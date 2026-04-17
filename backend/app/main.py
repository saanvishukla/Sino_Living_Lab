from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.base import Base, engine
from app.db import models  # noqa: F401 — ensure models are registered
from app.db.seed import seed_if_empty
from app.routes import health, tenants, buildings, posters, chat, activity, plugin, auth, public, insights


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_if_empty()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Agentic AI Operating Layer for Sino Group Brand Operations",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.auth import get_current_user

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Protected routes — require a bearer token
protected = [Depends(get_current_user)]
app.include_router(tenants.router, prefix="/api/tenants", tags=["tenants"], dependencies=protected)
app.include_router(buildings.router, prefix="/api/buildings", tags=["buildings"], dependencies=protected)
app.include_router(posters.router, prefix="/api/posters", tags=["posters"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"], dependencies=protected)
app.include_router(activity.router, prefix="/api/activity", tags=["activity"], dependencies=protected)
app.include_router(insights.router, prefix="/api/insights", tags=["insights"], dependencies=protected)
# Plug-in endpoints stay open so external systems can POST without user tokens
app.include_router(plugin.router, prefix="/api/plugin", tags=["plugin"])
# Public endpoints accessed via QR codes — no auth required
app.include_router(public.router, prefix="/api/public", tags=["public"])


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }
