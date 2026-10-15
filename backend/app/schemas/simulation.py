from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SimulationRunRequest(BaseModel):
    cloud_cover_pct: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    irradiance_multiplier: Optional[float] = 1.0
    demand_multiplier: Optional[float] = 1.0
    initial_soc_pct: Optional[float] = None

class SimulationComparisonPoint(BaseModel):
    hour: int
    time_label: str
    baseline_generation_kw: float
    simulated_generation_kw: float
    baseline_demand_kw: float
    simulated_demand_kw: float
    baseline_battery_soc_pct: float
    simulated_battery_soc_pct: float

class SimulationRunResponse(BaseModel):
    inputs_applied: Dict[str, Any]
    baseline_predicted_solar_kwh: float
    simulated_predicted_solar_kwh: float
    baseline_predicted_wind_kwh: float
    simulated_predicted_wind_kwh: float
    baseline_total_generation_kwh: float
    simulated_total_generation_kwh: float
    baseline_demand_kwh: float
    simulated_demand_kwh: float
    baseline_deficit_kwh: float
    simulated_deficit_kwh: float
    baseline_recommended_charge_kwh: float
    simulated_recommended_charge_kwh: float
    baseline_mode: str
    simulated_mode: str
    timeline: List[SimulationComparisonPoint]
    executive_summary: str
