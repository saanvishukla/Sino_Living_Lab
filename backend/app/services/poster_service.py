"""Poster generation service used by both tools and auto-regeneration."""
from __future__ import annotations

from sqlalchemy import select, func

from app.db.base import AsyncSessionLocal
from app.db.models import Building, Poster, PosterStatus, Tenant, TenantStatus
from app.posters.generator import render_poster
from app.services.activity import log_activity


async def regenerate_for_building(
    building_id: str,
    actor_type: str = "operating_layer",
    actor_id: str | None = None,
    reason: str = "manual",
    auto_approve: bool = True,
) -> dict:
    """Render a new poster version for the given building.

    If auto_approve is True (default for chat-initiated changes), the poster goes live
    immediately. Set False for plug-in/CSV imports so a human reviews before going live.
    """
    async with AsyncSessionLocal() as db:
        building = await db.get(Building, building_id)
        if building is None:
            result = await db.execute(
                select(Building).where(func.lower(Building.code) == building_id.lower())
            )
            building = result.scalars().first()
        if building is None:
            return {"error": f"Building '{building_id}' not found"}

        tenants_q = await db.execute(
            select(Tenant).where(
                Tenant.building_id == building.id,
                Tenant.status == TenantStatus.ACTIVE,
            )
        )
        tenants = list(tenants_q.scalars().all())

        latest_q = await db.execute(
            select(Poster)
            .where(Poster.building_id == building.id)
            .order_by(Poster.version.desc())
        )
        latest = latest_q.scalars().first()
        next_version = (latest.version + 1) if latest else 1

        image_path = render_poster(building, tenants)

        new_status = PosterStatus.APPROVED if auto_approve else PosterStatus.PENDING_APPROVAL
        if auto_approve and latest and latest.is_live:
            latest.is_live = False

        poster = Poster(
            building_id=building.id,
            template_key=building.template_key,
            version=next_version,
            image_path=str(image_path),
            status=new_status,
            is_live=auto_approve,
            metadata_json={"tenant_count": len(tenants), "reason": reason},
            generated_by=actor_type,
        )
        db.add(poster)
        await db.commit()
        await db.refresh(poster)

    if not auto_approve:
        from app.services.notifications import notify_poster_event
        await notify_poster_event(
            event="pending",
            building_name=building.name,
            poster_id=poster.id,
            version=next_version,
            actor=actor_type,
        )

    await log_activity(
        actor_type=actor_type,
        actor_id=actor_id,
        action="poster.regenerated" if auto_approve else "poster.pending_approval",
        entity_type="poster",
        entity_id=poster.id,
        details={
            "building_id": building.id,
            "building_name": building.name,
            "version": next_version,
            "tenant_count": len(tenants),
            "reason": reason,
            "auto_approved": auto_approve,
        },
    )

    return {
        "success": True,
        "poster_id": poster.id,
        "building_id": building.id,
        "building": building.name,
        "version": next_version,
        "tenant_count": len(tenants),
    }
