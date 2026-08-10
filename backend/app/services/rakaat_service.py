from __future__ import annotations

import logging
from app.core.supabase import supabase

logger = logging.getLogger(__name__)


def log_rakaat_session(
    session_id: str,
    prayer_type: str,
    max_rakaat: int,
    detected_rakaat: int,
    exceeded: bool,
) -> None:
    if not supabase:
        return
    try:
        supabase.table("rakaat_sessions").insert({
            "session_id": session_id,
            "prayer_type": prayer_type,
            "max_rakaat": max_rakaat,
            "detected_rakaat": detected_rakaat,
            "exceeded": exceeded,
        }).execute()
    except Exception as e:
        logger.error(f"Gagal menyimpan rakaat session: {e}")
