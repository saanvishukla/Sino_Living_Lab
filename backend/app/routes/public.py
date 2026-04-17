"""Public, unauthenticated endpoints accessed via QR codes on posters."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models import Tenant, Building

router = APIRouter()


@router.get("/tenants/{tenant_id}")
async def public_tenant(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    building = await db.get(Building, tenant.building_id)
    return {
        "id": tenant.id,
        "name": tenant.name,
        "name_zh": tenant.name_zh,
        "unit": tenant.unit,
        "floor": tenant.floor,
        "category": tenant.category,
        "category_zh": tenant.category_zh,
        "contact_email": tenant.contact_email,
        "contact_phone": tenant.contact_phone,
        "status": tenant.status.value if hasattr(tenant.status, "value") else tenant.status,
        "building": {
            "id": building.id,
            "name": building.name,
            "name_zh": building.name_zh,
            "code": building.code,
            "address": building.address,
            "address_zh": building.address_zh,
        } if building else None,
    }


@router.get("/buildings/{building_id}")
async def public_building(building_id: str, db: AsyncSession = Depends(get_db)):
    building = await db.get(Building, building_id)
    if not building:
        # fall back to code lookup
        res = await db.execute(select(Building).where(Building.code == building_id.upper()))
        building = res.scalars().first()
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")
    res = await db.execute(select(Tenant).where(Tenant.building_id == building.id))
    tenants = res.scalars().all()
    return {
        "id": building.id,
        "name": building.name,
        "name_zh": building.name_zh,
        "code": building.code,
        "address": building.address,
        "address_zh": building.address_zh,
        "tenants": [
            {
                "id": t.id,
                "name": t.name,
                "name_zh": t.name_zh,
                "unit": t.unit,
                "floor": t.floor,
                "category": t.category,
                "category_zh": t.category_zh,
            }
            for t in tenants
        ],
    }
