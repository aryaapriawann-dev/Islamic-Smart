from __future__ import annotations

import base64
import time

import cv2
import mediapipe as mp
import numpy as np
from collections import deque

from app.core.pose_utils import hitung_sudut, get_coord

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

_pose = mp_pose.Pose(
    min_detection_confidence=0.65,
    min_tracking_confidence=0.65,
    model_complexity=1,
)

def _encode_to_base64(frame_bgr: np.ndarray) -> str:
    _, buffer = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
    b64_bytes = base64.b64encode(buffer)
    return f"data:image/jpeg;base64,{b64_bytes.decode('utf-8')}"

class Session:
    def __init__(self, session_id: str, prayer_type: str, max_rakaat: int):
        self.session_id = session_id
        self.prayer_type = prayer_type
        self.max_rakaat = max_rakaat
        self.rakaat_sekarang = 0
        self.step_gerakan = 0
        self.status_sekarang = "TIDAK TERDETEKSI"
        self.status_sebelum = ""
        self.riwayat_gerakan = deque(maxlen=6)
        self.last_rakaat_time = 0.0
        self.visibilitas = 0.0


class RakaatSessionManager:
    def __init__(self) -> None:
        self.sessions: dict[str, Session] = {}

    def start_session(self, session_id: str, prayer_type: str, max_rakaat: int) -> dict:
        session = Session(session_id, prayer_type, max_rakaat)
        self.sessions[session_id] = session
        return {
            "session_id": session_id,
            "prayer_type": prayer_type,
            "max_rakaat": max_rakaat,
            "status": "STARTED",
        }

    def get_session(self, session_id: str) -> Session | None:
        return self.sessions.get(session_id)

    def process_frame(self, session: Session, image_base64: str) -> dict:
        frame = _decode(image_base64)
        if frame is None:
            return {
                "session_id": session.session_id,
                "prayer_type": session.prayer_type,
                "max_rakaat": session.max_rakaat,
                "detected_rakaat": session.rakaat_sekarang,
                "exceeded": session.rakaat_sekarang > session.max_rakaat,
                "step_gerakan": _step_label(session.step_gerakan),
                "status_sekarang": "TIDAK TERDETEKSI",
                "visibilitas": 0.0,
                "message": "Frame tidak valid",
                "annotated_image": None,
            }

        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        hasil = _pose.process(rgb)

        visibilitas = 0.0
        sudut_pinggul = 0.0
        sudut_lutut = 0.0
        annotated_image = None

        if hasil.pose_landmarks: # type: ignore
            lm = hasil.pose_landmarks.landmark # type: ignore
            idx_utama = [0, 11, 12, 23, 24, 25, 26, 27, 28]
            visibilitas = float(np.mean([lm[i].visibility for i in idx_utama]))
            status_raw, sudut_pinggul, sudut_lutut = deteksi_posisi(lm, w, h)
            self._update_state(session, status_raw)

            # ── DRAW SKELETON LANDMARKS & CONNECTIONS ──
            mp_drawing.draw_landmarks(
                frame,
                hasil.pose_landmarks, # type: ignore
                mp_pose.POSE_CONNECTIONS, # type: ignore
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=3),
                connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2)
            )

            cv2.putText(
                frame,
                f"GERAKAN: {session.status_sekarang}",
                (20, 40),
                cv2.FONT_HERSHEY_DUPLEX,
                0.8,
                (0, 255, 255),
                2,
                cv2.LINE_AA,
            )
            cv2.putText(
                frame,
                f"RAKAAT: {session.rakaat_sekarang}/{session.max_rakaat}",
                (20, 80),
                cv2.FONT_HERSHEY_DUPLEX,
                0.8,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

            annotated_image = _encode_to_base64(frame)
        else:
            session.status_sekarang = "TIDAK TERDETEKSI"
            session.riwayat_gerakan.clear()

        exceeded = session.rakaat_sekarang > session.max_rakaat
        if session.rakaat_sekarang == session.max_rakaat and session.step_gerakan == -1:
            message = "SHOLAT SEMPURNA"
        elif exceeded:
            message = "RAKAAT MELEBIHI BATAS"
        else:
            message = ""

        return {
            "session_id": session.session_id,
            "prayer_type": session.prayer_type,
            "max_rakaat": session.max_rakaat,
            "detected_rakaat": session.rakaat_sekarang,
            "exceeded": exceeded,
            "step_gerakan": _step_label(session.step_gerakan),
            "status_sekarang": session.status_sekarang,
            "visibilitas": round(visibilitas * 100, 1),
            "message": message,
            "sudut_pinggul": round(float(sudut_pinggul), 1),
            "sudut_lutut": round(float(sudut_lutut), 1),
            "annotated_image": annotated_image,
        }

    def _update_state(self, session: Session, status_raw: str) -> None:
        session.riwayat_gerakan.append(status_raw)
        if (
            len(session.riwayat_gerakan) == session.riwayat_gerakan.maxlen
            and all(g == session.riwayat_gerakan[0] for g in session.riwayat_gerakan)
        ):
            session.status_sekarang = session.riwayat_gerakan[0]
        else:
            return

        waktu_sekarang = time.time()
        status_berubah = session.status_sekarang != session.status_sebelum
        if not status_berubah:
            return

        step = session.step_gerakan
        if session.status_sekarang == "RUKU" and step == 0:
            session.step_gerakan = 1
        elif session.status_sekarang == "BERDIRI" and step == 1:
            session.step_gerakan = 2
        elif session.status_sekarang == "SUJUD" and step == 2:
            session.step_gerakan = 3
        elif session.status_sekarang == "DUDUK" and step == 3:
            session.step_gerakan = 4
        elif session.status_sekarang == "SUJUD" and step == 4:
            session.step_gerakan = 5
        elif session.status_sekarang in ("BERDIRI", "DUDUK") and step == 5:
            if waktu_sekarang - session.last_rakaat_time >= 1.5:
                session.rakaat_sekarang += 1
                session.last_rakaat_time = waktu_sekarang
            session.step_gerakan = 0 if session.status_sekarang == "BERDIRI" else -1

        session.status_sebelum = session.status_sekarang


def _decode(data_url: str) -> np.ndarray | None:
    try:
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        raw = np.frombuffer(base64.b64decode(data_url), np.uint8)
        frame = cv2.imdecode(raw, cv2.IMREAD_COLOR)
        if frame is None:
            return None
        return frame
    except Exception:
        return None


def deteksi_posisi(lm, w, h):
    bahu_kiri = get_coord(lm, 11, w, h)
    bahu_kanan = get_coord(lm, 12, w, h)
    pinggul_kiri = get_coord(lm, 23, w, h)
    pinggul_kanan = get_coord(lm, 24, w, h)
    lutut_kiri = get_coord(lm, 25, w, h)
    lutut_kanan = get_coord(lm, 26, w, h)

    kepala_y = lm[0].y * h
    pinggul_y = (pinggul_kiri[1] + pinggul_kanan[1]) / 2

    sudut_pinggul = (
        hitung_sudut(bahu_kiri, pinggul_kiri, lutut_kiri)
        + hitung_sudut(bahu_kanan, pinggul_kanan, lutut_kanan)
    ) / 2
    sudut_lutut = (
        hitung_sudut(pinggul_kiri, lutut_kiri, [lm[27].x * w, lm[27].y * h])
        + hitung_sudut(pinggul_kanan, lutut_kanan, [lm[28].x * w, lm[28].y * h])
    ) / 2

    if kepala_y > pinggul_y:
        return "SUJUD", sudut_pinggul, sudut_lutut
    if sudut_pinggul < 110:
        return "RUKU", sudut_pinggul, sudut_lutut
    if sudut_lutut < 120 and kepala_y < pinggul_y:
        return "DUDUK", sudut_pinggul, sudut_lutut
    return "BERDIRI", sudut_pinggul, sudut_lutut


def _step_label(step: int) -> str:
    labels = ["Awal", "Ruku", "I'tidal", "Sujud1", "Duduk", "Sujud2", "Tahiyat"]
    if 0 <= step < len(labels):
        return labels[step]
    return "Tahiyat Akhir"
