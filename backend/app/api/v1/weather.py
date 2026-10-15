from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, date, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.demo_data.generator import get_current_telemetry, generate_hourly_history, get_weather_forecast_days
from app.schemas.weather import WeatherCurrent, WeatherForecastDay, WeatherForecastResponse, WeatherImpactChain
from app.services.forecasting.model import get_forecasting_service
from app.services.optimization.engine import run_optimization, OptimizationInputs
from app.services.battery.simulator import get_battery_status

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("/current", response_model=WeatherCurrent)
async def get_weather_current():
    t = get_current_telemetry()
    return WeatherCurrent(
        timestamp=t["timestamp"],
        temperature=t["temperature"],
        humidity=t["humidity"],
        cloud_cover=t["cloud_cover"],
        rainfall=t["rainfall"],
        wind_speed=t["wind_speed"],
        solar_irradiance=t["solar_irradiance"],
        source="demo",
    )

@router.get("/forecast", response_model=WeatherForecastResponse)
async def get_weather_forecast():
    t = get_current_telemetry()
    forecast_days = get_weather_forecast_days(7)
    current = WeatherCurrent(
        timestamp=t["timestamp"],
        temperature=t["temperature"],
        humidity=t["humidity"],
        cloud_cover=t["cloud_cover"],
        rainfall=t["rainfall"],
        wind_speed=t["wind_speed"],
        solar_irradiance=t["solar_irradiance"],
        source="demo",
    )
    forecast = [WeatherForecastDay(**d) for d in forecast_days]
    return WeatherForecastResponse(current=current, forecast=forecast, source="demo")

@router.get("/impact", response_model=WeatherImpactChain)
async def get_weather_impact():
    """Weather Impact Engine: cloud → irradiance → solar → deficit → battery."""
    t = get_current_telemetry()
    svc = get_forecasting_service()
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
    prediction = svc.predict_day(tomorrow)
    batt = get_battery_status()

    predicted_gen = prediction["predicted_solar_kwh"] + prediction["predicted_wind_kwh"]
    demand = prediction["expected_demand_kwh"]
    
    inputs = OptimizationInputs(
        expected_demand_kwh=demand,
        predicted_generation_kwh=predicted_gen,
        current_stored_energy_kwh=batt["stored_kwh"],
        current_soc_pct=batt["soc_pct"],
        capacity_kwh=batt["capacity_kwh"],
        min_soc_pct=batt["min_soc_pct"],
        max_soc_pct=batt["max_soc_pct"],
        charging_efficiency=batt["charging_efficiency"],
        reserve_pct=batt["reserve_pct"],
        max_charge_power_kw=batt["max_charge_power_kw"],
        max_discharge_power_kw=batt["max_discharge_power_kw"],
    )
    result = run_optimization(inputs)

    cloud = t["cloud_cover"]
    impact_narrative = (
        f"{'Heavy' if cloud > 70 else 'Moderate' if cloud > 40 else 'Light'} cloud cover ({cloud:.0f}%) "
        f"reduces solar irradiance to {t['solar_irradiance']:.0f} W/m². "
        f"Forecast solar yield tomorrow: {prediction['predicted_solar_kwh']:,.0f} kWh. "
        f"Against {demand:,.0f} kWh demand, "
        f"{'a deficit' if result.deficit_kwh > 0 else 'a surplus'} of "
        f"{abs(result.deficit_kwh if result.deficit_kwh > 0 else result.surplus_kwh):,.0f} kWh "
        f"requires charging {result.effective_recommended_charge_kwh:,.0f} kWh today."
    )

    return WeatherImpactChain(
        cloud_cover_pct=cloud,
        solar_irradiance_wm2=t["solar_irradiance"],
        predicted_solar_kwh=prediction["predicted_solar_kwh"],
        expected_demand_kwh=demand,
        deficit_kwh=result.deficit_kwh,
        battery_required_charge_kwh=result.effective_recommended_charge_kwh,
        mode=result.mode,
        impact_narrative=impact_narrative,
    )
