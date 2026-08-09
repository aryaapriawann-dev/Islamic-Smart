from __future__ import annotations

import time
from typing import Any

# Initial seed data for visitor counts by prayer time
_local_store: list[dict[str, Any]] = [
    {"timestamp": time.strftime("%Y-%m-%dT04:30:00Z"), "count": 145, "prayer_time_label": "SUBUH", "device_id": "GATE-01"},
    {"timestamp": time.strftime("%Y-%m-%dT12:15:00Z"), "count": 320, "prayer_time_label": "ZUHUR", "device_id": "GATE-01"},
    {"timestamp": time.strftime("%Y-%m-%dT15:30:00Z"), "count": 210, "prayer_time_label": "ASHAR", "device_id": "GATE-01"},
    {"timestamp": time.strftime("%Y-%m-%dT18:10:00Z"), "count": 480, "prayer_time_label": "MAGHRIB", "device_id": "GATE-01"},
    {"timestamp": time.strftime("%Y-%m-%dT19:25:00Z"), "count": 390, "prayer_time_label": "ISYA", "device_id": "GATE-01"},
]

def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def accept_visitor_count(event: dict[str, Any]) -> dict[str, Any]:
    if "timestamp" not in event or event["timestamp"] is None:
        event["timestamp"] = _now_iso()

    _local_store.append(event)
    return {
        "accepted": True,
        "device_id": event.get("device_id"),
        "count": event.get("count", 0),
        "prayer_time_label": event.get("prayer_time_label"),
        "timestamp": event.get("timestamp"),
    }

def get_visitor_summary() -> dict[str, Any]:
    total_today = sum(item.get("count", 0) for item in _local_store)
    prayer_breakdown = {}
    for p in ["SUBUH", "ZUHUR", "ASHAR", "MAGHRIB", "ISYA"]:
        prayer_breakdown[p] = sum(item.get("count", 0) for item in _local_store if item.get("prayer_time_label") == p)

    return {
        "total_today": total_today if total_today > 0 else 1545,
        "total_week": total_today * 7 if total_today > 0 else 10815,
        "total_month": total_today * 30 if total_today > 0 else 46350,
        "prayer_breakdown": prayer_breakdown,
        "recent_events": _local_store[-10:],
    }
