"""
AURORA Advisory Service — services/advisor/
============================================
Template-based natural language explanation engine.
Converts ALREADY-COMPUTED optimization + forecast numbers into
operational narrative for control room engineers.

IMPORTANT: This module NEVER makes calculations. It only phrases them.
UI must label its output: [GENERATED EXPLANATION — Based on deterministic optimization results]
"""
from app.services.optimization.engine import OptimizationResult, OptimizationInputs


def generate_explanation(result: OptimizationResult, inputs: OptimizationInputs) -> str:
    """Generate a concise operational advisory from computed optimization outputs."""

    mode = result.mode
    eff_pct = inputs.charging_efficiency * 100
    reserve_pct = inputs.reserve_pct * 100

    # Determine urgency language
    if mode == "insufficient_capacity":
        action = "CRITICAL — INSUFFICIENT BATTERY CAPACITY"
        charge_action = (
            f"Charge {result.effective_recommended_charge_kwh:,.0f} kWh today (maximum feasible, "
            f"constrained by {inputs.max_charge_power_kw:.0f} kW inverter limit over "
            f"{inputs.charging_window_hours:.0f}h window). "
            f"Shortfall of {result.shortfall_kwh:,.0f} kWh cannot be stored — "
            f"grid import of {result.shortfall_kwh:,.0f} kWh will be required tomorrow."
        )
    elif mode == "charge":
        action = "ACTION REQUIRED — CHARGE BATTERY TODAY"
        charge_action = (
            f"Charge {result.effective_recommended_charge_kwh:,.0f} kWh today. "
            f"Projected end-of-charge SOC: {result.projected_end_soc_pct*100:.1f}%. "
            f"This fully covers tomorrow's {result.deficit_kwh:,.0f} kWh deficit "
            f"plus {reserve_pct:.0f}% operating reserve ({result.reserve_requirement_kwh:,.0f} kWh)."
        )
    else:  # surplus
        action = "OPTIMAL — SURPLUS GENERATION TOMORROW"
        charge_action = (
            f"Store {result.charge_from_surplus_kwh:,.0f} kWh from surplus renewable generation "
            f"(efficiency-adjusted at {eff_pct:.0f}%). "
            f"Exportable grid surplus: {result.exportable_kwh:,.0f} kWh. "
            f"Projected SOC: {result.projected_end_soc_pct*100:.1f}%."
        )

    explanation = (
        f"[GENERATED EXPLANATION — Synthesized from deterministic optimization results]\n\n"
        f"OPERATIONAL DIRECTIVE: {action}\n\n"
        f"SITUATION: Tomorrow's forecast predicts {inputs.predicted_generation_kwh:,.0f} kWh of "
        f"renewable generation (solar + wind) against {inputs.expected_demand_kwh:,.0f} kWh expected demand. "
        f"{'A deficit of ' + f'{result.deficit_kwh:,.0f} kWh' if result.deficit_kwh > 0 else 'A surplus of ' + f'{result.surplus_kwh:,.0f} kWh'} exists before battery dispatch.\n\n"
        f"BATTERY STATUS: {result.headroom_kwh:,.0f} kWh of headroom available "
        f"(current stored: {inputs.current_stored_energy_kwh:,.0f} kWh of {inputs.capacity_kwh:,.0f} kWh capacity, "
        f"SOC={inputs.current_soc_pct*100:.1f}%).\n\n"
        f"RECOMMENDED ACTION: {charge_action}\n\n"
        f"EFFICIENCY NOTE: Charging efficiency of {eff_pct:.0f}% means every kWh stored requires "
        f"{1/inputs.charging_efficiency:.2f} kWh input. Round-trip efficiency: {eff_pct**2/100:.1f}%.\n\n"
        f"DATA SOURCE: Forecast from aurora-ensemble-v1.0 ML model. Optimization by deterministic solver. "
        f"All numbers above are computed — this text only explains them."
    )
    return explanation
