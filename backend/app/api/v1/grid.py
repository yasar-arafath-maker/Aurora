from fastapi import APIRouter
from datetime import datetime, timezone, timedelta, date
import random

router = APIRouter(prefix="/grid", tags=["Grid"])

_rng = random.Random(11)

@router.get("/status")
async def get_grid_status():
    now = datetime.now(timezone.utc)
    h = now.hour
    # Frequency oscillates subtly around 50 Hz
    freq = 50.0 + _rng.gauss(0, 0.03)
    voltage_kv = 11.0 + _rng.gauss(0, 0.05)
    # Import/export based on time of day
    solar_active = 8 <= h <= 18
    import_kw = max(0, _rng.uniform(50, 400) if not solar_active else _rng.uniform(0, 80))
    export_kw = max(0, _rng.uniform(100, 600) if solar_active else 0)
    pf = _rng.uniform(0.92, 0.99)
    return {
        "timestamp": now.isoformat(),
        "frequency_hz": round(freq, 3),
        "voltage_kv": round(voltage_kv, 3),
        "import_kw": round(import_kw, 1),
        "export_kw": round(export_kw, 1),
        "power_factor": round(pf, 3),
        "grid_status": "CONNECTED",
        "source": "demo",
    }

@router.get("/flow")
async def get_power_flow():
    now = datetime.now(timezone.utc)
    h = now.hour
    solar_kw = max(0, 800 + _rng.gauss(0, 80)) if 8 <= h <= 18 else 0
    wind_kw = max(0, 350 + _rng.gauss(0, 60))
    battery_kw = _rng.uniform(-200, 200)  # + charging, - discharging
    demand_kw = 1800 + _rng.gauss(0, 100)
    generation_kw = solar_kw + wind_kw
    grid_kw = demand_kw - generation_kw - battery_kw
    return {
        "timestamp": now.isoformat(),
        "solar_kw": round(solar_kw, 1),
        "wind_kw": round(wind_kw, 1),
        "generation_total_kw": round(generation_kw, 1),
        "battery_kw": round(battery_kw, 1),  # pos = charging
        "demand_kw": round(demand_kw, 1),
        "grid_kw": round(grid_kw, 1),         # pos = import
        "source": "demo",
    }
