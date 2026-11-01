from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

class WeatherCurrent(BaseModel):
    timestamp: datetime
    temperature: float        # °C
    humidity: float           # %
    cloud_cover: float        # %
    rainfall: float           # mm
    wind_speed: float         # m/s
    solar_irradiance: float   # W/m²
    source: str = "demo"

class WeatherForecastDay(BaseModel):
    date: date
    temp_min: float
    temp_max: float
    avg_temp: float
    cloud_cover_pct: float
    solar_irradiance_wm2: float
    wind_speed_ms: float
    condition: str            # e.g., 'Sunny', 'Partly Cloudy', 'Overcast', 'Windy'

class WeatherForecastHour(BaseModel):
    time: str
    temperature_c: float
    cloud_cover_pct: float
    irradiance_w_m2: float
    wind_speed_ms: float
    expected_solar_kw: float
    expected_wind_kw: float

class WeatherForecastResponse(BaseModel):
    current: WeatherCurrent
    forecast: List[WeatherForecastDay]
    hourly: Optional[List[WeatherForecastHour]] = None
    source: str = "demo"

class WeatherImpactChain(BaseModel):
    cloud_cover_pct: float
    solar_irradiance_wm2: float
    predicted_solar_kwh: float
    expected_demand_kwh: float
    deficit_kwh: float
    battery_required_charge_kwh: float
    mode: str
    impact_narrative: str
