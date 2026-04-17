"""Seed the database with sample Sino Group data."""
from sqlalchemy import select

from app.db.base import AsyncSessionLocal
from app.db.models import Building, Tenant, TenantStatus


SAMPLE_BUILDINGS = [
    {
        "id": "bld-plaza",
        "name": "Sino Plaza",
        "name_zh": "信和廣場",
        "code": "PLAZA",
        "address": "255 Gloucester Road, Causeway Bay, Hong Kong",
        "address_zh": "香港銅鑼灣告士打道255號",
        "template_key": "default",
        "brand_config": {"primary_color": "#c8102e", "accent_color": "#f4b223"},
    },
    {
        "id": "bld-central",
        "name": "Central Building",
        "name_zh": "中建大廈",
        "code": "CENTRAL",
        "address": "1-3 Pedder Street, Central, Hong Kong",
        "address_zh": "香港中環畢打街1-3號",
        "template_key": "default",
        "brand_config": {"primary_color": "#c8102e", "accent_color": "#f4b223"},
    },
    {
        "id": "bld-olympian",
        "name": "Olympian City",
        "name_zh": "奧海城",
        "code": "OLYMPIAN",
        "address": "11 Hoi Fai Road, West Kowloon, Hong Kong",
        "address_zh": "九龍西海輝道11號",
        "template_key": "default",
        "brand_config": {"primary_color": "#c8102e", "accent_color": "#f4b223"},
    },
]

SAMPLE_TENANTS = [
    # Sino Plaza
    {"building_id": "bld-plaza", "name": "Starbucks", "name_zh": "星巴克", "unit": "G-12", "floor": "G", "category": "F&B", "category_zh": "餐飲", "contact_email": "plaza@starbucks.hk"},
    {"building_id": "bld-plaza", "name": "Pret A Manger", "name_zh": "Pret A Manger", "unit": "G-08", "floor": "G", "category": "F&B", "category_zh": "餐飲", "contact_email": "ops@pret.hk"},
    {"building_id": "bld-plaza", "name": "Muji", "name_zh": "無印良品", "unit": "1-05", "floor": "1", "category": "Retail", "category_zh": "零售", "contact_email": "plaza@muji.hk"},
    {"building_id": "bld-plaza", "name": "Uniqlo", "name_zh": "優衣庫", "unit": "2-01", "floor": "2", "category": "Retail", "category_zh": "零售", "contact_email": "hk@uniqlo.com"},
    {"building_id": "bld-plaza", "name": "Apple Store", "name_zh": "蘋果專門店", "unit": "G-01", "floor": "G", "category": "Retail", "category_zh": "零售", "contact_email": "plaza@apple.com"},
    # Central Building
    {"building_id": "bld-central", "name": "HSBC Premier Centre", "name_zh": "滙豐卓越理財中心", "unit": "3-01", "floor": "3", "category": "Finance", "category_zh": "金融", "contact_email": "premier.central@hsbc.com"},
    {"building_id": "bld-central", "name": "The Coffee Academics", "name_zh": "咖啡學院", "unit": "G-03", "floor": "G", "category": "F&B", "category_zh": "餐飲", "contact_email": "central@tca.hk"},
    {"building_id": "bld-central", "name": "Lane Crawford Home", "name_zh": "連卡佛家品", "unit": "2-10", "floor": "2", "category": "Retail", "category_zh": "零售", "contact_email": "home@lanecrawford.com"},
    # Olympian City
    {"building_id": "bld-olympian", "name": "Taste by Park N Shop", "name_zh": "Taste 超級市場", "unit": "B1-01", "floor": "B1", "category": "Supermarket", "category_zh": "超級市場", "contact_email": "olympian@parknshop.com"},
    {"building_id": "bld-olympian", "name": "Sasa Cosmetics", "name_zh": "莎莎化妝品", "unit": "1-22", "floor": "1", "category": "Retail", "category_zh": "零售", "contact_email": "olympian@sasa.com"},
    {"building_id": "bld-olympian", "name": "Maxim's MX", "name_zh": "美心MX", "unit": "G-15", "floor": "G", "category": "F&B", "category_zh": "餐飲", "contact_email": "olympian@maxims.hk"},
]


async def seed_if_empty() -> None:
    """Insert sample data if the buildings table is empty."""
    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(Building))).scalars().first()
        if existing is not None:
            return

        for b in SAMPLE_BUILDINGS:
            session.add(Building(**b))
        await session.flush()

        for t in SAMPLE_TENANTS:
            session.add(Tenant(status=TenantStatus.ACTIVE, **t))

        await session.commit()
