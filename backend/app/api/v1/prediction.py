from fastapi import APIRouter, Query
from datetime import datetime, timezone, date, timedelta

from app.services.forecasting.model import get_forecasting_service
from app.schemas.prediction import (
    PredictionTomorrowResponse, PredictionForecastResponse,
    PredictionForecastDay, AccuracyMetricsResponse, AccuracyDataPoint
)

router = APIRouter(prefix="/prediction", tags=["Prediction"])

@router.get("/tomorrow", response_model=PredictionTomorrowResponse)
async def predict_tomorrow():
    svc = get_forecasting_service()
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
    result = svc.predict_day(tomorrow)
    return PredictionTomorrowResponse(**result)

@router.get("/forecast", response_model=PredictionForecastResponse)
async def predict_forecast(days: int = Query(default=7, ge=1, le=30)):
    svc = get_forecasting_service()
    raw = svc.predict_n_days(days=days)
    forecast = [
        PredictionForecastDay(
            date=r["target_date"],
            predicted_solar_kwh=r["predicted_solar_kwh"],
            predicted_wind_kwh=r["predicted_wind_kwh"],
            predicted_total_kwh=r["predicted_total_kwh"],
            expected_demand_kwh=r["expected_demand_kwh"],
            confidence_pct=r["confidence_pct"],
        )
        for r in raw
    ]
    return PredictionForecastResponse(days=days, forecast=forecast)

@router.get("/accuracy", response_model=AccuracyMetricsResponse)
async def get_accuracy():
    svc = get_forecasting_service()
    acc = svc.accuracy_metrics
    history_points = [AccuracyDataPoint(**h) for h in acc["history"]]
    return AccuracyMetricsResponse(
        solar_mae=acc["solar_mae"],
        solar_rmse=acc["solar_rmse"],
        solar_mape=acc["solar_mape"],
        solar_r2=acc["solar_r2"],
        wind_mae=acc["wind_mae"],
        wind_rmse=acc["wind_rmse"],
        wind_mape=acc["wind_mape"],
        wind_r2=acc["wind_r2"],
        combined_mae=acc["combined_mae"],
        combined_rmse=acc["combined_rmse"],
        combined_mape=acc["combined_mape"],
        combined_r2=acc["combined_r2"],
        evaluation_samples=acc["evaluation_samples"],
        history=history_points,
    )
