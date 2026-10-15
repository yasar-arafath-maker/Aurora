import pytest
from datetime import date, timedelta
from app.services.forecasting.model import get_forecasting_service

def test_forecasting_tomorrow_prediction():
    svc = get_forecasting_service()
    tomorrow = date.today() + timedelta(days=1)
    res = svc.predict_day(tomorrow)
    
    assert res["predicted_solar_kwh"] > 0
    assert res["predicted_wind_kwh"] > 0
    assert abs(res["predicted_total_kwh"] - (res["predicted_solar_kwh"] + res["predicted_wind_kwh"])) < 0.1
    assert 0 <= res["confidence_pct"] <= 100
    assert res["confidence_interval_lower_kwh"] <= res["predicted_total_kwh"]
    assert res["confidence_interval_upper_kwh"] >= res["predicted_total_kwh"]

def test_forecasting_multi_day():
    svc = get_forecasting_service()
    res = svc.predict_n_days(days=7)
    assert len(res) == 7
    for day in res:
        assert day["predicted_solar_kwh"] > 0
        assert day["predicted_wind_kwh"] > 0
        assert day["predicted_total_kwh"] > 0

def test_accuracy_metrics_structure():
    svc = get_forecasting_service()
    acc = svc.accuracy_metrics
    assert "solar_r2" in acc
    assert "wind_r2" in acc
    assert acc["solar_r2"] > 0.80
    assert acc["wind_r2"] > 0.80
