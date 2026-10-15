import pytest
from app.services.optimization.engine import run_optimization, OptimizationInputs

def test_deterministic_deficit_calculation():
    # Generation (5000) < Demand (7000) => Deficit = 2000 kWh
    inputs = OptimizationInputs(
        expected_demand_kwh=7000.0,
        predicted_generation_kwh=5000.0,
        current_stored_energy_kwh=1250.0,
        current_soc_pct=0.50,
        capacity_kwh=2500.0,
        min_soc_pct=0.10,
        max_soc_pct=0.95,
        charging_efficiency=0.92,
        reserve_pct=0.15,
        max_charge_power_kw=625.0,
        max_discharge_power_kw=750.0,
        charging_window_hours=6.0,
    )
    res = run_optimization(inputs)
    assert res.deficit_kwh == 2000.0
    assert res.surplus_kwh == 0.0
    assert res.recommended_charge_kwh > 0
    # Headroom = 0.95 * 2500 - 1250 = 2375 - 1250 = 1125 kWh
    assert res.headroom_kwh == 1125.0
    # Recommended charge is capped by headroom
    assert res.recommended_charge_kwh <= res.headroom_kwh
    assert res.shortfall_kwh > 0  # Headroom is smaller than full deficit + reserve requirement

def test_deterministic_surplus_calculation():
    # Generation (9000) > Demand (6000) => Surplus = 3000 kWh
    inputs = OptimizationInputs(
        expected_demand_kwh=6000.0,
        predicted_generation_kwh=9000.0,
        current_stored_energy_kwh=750.0,
        current_soc_pct=0.30,
        capacity_kwh=2500.0,
        min_soc_pct=0.10,
        max_soc_pct=0.95,
        charging_efficiency=0.92,
        reserve_pct=0.10,
        max_charge_power_kw=625.0,
        max_discharge_power_kw=750.0,
        charging_window_hours=6.0,
    )
    res = run_optimization(inputs)
    assert res.deficit_kwh == -3000.0
    assert res.surplus_kwh == 3000.0
    assert res.mode == "surplus"
    assert res.exportable_kwh >= 0.0

def test_derivation_trace_completeness():
    inputs = OptimizationInputs(
        expected_demand_kwh=8600.0,
        predicted_generation_kwh=7350.0,
        current_stored_energy_kwh=1712.5,
        current_soc_pct=0.685,
        capacity_kwh=2500.0,
        min_soc_pct=0.10,
        max_soc_pct=0.95,
        charging_efficiency=0.92,
        reserve_pct=0.15,
        max_charge_power_kw=625.0,
        max_discharge_power_kw=750.0,
        charging_window_hours=6.0,
    )
    res = run_optimization(inputs)
    assert len(res.derivations) >= 6
    for step in res.derivations:
        assert step.formula_name
        assert step.formula_latex
        assert step.calculation
        assert step.result_unit
