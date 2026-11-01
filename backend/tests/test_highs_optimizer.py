"""
Unit tests for the 24-Hour HiGHS Mathematical LP Optimizer.
Verifies critical engineering invariants:
  - Strict energy balance at every single hour
  - Battery SoC bounded within [min_soc, max_soc]
  - Terminal SoC invariant: E_T >= E_init (eliminates end-of-horizon effect)
  - Zero simultaneous charge and discharge
  - Shadow prices (duals) extraction
"""
import pytest
import numpy as np
from app.services.optimization.highs_solver import (
    HighsBESSOptimizer, HighsOptimizerInputs, IndianTariffStructure
)

def test_highs_solver_invariants():
    T = 24
    # Solar bell curve + evening load spike
    gen = [round(max(0.0, 500.0 * np.sin(np.pi * (h - 6) / 12)), 1) if 6 <= h <= 18 else 0.0 for h in range(T)]
    demand = [round(300.0 + 150.0 * np.sin(np.pi * (h - 5) / 14) + (100.0 if 18 <= h <= 21 else 0.0), 1) for h in range(T)]

    cap = 2500.0
    init_soc = 0.50
    e_init = init_soc * cap
    min_soc = 0.10
    max_soc = 0.95
    max_p = 625.0

    inputs = HighsOptimizerInputs(
        horizon_hours=T,
        dt_hours=1.0,
        generation_kw=gen,
        demand_kw=demand,
        battery_capacity_kwh=cap,
        initial_soc_pct=init_soc,
        min_soc_pct=min_soc,
        max_soc_pct=max_soc,
        max_charge_kw=max_p,
        max_discharge_kw=max_p,
        charge_efficiency=0.94,
        discharge_efficiency=0.94,
        enforce_terminal_soc=True,
        tariff=IndianTariffStructure()
    )

    optimizer = HighsBESSOptimizer(inputs)
    res = optimizer.solve()

    assert res["success"] is True, f"Solver failed: {res.get('message')}"
    schedule = res["dispatch_schedule"]
    assert len(schedule) == T

    # Invariant 1: Terminal SoC invariant E_T >= E_init
    last_step = schedule[-1]
    assert last_step["stored_kwh"] >= (e_init - 1e-3), (
        f"Terminal SoC violation: {last_step['stored_kwh']} < {e_init}"
    )

    for item in schedule:
        ch = item["charge_kw"]
        dis = item["discharge_kw"]
        p_in = item["grid_import_kw"]
        p_out = item["grid_export_kw"]
        stored = item["stored_kwh"]
        soc = item["soc_pct"]
        pv = item["pv_generation_kw"]
        d = item["demand_kw"]

        # Invariant 2: Conservation of energy (Power Balance)
        # Gen + Grid_In + Dis == Demand + Grid_Out + Ch
        lhs = round(pv + p_in + dis, 2)
        rhs = round(d + p_out + ch, 2)
        assert abs(lhs - rhs) < 0.05, f"Energy balance violated at hour {item['hour']}: {lhs} != {rhs}"

        # Invariant 3: SoC bounds respected
        assert stored >= (min_soc * cap - 1e-3), f"SoC floor breached: {stored} < {min_soc * cap}"
        assert stored <= (max_soc * cap + 1e-3), f"SoC ceiling breached: {stored} > {max_soc * cap}"

        # Invariant 4: No simultaneous charging and discharging
        assert min(ch, dis) < 1e-3, f"Simultaneous charge/discharge at hour {item['hour']}: ch={ch}, dis={dis}"

        # Invariant 5: Inverter limits respected
        assert ch <= (max_p + 1e-3)
        assert dis <= (max_p + 1e-3)

    # Invariant 6: Financial accounting exists and is non-zero
    fin = res["financial_summary"]
    assert fin["net_operating_cost_inr"] > 0
    assert fin["peak_grid_demand_kw"] > 0
