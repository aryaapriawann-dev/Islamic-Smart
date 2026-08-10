from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.supabase import supabase

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def accept_visitor_count(event: dict[str, Any]) -> dict[str, Any]:
    if "timestamp" not in event or event["timestamp"] is None:
        event["timestamp"] = _now_iso()

    if supabase:
        try:
            supabase.table("visitor_counts").insert({
                "timestamp": event["timestamp"],
                "count": event.get("count", 0),
                "prayer_time_label": event.get("prayer_time_label"),
                "device_id": event.get("device_id"),
            }).execute()
        except Exception as e:
            logger.error(f"Gagal menyimpan visitor count ke Supabase: {e}")

    return {
        "accepted": True,
        "device_id": event.get("device_id"),
        "count": event.get("count", 0),
        "prayer_time_label": event.get("prayer_time_label"),
        "timestamp": event.get("timestamp"),
    }


def get_visitor_summary() -> dict[str, Any]:
    if not supabase:
        return {
            "total_today": 0,
            "total_week": 0,
            "total_month": 0,
            "prayer_breakdown": {p: 0 for p in ["SUBUH", "ZUHUR", "ASHAR", "MAGHRIB", "ISYA"]},
            "recent_events": [],
        }

    try:
        now = datetime.now(timezone.utc)
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

        # Single query fetching all records from month start
        month_res = (
            supabase.table("visitor_counts")
            .select("timestamp, count, prayer_time_label")
            .gte("timestamp", start_of_month)
            .execute()
        )
        month_rows = month_res.data or []

        total_month = sum(r.get("count", 0) for r in month_rows)
        total_week = sum(r.get("count", 0) for r in month_rows if (r.get("timestamp") or "") >= start_of_week)
        today_rows = [r for r in month_rows if (r.get("timestamp") or "") >= start_of_today]
        total_today = sum(r.get("count", 0) for r in today_rows)

        prayer_breakdown: dict[str, int] = {}
        for p in ["SUBUH", "ZUHUR", "ASHAR", "MAGHRIB", "ISYA"]:
            prayer_breakdown[p] = sum(
                r.get("count", 0) for r in today_rows if r.get("prayer_time_label") == p
            )

        recent_res = (
            supabase.table("visitor_counts")
            .select("*")
            .order("timestamp", desc=True)
            .limit(10)
            .execute()
        )
        recent_events = recent_res.data or []

        return {
            "total_today": total_today,
            "total_week": total_week,
            "total_month": total_month,
            "prayer_breakdown": prayer_breakdown,
            "recent_events": recent_events,
        }
    except Exception as e:
        logger.error(f"Gagal mengambil visitor summary: {e}")
        return {
            "total_today": 0,
            "total_week": 0,
            "total_month": 0,
            "prayer_breakdown": {p: 0 for p in ["SUBUH", "ZUHUR", "ASHAR", "MAGHRIB", "ISYA"]},
            "recent_events": [],
        }


def get_visitor_report(start_date: str, end_date: str) -> list[dict[str, Any]]:
    if not supabase:
        return []

    try:
        res = (
            supabase.table("visitor_counts")
            .select("timestamp, count, prayer_time_label")
            .gte("timestamp", f"{start_date}T00:00:00Z")
            .lte("timestamp", f"{end_date}T23:59:59Z")
            .order("timestamp", desc=False)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Gagal mengambil visitor report: {e}")
        return []
