"""
Demo Data Generator — AURORA Platform
======================================
Generates realistic synthetic time-series for:
  - Solar irradiance & solar generation (diurnal bell curve with cloud scattering)
  - Wind speed & wind generation (Weibull-distributed, autocorrelated)
  - Energy demand (base + seasonal + daily peak pattern)
  - Weather parameters (temperature, humidity, cloud cover, rainfall)

All data is clearly marked source='demo'.
THIS IS SYNTHETIC DATA — NOT LIVE SENSOR DATA.
"""
import math
import random
from datetime import datetime, timedelta, timezone, date
from typing import List, Tuple, Dict, Any

# Seeded RNG for reproducible demo data
_rng = random.Random(42)

# ─── Solar ──────────────────────────────────────────────────────────────────

def solar_irradiance_wm2(hour: float, cloud_cover_pct: float, day_of_year: int) -> float:
    """Return W/m² using a top-of-atmosphere bell curve adjusted for cloud cover and season."""
    solar_declination = 23.45 * math.sin(math.radians(360 / 365 * (day_of_year - 81)))
    latitude = 20.0  # India approx
    hour_angle = 15 * (hour - 12)
    cos_zenith = (
        math.sin(math.radians(latitude)) * math.sin(math.radians(solar_declination))
        + math.cos(math.radians(latitude))
        * math.cos(math.radians(solar_declination))
        * math.cos(math.radians(hour_angle))
    )
    cos_zenith = max(0.0, cos_zenith)
    ghi = 1000.0 * cos_zenith  # W/m² at clear sky
    cloud_factor = 1.0 - (cloud_cover_pct / 100.0) * 0.8
    noise = _rng.gauss(0, 15)
    return max(0.0, ghi * cloud_factor + noise)


def solar_kwh_from_irradiance(irr_wm2: float, panel_area_m2: float = 8000.0, efficiency: float = 0.18) -> float:
    """Convert W/m² to kWh for one hour of generation."""
    return max(0.0, irr_wm2 * panel_area_m2 * efficiency / 1000.0)


# ─── Wind ───────────────────────────────────────────────────────────────────

def wind_kwh_from_speed(speed_ms: float, rated_power_kw: float = 3000.0, cut_in: float = 3.0,
                         rated: float = 12.0, cut_out: float = 25.0) -> float:
    """Power curve: cubic interpolation between cut-in and rated speed."""
    if speed_ms < cut_in or speed_ms > cut_out:
        return 0.0
    if speed_ms >= rated:
        return rated_power_kw
    fraction = (speed_ms - cut_in) / (rated - cut_in)
    return rated_power_kw * fraction ** 3


def wind_speed_ms(prev_speed: float, hour: int) -> float:
    """AR(1) wind speed with diurnal variation (stronger afternoons)."""
    diurnal_offset = 1.5 * math.sin(math.radians((hour - 14) * 15))
    mean = 7.5 + diurnal_offset
    new_speed = 0.85 * prev_speed + 0.15 * mean + _rng.gauss(0, 0.8)
    return max(0.0, min(30.0, new_speed))


# ─── Demand ─────────────────────────────────────────────────────────────────

def demand_kwh(hour: int, day_of_week: int, month: int) -> float:
    """Industrial + residential demand with morning/evening peaks."""
    base = 1800.0
    # Seasonal factor (summer cooling load)
    seasonal = 250.0 * math.sin(math.radians((month - 3) * 30))
    # Daily double-peak (07:00 and 19:00)
    morning = 600.0 * math.exp(-0.5 * ((hour - 8) / 2.5) ** 2)
    evening = 700.0 * math.exp(-0.5 * ((hour - 19) / 2.0) ** 2)
    # Weekend dip
    weekend_factor = 0.85 if day_of_week >= 5 else 1.0
    noise = _rng.gauss(0, 40)
    total = (base + seasonal + morning + evening + noise) * weekend_factor
    return max(800.0, total)


# ─── Weather ────────────────────────────────────────────────────────────────

def cloud_cover_pct(prev_cloud: float, hour: int) -> float:
    """Markov chain cloud cover with morning clearing tendency."""
    change = _rng.gauss(0, 8)
    morning_clear = -10.0 if 6 <= hour <= 10 else 0.0
    new_cloud = prev_cloud + change + morning_clear
    return max(0.0, min(100.0, new_cloud))


def temperature_c(hour: int, month: int) -> float:
    """Diurnal temperature curve with seasonal offset."""
    seasonal_base = 20.0 + 12.0 * math.sin(math.radians((month - 3) * 30))
    diurnal = 8.0 * math.sin(math.radians((hour - 6) * 15))
    return seasonal_base + diurnal + _rng.gauss(0, 1.5)


# ─── Main generation function ────────────────────────────────────────────────

def generate_hourly_history(days_back: int = 180) -> List[Dict[str, Any]]:
    """
    Generate `days_back` days of hourly synthetic data rows.
    Returns a list of dicts matching DB column names.
    """
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(days=days_back)

    rows = []
    wind_speed = 7.0
    cloud = 30.0

    for hour_offset in range(days_back * 24):
        ts = start + timedelta(hours=hour_offset)
        h = ts.hour
        doy = ts.timetuple().tm_yday
        month = ts.month
        dow = ts.weekday()

        cloud = cloud_cover_pct(cloud, h)
        wind_speed = wind_speed_ms(wind_speed, h)
        irr = solar_irradiance_wm2(h, cloud, doy)
        solar_kwh = solar_kwh_from_irradiance(irr)
        wind_kwh = wind_kwh_from_speed(wind_speed)
        demand = demand_kwh(h, dow, month)
        temp = temperature_c(h, month)
        humidity = max(20.0, min(95.0, 60.0 + _rng.gauss(0, 10)))
        rainfall = max(0.0, _rng.gauss(0, 2)) if cloud > 70 else 0.0

        rows.append({
            "timestamp": ts,
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "cloud_cover": round(cloud, 2),
            "rainfall": round(rainfall, 2),
            "wind_speed": round(wind_speed, 2),
            "solar_irradiance": round(irr, 2),
            "solar_kwh": round(solar_kwh, 2),
            "wind_kwh": round(wind_kwh, 2),
            "demand_kwh": round(demand, 2),
            "source": "demo",
        })

    return rows


def get_current_telemetry() -> Dict[str, Any]:
    """Return a realistic 'live' telemetry snapshot for the current hour."""
    now = datetime.now(timezone.utc)
    h = now.hour
    doy = now.timetuple().tm_yday
    month = now.month
    dow = now.weekday()

    cloud = _rng.uniform(20, 60)
    wind = _rng.uniform(5, 12)
    irr = solar_irradiance_wm2(h, cloud, doy)
    solar_kw = solar_kwh_from_irradiance(irr) * 0.95  # kW approximation (1h period)
    wind_kw = wind_kwh_from_speed(wind)
    demand_kw = demand_kwh(h, dow, month)
    total_gen_kw = solar_kw + wind_kw
    net_kw = total_gen_kw - demand_kw
    grid_import_kw = max(0.0, -net_kw)
    grid_export_kw = max(0.0, net_kw)
    battery_flow_kw = min(abs(grid_import_kw), 625.0) * (-1 if net_kw < 0 else 0.3)

    return {
        "timestamp": now,
        "temperature": round(temperature_c(h, month), 2),
        "humidity": round(_rng.uniform(40, 75), 2),
        "cloud_cover": round(cloud, 2),
        "rainfall": 0.0,
        "wind_speed": round(wind, 2),
        "solar_irradiance": round(irr, 2),
        "solar_kw": round(solar_kw, 2),
        "wind_kw": round(wind_kw, 2),
        "total_generation_kw": round(total_gen_kw, 2),
        "demand_kw": round(demand_kw, 2),
        "net_balance_kw": round(net_kw, 2),
        "grid_import_kw": round(grid_import_kw, 2),
        "grid_export_kw": round(grid_export_kw, 2),
        "battery_flow_kw": round(battery_flow_kw, 2),
        "source": "demo",
    }


def get_weather_forecast_days(days: int = 7) -> List[Dict[str, Any]]:
    """Generate weather forecast for the next N days."""
    now = datetime.now(timezone.utc)
    forecast = []
    cloud = _rng.uniform(20, 50)
    month = now.month

    for d in range(1, days + 1):
        target_date = (now + timedelta(days=d)).date()
        doy = (now + timedelta(days=d)).timetuple().tm_yday
        # Daily cloud variation
        cloud = max(5, min(95, cloud + _rng.gauss(0, 12)))
        wind = max(2, _rng.uniform(4, 16))

        # Peak irradiance (noon)
        peak_irr = solar_irradiance_wm2(12, cloud, doy)
        # Avg daily solar (integrate bell curve ≈ 7h equiv)
        daily_solar_kwh = solar_kwh_from_irradiance(peak_irr) * 7.2 * (1 - cloud / 200)
        daily_wind_kwh = wind_kwh_from_speed(wind) * 24
        temp_low = temperature_c(5, month)
        temp_high = temperature_c(14, month)

        conditions = (
            "Sunny" if cloud < 20
            else "Partly Cloudy" if cloud < 50
            else "Overcast" if cloud < 80
            else "Stormy"
        )
        if wind > 12:
            conditions = "Windy" if cloud < 40 else conditions

        forecast.append({
            "date": target_date,
            "temp_min": round(temp_low, 1),
            "temp_max": round(temp_high, 1),
            "avg_temp": round((temp_low + temp_high) / 2, 1),
            "cloud_cover_pct": round(cloud, 1),
            "solar_irradiance_wm2": round(peak_irr, 1),
            "wind_speed_ms": round(wind, 1),
            "condition": conditions,
            "predicted_solar_kwh": round(daily_solar_kwh, 1),
            "predicted_wind_kwh": round(daily_wind_kwh, 1),
        })
    return forecast
