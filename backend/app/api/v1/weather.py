import math
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, date, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.demo_data.generator import (
    get_current_telemetry, generate_hourly_history, get_weather_forecast_days,
    solar_irradiance_wm2, solar_kwh_from_irradiance, wind_kwh_from_speed
)
from app.schemas.weather import (
    WeatherCurrent, WeatherForecastDay, WeatherForecastHour,
    WeatherForecastResponse, WeatherImpactChain
)
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

    # Generate 24-hour diurnal physics-based curve
    doy = datetime.now(timezone.utc).timetuple().tm_yday
    hourly_items = []
    base_cloud = t["cloud_cover"]
    base_wind = t["wind_speed"]

    for h in range(24):
        irr = solar_irradiance_wm2(h, base_cloud, doy)
        solar_kw = solar_kwh_from_irradiance(irr)
        wind_spd = max(1.5, base_wind + 1.2 * math.sin((h - 8) / 12.0 * math.pi))
        wind_kw = wind_kwh_from_speed(wind_spd)
        temp_c = round(16.0 + 10.0 * math.sin(max(0, (h - 6)) / 14.0 * math.pi), 1)

        hourly_items.append(
            WeatherForecastHour(
                time=f"{h:02d}:00",
                temperature_c=temp_c,
                cloud_cover_pct=round(base_cloud, 1),
                irradiance_w_m2=round(irr, 1),
                wind_speed_ms=round(wind_spd, 1),
                expected_solar_kw=round(solar_kw, 1),
                expected_wind_kw=round(wind_kw, 1),
            )
        )

    return WeatherForecastResponse(
        current=current,
        forecast=forecast,
        hourly=hourly_items,
        source="demo"
    )

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

from app.services.weather.open_meteo import fetch_open_meteo_forecast
from app.services.forecasting.physics_pv import PVPhysicsModel

@router.get("/real-pvlib")
async def get_real_pvlib_simulation(
    latitude: float = Query(11.0168, description="Latitude (default: Coimbatore, Tamil Nadu)"),
    longitude: float = Query(76.9558, description="Longitude"),
    capacity_dc_kw: float = Query(500.0, description="DC Array Capacity kWp"),
    tilt_deg: float = Query(15.0, description="Surface Tilt Angle"),
    azimuth_deg: float = Query(180.0, description="Surface Azimuth (180=South)"),
):
    """
    Genuine Physics-Based Photovoltaic Yield Simulation using pvlib-python.
    Ingests satellite weather from Open-Meteo (GHI, DNI, DHI, Wind, Temp),
    computes Solar Position (SPA), Ineichen Clear-Sky, Hay-Davies POA Transposition,
    Faiman Cell Temperature derating, and Sandia Inverter clipping.
    """
    weather_data = await fetch_open_meteo_forecast(latitude=latitude, longitude=longitude, days=2)
    hourly = weather_data.get("hourly", {})
    times_raw = hourly.get("time", [])[:24]
    
    times = [datetime.fromisoformat(t).replace(tzinfo=timezone.utc) for t in times_raw]
    ghis = hourly.get("shortwave_radiation_instant", [])[:24]
    dnis = hourly.get("direct_normal_irradiance", [])[:24]
    dhis = hourly.get("diffuse_radiation", [])[:24]
    temps = hourly.get("temperature_2m", [])[:24]
    winds = hourly.get("wind_speed_10m", [])[:24]

    pv_sim = PVPhysicsModel(
        latitude=latitude,
        longitude=longitude,
        surface_tilt_deg=tilt_deg,
        surface_azimuth_deg=azimuth_deg,
        system_capacity_dc_kw=capacity_dc_kw,
        inverter_capacity_ac_kw=capacity_dc_kw * 0.90
    )
    df = pv_sim.simulate_timeseries(
        timestamps=times,
        ghi_wm2=ghis,
        dni_wm2=dnis,
        dhi_wm2=dhis,
        temp_c=temps,
        wind_speed_ms=winds
    )
    
    total_yield_kwh = float(df["ac_power_kw"].sum())
    peak_ac_kw = float(df["ac_power_kw"].max())
    mean_cell_temp = float(df["cell_temp_c"].mean())

    return {
        "status": "success",
        "location": {"latitude": latitude, "longitude": longitude, "region": "Tamil Nadu, India"},
        "system_config": {
            "capacity_dc_kw": capacity_dc_kw,
            "inverter_ac_kw": capacity_dc_kw * 0.90,
            "tilt_deg": tilt_deg,
            "azimuth_deg": azimuth_deg,
        },
        "daily_yield_kwh": round(total_yield_kwh, 2),
        "peak_power_kw": round(peak_ac_kw, 2),
        "mean_cell_temp_c": round(mean_cell_temp, 1),
        "hourly_physics_series": df.to_dict(orient="records")
    }

