from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime
from app.core.database import Base

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    temperature = Column(Float, nullable=False)           # °C
    humidity = Column(Float, nullable=False)              # %
    cloud_cover = Column(Float, nullable=False)           # %
    rainfall = Column(Float, default=0.0, nullable=False) # mm
    wind_speed = Column(Float, nullable=False)            # m/s
    solar_irradiance = Column(Float, nullable=False)      # W/m²
    source = Column(String(50), default="demo", nullable=False)  # 'live' or 'demo'
