from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import ActivityLog

router = APIRouter()


class ActivityOut(BaseModel):
    id: str
    actor_type: str
    actor_id: str | None
    action: str
    entity_type: str | None
    entity_id: str | None
    details: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ActivityOut])
async def list_activity(limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())
