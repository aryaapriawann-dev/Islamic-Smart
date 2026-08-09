from fastapi import APIRouter
from app.schemas.rakaat import RakaatStart, RakaatStatusRequest, RakaatStatusResponse
from app.services.rakaat_engine import RakaatSessionManager

router = APIRouter()
manager = RakaatSessionManager()

@router.post("/rakaat/start", response_model=dict)
def start_rakaat(payload: RakaatStart):
    session = manager.start_session(
        session_id=payload.session_id,
        prayer_type=payload.prayer_type,
        max_rakaat=payload.max_rakaat,
    )
    return session

@router.post("/rakaat/status", response_model=RakaatStatusResponse)
def rakaat_status(payload: RakaatStatusRequest):
    session = manager.get_session(payload.session_id)
    if session is None:
        return RakaatStatusResponse(
            session_id=payload.session_id,
            prayer_type="",
            max_rakaat=0,
            detected_rakaat=0,
            exceeded=False,
            step_gerakan="TIDAK TERDETEKSI",
            status_sekarang="TIDAK TERDETEKSI",
            visibilitas=0.0,
            message="Sesi tidak ditemukan. Jalankan /start terlebih dahulu.",
        )
    result = manager.process_frame(session, payload.image_base64)
    return RakaatStatusResponse(**result)
