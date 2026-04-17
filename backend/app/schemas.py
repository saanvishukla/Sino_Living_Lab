from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.db.models import TenantStatus, PosterStatus


class BuildingBase(BaseModel):
    name: str
    name_zh: str | None = None
    code: str
    address: str | None = None
    address_zh: str | None = None
    template_key: str = "default"
    brand_config: dict[str, Any] = {}


class BuildingCreate(BuildingBase):
    pass


class BuildingUpdate(BaseModel):
    name: str | None = None
    name_zh: str | None = None
    address: str | None = None
    address_zh: str | None = None
    template_key: str | None = None
    brand_config: dict[str, Any] | None = None


class BuildingOut(BuildingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class TenantBase(BaseModel):
    name: str
    name_zh: str | None = None
    unit: str | None = None
    floor: str | None = None
    category: str | None = None
    category_zh: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    extra: dict[str, Any] = {}


class TenantCreate(TenantBase):
    building_id: str
    status: TenantStatus = TenantStatus.ACTIVE


class TenantUpdate(BaseModel):
    name: str | None = None
    name_zh: str | None = None
    unit: str | None = None
    floor: str | None = None
    category: str | None = None
    category_zh: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    status: TenantStatus | None = None
    extra: dict[str, Any] | None = None


class TenantOut(TenantBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    building_id: str
    status: TenantStatus
    created_at: datetime
    updated_at: datetime


class PosterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    building_id: str
    template_key: str
    version: int
    status: PosterStatus
    is_live: bool
    image_path: str | None
    pdf_path: str | None
    created_at: datetime
