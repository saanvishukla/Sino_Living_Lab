"""Seed the database with sample Sino Group data."""
from sqlalchemy import select

from app.db.base import AsyncSessionLocal
from app.db.models import Building, Tenant, TenantStatus


SAMPLE_BUILDINGS = [
    {
        "id": "bld-plaza",
        "name": "Sino Plaza",
        "code": "PLAZA",
        "address": "255 Gloucester Road, Causeway Bay, Hong Kong",
        "template_key": "default",
        "brand_config": {"primary_color": "#c8102e", "accent_color": "#f4b223"},
    },
    {
        "id": "bld-central",
        "name": "Central Building",
        "code": "CENTRAL",
        "address": "1-3 Pedder Street, Central, Hong Kong",
        "template_key": "default",
        "brand_config": {"primary_color": "#c8102e", "accent_color": "#f4b223"},
    },
    {
        "id": "bld-olympian",
        "name": "Olympian City",
        "code": "OLYMPIAN",
        "address": "11 Hoi Fai Road, West Kowloon, Hong Kong",
        "template_key": "default",
        "brand_config": {"primary_color": "#c8102e", "accent_color": "#f4b223"},
    },
]

SAMPLE_TENANTS = [
    # Sino Plaza
    {"building_id": "bld-plaza", "name": "Starbucks", "unit": "G-12", "floor": "G", "category": "F&B", "contact_email": "plaza@starbucks.hk"},
    {"building_id": "bld-plaza", "name": "Pret A Manger", "unit": "G-08", "floor": "G", "category": "F&B", "contact_email": "ops@pret.hk"},
    {"building_id": "bld-plaza", "name": "Muji", "unit": "1-05", "floor": "1", "category": "Retail", "contact_email": "plaza@muji.hk"},
    {"building_id": "bld-plaza", "name": "Uniqlo", "unit": "2-01", "floor": "2", "category": "Retail", "contact_email": "hk@uniqlo.com"},
    {"building_id": "bld-plaza", "name": "Apple Store", "unit": "G-01", "floor": "G", "category": "Retail", "contact_email": "plaza@apple.com"},
    # Central Building
    {"building_id": "bld-central", "name": "HSBC Premier Centre", "unit": "3-01", "floor": "3", "category": "Finance", "contact_email": "premier.central@hsbc.com"},
    {"building_id": "bld-central", "name": "The Coffee Academics", "unit": "G-03", "floor": "G", "category": "F&B", "contact_email": "central@tca.hk"},
    {"building_id": "bld-central", "name": "Lane Crawford Home", "unit": "2-10", "floor": "2", "category": "Retail", "contact_email": "home@lanecrawford.com"},
    # Olympian City
    {"building_id": "bld-olympian", "name": "Taste by Park N Shop", "unit": "B1-01", "floor": "B1", "category": "Supermarket", "contact_email": "olympian@parknshop.com"},
    {"building_id": "bld-olympian", "name": "Sasa Cosmetics", "unit": "1-22", "floor": "1", "category": "Retail", "contact_email": "olympian@sasa.com"},
    {"building_id": "bld-olympian", "name": "Maxim's MX", "unit": "G-15", "floor": "G", "category": "F&B", "contact_email": "olympian@maxims.hk"},
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
