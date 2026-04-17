from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import Tenant
from app.schemas import TenantCreate, TenantOut, TenantUpdate

router = APIRouter()


@router.get("/", response_model=list[TenantOut])
async def list_tenants(
    building_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Tenant).order_by(Tenant.floor, Tenant.name)
    if building_id:
        query = query.where(Tenant.building_id == building_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{tenant_id}", response_model=TenantOut)
async def get_tenant(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.post("/", response_model=TenantOut, status_code=201)
async def create_tenant(payload: TenantCreate, db: AsyncSession = Depends(get_db)):
    tenant = Tenant(**payload.model_dump())
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant


@router.patch("/{tenant_id}", response_model=TenantOut)
async def update_tenant(
    tenant_id: str, payload: TenantUpdate, db: AsyncSession = Depends(get_db)
):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(tenant, k, v)
    await db.commit()
    await db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=204)
async def delete_tenant(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await db.delete(tenant)
    await db.commit()
