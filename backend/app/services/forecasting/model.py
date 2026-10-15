"""
AURORA Forecasting Service — services/forecasting/
====================================================
Architecture:
  - Isolated module with clean predict() interface
  - GradientBoosting ensemble (solar) + RandomForest (wind)
  - Confidence via prediction interval from quantile regressors (q10/q90)
  - Can be swapped for LSTM without touching any caller

THIS MODULE ONLY PREDICTS — it never decides battery actions.
Battery action is deterministic math in services/optimization/.
"""
import math
import random
import numpy as np
from typing import Tuple, List, Dict, Any
from datetime import date, datetime, timedelta, timezone

# sklearn
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.demo_data.generator import (
    generate_hourly_history,
    get_weather_forecast_days,
    solar_irradiance_wm2,
    solar_kwh_from_irradiance,
    wind_kwh_from_speed,
    wind_speed_ms,
    demand_kwh,
    temperature_c,
)

# ─── Feature Engineering ─────────────────────────────────────────────────────

def _build_features(row: Dict[str, Any]) -> List[float]:
    """
    Build a feature vector from a data row.
    Features: hour, day_of_week, month, day_of_year, sin/cos cyclical encodings,
              temperature, humidity, cloud_cover, wind_speed, solar_irradiance
    """
    ts: datetime = row["timestamp"]
    h = ts.hour
    doy = ts.timetuple().tm_yday
    dow = ts.weekday()
    month = ts.month
    return [
        h,
        math.sin(2 * math.pi * h / 24),
        math.cos(2 * math.pi * h / 24),
        dow,
        month,
        math.sin(2 * math.pi * doy / 365),
        math.cos(2 * math.pi * doy / 365),
        row.get("temperature", 25.0),
        row.get("humidity", 60.0),
        row.get("cloud_cover", 30.0),
        row.get("wind_speed", 7.0),
        row.get("solar_irradiance", 400.0),
    ]


# ─── ForecastingService ──────────────────────────────────────────────────────

class ForecastingService:
    """
    Encapsulates two GradientBoosting models (solar & wind) and
    quantile regressors for prediction intervals.
    Exposes predict() -> (value, confidence_pct, lower, upper)
    """

    def __init__(self):
        self._solar_model: GradientBoostingRegressor | None = None
        self._wind_model: RandomForestRegressor | None = None
        self._solar_q10: GradientBoostingRegressor | None = None
        self._solar_q90: GradientBoostingRegressor | None = None
        self._wind_q10: GradientBoostingRegressor | None = None
        self._wind_q90: GradientBoostingRegressor | None = None
        self._scaler = StandardScaler()
        self._is_trained = False
        self._accuracy: Dict[str, float] = {}
        self._accuracy_history: List[Dict[str, Any]] = []
        self._model_version = "aurora-ensemble-v1.0"

    def _prepare_dataset(self, rows: List[Dict[str, Any]]):
        X, y_solar, y_wind = [], [], []
        for row in rows:
            X.append(_build_features(row))
            y_solar.append(row["solar_kwh"])
            y_wind.append(row["wind_kwh"])
        return np.array(X), np.array(y_solar), np.array(y_wind)

    def train(self):
        """Train on synthetic historical data. Evaluates on held-out 20% test split."""
        print("[Forecasting] Generating synthetic training dataset...")
        rows = generate_hourly_history(days_back=180)
        X, y_solar, y_wind = self._prepare_dataset(rows)

        # 80/20 split preserving temporal order
        split = int(0.8 * len(X))
        X_train, X_test = X[:split], X[split:]
        ys_train, ys_test = y_solar[:split], y_solar[split:]
        yw_train, yw_test = y_wind[:split], y_wind[split:]

        X_train_s = self._scaler.fit_transform(X_train)
        X_test_s = self._scaler.transform(X_test)

        print("[Forecasting] Training GradientBoosting (solar) + RandomForest (wind)...")
        self._solar_model = GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.08, subsample=0.8, random_state=42
        )
        self._solar_model.fit(X_train_s, ys_train)

        self._wind_model = RandomForestRegressor(
            n_estimators=200, max_depth=8, min_samples_leaf=3, random_state=42, n_jobs=-1
        )
        self._wind_model.fit(X_train_s, yw_train)

        # Quantile regressors for confidence intervals
        self._solar_q10 = GradientBoostingRegressor(loss="quantile", alpha=0.10, n_estimators=100, random_state=42)
        self._solar_q90 = GradientBoostingRegressor(loss="quantile", alpha=0.90, n_estimators=100, random_state=42)
        self._wind_q10  = GradientBoostingRegressor(loss="quantile", alpha=0.10, n_estimators=100, random_state=42)
        self._wind_q90  = GradientBoostingRegressor(loss="quantile", alpha=0.90, n_estimators=100, random_state=42)
        self._solar_q10.fit(X_train_s, ys_train)
        self._solar_q90.fit(X_train_s, ys_train)
        self._wind_q10.fit(X_train_s, yw_train)
        self._wind_q90.fit(X_train_s, yw_train)

        # Evaluate on held-out test set
        pred_solar = np.maximum(0, self._solar_model.predict(X_test_s))
        pred_wind  = np.maximum(0, self._wind_model.predict(X_test_s))
        pred_total = pred_solar + pred_wind
        actual_total = ys_test + yw_test

        def mape(actual, pred):
            mask = actual > 0.1
            return float(np.mean(np.abs((actual[mask] - pred[mask]) / actual[mask])) * 100) if mask.any() else 0.0

        self._accuracy = {
            "solar_mae": float(mean_absolute_error(ys_test, pred_solar)),
            "solar_rmse": float(math.sqrt(mean_squared_error(ys_test, pred_solar))),
            "solar_mape": mape(ys_test, pred_solar),
            "solar_r2": float(r2_score(ys_test, pred_solar)),
            "wind_mae": float(mean_absolute_error(yw_test, pred_wind)),
            "wind_rmse": float(math.sqrt(mean_squared_error(yw_test, pred_wind))),
            "wind_mape": mape(yw_test, pred_wind),
            "wind_r2": float(r2_score(yw_test, pred_wind)),
            "combined_mae": float(mean_absolute_error(actual_total, pred_total)),
            "combined_rmse": float(math.sqrt(mean_squared_error(actual_total, pred_total))),
            "combined_mape": mape(actual_total, pred_total),
            "combined_r2": float(r2_score(actual_total, pred_total)),
            "evaluation_samples": len(X_test),
        }

        # Build history for actual-vs-predicted chart (sample every 6 hours)
        test_rows = rows[split:]
        history = []
        for i in range(0, len(test_rows), 6):
            row = test_rows[i]
            history.append({
                "timestamp": row["timestamp"].isoformat(),
                "actual_solar": round(float(ys_test[i]), 2),
                "predicted_solar": round(float(pred_solar[i]), 2),
                "actual_wind": round(float(yw_test[i]), 2),
                "predicted_wind": round(float(pred_wind[i]), 2),
                "actual_total": round(float(actual_total[i]), 2),
                "predicted_total": round(float(pred_total[i]), 2),
            })
        self._accuracy_history = history
        self._is_trained = True

        print(f"[Forecasting] Training complete. Solar R²={self._accuracy['solar_r2']:.4f}, "
              f"Wind R²={self._accuracy['wind_r2']:.4f}")

    def _predict_single_hour(self, feature_row: Dict[str, Any]) -> Tuple[float, float, float, float, float, float]:
        """Returns (solar_kwh, wind_kwh, solar_lower, solar_upper, wind_lower, wind_upper)."""
        if not self._is_trained:
            self.train()
        X = self._scaler.transform([_build_features(feature_row)])
        solar = float(max(0, self._solar_model.predict(X)[0]))
        wind  = float(max(0, self._wind_model.predict(X)[0]))
        s_lo  = float(max(0, self._solar_q10.predict(X)[0]))
        s_hi  = float(max(0, self._solar_q90.predict(X)[0]))
        w_lo  = float(max(0, self._wind_q10.predict(X)[0]))
        w_hi  = float(max(0, self._wind_q90.predict(X)[0]))
        return solar, wind, s_lo, s_hi, w_lo, w_hi

    def predict_day(self, target_date: date) -> Dict[str, Any]:
        """
        Aggregate hourly predictions for a target date into daily totals.
        Returns predicted kWh + confidence from interval width.
        """
        if not self._is_trained:
            self.train()

        # Build hourly feature rows for the target date using tomorrow's weather forecast
        weather_fcst = get_weather_forecast_days(days=3)
        target_weather = next(
            (w for w in weather_fcst if w["date"] == target_date),
            weather_fcst[0]
        )

        total_solar, total_wind = 0.0, 0.0
        total_s_lo, total_s_hi = 0.0, 0.0
        total_w_lo, total_w_hi = 0.0, 0.0

        dt = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        for h in range(24):
            row = {
                "timestamp": dt.replace(hour=h),
                "temperature": target_weather["avg_temp"] + (3 if h in range(10, 16) else -2),
                "humidity": 60.0,
                "cloud_cover": target_weather["cloud_cover_pct"],
                "wind_speed": target_weather["wind_speed_ms"],
                "solar_irradiance": solar_irradiance_wm2(
                    h, target_weather["cloud_cover_pct"],
                    dt.replace(hour=h).timetuple().tm_yday
                ),
            }
            s, w, sl, sh, wl, wh = self._predict_single_hour(row)
            total_solar += s
            total_wind  += w
            total_s_lo  += sl
            total_s_hi  += sh
            total_w_lo  += wl
            total_w_hi  += wh

        # Confidence: based on normalized interval width (1 - width/mean, clamped)
        s_interval = max(0, total_s_hi - total_s_lo)
        w_interval = max(0, total_w_hi - total_w_lo)
        total_mean = total_solar + total_wind
        total_interval = s_interval + w_interval
        confidence = max(45.0, min(96.0, 100.0 - (total_interval / max(1, total_mean)) * 100.0))

        # Expected demand (same demo formula for consistency)
        now = datetime.now(timezone.utc)
        expected_demand = sum(
            demand_kwh(h, target_date.weekday(), target_date.month) for h in range(24)
        )

        return {
            "target_date": target_date,
            "predicted_solar_kwh": round(total_solar, 2),
            "predicted_wind_kwh": round(total_wind, 2),
            "predicted_total_kwh": round(total_solar + total_wind, 2),
            "expected_demand_kwh": round(expected_demand, 2),
            "confidence_pct": round(confidence, 1),
            "confidence_interval_lower_kwh": round(total_s_lo + total_w_lo, 2),
            "confidence_interval_upper_kwh": round(total_s_hi + total_w_hi, 2),
            "model_version": self._model_version,
            "created_at": datetime.now(timezone.utc),
        }

    def predict_n_days(self, days: int = 7) -> List[Dict[str, Any]]:
        """Predict for the next N days."""
        today = date.today()
        return [self.predict_day(today + timedelta(days=i+1)) for i in range(days)]

    @property
    def accuracy_metrics(self) -> Dict[str, Any]:
        if not self._is_trained:
            self.train()
        return {**self._accuracy, "history": self._accuracy_history}

    @property
    def is_trained(self) -> bool:
        return self._is_trained


# Singleton instance — trained once on startup
_service_instance: ForecastingService | None = None

def get_forecasting_service() -> ForecastingService:
    global _service_instance
    if _service_instance is None:
        _service_instance = ForecastingService()
        _service_instance.train()
    return _service_instance
