from __future__ import annotations

from pydantic import BaseModel, Field


class PumpControlRequest(BaseModel):
    status: str = Field(pattern="^(ON|OFF|on|off)$")
    mode: str | None = None
    duration: int = Field(default=0, ge=0)
