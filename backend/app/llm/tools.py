"""Tool definitions + execution for the Sino agentic operating layer.

Each tool:
- has a JSON schema (OpenAI function-calling format) advertised to the LLM
- has an async Python implementation that operates on the database

When the LLM returns tool_calls, we run them, append results, and loop.
"""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select, func

from app.db.base import AsyncSessionLocal
from app.db.models import Building, Tenant, TenantStatus
from app.services.activity import log_activity
from app.services.poster_service import regenerate_for_building


# --- Tool implementations -----------------------------------------------------


async def list_buildings() -> dict[str, Any]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Building).order_by(Building.name))
        buildings = result.scalars().all()
        return {
            "buildings": [
                {"id": b.id, "name": b.name, "code": b.code, "address": b.address}
                for b in buildings
            ]
        }


async def list_tenants(building_id: str | None = None, search: str | None = None) -> dict[str, Any]:
    async with AsyncSessionLocal() as db:
        # Resolve building code → id if needed
        if building_id:
            building = await db.get(Building, building_id)
            if building is None:
                result = await db.execute(
                    select(Building).where(func.lower(Building.code) == building_id.lower())
                )
                building = result.scalars().first()
                if building:
                    building_id = building.id

        query = select(Tenant).order_by(Tenant.floor, Tenant.name)
        if building_id:
            query = query.where(Tenant.building_id == building_id)
        if search:
            pattern = f"%{search.lower()}%"
            query = query.where(func.lower(Tenant.name).like(pattern))
        result = await db.execute(query)
        tenants = result.scalars().all()
        return {
            "count": len(tenants),
            "tenants": [
                {
                    "id": t.id,
                    "name": t.name,
                    "building_id": t.building_id,
                    "floor": t.floor,
                    "unit": t.unit,
                    "category": t.category,
                    "status": t.status.value if hasattr(t.status, "value") else t.status,
                }
                for t in tenants
            ],
        }


async def add_tenant(
    name: str,
    building_id: str,
    floor: str | None = None,
    unit: str | None = None,
    category: str | None = None,
    contact_email: str | None = None,
) -> dict[str, Any]:
    async with AsyncSessionLocal() as db:
        building = await db.get(Building, building_id)
        if not building:
            # try code lookup as a fallback
            result = await db.execute(
                select(Building).where(func.lower(Building.code) == building_id.lower())
            )
            building = result.scalars().first()
            if not building:
                return {"error": f"Building '{building_id}' not found"}

        tenant = Tenant(
            name=name,
            building_id=building.id,
            floor=floor,
            unit=unit,
            category=category,
            contact_email=contact_email,
            status=TenantStatus.ACTIVE,
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        tenant_id = tenant.id
        resolved_building_id = tenant.building_id

    await log_activity(
        actor_type="operating_layer",
        action="tenant.added",
        entity_type="tenant",
        entity_id=tenant_id,
        details={"name": name, "building_id": resolved_building_id, "floor": floor, "unit": unit},
    )
    regen = await regenerate_for_building(
        resolved_building_id, reason=f"tenant.added:{name}"
    )
    return {
        "success": True,
        "tenant": {
            "id": tenant_id,
            "name": name,
            "building_id": resolved_building_id,
            "floor": floor,
            "unit": unit,
        },
        "auto_regenerated_poster": regen,
    }


async def update_tenant(
    tenant_id: str | None = None,
    tenant_name: str | None = None,
    floor: str | None = None,
    unit: str | None = None,
    category: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    async with AsyncSessionLocal() as db:
        tenant: Tenant | None = None
        if tenant_id:
            tenant = await db.get(Tenant, tenant_id)
        if tenant is None and tenant_name:
            result = await db.execute(
                select(Tenant).where(func.lower(Tenant.name) == tenant_name.lower())
            )
            tenant = result.scalars().first()
        if tenant is None:
            return {"error": "Tenant not found. Provide tenant_id or exact tenant_name."}

        if floor is not None:
            tenant.floor = floor
        if unit is not None:
            tenant.unit = unit
        if category is not None:
            tenant.category = category
        if status is not None:
            try:
                tenant.status = TenantStatus(status)
            except ValueError:
                return {"error": f"Invalid status '{status}'. Use: active, pending, left."}

        await db.commit()
        await db.refresh(tenant)
        result = {
            "id": tenant.id,
            "name": tenant.name,
            "building_id": tenant.building_id,
            "floor": tenant.floor,
            "unit": tenant.unit,
            "status": tenant.status.value,
        }

    await log_activity(
        actor_type="operating_layer",
        action="tenant.updated",
        entity_type="tenant",
        entity_id=result["id"],
        details={"name": result["name"], "floor": floor, "unit": unit, "status": status},
    )
    regen = await regenerate_for_building(
        result["building_id"], reason=f"tenant.updated:{result['name']}"
    )
    return {"success": True, "tenant": result, "auto_regenerated_poster": regen}


async def remove_tenant(tenant_id: str | None = None, tenant_name: str | None = None) -> dict[str, Any]:
    async with AsyncSessionLocal() as db:
        tenant: Tenant | None = None
        if tenant_id:
            tenant = await db.get(Tenant, tenant_id)
        if tenant is None and tenant_name:
            result = await db.execute(
                select(Tenant).where(func.lower(Tenant.name) == tenant_name.lower())
            )
            tenant = result.scalars().first()
        if tenant is None:
            return {"error": "Tenant not found"}
        name = tenant.name
        building_id_for_regen = tenant.building_id
        await db.delete(tenant)
        await db.commit()

    await log_activity(
        actor_type="operating_layer",
        action="tenant.removed",
        entity_type="tenant",
        details={"name": name, "building_id": building_id_for_regen},
    )
    regen = await regenerate_for_building(
        building_id_for_regen, reason=f"tenant.removed:{name}"
    )
    return {"success": True, "removed": name, "auto_regenerated_poster": regen}


async def generate_poster(building_id: str) -> dict[str, Any]:
    """Render a new e-directory poster for a building and save as a new version."""
    result = await regenerate_for_building(building_id, reason="manual_via_chat")
    if "error" in result:
        return result
    result["image_url"] = f"/api/posters/{result['poster_id']}/image"
    return result


async def get_stats() -> dict[str, Any]:
    async with AsyncSessionLocal() as db:
        b_count = (await db.execute(select(func.count()).select_from(Building))).scalar_one()
        t_count = (await db.execute(select(func.count()).select_from(Tenant))).scalar_one()
        active = (
            await db.execute(
                select(func.count())
                .select_from(Tenant)
                .where(Tenant.status == TenantStatus.ACTIVE)
            )
        ).scalar_one()

        by_category = (
            await db.execute(
                select(Tenant.category, func.count()).group_by(Tenant.category)
            )
        ).all()

        return {
            "buildings": b_count,
            "total_tenants": t_count,
            "active_tenants": active,
            "by_category": {cat or "Uncategorized": count for cat, count in by_category},
        }


# --- Tool registry ------------------------------------------------------------

TOOL_IMPLS = {
    "list_buildings": list_buildings,
    "list_tenants": list_tenants,
    "add_tenant": add_tenant,
    "update_tenant": update_tenant,
    "remove_tenant": remove_tenant,
    "generate_poster": generate_poster,
    "get_stats": get_stats,
}


TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "list_buildings",
            "description": "List all Sino Group buildings with their IDs, names, codes, and addresses.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tenants",
            "description": "List tenants. Optionally filter by building_id (or building code like 'PLAZA') and/or search by name substring.",
            "parameters": {
                "type": "object",
                "properties": {
                    "building_id": {"type": "string", "description": "Building id or code (optional)"},
                    "search": {"type": "string", "description": "Case-insensitive tenant name substring (optional)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_tenant",
            "description": "Register a new tenant in a building. Accepts building id or code.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "building_id": {"type": "string", "description": "Building id (e.g. 'bld-plaza') or code (e.g. 'PLAZA')"},
                    "floor": {"type": "string"},
                    "unit": {"type": "string"},
                    "category": {"type": "string", "description": "e.g. F&B, Retail, Finance"},
                    "contact_email": {"type": "string"},
                },
                "required": ["name", "building_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_tenant",
            "description": "Update an existing tenant's fields. Identify by tenant_id OR tenant_name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tenant_id": {"type": "string"},
                    "tenant_name": {"type": "string"},
                    "floor": {"type": "string"},
                    "unit": {"type": "string"},
                    "category": {"type": "string"},
                    "status": {"type": "string", "enum": ["active", "pending", "left"]},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "remove_tenant",
            "description": "Remove a tenant permanently. Identify by tenant_id OR tenant_name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tenant_id": {"type": "string"},
                    "tenant_name": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_poster",
            "description": "Generate a new e-directory poster PNG for a building using the current active tenants. Creates a new versioned poster marked live.",
            "parameters": {
                "type": "object",
                "properties": {
                    "building_id": {"type": "string", "description": "Building id (e.g. 'bld-plaza') or code (e.g. 'PLAZA')"},
                },
                "required": ["building_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stats",
            "description": "Get overall stats: building count, tenant count, active count, breakdown by category.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


async def execute_tool(name: str, arguments: str | dict) -> str:
    """Run a tool by name with JSON-string or dict arguments. Returns JSON string."""
    impl = TOOL_IMPLS.get(name)
    if not impl:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        args = arguments if isinstance(arguments, dict) else json.loads(arguments or "{}")
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON arguments"})
    try:
        result = await impl(**args)
        return json.dumps(result, default=str)
    except TypeError as exc:
        return json.dumps({"error": f"Bad arguments: {exc}"})
    except Exception as exc:
        return json.dumps({"error": f"Tool execution failed: {exc}"})
