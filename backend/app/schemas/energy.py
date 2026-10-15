from pydantic import BaseModel
from typing import List
from datetime import datetime

class EnergyCurrent(BaseModel):
    timestamp: datetime
    solar_kw: float
    wind_kw: float
    total_generation_kw: float
    demand_kw: float
    net_balance_kw: float         # generation - demand (+ surplus, - deficit)
    grid_import_kw: float         # active draw from external grid
    grid_export_kw: float         # feed back to external grid
    battery_flow_kw: float        # + charging, - discharging
    source: str = "demo"

class EnergyHistoryPoint(BaseModel):
    timestamp: datetime
    solar_kwh: float
    wind_kwh: float
    total_kwh: float
    demand_kwh: float
    net_kwh: float
    source: str = "demo"

class EnergyHistoryResponse(BaseModel):
    points: List[EnergyHistoryPoint]
    summary_solar_total_kwh: float
    summary_wind_total_kwh: float
    summary_demand_total_kwh: float
    source: str = "demo"
