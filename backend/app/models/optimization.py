from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, Date, JSON
from app.core.database import Base

class OptimizationResult(Base):
    __tablename__ = "optimization_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    target_date = Column(Date, index=True, nullable=False)
    deficit_kwh = Column(Float, nullable=False)
    recommended_charge_kwh = Column(Float, nullable=False)
    mode = Column(String(50), nullable=False)  # 'charge', 'surplus', 'insufficient_capacity'
    inputs_json = Column(JSON, nullable=False) # demand, reserve_pct, efficiency, current_soc, capacity
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
