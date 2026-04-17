"""AI proactive suggestions + analytics summary for the Overview dashboard."""
from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import (
    ActivityLog,
    Building,
    Poster,
    PosterStatus,
    Tenant,
    TenantStatus,
)

router = APIRouter()


@router.get("/notifications")
async def list_notifications(limit: int = 20) -> dict[str, Any]:
    """Return recent simulated notifications written by the notification service."""
    import json
    from pathlib import Path
    import os

    path = Path(
        os.environ.get("NOTIF_LOG")
        or Path(__file__).resolve().parent.parent.parent / "notifications.jsonl"
    )
    entries: list[dict[str, Any]] = []
    if path.exists():
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
            for line in lines[-limit * 2 :]:
                try:
                    entries.append(json.loads(line))
                except Exception:
                    continue
        except Exception:
            pass
    entries.reverse()
    return {"count": len(entries), "notifications": entries[:limit]}


@router.get("/suggestions")
async def get_suggestions(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Heuristic-based AI suggestions surfaced on the Overview dashboard."""

    tenants = (await db.execute(select(Tenant))).scalars().all()
    buildings = (await db.execute(select(Building))).scalars().all()
    posters = (await db.execute(select(Poster))).scalars().all()

    by_building: dict[str, list[Tenant]] = {}
    for t in tenants:
        by_building.setdefault(t.building_id, []).append(t)

    suggestions: list[dict[str, Any]] = []

    # 1) Pending poster approvals
    pending = [p for p in posters if p.status == PosterStatus.PENDING_APPROVAL]
    for p in pending:
        b = next((x for x in buildings if x.id == p.building_id), None)
        suggestions.append({
            "severity": "high",
            "kind": "approval_pending",
            "title": f"{b.name if b else 'Building'} — poster v{p.version} waiting for approval",
            "body": "A regenerated poster is waiting to go live. Review and approve it.",
            "cta": {"label": "Review posters", "href": "/dashboard/posters"},
        })

    # 2) Tenants missing Traditional Chinese name
    missing_zh = [t for t in tenants if not (t.name_zh and t.name_zh.strip())]
    if missing_zh:
        sample = ", ".join(t.name for t in missing_zh[:3])
        more = f" (+{len(missing_zh) - 3} more)" if len(missing_zh) > 3 else ""
        suggestions.append({
            "severity": "medium",
            "kind": "missing_zh",
            "title": f"{len(missing_zh)} tenants missing Traditional Chinese name",
            "body": f"Ask the AI: 'Add Chinese name 星巴克 to Starbucks'. Examples: {sample}{more}.",
            "cta": {"label": "Open AI chat", "href": "/dashboard/chat"},
        })

    # 3) Tenants in pending status
    pending_tenants = [t for t in tenants if t.status == TenantStatus.PENDING]
    if pending_tenants:
        suggestions.append({
            "severity": "medium",
            "kind": "pending_tenants",
            "title": f"{len(pending_tenants)} tenants still marked 'pending'",
            "body": "Confirm move-in and set status to active so they appear on live posters.",
            "cta": {"label": "Review tenants", "href": "/dashboard/tenants"},
        })

    # 4) Tenants without contact info
    no_contact = [t for t in tenants if not (t.contact_email or t.contact_phone)]
    if no_contact:
        suggestions.append({
            "severity": "low",
            "kind": "missing_contact",
            "title": f"{len(no_contact)} tenants have no contact info",
            "body": "QR-scanned tenant pages will be thin. Add email or phone via AI chat or plug-in import.",
            "cta": {"label": "Tenant plug-in", "href": "/dashboard/plugin"},
        })

    # 5) Buildings with very few tenants
    sparse = [
        b for b in buildings
        if len([t for t in by_building.get(b.id, []) if t.status == TenantStatus.ACTIVE]) < 3
    ]
    for b in sparse:
        count = len([t for t in by_building.get(b.id, []) if t.status == TenantStatus.ACTIVE])
        suggestions.append({
            "severity": "low",
            "kind": "sparse_building",
            "title": f"{b.name} has only {count} active tenant{'s' if count != 1 else ''}",
            "body": "Consider importing more tenants via the plug-in or CSV.",
            "cta": {"label": "Import tenants", "href": "/dashboard/plugin"},
        })

    # 6) No posters generated yet
    if not posters:
        suggestions.append({
            "severity": "high",
            "kind": "no_posters",
            "title": "No posters generated yet",
            "body": "Ask the AI: 'Generate a poster for Sino Plaza' to get started.",
            "cta": {"label": "Open AI chat", "href": "/dashboard/chat"},
        })

    # Sort by severity
    order = {"high": 0, "medium": 1, "low": 2}
    suggestions.sort(key=lambda s: order.get(s["severity"], 9))

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "count": len(suggestions),
        "suggestions": suggestions,
    }


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Aggregate analytics for the Overview dashboard charts."""
    tenants = (await db.execute(select(Tenant))).scalars().all()
    buildings = (await db.execute(select(Building))).scalars().all()
    posters = (await db.execute(select(Poster))).scalars().all()

    # by category
    cat_counter = Counter(t.category or "Other" for t in tenants)
    by_category = [
        {"category": k, "count": v}
        for k, v in sorted(cat_counter.items(), key=lambda x: -x[1])
    ]

    # by building
    b_map = {b.id: b for b in buildings}
    b_counter: Counter[str] = Counter()
    for t in tenants:
        b_counter[t.building_id] += 1
    by_building = [
        {
            "building_id": bid,
            "building": b_map[bid].name if bid in b_map else bid,
            "count": c,
        }
        for bid, c in b_counter.most_common()
    ]

    # by status
    status_counter = Counter(
        (t.status.value if hasattr(t.status, "value") else t.status) for t in tenants
    )

    # activity over last 14 days
    since = datetime.utcnow() - timedelta(days=13)
    logs = (
        await db.execute(
            select(ActivityLog).where(ActivityLog.created_at >= since)
        )
    ).scalars().all()
    day_counter: Counter[str] = Counter()
    for log in logs:
        key = log.created_at.strftime("%Y-%m-%d")
        day_counter[key] += 1
    activity_by_day: list[dict[str, Any]] = []
    for i in range(14):
        d = (since + timedelta(days=i)).strftime("%Y-%m-%d")
        activity_by_day.append({"date": d, "count": day_counter.get(d, 0)})

    return {
        "totals": {
            "buildings": len(buildings),
            "tenants": len(tenants),
            "active_tenants": sum(
                1 for t in tenants if t.status == TenantStatus.ACTIVE
            ),
            "posters": len(posters),
            "live_posters": sum(1 for p in posters if p.is_live),
            "pending_posters": sum(
                1 for p in posters if p.status == PosterStatus.PENDING_APPROVAL
            ),
        },
        "by_category": by_category,
        "by_building": by_building,
        "by_status": [{"status": k, "count": v} for k, v in status_counter.items()],
        "activity_by_day": activity_by_day,
    }
