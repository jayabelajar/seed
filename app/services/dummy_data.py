from __future__ import annotations

import math
import random
from datetime import datetime, timedelta
from typing import Any


class DummyDataService:
    def __init__(self) -> None:
        self._started_at = datetime.utcnow()
        self._pump_status = "OFF"
        self._pump_mode = "Otomatis"
        self._pump_logs: list[dict[str, Any]] = [
            {
                "id": 1,
                "status": "OFF",
                "mode": "Otomatis",
                "duration": 0,
                "created_at": (datetime.utcnow() - timedelta(minutes=35)).isoformat(),
            }
        ]

    def get_latest_sensor(self) -> dict[str, Any]:
        seconds = (datetime.utcnow() - self._started_at).total_seconds()
        wave = math.sin(seconds / 25)
        small_wave = math.cos(seconds / 40)

        return {
            "id": int(seconds),
            "temperature": round(28.5 + wave * 1.7 + random.uniform(-0.25, 0.25), 1),
            "humidity": round(78 + small_wave * 4 + random.uniform(-0.8, 0.8), 1),
            "soil_moisture": round(67 + wave * 5 + random.uniform(-1.0, 1.0), 1),
            "light_intensity": round(820 + small_wave * 95 + random.uniform(-18, 18), 0),
            "created_at": datetime.utcnow().isoformat(),
        }

    def get_sensor_history(self, hours: int = 6) -> list[dict[str, Any]]:
        hours = max(1, min(hours, 24))
        now = datetime.utcnow()
        points: list[dict[str, Any]] = []

        for index in range(hours * 6):
            created_at = now - timedelta(minutes=(hours * 6 - index - 1) * 10)
            wave = math.sin(index / 4)
            small_wave = math.cos(index / 5)
            points.append(
                {
                    "id": index + 1,
                    "temperature": round(28.2 + wave * 1.8 + random.uniform(-0.2, 0.2), 1),
                    "humidity": round(77 + small_wave * 4 + random.uniform(-0.7, 0.7), 1),
                    "soil_moisture": round(66 + wave * 5 + random.uniform(-0.8, 0.8), 1),
                    "light_intensity": round(790 + small_wave * 120 + random.uniform(-15, 15), 0),
                    "created_at": created_at.isoformat(),
                }
            )

        return points

    def get_device_status(self) -> dict[str, Any]:
        return {
            "esp32": {
                "id": 1,
                "name": "ESP32 Persemaian A",
                "status": "Online",
                "last_seen": datetime.utcnow().isoformat(),
            },
            "pump": {
                "id": 1,
                "name": "Pompa Air Utama",
                "status": self._pump_status,
                "mode": self._pump_mode,
                "last_seen": datetime.utcnow().isoformat(),
            },
        }

    def set_pump_status(self, status: str, mode: str | None = None, duration: int = 0) -> dict[str, Any]:
        normalized_status = status.upper()
        if normalized_status not in {"ON", "OFF"}:
            raise ValueError("status pompa harus ON atau OFF")

        if mode:
            self._pump_mode = mode

        self._pump_status = normalized_status
        log = {
            "id": len(self._pump_logs) + 1,
            "status": self._pump_status,
            "mode": self._pump_mode,
            "duration": duration,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._pump_logs.insert(0, log)
        self._pump_logs = self._pump_logs[:12]
        return log

    def get_pump_logs(self) -> list[dict[str, Any]]:
        return self._pump_logs

    def get_latest_fuzzy_result(self) -> dict[str, Any]:
        sensor = self.get_latest_sensor()
        should_water = sensor["soil_moisture"] < 62 or sensor["temperature"] > 30
        return {
            "id": sensor["id"],
            "input_data": sensor,
            "decision": "Menyiram" if should_water else "Tidak Menyiram",
            "duration": 45 if should_water else 0,
            "created_at": datetime.utcnow().isoformat(),
        }

    def get_fuzzy_history(self) -> list[dict[str, Any]]:
        history = self.get_sensor_history(4)[-10:]
        results: list[dict[str, Any]] = []
        for item in history:
            should_water = item["soil_moisture"] < 62 or item["temperature"] > 30
            results.append(
                {
                    "id": item["id"],
                    "input_data": item,
                    "decision": "Menyiram" if should_water else "Tidak Menyiram",
                    "duration": 45 if should_water else 0,
                    "created_at": item["created_at"],
                }
            )
        return results

    def get_latest_vision_result(self) -> dict[str, Any]:
        return {
            "id": 1,
            "image_path": "/static/img/seedling.svg",
            "result": "Bibit Sehat",
            "confidence": 94,
            "created_at": datetime.utcnow().isoformat(),
        }

    def get_vision_history(self) -> list[dict[str, Any]]:
        labels = ["Bibit Sehat", "Pertumbuhan Normal", "Daun Sedikit Menguning", "Bibit Sehat"]
        return [
            {
                "id": index + 1,
                "image_path": "/static/img/seedling.svg",
                "result": label,
                "confidence": 88 + index * 2,
                "created_at": (datetime.utcnow() - timedelta(hours=index * 3)).isoformat(),
            }
            for index, label in enumerate(labels)
        ]


data_service = DummyDataService()
