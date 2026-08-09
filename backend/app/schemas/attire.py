from __future__ import annotations

from pydantic import BaseModel, Field

class AttireRequest(BaseModel):
    image_base64: str = Field(..., description="Frame kamera dalam base64")
    mode: str = Field("PEREMPUAN", description="Mode gate: PEREMPUAN atau LAKI-LAKI")
    threshold: float | None = Field(None, description="Ambang batas persen aurat")

class AttireResult(BaseModel):
    pose_detected: bool
    pelanggaran: bool
    persen_aurat: float
    status: str
    threshold: float
    message: str | None = None
    annotated_image: str | None = Field(None, description="Frame gambar dengan skeleton dan highlight contour")
