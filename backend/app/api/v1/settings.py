from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
async def get_settings():
    return {
        "battery_capacity_kwh": settings.DEFAULT_BATTERY_CAPACITY_KWH,
        "max_charge_power_kw": settings.DEFAULT_MAX_CHARGE_POWER_KW,
        "max_discharge_power_kw": settings.DEFAULT_MAX_DISCHARGE_POWER_KW,
        "min_soc_pct": settings.DEFAULT_MIN_SOC_PCT,
        "max_soc_pct": settings.DEFAULT_MAX_SOC_PCT,
        "charging_efficiency": settings.DEFAULT_CHARGING_EFFICIENCY,
        "reserve_pct": settings.DEFAULT_RESERVE_PCT,
        "simulation_mode": True,
    }
