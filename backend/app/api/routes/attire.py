from fastapi import APIRouter
from app.schemas.attire import AttireRequest, AttireResult
from app.services.attire_engine import detect_attire_from_frame
from app.services.attire_service import get_attire_summary

router = APIRouter()

@router.post("/attire", response_model=AttireResult)
def detect_attire(payload: AttireRequest):
    result = detect_attire_from_frame(
        image_base64=payload.image_base64,
        mode=payload.mode,
        threshold=payload.threshold,
    )
    return result

@router.get("/attire/summary")
def attire_summary():
    return get_attire_summary()
