"""
AURORA Live Telemetry WebSocket Streamer
=========================================
Endpoints:
  - WS  /api/v1/telemetry/ws: 2-5 Hz streaming telemetry with SunSpec Modbus registers and ping/pong latency
  - GET /api/v1/telemetry/modbus-registers: Snapshot of current Modbus holding register table
"""
import asyncio
import json
import random
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any

from app.services.telemetry.sunspec_modbus import SunSpecModbusMap
from app.services.battery.simulator import get_battery_status
from app.core.config import settings

router = APIRouter(prefix="/telemetry", tags=["Telemetry & SCADA"])

@router.get("/modbus-registers")
async def get_modbus_registers():
    """Returns a snapshot of the current SunSpec Modbus TCP holding registers."""
    bat = get_battery_status()
    frame = SunSpecModbusMap.generate_telemetry_frame(
        voltage_v=bat.get("voltage", 765.2),
        current_a=bat.get("current", 196.0),
        frequency_hz=50.02,
        active_power_kw=150.0,
        reactive_power_kvar=18.5,
        power_factor=0.988,
        soc_pct=bat.get("soc_pct", 0.685) * 100.0 if bat.get("soc_pct", 0.685) <= 1 else bat.get("soc_pct", 68.5),
        cell_temp_c=bat.get("temperature_c", 24.8),
    )
    return frame

@router.websocket("/ws")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    High-speed streaming WebSocket connection.
    Pushes live electrical SCADA frames every 500ms (2 Hz).
    Handles client ping for latency computation.
    """
    await websocket.accept()
    
    # State tracking
    base_v = 765.2
    base_hz = 50.00
    base_kw = 150.0

    async def receiver():
        """Listen for client pings or control commands."""
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        # Echo back pong with original client timestamp
                        await websocket.send_text(json.dumps({
                            "type": "pong",
                            "client_t": msg.get("t"),
                            "server_t": datetime.now(timezone.utc).timestamp() * 1000,
                        }))
                except Exception:
                    pass
        except WebSocketDisconnect:
            pass

    async def sender():
        """Push streaming telemetry frames periodically."""
        nonlocal base_v, base_hz, base_kw
        seq = 0
        try:
            while True:
                # Add micro-disturbances
                v_jitter = base_v + random.gauss(0, 0.4)
                hz_jitter = base_hz + random.gauss(0, 0.02)
                kw_jitter = base_kw + random.gauss(0, 1.2)
                pf_jitter = max(0.95, min(0.999, 0.988 + random.gauss(0, 0.002)))

                frame = SunSpecModbusMap.generate_telemetry_frame(
                    voltage_v=round(v_jitter, 1),
                    current_a=round(kw_jitter * 1000 / max(1, v_jitter), 1),
                    frequency_hz=round(hz_jitter, 2),
                    active_power_kw=round(kw_jitter, 1),
                    reactive_power_kvar=round(kw_jitter * 0.12, 1),
                    power_factor=round(pf_jitter, 3),
                    soc_pct=68.5,
                    cell_temp_c=24.8,
                )
                frame["type"] = "telemetry_frame"
                frame["sequence"] = seq
                seq += 1

                await websocket.send_text(json.dumps(frame))
                await asyncio.sleep(0.5) # 2 Hz stream rate
        except WebSocketDisconnect:
            pass
        except Exception:
            pass

    sender_task = asyncio.create_task(sender())
    receiver_task = asyncio.create_task(receiver())

    try:
        done, pending = await asyncio.wait(
            [sender_task, receiver_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()
    except Exception:
        pass
