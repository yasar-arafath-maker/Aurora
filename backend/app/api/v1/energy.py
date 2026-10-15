from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.demo_data.generator import get_current_telemetry, generate_hourly_history
from app.schemas.energy import EnergyCurrent, EnergyHistoryPoint, EnergyHistoryResponse

router = APIRouter(prefix="/energy", tags=["Energy"])

@router.get("/current", response_model=EnergyCurrent)
async def get_energy_current():
    t = get_current_telemetry()
    return EnergyCurrent(
        timestamp=t["timestamp"],
        solar_kw=t["solar_kw"],
        wind_kw=t["wind_kw"],
        total_generation_kw=t["total_generation_kw"],
        demand_kw=t["demand_kw"],
        net_balance_kw=t["net_balance_kw"],
        grid_import_kw=t["grid_import_kw"],
        grid_export_kw=t["grid_export_kw"],
        battery_flow_kw=t["battery_flow_kw"],
        source="demo",
    )

@router.get("/history", response_model=EnergyHistoryResponse)
async def get_energy_history(
    days: int = Query(default=7, ge=1, le=90, description="Number of days of history to return"),
):
    rows = generate_hourly_history(days_back=days)
    # Aggregate to daily
    daily: dict = {}
    for r in rows:
        day = r["timestamp"].date().isoformat()
        if day not in daily:
            daily[day] = {"solar": 0, "wind": 0, "demand": 0, "ts": r["timestamp"]}
        daily[day]["solar"] += r["solar_kwh"]
        daily[day]["wind"] += r["wind_kwh"]
        daily[day]["demand"] += r["demand_kwh"]

    points = []
    for day, v in sorted(daily.items())[-days:]:
        total = v["solar"] + v["wind"]
        net = total - v["demand"]
        points.append(EnergyHistoryPoint(
            timestamp=datetime.fromisoformat(day + "T00:00:00+00:00"),
            solar_kwh=round(v["solar"], 1),
            wind_kwh=round(v["wind"], 1),
            total_kwh=round(total, 1),
            demand_kwh=round(v["demand"], 1),
            net_kwh=round(net, 1),
            source="demo",
        ))

    total_solar = sum(p.solar_kwh for p in points)
    total_wind = sum(p.wind_kwh for p in points)
    total_demand = sum(p.demand_kwh for p in points)

    return EnergyHistoryResponse(
        points=points,
        summary_solar_total_kwh=round(total_solar, 1),
        summary_wind_total_kwh=round(total_wind, 1),
        summary_demand_total_kwh=round(total_demand, 1),
        source="demo",
    )
