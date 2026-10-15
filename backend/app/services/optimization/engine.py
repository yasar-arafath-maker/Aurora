"""
AURORA Battery Optimization Engine — services/optimization/
============================================================
DETERMINISTIC MATH ONLY. No ML. No LLM. No probabilities.
Every output is a direct algebraic consequence of the inputs.

Implements exactly the spec formulas:
  deficit = demand - predicted_generation
  if deficit > 0:
      required_usable   = deficit + (reserve_pct * demand)
      required_charging = required_usable / charging_efficiency
      headroom           = (max_soc_pct * capacity) - current_stored
      recommended_charge = min(required_charging, headroom)
      shortfall          = max(0, required_charging - headroom)
  else:
      surplus             = -deficit
      headroom            = (max_soc_pct * capacity) - current_stored
      charge_from_surplus = min(surplus * charging_efficiency, headroom)
      exportable          = max(0, surplus - charge_from_surplus / charging_efficiency)

Physical limits checked:
  - max_charge_power kW over charging_window_hours
  - min_soc floor not breached by discharge
  - max_soc ceiling not exceeded
"""
from typing import Dict, Any, List
from dataclasses import dataclass
from app.schemas.battery import BatteryStepDerivation


@dataclass
class OptimizationInputs:
    expected_demand_kwh: float          # kWh over target period
    predicted_generation_kwh: float     # Solar + Wind kWh
    current_stored_energy_kwh: float    # Current usable stored energy
    current_soc_pct: float              # 0.0 – 1.0
    capacity_kwh: float                 # Nameplate capacity
    min_soc_pct: float                  # Hard floor (e.g., 0.10)
    max_soc_pct: float                  # Hard ceiling (e.g., 0.95)
    charging_efficiency: float          # One-way (e.g., 0.92)
    reserve_pct: float                  # Buffer fraction of demand (e.g., 0.15)
    max_charge_power_kw: float          # Inverter charging limit
    max_discharge_power_kw: float       # Inverter discharge limit
    charging_window_hours: float = 6.0  # Available charging window


@dataclass
class OptimizationResult:
    mode: str
    deficit_kwh: float
    surplus_kwh: float
    reserve_requirement_kwh: float
    required_usable_kwh: float
    required_charging_kwh: float
    headroom_kwh: float
    recommended_charge_kwh: float
    shortfall_kwh: float
    charge_from_surplus_kwh: float
    exportable_kwh: float
    power_limit_kwh: float
    power_limit_clamped: bool
    effective_recommended_charge_kwh: float
    projected_end_soc_pct: float
    inputs_used: Dict[str, float]
    derivations: List[BatteryStepDerivation]


def _fmt(val: float, decimals: int = 2) -> str:
    return f"{val:,.{decimals}f}"


def run_optimization(inputs: OptimizationInputs) -> OptimizationResult:
    """
    Execute the deterministic battery optimization pipeline.
    Returns full derivation trace for the SCADA formula display panel.
    """
    derivations: List[BatteryStepDerivation] = []
    step = 0

    def add_step(formula_name: str, formula_latex: str, calculation: str,
                 result: float, unit: str, explanation: str):
        nonlocal step
        step += 1
        derivations.append(BatteryStepDerivation(
            step_number=step,
            formula_name=formula_name,
            formula_latex=formula_latex,
            calculation=calculation,
            result_value=round(result, 3),
            result_unit=unit,
            explanation=explanation,
        ))

    # ── Step 1: Deficit / Surplus ──────────────────────────────────────────
    deficit = inputs.expected_demand_kwh - inputs.predicted_generation_kwh
    add_step(
        "Energy Deficit",
        r"deficit = demand - generation",
        f"{_fmt(inputs.expected_demand_kwh)} - {_fmt(inputs.predicted_generation_kwh)}",
        deficit,
        "kWh",
        "Net energy deficit for tomorrow. Positive means renewable generation falls short of demand."
    )

    surplus = max(0.0, -deficit)
    add_step(
        "Surplus Energy",
        r"surplus = \max(0,\ -deficit)",
        f"max(0, -{_fmt(deficit)}) = {_fmt(surplus)}",
        surplus,
        "kWh",
        "Excess renewable energy available after meeting demand. Zero when there is a deficit."
    )

    # ── Step 2: Reserve buffer ────────────────────────────────────────────
    reserve_req = inputs.reserve_pct * inputs.expected_demand_kwh
    add_step(
        "Reserve Requirement",
        r"R_{req} = r_{pct} \times demand",
        f"{_fmt(inputs.reserve_pct, 3)} × {_fmt(inputs.expected_demand_kwh)} = {_fmt(reserve_req)}",
        reserve_req,
        "kWh",
        f"Operating reserve: {inputs.reserve_pct*100:.0f}% of demand held back as contingency buffer."
    )

    # ── Step 3: Battery headroom ──────────────────────────────────────────
    max_storable = inputs.max_soc_pct * inputs.capacity_kwh
    headroom = max_storable - inputs.current_stored_energy_kwh
    add_step(
        "Available Headroom",
        r"headroom = (SOC_{max} \times C) - E_{stored}",
        f"({_fmt(inputs.max_soc_pct, 3)} × {_fmt(inputs.capacity_kwh)}) - {_fmt(inputs.current_stored_energy_kwh)} = {_fmt(headroom)}",
        headroom,
        "kWh",
        "Maximum additional energy the battery can physically absorb before hitting SOC ceiling."
    )

    # ── Step 4a: Deficit branch ──────────────────────────────────────────
    required_usable = 0.0
    required_charging = 0.0
    recommended_charge = 0.0
    shortfall = 0.0
    charge_from_surplus = 0.0
    exportable = 0.0

    if deficit > 0:
        required_usable = deficit + reserve_req
        add_step(
            "Required Usable Energy",
            r"E_{usable} = deficit + R_{req}",
            f"{_fmt(deficit)} + {_fmt(reserve_req)} = {_fmt(required_usable)}",
            required_usable,
            "kWh",
            "Total usable energy that must be in the battery tomorrow: deficit covered plus operating reserve."
        )

        required_charging = required_usable / inputs.charging_efficiency
        add_step(
            "Required Charging (with efficiency loss)",
            r"E_{charge} = E_{usable} / \eta",
            f"{_fmt(required_usable)} / {_fmt(inputs.charging_efficiency, 3)} = {_fmt(required_charging)}",
            required_charging,
            "kWh",
            f"More energy must be charged in than can be discharged due to {inputs.charging_efficiency*100:.0f}% one-way efficiency."
        )

        recommended_charge = min(required_charging, headroom)
        add_step(
            "Recommended Charge",
            r"E_{rec} = \min(E_{charge},\ headroom)",
            f"min({_fmt(required_charging)}, {_fmt(headroom)}) = {_fmt(recommended_charge)}",
            recommended_charge,
            "kWh",
            "Cannot charge beyond what headroom allows. This is the charging energy to deliver today."
        )

        shortfall = max(0.0, required_charging - headroom)
        add_step(
            "Capacity Shortfall",
            r"shortfall = \max(0,\ E_{charge} - headroom)",
            f"max(0, {_fmt(required_charging)} - {_fmt(headroom)}) = {_fmt(shortfall)}",
            shortfall,
            "kWh",
            "Energy requirement that cannot be met by the battery — may require grid import or demand response."
        )

        mode = "insufficient_capacity" if shortfall > 0 else "charge"

    # ── Step 4b: Surplus branch ───────────────────────────────────────────
    else:
        charge_from_surplus = min(surplus * inputs.charging_efficiency, headroom)
        add_step(
            "Charge from Surplus",
            r"E_{surplus\_charge} = \min(surplus \times \eta,\ headroom)",
            f"min({_fmt(surplus)} × {_fmt(inputs.charging_efficiency, 3)}, {_fmt(headroom)}) = {_fmt(charge_from_surplus)}",
            charge_from_surplus,
            "kWh",
            "Energy stored from surplus production, reduced by charging efficiency, capped at headroom."
        )

        exportable = max(0.0, surplus - charge_from_surplus / max(inputs.charging_efficiency, 0.01))
        add_step(
            "Grid-Exportable Surplus",
            r"E_{export} = \max(0,\ surplus - E_{surplus\_charge} / \eta)",
            f"max(0, {_fmt(surplus)} - {_fmt(charge_from_surplus)}/{_fmt(inputs.charging_efficiency, 3)}) = {_fmt(exportable)}",
            exportable,
            "kWh",
            "Remaining surplus after battery is fully charged — this can be exported to the grid."
        )

        mode = "surplus"
        recommended_charge = charge_from_surplus

    # ── Step 5: Physical power limit check ───────────────────────────────
    power_limit_kwh = inputs.max_charge_power_kw * inputs.charging_window_hours
    add_step(
        "Max Deliverable Charge (Power Limit)",
        r"E_{power\_limit} = P_{max} \times t_{window}",
        f"{_fmt(inputs.max_charge_power_kw)} kW × {_fmt(inputs.charging_window_hours, 1)} h = {_fmt(power_limit_kwh)}",
        power_limit_kwh,
        "kWh",
        f"The inverter cannot deliver more than {inputs.max_charge_power_kw:.0f} kW × {inputs.charging_window_hours:.0f}h window regardless of energy requirement."
    )

    power_limit_clamped = recommended_charge > power_limit_kwh
    effective_charge = min(recommended_charge, power_limit_kwh)
    add_step(
        "Effective Recommended Charge",
        r"E_{effective} = \min(E_{rec},\ E_{power\_limit})",
        f"min({_fmt(recommended_charge)}, {_fmt(power_limit_kwh)}) = {_fmt(effective_charge)}",
        effective_charge,
        "kWh",
        "Physically deliverable charge: the lower of energy need and what the inverter can push in the available window."
    )

    # ── Step 6: Projected end SOC ─────────────────────────────────────────
    projected_stored = inputs.current_stored_energy_kwh + effective_charge
    projected_soc = min(inputs.max_soc_pct, projected_stored / inputs.capacity_kwh)
    add_step(
        "Projected End-of-Charge SOC",
        r"SOC_{end} = (E_{stored} + E_{effective}) / C",
        f"({_fmt(inputs.current_stored_energy_kwh)} + {_fmt(effective_charge)}) / {_fmt(inputs.capacity_kwh)} = {_fmt(projected_soc, 4)}",
        projected_soc * 100,
        "%",
        "Estimated state of charge at the end of today's charging window before tomorrow's operation."
    )

    inputs_dict = {
        "expected_demand_kwh": inputs.expected_demand_kwh,
        "predicted_generation_kwh": inputs.predicted_generation_kwh,
        "current_stored_energy_kwh": inputs.current_stored_energy_kwh,
        "current_soc_pct": inputs.current_soc_pct,
        "capacity_kwh": inputs.capacity_kwh,
        "min_soc_pct": inputs.min_soc_pct,
        "max_soc_pct": inputs.max_soc_pct,
        "charging_efficiency": inputs.charging_efficiency,
        "reserve_pct": inputs.reserve_pct,
        "max_charge_power_kw": inputs.max_charge_power_kw,
        "charging_window_hours": inputs.charging_window_hours,
    }

    return OptimizationResult(
        mode=mode,
        deficit_kwh=round(deficit, 2),
        surplus_kwh=round(surplus, 2),
        reserve_requirement_kwh=round(reserve_req, 2),
        required_usable_kwh=round(required_usable, 2),
        required_charging_kwh=round(required_charging, 2),
        headroom_kwh=round(headroom, 2),
        recommended_charge_kwh=round(recommended_charge, 2),
        shortfall_kwh=round(shortfall, 2),
        charge_from_surplus_kwh=round(charge_from_surplus, 2),
        exportable_kwh=round(exportable, 2),
        power_limit_kwh=round(power_limit_kwh, 2),
        power_limit_clamped=power_limit_clamped,
        effective_recommended_charge_kwh=round(effective_charge, 2),
        projected_end_soc_pct=round(projected_soc, 4),
        inputs_used=inputs_dict,
        derivations=derivations,
    )
