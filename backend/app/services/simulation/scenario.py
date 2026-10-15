"""Simulation engine: runs what-if scenarios without mutating live state."""
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from app.services.forecasting.model import get_forecasting_service
from app.services.optimization.engine import run_optimization, OptimizationInputs
from app.services.battery.simulator import get_battery_status
from app.demo_data.generator import solar_kwh_from_irradiance, solar_irradiance_wm2, wind_kwh_from_speed, demand_kwh


def run_scenario(
    cloud_cover_pct: Optional[float] = None,
    wind_speed_ms: Optional[float] = None,
    irradiance_multiplier: float = 1.0,
    demand_multiplier: float = 1.0,
    initial_soc_pct: Optional[float] = None,
    capacity_kwh: float = 2500.0,
    max_charge_power_kw: float = 625.0,
    max_discharge_power_kw: float = 750.0,
    min_soc_pct: float = 0.10,
    max_soc_pct: float = 0.95,
    charging_efficiency: float = 0.92,
    reserve_pct: float = 0.15,
    charging_window_hours: float = 6.0,
) -> Dict[str, Any]:
    """
    Run a what-if scenario.
    Baseline = current ML prediction + live battery state.
    Simulated = same pipeline with overrides applied.
    Returns before/after comparison without modifying any DB state.
    """
    svc = get_forecasting_service()
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()

    # Baseline
    baseline = svc.predict_day(tomorrow)
    b_solar = baseline["predicted_solar_kwh"]
    b_wind = baseline["predicted_wind_kwh"]
    b_demand = baseline["expected_demand_kwh"]

    # Battery baseline state
    batt = get_battery_status(capacity_kwh, min_soc_pct, max_soc_pct,
                               max_charge_power_kw, max_discharge_power_kw,
                               charging_efficiency, reserve_pct)
    base_soc = initial_soc_pct if initial_soc_pct is not None else batt["soc_pct"]
    base_stored = base_soc * capacity_kwh

    baseline_inputs = OptimizationInputs(
        expected_demand_kwh=b_demand,
        predicted_generation_kwh=b_solar + b_wind,
        current_stored_energy_kwh=base_stored,
        current_soc_pct=base_soc,
        capacity_kwh=capacity_kwh,
        min_soc_pct=min_soc_pct,
        max_soc_pct=max_soc_pct,
        charging_efficiency=charging_efficiency,
        reserve_pct=reserve_pct,
        max_charge_power_kw=max_charge_power_kw,
        max_discharge_power_kw=max_discharge_power_kw,
        charging_window_hours=charging_window_hours,
    )
    baseline_result = run_optimization(baseline_inputs)

    # Simulated: apply overrides
    now = datetime.now(timezone.utc)
    month = now.month
    dow = tomorrow.weekday()
    doy = (datetime.now(timezone.utc) + timedelta(days=1)).timetuple().tm_yday

    # Recompute solar with cloud_cover / irradiance override
    sim_cloud = cloud_cover_pct if cloud_cover_pct is not None else 30.0
    sim_wind = wind_speed_ms if wind_speed_ms is not None else 7.5

    sim_solar_total = 0.0
    sim_wind_total = 0.0
    for h in range(24):
        irr = solar_irradiance_wm2(h, sim_cloud, doy) * irradiance_multiplier
        sim_solar_total += solar_kwh_from_irradiance(irr)
        sim_wind_total += wind_kwh_from_speed(sim_wind)
    sim_demand_total = sum(demand_kwh(h, dow, month) for h in range(24)) * demand_multiplier

    sim_inputs = OptimizationInputs(
        expected_demand_kwh=sim_demand_total,
        predicted_generation_kwh=sim_solar_total + sim_wind_total,
        current_stored_energy_kwh=base_stored,
        current_soc_pct=base_soc,
        capacity_kwh=capacity_kwh,
        min_soc_pct=min_soc_pct,
        max_soc_pct=max_soc_pct,
        charging_efficiency=charging_efficiency,
        reserve_pct=reserve_pct,
        max_charge_power_kw=max_charge_power_kw,
        max_discharge_power_kw=max_discharge_power_kw,
        charging_window_hours=charging_window_hours,
    )
    sim_result = run_optimization(sim_inputs)

    # Build hourly timeline for chart
    timeline = []
    for h in range(24):
        b_irr = solar_irradiance_wm2(h, 30, doy)
        b_solar_h = solar_kwh_from_irradiance(b_irr)
        b_wind_h = wind_kwh_from_speed(7.5)
        b_demand_h = demand_kwh(h, dow, month)

        s_irr = solar_irradiance_wm2(h, sim_cloud, doy) * irradiance_multiplier
        s_solar_h = solar_kwh_from_irradiance(s_irr)
        s_wind_h = wind_kwh_from_speed(sim_wind)
        s_demand_h = demand_kwh(h, dow, month) * demand_multiplier

        timeline.append({
            "hour": h,
            "time_label": f"{h:02d}:00",
            "baseline_generation_kw": round(b_solar_h + b_wind_h, 1),
            "simulated_generation_kw": round(s_solar_h + s_wind_h, 1),
            "baseline_demand_kw": round(b_demand_h, 1),
            "simulated_demand_kw": round(s_demand_h, 1),
            "baseline_battery_soc_pct": round(base_soc + (h / 24) * (baseline_result.projected_end_soc_pct - base_soc), 4),
            "simulated_battery_soc_pct": round(base_soc + (h / 24) * (sim_result.projected_end_soc_pct - base_soc), 4),
        })

    # Executive summary
    delta_charge = sim_result.effective_recommended_charge_kwh - baseline_result.effective_recommended_charge_kwh
    summary = (
        f"Scenario analysis complete. "
        f"Simulated generation: {sim_solar_total + sim_wind_total:,.0f} kWh "
        f"vs baseline: {b_solar + b_wind:,.0f} kWh "
        f"({'▲' if sim_solar_total + sim_wind_total > b_solar + b_wind else '▼'}"
        f"{abs((sim_solar_total + sim_wind_total) - (b_solar + b_wind)):,.0f} kWh). "
        f"Required charge: {sim_result.effective_recommended_charge_kwh:,.0f} kWh "
        f"({'▲' if delta_charge > 0 else '▼'}{abs(delta_charge):,.0f} kWh vs baseline). "
        f"Mode: {sim_result.mode.replace('_', ' ').upper()}."
    )

    return {
        "inputs_applied": {
            "cloud_cover_pct": cloud_cover_pct,
            "wind_speed_ms": wind_speed_ms,
            "irradiance_multiplier": irradiance_multiplier,
            "demand_multiplier": demand_multiplier,
            "initial_soc_pct": initial_soc_pct,
        },
        "baseline_predicted_solar_kwh": round(b_solar, 2),
        "simulated_predicted_solar_kwh": round(sim_solar_total, 2),
        "baseline_predicted_wind_kwh": round(b_wind, 2),
        "simulated_predicted_wind_kwh": round(sim_wind_total, 2),
        "baseline_total_generation_kwh": round(b_solar + b_wind, 2),
        "simulated_total_generation_kwh": round(sim_solar_total + sim_wind_total, 2),
        "baseline_demand_kwh": round(b_demand, 2),
        "simulated_demand_kwh": round(sim_demand_total, 2),
        "baseline_deficit_kwh": round(baseline_result.deficit_kwh, 2),
        "simulated_deficit_kwh": round(sim_result.deficit_kwh, 2),
        "baseline_recommended_charge_kwh": round(baseline_result.effective_recommended_charge_kwh, 2),
        "simulated_recommended_charge_kwh": round(sim_result.effective_recommended_charge_kwh, 2),
        "baseline_mode": baseline_result.mode,
        "simulated_mode": sim_result.mode,
        "timeline": timeline,
        "executive_summary": summary,
    }
