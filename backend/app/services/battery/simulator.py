"""Battery status simulator returning realistic live telemetry."""
import math
import random
from datetime import datetime, timezone

_rng = random.Random(99)

def get_battery_status(
    capacity_kwh: float = 2500.0,
    min_soc_pct: float = 0.10,
    max_soc_pct: float = 0.95,
    max_charge_power_kw: float = 625.0,
    max_discharge_power_kw: float = 750.0,
    charging_efficiency: float = 0.92,
    reserve_pct: float = 0.15,
    **kwargs
) -> dict:
    """Return a realistic battery telemetry snapshot."""
    min_soc = kwargs.get("min_soc", min_soc_pct)
    max_soc = kwargs.get("max_soc", max_soc_pct)
    efficiency = kwargs.get("efficiency", charging_efficiency)

    now = datetime.now(timezone.utc)
    hour = now.hour
    
    # SOC cycles: charges during solar peak (09-15), discharges at evening peak (17-22)
    if 9 <= hour <= 15:
        soc = min_soc + (max_soc - min_soc) * (hour - 9) / 6 * 0.9
        current_a = 800.0  # charging
    elif 17 <= hour <= 22:
        soc = max_soc * (1 - (hour - 17) / 5 * 0.5)
        current_a = -950.0  # discharging
    else:
        soc = min_soc + (max_soc - min_soc) * 0.55
        current_a = _rng.uniform(-50, 50)

    soc = max(min_soc, min(max_soc, soc + _rng.gauss(0, 0.01)))
    stored_kwh = soc * capacity_kwh
    voltage = 780.0 + (soc - 0.5) * 40.0 + _rng.gauss(0, 1.5)  # ~760-800V pack
    temp_c = 28.0 + abs(current_a) / 100.0 + _rng.gauss(0, 0.5)
    
    # Average demand ~1800kW, backup hours from stored energy / avg demand
    avg_demand_kw = 1850.0
    backup_hours = stored_kwh / avg_demand_kw

    health_state = "OPTIMAL" if 0.3 < soc < 0.9 else ("NORMAL" if soc >= min_soc else "DERATED")

    return {
        "timestamp": now,
        "soc_pct": round(soc, 4),
        "voltage": round(voltage, 1),
        "current": round(current_a, 1),
        "temperature_c": round(temp_c, 1),
        "stored_kwh": round(stored_kwh, 1),
        "capacity_kwh": capacity_kwh,
        "min_soc_pct": min_soc,
        "max_soc_pct": max_soc,
        "max_charge_power_kw": max_charge_power_kw,
        "max_discharge_power_kw": max_discharge_power_kw,
        "charging_efficiency": efficiency,
        "reserve_pct": reserve_pct,
        "health_state": health_state,
        "estimated_backup_hours": round(backup_hours, 2),
    }
