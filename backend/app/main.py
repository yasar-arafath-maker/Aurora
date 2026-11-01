"""AURORA FastAPI Application Entry Point"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.init_db import init_db
from app.api.router import api_router
from app.services.forecasting.model import get_forecasting_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: init DB + warm up ML model on startup."""
    print("[AURORA] Initializing database...")
    await init_db()
    
    print("[AURORA] Training ML forecasting models (this takes ~15 seconds)...")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_forecasting_service)
    print("[AURORA] [OK] Ready - API serving on http://localhost:8000")
    
    yield
    print("[AURORA] Shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Health check route
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "AURORA API", "version": "1.0.0"}

# Static Files & SPA Frontend Serving (for Render / Production)
dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
    os.path.abspath(os.path.join(os.getcwd(), "..", "frontend", "dist")),
    "/app/frontend/dist",
]

frontend_dist = next((p for p in dist_candidates if os.path.exists(p) and os.path.isdir(p)), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_app(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return None
        candidate_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(candidate_file):
            return FileResponse(candidate_file)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"name": "AURORA", "status": "active", "version": "1.0.0"}
else:
    @app.get("/")
    async def root():
        return {"name": "AURORA", "status": "active", "version": "1.0.0"}
