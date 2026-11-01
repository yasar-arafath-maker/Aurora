"""
Unit tests for the Rolling-Horizon Model Predictive Control (MPC) Controller.
Verifies:
  - 24 sequential HiGHS LP solves execute cleanly without infeasibility
  - Receding-horizon feedback achieves economic savings over blind Static Day-Ahead dispatch
  - Peak grid demand is mitigated under unexpected disturbance shocks
  - Physical SoC constraints [min_soc, max_soc] are strictly respected
"""
import pytest
from app.services.optimization.mpc_controller import (
    RollingHorizonMPCController, MPCSimulationConfig
)

def test_mpc_controller_simulation():
    cfg = MPCSimulationConfig(
        horizon_hours=24,
        lookahead_hours=24,
        battery_capacity_kwh=2500.0,
        initial_soc_pct=0.50,
        max_power_kw=625.0,
        cloud_shock_hours=(11, 14),
        cloud_drop_pct=0.45,
        demand_spike_hours=(18, 20),
        demand_surge_pct=0.35
    )

    controller = RollingHorizonMPCController(cfg)
    res = controller.run_simulation()

    assert res["status"] == "success"
    assert res["controller_type"] == "Rolling-Horizon Model Predictive Control (MPC)"
    assert res["horizon_hours"] == 24

    kpis = res["kpi_comparison"]
    static_cost = kpis["static_dayahead_cost_inr"]
    mpc_cost = kpis["mpc_closedloop_cost_inr"]
    savings = kpis["mpc_savings_over_static_inr"]

    # Fundamental MPC Invariant under disturbances:
    # Closed-loop MPC with nowcast feedback adapts to the shock and saves money vs static plan
    assert mpc_cost <= static_cost, f"MPC cost {mpc_cost} should be <= static cost {static_cost}"
    assert savings >= 0.0, f"MPC savings should be positive: {savings}"

    # Peak demand check: MPC should avoid or shave peak spikes
    assert kpis["mpc_peak_grid_demand_kw"] <= kpis["static_peak_grid_demand_kw"]

    # Step-by-step physical feasibility check
    trace = res["hourly_mpc_trace"]
    assert len(trace) == 24

    cap = cfg.battery_capacity_kwh
    for item in trace:
        soc_pct = item["mpc_soc_pct"]
        assert cfg.min_soc_pct * 100 - 1e-2 <= soc_pct <= cfg.max_soc_pct * 100 + 1e-2, (
            f"SoC out of bounds at hour {item['hour']}: {soc_pct}%"
        )
        # Power limits
        assert item["mpc_charge_kw"] <= cfg.max_power_kw + 1e-2
        assert item["mpc_discharge_kw"] <= cfg.max_power_kw + 1e-2

    # Check snapshots
    assert len(res["receding_plan_snapshots"]) >= 3
