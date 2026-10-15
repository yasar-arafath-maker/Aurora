from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_and_root():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "AURORA"
    assert data["status"] == "active"

def test_energy_current():
    res = client.get("/api/v1/energy/current")
    assert res.status_code == 200
    data = res.json()
    assert "solar_kw" in data
    assert "wind_kw" in data
    assert "total_generation_kw" in data
    assert "demand_kw" in data

def test_weather_current():
    res = client.get("/api/v1/weather/current")
    assert res.status_code == 200
    data = res.json()
    assert "temperature" in data
    assert "solar_irradiance" in data

def test_prediction_tomorrow():
    res = client.get("/api/v1/prediction/tomorrow")
    assert res.status_code == 200
    data = res.json()
    assert "predicted_solar_kwh" in data
    assert "confidence_pct" in data

def test_battery_status_and_optimize():
    res1 = client.get("/api/v1/battery/status")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "soc_pct" in data1
    assert "voltage" in data1
    
    res2 = client.post("/api/v1/battery/optimize", json={})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "recommended_charge_kwh" in data2
    assert "derivations" in data2

def test_grid_status():
    res = client.get("/api/v1/grid/status")
    assert res.status_code == 200
    data = res.json()
    assert "frequency_hz" in data

def test_reports_daily():
    res = client.get("/api/v1/reports/daily")
    assert res.status_code == 200
    data = res.json()
    assert "total_solar_kwh" in data
    assert "renewable_penetration_pct" in data
