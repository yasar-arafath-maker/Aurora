from fastapi.testclient import TestClient
from app.main import app
from app.services.site.site_analyzer import (
    estimate_solar_resource,
    diagnose_land_problems,
    generate_site_layout,
)
import io

client = TestClient(app)

def test_estimate_solar_resource():
    res = estimate_solar_resource(13.0827, 80.2707)
    assert res["peak_sun_hours_per_day"] > 4.0
    assert res["annual_specific_yield_kwh_kwp"] > 1200.0
    assert 10.0 <= res["optimal_tilt_angle_deg"] <= 30.0

def test_diagnose_land_problems_flat():
    diag = diagnose_land_problems(area_sqm=20234.0, slope_deg=2.0)
    assert diag["site_suitability_score"] > 80
    assert len(diag["remediations"]) >= 1

def test_diagnose_land_problems_steep():
    diag = diagnose_land_problems(area_sqm=20234.0, slope_deg=9.5, soil_type="rocky")
    assert any(p["severity"] == "CRITICAL" for p in diag["problems"])
    assert any("Grading" in r["action"] for r in diag["remediations"])

def test_generate_site_layout():
    layout = generate_site_layout(area_sqm=40468.6)  # 10 acres
    assert layout["solar_pv_system"]["dc_capacity_kwp"] > 2000.0
    assert layout["battery_energy_storage"]["capacity_kwh"] > 1000.0
    assert len(layout["solar_pv_system"]["rows_layout"]) >= 4

def test_api_analyze_boundary():
    payload = {
        "coordinates": [
            {"lat": 13.0820, "lng": 80.2700},
            {"lat": 13.0850, "lng": 80.2700},
            {"lat": 13.0850, "lng": 80.2750},
            {"lat": 13.0820, "lng": 80.2750}
        ],
        "slope_deg": 3.0,
        "soil_type": "red_loam",
        "land_utilization_pct": 75.0
    }
    res = client.post("/api/v1/site/analyze-boundary", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "calculated_area_acres" in data
    assert "diagnostics" in data
    assert "layout" in data

def test_api_analyze_photo():
    fake_img = io.BytesIO(b"fake image data")
    files = {"file": ("test_land.jpg", fake_img, "image/jpeg")}
    res = client.post("/api/v1/site/analyze-photo", files=files, data={"latitude": 13.08, "longitude": 80.27, "area_acres": 5.0})
    assert res.status_code == 200
    data = res.json()
    assert "detected_obstacles" in data
    assert "suitability_verdict" in data
    assert len(data["detected_obstacles"]) >= 1
