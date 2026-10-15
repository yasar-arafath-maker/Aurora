from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.services.battery.simulator import get_battery_status
from app.services.optimization.engine import run_optimization, OptimizationInputs
from app.services.forecasting.model import get_forecasting_service
from app.services.advisor.explainer import generate_explanation
from app.schemas.battery import (
    BatteryStatusResponse, BatteryOptimizeRequest, BatteryOptimizeResponse
)
from app.demo_data.generator import generate_hourly_history
from app.core.config import settings

router = APIRouter(prefix="/battery", tags=["Battery"])

def _get_settings_defaults():
    return {
        "capacity_kwh": settings.DEFAULT_BATTERY_CAPACITY_KWH,
        "min_soc_pct": settings.DEFAULT_MIN_SOC_PCT,
        "max_soc_pct": settings.DEFAULT_MAX_SOC_PCT,
        "max_charge_power_kw": settings.DEFAULT_MAX_CHARGE_POWER_KW,
        "max_discharge_power_kw": settings.DEFAULT_MAX_DISCHARGE_POWER_KW,
        "charging_efficiency": settings.DEFAULT_CHARGING_EFFICIENCY,
        "reserve_pct": settings.DEFAULT_RESERVE_PCT,
    }

@router.get("/status", response_model=BatteryStatusResponse)
async def get_battery_status_endpoint():
    d = _get_settings_defaults()
    status = get_battery_status(**d)
    return BatteryStatusResponse(**status)

@router.post("/optimize", response_model=BatteryOptimizeResponse)
async def optimize_battery(req: BatteryOptimizeRequest):
    d = _get_settings_defaults()

    # Get ML prediction for tomorrow
    svc = get_forecasting_service()
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
    prediction = svc.predict_day(tomorrow)

    # Battery live status
    batt = get_battery_status(
        d["capacity_kwh"], d["min_soc_pct"], d["max_soc_pct"],
        d["max_charge_power_kw"], d["max_discharge_power_kw"],
        d["charging_efficiency"], d["reserve_pct"]
    )

    # Apply any overrides from the request
    capacity = req.capacity_kwh or d["capacity_kwh"]
    min_soc = req.min_soc_pct or d["min_soc_pct"]
    max_soc = req.max_soc_pct or d["max_soc_pct"]
    efficiency = req.charging_efficiency or d["charging_efficiency"]
    reserve = req.reserve_pct or d["reserve_pct"]
    max_charge = req.max_charge_power_kw or d["max_charge_power_kw"]
    charging_window = req.charging_window_hours or 6.0
    
    current_soc = req.current_soc_pct or batt["soc_pct"]
    current_stored = req.current_stored_energy_kwh or (current_soc * capacity)
    
    demand = req.expected_demand_kwh or prediction["expected_demand_kwh"]
    predicted_gen = req.predicted_generation_kwh or prediction["predicted_total_kwh"]

    inputs = OptimizationInputs(
        expected_demand_kwh=demand,
        predicted_generation_kwh=predicted_gen,
        current_stored_energy_kwh=current_stored,
        current_soc_pct=current_soc,
        capacity_kwh=capacity,
        min_soc_pct=min_soc,
        max_soc_pct=max_soc,
        charging_efficiency=efficiency,
        reserve_pct=reserve,
        max_charge_power_kw=max_charge,
        max_discharge_power_kw=d["max_discharge_power_kw"],
        charging_window_hours=charging_window,
    )
    result = run_optimization(inputs)
    explanation = generate_explanation(result, inputs)

    return BatteryOptimizeResponse(
        mode=result.mode,
        deficit_kwh=result.deficit_kwh,
        surplus_kwh=result.surplus_kwh,
        reserve_requirement_kwh=result.reserve_requirement_kwh,
        required_usable_kwh=result.required_usable_kwh,
        required_charging_kwh=result.required_charging_kwh,
        headroom_kwh=result.headroom_kwh,
        recommended_charge_kwh=result.recommended_charge_kwh,
        shortfall_kwh=result.shortfall_kwh,
        charge_from_surplus_kwh=result.charge_from_surplus_kwh,
        exportable_kwh=result.exportable_kwh,
        power_limit_clamped=result.power_limit_clamped,
        power_limit_kwh=result.power_limit_kwh,
        effective_recommended_charge_kwh=result.effective_recommended_charge_kwh,
        projected_end_soc_pct=result.projected_end_soc_pct,
        inputs_used=result.inputs_used,
        derivations=result.derivations,
        advisor_explanation=explanation,
    )

@router.get("/history")
async def get_battery_history(days: int = 7):
    rows = generate_hourly_history(days_back=days)
    batt = get_battery_status()
    # Reconstruct simulated SOC history
    cap = batt["capacity_kwh"]
    history = []
    for i, row in enumerate(rows[::6]):  # every 6 hours
        h = row["timestamp"].hour
        soc = 0.55 + 0.25 * (1 if 9 <= h <= 15 else -0.5 if 17 <= h <= 22 else 0)
        soc = max(0.10, min(0.95, soc + (i % 5 - 2) * 0.02))
        history.append({
            "timestamp": row["timestamp"].isoformat(),
            "soc_pct": round(soc, 3),
            "stored_kwh": round(soc * cap, 1),
            "solar_kwh": row["solar_kwh"],
            "wind_kwh": row["wind_kwh"],
            "demand_kwh": row["demand_kwh"],
        })
    return {"history": history, "source": "demo"}
