import os
from typing import List
from pydantic import BaseModel, Field

class Settings(BaseModel):
    PROJECT_NAME: str = "AURORA Renewable Energy Yield Prediction & Grid Battery Storage Optimization Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aurora-super-secret-jwt-signing-key-production-grade-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite async dev fallback; PostgreSQL compatible: postgresql+asyncpg://user:pass@localhost:5432/aurora
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./aurora.db")
    
    CORS_ORIGINS: List[str] = ["*"]
    
    # Default Battery Physical Constants
    DEFAULT_BATTERY_CAPACITY_KWH: float = 2500.0       # 2.5 MWh
    DEFAULT_MAX_CHARGE_POWER_KW: float = 625.0         # 4-hour C-rate limit
    DEFAULT_MAX_DISCHARGE_POWER_KW: float = 750.0
    DEFAULT_MIN_SOC_PCT: float = 0.10                  # 10% depth of discharge floor
    DEFAULT_MAX_SOC_PCT: float = 0.95                  # 95% ceiling for cell longevity
    DEFAULT_CHARGING_EFFICIENCY: float = 0.92          # 92% one-way roundtrip ~85%
    DEFAULT_RESERVE_PCT: float = 0.15                  # 15% operating reserve buffer

settings = Settings()
