from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import date

class ReportMetric(BaseModel):
    name: str
    value: float
    unit: str
    benchmark: Optional[str] = None

class ReportSummary(BaseModel):
    report_id: str
    timeframe: str          # 'daily' | 'weekly' | 'monthly'
    period_start: date
    period_end: date
    generated_at: str
    total_solar_kwh: float
    total_wind_kwh: float
    total_renewable_kwh: float
    total_demand_kwh: float
    renewable_penetration_pct: float
    battery_energy_charged_kwh: float
    battery_energy_discharged_kwh: float
    battery_roundtrip_efficiency_realized_pct: float
    forecast_mae_kwh: float
    forecast_mape_pct: float
    grid_import_avoided_kwh: float
    estimated_cost_savings_usd: float
    highlights: List[str]
    source: str = "demo"
