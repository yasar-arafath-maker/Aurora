import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.settings import SystemSetting
from app.models import (
    WeatherData, EnergyGeneration, EnergyDemand,
    BatteryStatus, Prediction, OptimizationResult,
    Alert, SimulationRun
)
from app.core.config import settings

async def init_db():
    # Create all tables asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial users & settings
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        stmt = select(User).where(User.email == "admin@aurora.grid")
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            users_to_seed = [
                User(
                    email="admin@aurora.grid",
                    password_hash=get_password_hash("AdminPassword123!"),
                    role=UserRole.ADMIN.value,
                    created_at=datetime.now(timezone.utc)
                ),
                User(
                    email="operator@aurora.grid",
                    password_hash=get_password_hash("OperatorPassword123!"),
                    role=UserRole.OPERATOR.value,
                    created_at=datetime.now(timezone.utc)
                ),
                User(
                    email="viewer@aurora.grid",
                    password_hash=get_password_hash("ViewerPassword123!"),
                    role=UserRole.VIEWER.value,
                    created_at=datetime.now(timezone.utc)
                )
            ]
            db.add_all(users_to_seed)
            await db.commit()
            print("[AURORA INIT] Seeded default users: admin, operator, viewer.")

        # Seed system settings if not present
        default_settings = {
            "battery_capacity_kwh": str(settings.DEFAULT_BATTERY_CAPACITY_KWH),
            "max_charge_power_kw": str(settings.DEFAULT_MAX_CHARGE_POWER_KW),
            "max_discharge_power_kw": str(settings.DEFAULT_MAX_DISCHARGE_POWER_KW),
            "min_soc_pct": str(settings.DEFAULT_MIN_SOC_PCT),
            "max_soc_pct": str(settings.DEFAULT_MAX_SOC_PCT),
            "charging_efficiency": str(settings.DEFAULT_CHARGING_EFFICIENCY),
            "reserve_pct": str(settings.DEFAULT_RESERVE_PCT),
            "simulation_mode": "true",
        }
        for k, v in default_settings.items():
            s_stmt = select(SystemSetting).where(SystemSetting.key == k)
            s_res = await db.execute(s_stmt)
            if not s_res.scalar_one_or_none():
                db.add(SystemSetting(key=k, value=v, updated_at=datetime.now(timezone.utc)))
        await db.commit()
        print("[AURORA INIT] Seeded default system settings.")

if __name__ == "__main__":
    asyncio.run(init_db())
