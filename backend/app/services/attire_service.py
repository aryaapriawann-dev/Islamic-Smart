from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.core.supabase import supabase

logger = logging.getLogger(__name__)


def log_attire_check(result_status: str, persen_aurat: float, mode: str) -> None:
    if not supabase:
        return
    try:
        supabase.table("attire_logs").insert({
            "result_status": result_status,
            "persen_aurat": round(persen_aurat, 2),
            "mode": mode,
        }).execute()
    except Exception as e:
        logger.error(f"Gagal menyimpan attire log: {e}")


def get_attire_summary() -> dict[str, Any]:
    if not supabase:
        return {
            "total_checks_today": 0,
            "reminders_today": 0,
            "compliance_rate": 0.0,
        }

    try:
        now = datetime.now(timezone.utc)
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

        res = (
            supabase.table("attire_logs")
            .select("result_status")
            .gte("timestamp", start_of_today)
            .execute()
        )
        rows = res.data or []

        total = len(rows)
        reminders = sum(1 for r in rows if r.get("result_status") == "PENGINGAT_SOPAN")
        compliant = sum(1 for r in rows if r.get("result_status") == "RAPI")
        rate = (compliant / total * 100) if total > 0 else 0.0

        return {
            "total_checks_today": total,
            "reminders_today": reminders,
            "compliance_rate": round(rate, 1),
        }
    except Exception as e:
        logger.error(f"Gagal mengambil attire summary: {e}")
        return {
            "total_checks_today": 0,
            "reminders_today": 0,
            "compliance_rate": 0.0,
        }
