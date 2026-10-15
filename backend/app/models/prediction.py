from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, Date
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    target_date = Column(Date, index=True, nullable=False)
    predicted_solar_kwh = Column(Float, nullable=False)
    predicted_wind_kwh = Column(Float, nullable=False)
    confidence_pct = Column(Float, nullable=False)  # 0.0 - 100.0 from prediction intervals
    model_version = Column(String(50), default="aurora-xgb-v1.0", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
