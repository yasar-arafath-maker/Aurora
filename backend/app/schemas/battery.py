from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BatteryStatusResponse(BaseModel):
    timestamp: datetime
    soc_pct: float                 # Current SOC (0.0 - 1.0)
    voltage: float                 # DC bus voltage (V)
    current: float                 # DC current (A)
    temperature_c: float           # Cell temperature (°C)
    stored_kwh: float              # Current stored energy (kWh)
    capacity_kwh: float            # Nameplate capacity (kWh)
    min_soc_pct: float             # Floor SOC limit
    max_soc_pct: float             # Ceiling SOC limit
    max_charge_power_kw: float     # Inverter max charge rate
    max_discharge_power_kw: float  # Inverter max discharge rate
    charging_efficiency: float     # One-way efficiency
    reserve_pct: float             # Operating reserve buffer
    health_state: str              # 'NORMAL', 'OPTIMAL', 'DERATED'
    estimated_backup_hours: float  # Stored energy / average demand

class BatteryOptimizeRequest(BaseModel):
    expected_demand_kwh: Optional[float] = None
    predicted_generation_kwh: Optional[float] = None
    current_stored_energy_kwh: Optional[float] = None
    current_soc_pct: Optional[float] = None
    capacity_kwh: Optional[float] = None
    min_soc_pct: Optional[float] = None
    max_soc_pct: Optional[float] = None
    charging_efficiency: Optional[float] = None
    reserve_pct: Optional[float] = None
    max_charge_power_kw: Optional[float] = None
    charging_window_hours: Optional[float] = 6.0  # available off-peak / solar charging window

class BatteryStepDerivation(BaseModel):
    step_number: int
    formula_name: str
    formula_latex: str
    calculation: str
    result_value: float
    result_unit: str
    explanation: str

class BatteryOptimizeResponse(BaseModel):
    # Core mathematical outputs
    mode: str                             # 'charge' | 'surplus' | 'insufficient_capacity'
    deficit_kwh: float                    # demand - predicted_generation
    surplus_kwh: float                    # max(0, -deficit)
    reserve_requirement_kwh: float        # reserve_pct * demand
    required_usable_kwh: float            # deficit + reserve
    required_charging_kwh: float          # required_usable / efficiency
    headroom_kwh: float                   # (max_soc * capacity) - current_stored
    recommended_charge_kwh: float         # min(required_charging, headroom)
    shortfall_kwh: float                  # max(0, required_charging - headroom)
    charge_from_surplus_kwh: float        # min(surplus * efficiency, headroom)
    exportable_kwh: float                 # max(0, surplus - charge / efficiency)
    power_limit_clamped: bool             # whether charge exceeded max_charge_power * window
    power_limit_kwh: float                # max_charge_power * charging_window
    effective_recommended_charge_kwh: float # physically deliverable charge
    projected_end_soc_pct: float          # (stored + effective_charge) / capacity
    
    # Traceable inputs used
    inputs_used: dict
    
    # Step-by-step calculation trace for the SCADA formula box
    derivations: List[BatteryStepDerivation]
    
    # Synthesized natural language explanation from advisor
    advisor_explanation: str
