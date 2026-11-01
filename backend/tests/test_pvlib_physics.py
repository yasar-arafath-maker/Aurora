"""
Unit tests for pvlib physics model and the comparative backtesting harness.
"""
import pytest
from datetime import datetime, timezone, timedelta
from app.services.forecasting.physics_pv import PVPhysicsModel
from app.services.optimization.backtest import run_comparative_backtest

def test_pvlib_physics_simulation():
    now = datetime(2026, 6, 21, 0, 0, tzinfo=timezone.utc) # Summer solstice
    times = [now + timedelta(hours=i) for i in range(24)]
    
    # Noon bell curve irradiance
    ghis = [800.0 if 10 <= i <= 14 else 300.0 if 7 <= i <= 17 else 0.0 for i in range(24)]
    dnis = [700.0 if 10 <= i <= 14 else 200.0 if 7 <= i <= 17 else 0.0 for i in range(24)]
    dhis = [150.0 if 7 <= i <= 17 else 0.0 for i in range(24)]
    temps = [32.0 if 10 <= i <= 16 else 26.0 for i in range(24)]
    winds = [4.0 for _ in range(24)]

    model = PVPhysicsModel(
        latitude=11.0168,
        longitude=76.9558,
        system_capacity_dc_kw=500.0,
        inverter_capacity_ac_kw=450.0
    )
    df = model.simulate_timeseries(times, ghis, dnis, dhis, temps, winds)

    assert len(df) == 24
    # Check inverter clipping ceiling invariant
    assert df["ac_power_kw"].max() <= 450.001
    # Check that midday output is positive
    midday = df[df["timestamp"].dt.hour == 12].iloc[0]
    assert midday["ac_power_kw"] > 100.0
    assert midday["poa_global_wm2"] > 200.0
    # Cell temp should be higher than ambient temp (32°C) under full sun
    assert midday["cell_temp_c"] > 32.0


def test_comparative_backtest_ordering():
    T = 24
    import numpy as np
    gen = [round(max(0.0, 450.0 * np.sin(np.pi * (h - 6) / 12)), 1) if 6 <= h <= 18 else 0.0 for h in range(T)]
    demand = [round(260.0 + 120.0 * np.sin(np.pi * (h - 5) / 14) + (80.0 if 18 <= h <= 21 else 0.0), 1) for h in range(T)]

    res = run_comparative_backtest(
        generation_kw=gen,
        demand_kw=demand,
        battery_capacity_kwh=2500.0,
        max_power_kw=625.0,
        initial_soc_pct=0.50
    )

    assert res["status"] == "success"
    summary = res["benchmark_summary"]
    
    no_bat = summary["no_battery_cost_inr"]
    heur = summary["heuristic_rule_cost_inr"]
    lp = summary["highs_lp_cost_inr"]
    bound = summary["perfect_foresight_bound_inr"]

    # Mathematical Invariant:
    # Perfect-Foresight (bound) <= Optimal LP <= No-Battery
    assert bound <= lp + 1e-2, f"Bound should be <= LP cost: {bound} vs {lp}"
    assert lp <= no_bat + 1e-2, f"LP should save money vs No-Battery: {lp} vs {no_bat}"
    assert summary["savings_vs_nobattery_inr"] >= 0.0
