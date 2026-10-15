from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime
from app.core.database import Base

class BatteryStatus(Base):
    __tablename__ = "battery_status"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), index=True, default=lambda: datetime.now(timezone.utc), nullable=False)
    soc_pct = Column(Float, nullable=False)        # 0.0 - 1.0 (State of charge)
    voltage = Column(Float, nullable=False)        # Volts DC (e.g. 780.4 V)
    current = Column(Float, nullable=False)        # Amperes (+ charge, - discharge)
    temperature_c = Column(Float, nullable=False)  # Operating temperature °C
    stored_kwh = Column(Float, nullable=False)     # Usable stored energy
