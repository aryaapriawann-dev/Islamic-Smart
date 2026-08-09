from __future__ import annotations

from pydantic import BaseModel, Field

class RakaatStart(BaseModel):
    session_id: str = Field(..., description="Unik ID sesi per jamaah/device")
    prayer_type: str = Field(..., description="Jenis sholat: SUBUH/ZUHUR/ASHAR/MAGHRIB/ISYA")
    max_rakaat: int = Field(..., ge=1, description="Batas maksimal rakaat")

class RakaatStatusRequest(BaseModel):
    session_id: str
    image_base64: str = Field(..., description="Frame dari kiosk personal")

class RakaatStatusResponse(BaseModel):
    session_id: str
    prayer_type: str
    max_rakaat: int
    detected_rakaat: int
    exceeded: bool
    step_gerakan: str
    status_sekarang: str
    visibilitas: float
    message: str
    sudut_pinggul: float | None = 0.0
    sudut_lutut: float | None = 0.0
    annotated_image: str | None = Field(None, description="Frame gambar dengan skeleton dan info pose")
