from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import date, datetime

class PredictionTomorrowResponse(BaseModel):
    target_date: date
    predicted_solar_kwh: float
    predicted_wind_kwh: float
    predicted_total_kwh: float
    expected_demand_kwh: float
    confidence_pct: float
    confidence_interval_lower_kwh: float
    confidence_interval_upper_kwh: float
    model_version: str = "aurora-ensemble-v1.0"
    created_at: datetime

class PredictionForecastDay(BaseModel):
    date: date
    predicted_solar_kwh: float
    predicted_wind_kwh: float
    predicted_total_kwh: float
    expected_demand_kwh: float
    confidence_pct: float

class PredictionForecastResponse(BaseModel):
    days: int
    forecast: List[PredictionForecastDay]

class AccuracyDataPoint(BaseModel):
    timestamp: str
    actual_solar: float
    predicted_solar: float
    actual_wind: float
    predicted_wind: float
    actual_total: float
    predicted_total: float

class AccuracyMetricsResponse(BaseModel):
    solar_mae: float
    solar_rmse: float
    solar_mape: float
    solar_r2: float
    wind_mae: float
    wind_rmse: float
    wind_mape: float
    wind_r2: float
    combined_mae: float
    combined_rmse: float
    combined_mape: float
    combined_r2: float
    evaluation_samples: int
    data_label: str = "Validated Against Held-Out Synthetic Validation Set"
    history: List[AccuracyDataPoint]
