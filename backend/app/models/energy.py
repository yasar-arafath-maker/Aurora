from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime
from app.core.database import Base

class EnergyGeneration(Base):
    __tablename__ = "energy_generation"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    solar_kwh = Column(Float, default=0.0, nullable=False)
    wind_kwh = Column(Float, default=0.0, nullable=False)
    source = Column(String(50), default="demo", nullable=False)  # 'live' or 'demo'

class EnergyDemand(Base):
    __tablename__ = "energy_demand"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    demand_kwh = Column(Float, default=0.0, nullable=False)
    source = Column(String(50), default="demo", nullable=False)  # 'live' or 'demo'
