from fastapi import APIRouter
from app.schemas.visitor import CountEvent, CountResponse
from app.services.visitor_service import accept_visitor_count, get_visitor_summary

router = APIRouter()

@router.post("/visitor", response_model=CountResponse)
def visitor_count(payload: CountEvent):
    event_dict = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    return accept_visitor_count(event_dict)

@router.get("/visitor/summary")
def visitor_summary():
    return get_visitor_summary()
