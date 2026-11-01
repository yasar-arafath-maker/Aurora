"""
AURORA SunSpec Modbus TCP Telemetry & Register Mapping Engine
============================================================
Conforms to SunSpec Alliance Specifications:
  - Model 101/103: Single Phase / Three Phase Inverter
  - Model 802: Battery Energy Storage System (BESS)
  - IEC 61850 Data Quality Attributes

Generates realistic 16-bit unsigned/signed Modbus register tables with hex representations,
scale factors, engineering units, and industrial data quality flags.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List
import struct

class SunSpecModbusMap:
    """
    Simulates standard SunSpec Modbus registers for AURORA C&I Microgrid:
      - 40069-40075: Common Inverter Model (Base Voltage, Current, Frequency)
      - 40080-40095: Active Power, Reactive Power, Power Factor
      - 40100-40120: BESS Battery Storage Status & DC Link
    """

    @staticmethod
    def encode_register_16(value: float, scale_factor: int = 0) -> str:
        """Encode float into 16-bit hex word taking scale factor (10^sf) into account."""
        scaled_int = int(round(value * (10 ** -scale_factor)))
        # clamp to 16-bit unsigned range
        clamped = max(0, min(65535, scaled_int))
        return f"0x{clamped:04X}"

    @classmethod
    def generate_telemetry_frame(
        cls,
        voltage_v: float = 765.2,
        current_a: float = 196.0,
        frequency_hz: float = 50.02,
        active_power_kw: float = 150.0,
        reactive_power_kvar: float = 18.5,
        power_factor: float = 0.988,
        soc_pct: float = 68.5,
        cell_temp_c: float = 24.8,
        status_code: int = 4, # 4 = MPPT_RUNNING / CHARGING
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive SunSpec frame containing:
          - Raw engineering measurements
          - Modbus holding registers (address, name, hex, units, quality)
        """
        registers = [
            {
                "address": 40071,
                "name": "DC Bus Voltage",
                "model": "SunSpec-M802",
                "raw_value": round(voltage_v, 1),
                "hex_value": cls.encode_register_16(voltage_v, scale_factor=-1),
                "units": "V",
                "scale_factor": -1,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40072,
                "name": "DC Battery Current",
                "model": "SunSpec-M802",
                "raw_value": round(current_a, 1),
                "hex_value": cls.encode_register_16(current_a, scale_factor=-1),
                "units": "A",
                "scale_factor": -1,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40083,
                "name": "Inverter Operating State",
                "model": "SunSpec-M103",
                "raw_value": status_code,
                "hex_value": f"0x{status_code:04X}",
                "units": "ENUM",
                "scale_factor": 0,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40084,
                "name": "AC Active Power",
                "model": "SunSpec-M103",
                "raw_value": round(active_power_kw, 1),
                "hex_value": cls.encode_register_16(active_power_kw, scale_factor=-1),
                "units": "kW",
                "scale_factor": -1,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40088,
                "name": "AC Reactive Power",
                "model": "SunSpec-M103",
                "raw_value": round(reactive_power_kvar, 1),
                "hex_value": cls.encode_register_16(reactive_power_kvar, scale_factor=-1),
                "units": "kVAR",
                "scale_factor": -1,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40092,
                "name": "Grid Frequency",
                "model": "SunSpec-M103",
                "raw_value": round(frequency_hz, 2),
                "hex_value": cls.encode_register_16(frequency_hz, scale_factor=-2),
                "units": "Hz",
                "scale_factor": -2,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40095,
                "name": "Power Factor",
                "model": "SunSpec-M103",
                "raw_value": round(power_factor, 3),
                "hex_value": cls.encode_register_16(power_factor, scale_factor=-3),
                "units": "PF",
                "scale_factor": -3,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40108,
                "name": "BESS State of Charge",
                "model": "SunSpec-M802",
                "raw_value": round(soc_pct, 1),
                "hex_value": cls.encode_register_16(soc_pct, scale_factor=-1),
                "units": "%",
                "scale_factor": -1,
                "quality": "GOOD_VALIDATED",
            },
            {
                "address": 40112,
                "name": "Cell Mean Temperature",
                "model": "SunSpec-M802",
                "raw_value": round(cell_temp_c, 1),
                "hex_value": cls.encode_register_16(cell_temp_c, scale_factor=-1),
                "units": "°C",
                "scale_factor": -1,
                "quality": "GOOD_VALIDATED",
            },
        ]

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "protocol": "SunSpec Modbus TCP / IEC 61850",
            "slave_id": 1,
            "port": 502,
            "registers": registers,
            "telemetry": {
                "voltage_v": voltage_v,
                "current_a": current_a,
                "frequency_hz": frequency_hz,
                "active_power_kw": active_power_kw,
                "reactive_power_kvar": reactive_power_kvar,
                "power_factor": power_factor,
                "soc_pct": soc_pct,
                "cell_temp_c": cell_temp_c,
            }
        }
