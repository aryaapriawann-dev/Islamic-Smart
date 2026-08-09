from __future__ import annotations

from pydantic import BaseModel, Field

class CountEvent(BaseModel):
    device_id: str = Field(..., description="ID kamera/device titik akses")
    count: int = Field(..., ge=0, description="Jumlah orang dalam event")
    prayer_time_label: str | None = Field(None, description="Label waktu sholat")
    timestamp: str | None = Field(None, description="ISO timestamp event")

class CountResponse(BaseModel):
    accepted: bool
    device_id: str
    count: int
    prayer_time_label: str | None
    timestamp: str | None
