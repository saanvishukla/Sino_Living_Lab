from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import Building
from app.schemas import BuildingCreate, BuildingOut, BuildingUpdate

router = APIRouter()


@router.get("/", response_model=list[BuildingOut])
async def list_buildings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Building).order_by(Building.name))
    return list(result.scalars().all())


@router.get("/{building_id}", response_model=BuildingOut)
async def get_building(building_id: str, db: AsyncSession = Depends(get_db)):
    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return building


@router.post("/", response_model=BuildingOut, status_code=201)
async def create_building(payload: BuildingCreate, db: AsyncSession = Depends(get_db)):
    building = Building(**payload.model_dump())
    db.add(building)
    await db.commit()
    await db.refresh(building)
    return building


@router.patch("/{building_id}", response_model=BuildingOut)
async def update_building(
    building_id: str, payload: BuildingUpdate, db: AsyncSession = Depends(get_db)
):
    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(building, k, v)
    await db.commit()
    await db.refresh(building)
    return building
