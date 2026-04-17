"""Tenant Plug-in: the automated data entry point for Sino buildings.

Two flavors:
1. POST /api/plugin/sync — JSON webhook (single or batch) for live systems
2. POST /api/plugin/import/csv — CSV bulk upload for onboarding

Both auto-regenerate posters for affected buildings.
"""
from __future__ import annotations

import csv
import io
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import Building, Tenant, TenantStatus
from app.services.activity import log_activity
from app.services.poster_service import regenerate_for_building

router = APIRouter()


class PluginTenant(BaseModel):
    name: str
    building: str  # id OR code (e.g. "PLAZA")
    unit: str | None = None
    floor: str | None = None
    category: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    status: str = "active"


class SyncPayload(BaseModel):
    source: str = "plugin"
    tenants: list[PluginTenant]


async def _resolve_building(db: AsyncSession, identifier: str) -> Building | None:
    b = await db.get(Building, identifier)
    if b:
        return b
    result = await db.execute(
        select(Building).where(func.lower(Building.code) == identifier.lower())
    )
    return result.scalars().first()


async def _upsert_tenant(
    db: AsyncSession, data: PluginTenant, building: Building
) -> tuple[Tenant, bool]:
    """Insert or update by (building_id, name). Returns (tenant, was_created)."""
    result = await db.execute(
        select(Tenant).where(
            Tenant.building_id == building.id,
            func.lower(Tenant.name) == data.name.lower(),
        )
    )
    tenant = result.scalars().first()
    created = False
    if tenant is None:
        tenant = Tenant(
            name=data.name,
            building_id=building.id,
            status=TenantStatus(data.status),
        )
        db.add(tenant)
        created = True

    if data.unit is not None:
        tenant.unit = data.unit
    if data.floor is not None:
        tenant.floor = data.floor
    if data.category is not None:
        tenant.category = data.category
    if data.contact_email is not None:
        tenant.contact_email = data.contact_email
    if data.contact_phone is not None:
        tenant.contact_phone = data.contact_phone
    try:
        tenant.status = TenantStatus(data.status)
    except ValueError:
        pass

    return tenant, created


@router.post("/sync")
async def sync_tenants(payload: SyncPayload, db: AsyncSession = Depends(get_db)):
    """Live sync webhook — plug-in systems POST JSON here whenever data changes."""
    created_count = 0
    updated_count = 0
    errors: list[dict[str, Any]] = []
    affected_buildings: set[str] = set()

    for t in payload.tenants:
        building = await _resolve_building(db, t.building)
        if not building:
            errors.append({"tenant": t.name, "error": f"Unknown building '{t.building}'"})
            continue
        try:
            _, created = await _upsert_tenant(db, t, building)
            if created:
                created_count += 1
            else:
                updated_count += 1
            affected_buildings.add(building.id)
        except Exception as exc:
            errors.append({"tenant": t.name, "error": str(exc)})

    await db.commit()

    await log_activity(
        actor_type="plugin",
        actor_id=payload.source,
        action="plugin.sync",
        details={
            "source": payload.source,
            "received": len(payload.tenants),
            "created": created_count,
            "updated": updated_count,
            "errors": len(errors),
        },
    )

    # Auto-regenerate posters for each affected building
    regen_results = []
    for bid in affected_buildings:
        regen_results.append(
            await regenerate_for_building(
                bid,
                actor_type="plugin",
                reason=f"plugin.sync:{payload.source}",
                auto_approve=False,
            )
        )

    return {
        "source": payload.source,
        "received": len(payload.tenants),
        "created": created_count,
        "updated": updated_count,
        "errors": errors,
        "regenerated_posters": regen_results,
    }


@router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """CSV bulk import. Expected columns: name, building, unit, floor, category, contact_email, contact_phone, status."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    content = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(content))

    rows: list[PluginTenant] = []
    for row in reader:
        try:
            rows.append(
                PluginTenant(
                    name=(row.get("name") or "").strip(),
                    building=(row.get("building") or "").strip(),
                    unit=(row.get("unit") or "").strip() or None,
                    floor=(row.get("floor") or "").strip() or None,
                    category=(row.get("category") or "").strip() or None,
                    contact_email=(row.get("contact_email") or "").strip() or None,
                    contact_phone=(row.get("contact_phone") or "").strip() or None,
                    status=(row.get("status") or "active").strip() or "active",
                )
            )
        except Exception:
            continue

    if not rows:
        raise HTTPException(status_code=400, detail="CSV had no valid rows")

    return await sync_tenants(
        SyncPayload(source=f"csv:{file.filename}", tenants=rows),
        db=db,
    )
