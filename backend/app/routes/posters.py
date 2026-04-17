from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.base import get_db
from app.db.models import Building, Poster, PosterStatus, Tenant, TenantStatus, User
from app.posters.generator import render_poster
from app.schemas import PosterOut

router = APIRouter()


class GenerateRequest(BaseModel):
    building_id: str


@router.get("/", response_model=list[PosterOut])
async def list_posters(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Poster).order_by(Poster.created_at.desc()))
    return list(result.scalars().all())


@router.post("/generate", response_model=PosterOut, status_code=201)
async def generate_poster(
    payload: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    building = await db.get(Building, payload.building_id)
    if not building:
        # Try code lookup
        from sqlalchemy import func
        result = await db.execute(
            select(Building).where(func.lower(Building.code) == payload.building_id.lower())
        )
        building = result.scalars().first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    tenants_q = await db.execute(
        select(Tenant)
        .where(Tenant.building_id == building.id, Tenant.status == TenantStatus.ACTIVE)
    )
    tenants = list(tenants_q.scalars().all())

    # Figure out next version
    latest_q = await db.execute(
        select(Poster)
        .where(Poster.building_id == building.id)
        .order_by(Poster.version.desc())
    )
    latest = latest_q.scalars().first()
    next_version = (latest.version + 1) if latest else 1

    image_path = render_poster(building, tenants)

    poster = Poster(
        building_id=building.id,
        template_key=building.template_key,
        version=next_version,
        image_path=str(image_path),
        status=PosterStatus.APPROVED,
        is_live=True,
        metadata_json={"tenant_count": len(tenants)},
        generated_by="operating_layer",
    )
    db.add(poster)
    await db.commit()
    await db.refresh(poster)
    return poster


@router.get("/{poster_id}/image")
async def poster_image(poster_id: str, db: AsyncSession = Depends(get_db)):
    poster = await db.get(Poster, poster_id)
    if not poster or not poster.image_path:
        raise HTTPException(status_code=404, detail="Poster image not found")
    path = Path(poster.image_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Poster file missing on disk")
    return FileResponse(path, media_type="image/png")


@router.post("/{poster_id}/approve", response_model=PosterOut)
async def approve_poster(
    poster_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.services.activity import log_activity
    poster = await db.get(Poster, poster_id)
    if not poster:
        raise HTTPException(status_code=404, detail="Poster not found")

    # Take any currently-live poster for this building offline
    live_q = await db.execute(
        select(Poster).where(
            Poster.building_id == poster.building_id,
            Poster.is_live == True,  # noqa: E712
            Poster.id != poster.id,
        )
    )
    for p in live_q.scalars().all():
        p.is_live = False

    poster.status = PosterStatus.APPROVED
    poster.is_live = True
    poster.approved_by = user.name
    await db.commit()
    await db.refresh(poster)

    await log_activity(
        actor_type="user",
        action="poster.approved",
        entity_type="poster",
        entity_id=poster.id,
        details={"building_id": poster.building_id, "version": poster.version},
    )
    return poster


@router.post("/{poster_id}/reject", response_model=PosterOut)
async def reject_poster(
    poster_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.services.activity import log_activity
    poster = await db.get(Poster, poster_id)
    if not poster:
        raise HTTPException(status_code=404, detail="Poster not found")
    poster.status = PosterStatus.REJECTED
    poster.is_live = False
    await db.commit()
    await db.refresh(poster)

    await log_activity(
        actor_type="user",
        action="poster.rejected",
        entity_type="poster",
        entity_id=poster.id,
        details={"building_id": poster.building_id, "version": poster.version},
    )
    return poster
