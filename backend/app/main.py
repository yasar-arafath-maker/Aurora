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

@app.get("/")
async def root():
    return {"name": "AURORA", "status": "active", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "AURORA API", "version": "1.0.0"}
