"""Activity logging — records every meaningful action for the audit feed."""
from __future__ import annotations

from typing import Any

from app.db.base import AsyncSessionLocal
from app.db.models import ActivityLog


async def log_activity(
    actor_type: str,
    action: str,
    actor_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Record an activity. Never raises — logging failures shouldn't break app flow."""
    try:
        async with AsyncSessionLocal() as db:
            entry = ActivityLog(
                actor_type=actor_type,
                actor_id=actor_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details or {},
            )
            db.add(entry)
            await db.commit()
    except Exception:
        pass
