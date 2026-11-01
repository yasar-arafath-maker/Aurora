import pytest
from app.services.telemetry.sunspec_modbus import SunSpecModbusMap
from fastapi.testclient import TestClient
from app.main import app

def test_sunspec_modbus_encoding():
    frame = SunSpecModbusMap.generate_telemetry_frame(
        voltage_v=765.2,
        current_a=196.0,
        frequency_hz=50.02,
        active_power_kw=150.0,
        reactive_power_kvar=18.5,
        power_factor=0.988,
        soc_pct=68.5,
        cell_temp_c=24.8,
    )
    assert frame["protocol"].startswith("SunSpec Modbus")
    assert len(frame["registers"]) >= 8
    
    # Check specific SunSpec addresses
    addresses = {r["address"]: r for r in frame["registers"]}
    assert 40071 in addresses  # DC Bus Voltage
    assert 40083 in addresses  # Operating State
    assert 40084 in addresses  # Active Power
    assert 40092 in addresses  # Grid Frequency
    assert 40108 in addresses  # SoC %
    
    # Check hex format
    assert addresses[40071]["hex_value"].startswith("0x")
    assert addresses[40108]["units"] == "%"
    assert addresses[40092]["raw_value"] == 50.02

def test_modbus_registers_endpoint():
    client = TestClient(app)
    resp = client.get("/api/v1/telemetry/modbus-registers")
    assert resp.status_code == 200
    data = resp.json()
    assert "registers" in data
    assert len(data["registers"]) > 0
    assert data["slave_id"] == 1
