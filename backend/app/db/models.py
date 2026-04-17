from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, PyEnum):
    ADMIN = "admin"
    DESIGNER = "designer"
    VIEWER = "viewer"


class TenantStatus(str, PyEnum):
    ACTIVE = "active"
    PENDING = "pending"
    LEFT = "left"


class PosterStatus(str, PyEnum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    LIVE = "live"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VIEWER)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Building(Base):
    __tablename__ = "buildings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    template_key: Mapped[str] = mapped_column(String, default="default")
    brand_config: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenants: Mapped[list[Tenant]] = relationship(back_populates="building", cascade="all, delete-orphan")
    posters: Mapped[list[Poster]] = relationship(back_populates="building", cascade="all, delete-orphan")


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    floor: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    extra: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[TenantStatus] = mapped_column(Enum(TenantStatus), default=TenantStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    building: Mapped[Building] = relationship(back_populates="tenants")


class Poster(Base):
    __tablename__ = "posters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), index=True)
    template_key: Mapped[str] = mapped_column(String, default="default")
    version: Mapped[int] = mapped_column(default=1)
    image_path: Mapped[str | None] = mapped_column(String, nullable=True)
    pdf_path: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[PosterStatus] = mapped_column(Enum(PosterStatus), default=PosterStatus.DRAFT)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    is_live: Mapped[bool] = mapped_column(Boolean, default=False)
    generated_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    building: Mapped[Building] = relationship(back_populates="posters")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    messages: Mapped[list[ChatMessage]] = relationship(back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id"), index=True)
    role: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    tool_calls: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[ChatSession] = relationship(back_populates="messages")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    actor_type: Mapped[str] = mapped_column(String)
    actor_id: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String, index=True)
    entity_type: Mapped[str | None] = mapped_column(String, nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
