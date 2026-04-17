"""Simulated notification dispatcher for poster approval events.

Writes structured notification records to the activity log and a local
notifications.jsonl file. In production these would hit WeChat Work (企業微信)
and SMTP/SendGrid, but we keep the surface area identical so it can be swapped in.
"""
from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from app.services.activity import log_activity


NOTIF_LOG = Path(
    os.environ.get("NOTIF_LOG") or Path(__file__).resolve().parent.parent.parent / "notifications.jsonl"
)


async def _write(entry: dict[str, Any]) -> None:
    entry["sent_at"] = datetime.utcnow().isoformat() + "Z"
    try:
        NOTIF_LOG.parent.mkdir(parents=True, exist_ok=True)
        with NOTIF_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


async def notify_poster_event(
    event: str,
    building_name: str,
    poster_id: str,
    version: int,
    actor: str | None = None,
) -> dict[str, Any]:
    """Simulate WeChat Work + email fan-out for a poster lifecycle event."""
    subject_map = {
        "approved": f"[Sino] Poster approved · {building_name} v{version}",
        "rejected": f"[Sino] Poster rejected · {building_name} v{version}",
        "pending": f"[Sino] Poster awaiting approval · {building_name} v{version}",
    }
    subject = subject_map.get(event, f"[Sino] Poster {event} · {building_name} v{version}")
    body = (
        f"Building: {building_name}\n"
        f"Poster version: {version}\n"
        f"Poster ID: {poster_id}\n"
        f"Event: {event}\n"
        f"Actor: {actor or 'system'}"
    )

    wechat = {
        "channel": "wechat_work",
        "to": "@all (ops group)",
        "template": "sino.poster." + event,
        "subject": subject,
        "body": body,
    }
    email = {
        "channel": "email",
        "to": "ops@sino-operating-layer.local",
        "subject": subject,
        "body": body,
    }

    await _write(wechat)
    await _write(email)

    await log_activity(
        actor_type="operating_layer",
        action=f"notification.{event}",
        entity_type="poster",
        entity_id=poster_id,
        details={
            "building": building_name,
            "version": version,
            "channels": ["wechat_work", "email"],
            "simulated": True,
        },
    )

    return {"sent": 2, "channels": ["wechat_work", "email"]}
