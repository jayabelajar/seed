from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.pump import PumpControlRequest
from app.services.dummy_data import data_service


router = APIRouter(prefix="/api")


@router.get("/sensors/latest")
def latest_sensor() -> dict[str, object]:
    return data_service.get_latest_sensor()


@router.get("/sensors/history")
def sensor_history(hours: int = Query(default=6, ge=1, le=24)) -> list[dict[str, object]]:
    return data_service.get_sensor_history(hours)


@router.get("/device/status")
def device_status() -> dict[str, object]:
    return data_service.get_device_status()


@router.post("/pump/control")
def pump_control(payload: PumpControlRequest) -> dict[str, object]:
    try:
        log = data_service.set_pump_status(payload.status, payload.mode, payload.duration)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "message": "Status pompa diperbarui",
        "log": log,
        "device": data_service.get_device_status(),
    }


@router.get("/fuzzy/latest")
def fuzzy_latest() -> dict[str, object]:
    return data_service.get_latest_fuzzy_result()


@router.get("/fuzzy/history")
def fuzzy_history() -> list[dict[str, object]]:
    return data_service.get_fuzzy_history()


@router.get("/vision/latest")
def vision_latest() -> dict[str, object]:
    return data_service.get_latest_vision_result()


@router.get("/vision/history")
def vision_history() -> list[dict[str, object]]:
    return data_service.get_vision_history()
