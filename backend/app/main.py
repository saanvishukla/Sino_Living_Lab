from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, tenants, buildings, posters, chat

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Agentic AI Operating Layer for Sino Group Brand Operations",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(tenants.router, prefix="/api/tenants", tags=["tenants"])
app.include_router(buildings.router, prefix="/api/buildings", tags=["buildings"])
app.include_router(posters.router, prefix="/api/posters", tags=["posters"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }
