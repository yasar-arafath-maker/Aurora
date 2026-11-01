"""
AURORA Open-Meteo Real Meteorological Data Client
Provides real satellite solar irradiance (GHI, DNI, DHI), wind speed, and ambient temperature
with local persistent caching and offline fallback.
"""
import os
import json
import httpx
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "demo_data", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

DEFAULT_LAT = 11.0168   # Coimbatore, Tamil Nadu
DEFAULT_LON = 76.9558
DEFAULT_TZ = "Asia/Kolkata"

async def fetch_open_meteo_forecast(
    latitude: float = DEFAULT_LAT,
    longitude: float = DEFAULT_LON,
    days: int = 7
) -> Dict[str, Any]:
    """
    Fetch real 7-day meteorological forecast from Open-Meteo Solar API.
    Includes GHI (shortwave_radiation), DNI, DHI, cloud cover, 2m temp, and wind speed.
    """
    cache_key = f"openmeteo_fcst_{latitude:.4f}_{longitude:.4f}_{date.today().isoformat()}.json"
    cache_path = os.path.join(CACHE_DIR, cache_key)

    # Check cache first (fresh for today)
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "cloud_cover",
            "direct_normal_irradiance",
            "diffuse_radiation",
            "shortwave_radiation_instant",  # GHI instant
            "wind_speed_10m"
        ],
        "timezone": DEFAULT_TZ,
        "forecast_days": min(days, 14)
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                # Save to cache
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(data, f)
                return data
    except Exception as e:
        print(f"[Open-Meteo] Live fetch failed ({e}), using synthetic fallback.")

    # Return structured fallback if API is unreachable
    return _generate_fallback_series(latitude, longitude, days)


def _generate_fallback_series(lat: float, lon: float, days: int) -> Dict[str, Any]:
    """Offline realistic reference profile when external API cannot be reached."""
    times = []
    temps = []
    clouds = []
    dnis = []
    dhis = []
    ghis = []
    winds = []

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for i in range(days * 24):
        t = now + timedelta(hours=i)
        times.append(t.isoformat())
        h = t.hour
        is_day = 6 <= h <= 18
        zenith_factor = max(0.0, 1.0 - abs(h - 12) / 6.0) if is_day else 0.0
        ghi = round(850.0 * (zenith_factor ** 1.3), 1) if is_day else 0.0
        dni = round(720.0 * (zenith_factor ** 1.1), 1) if is_day else 0.0
        dhi = round(ghi - 0.7 * dni, 1) if is_day else 0.0
        
        ghis.append(max(0.0, ghi))
        dnis.append(max(0.0, dni))
        dhis.append(max(0.0, dhi))
        temps.append(round(24.0 + 8.0 * zenith_factor, 1))
        clouds.append(round(20.0 + 15.0 * (1 - zenith_factor), 1))
        winds.append(round(3.5 + 2.5 * zenith_factor, 1))

    return {
        "latitude": lat,
        "longitude": lon,
        "hourly": {
            "time": times,
            "temperature_2m": temps,
            "cloud_cover": clouds,
            "direct_normal_irradiance": dnis,
            "diffuse_radiation": dhis,
            "shortwave_radiation_instant": ghis,
            "wind_speed_10m": winds,
        }
    }
