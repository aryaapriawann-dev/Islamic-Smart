from __future__ import annotations

import cv2
import mediapipe as mp
import numpy as np
import base64


# Initialize MediaPipe pose once
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose(
    min_detection_confidence=0.75,
    min_tracking_confidence=0.75,
    enable_segmentation=True,
    model_complexity=1,
)

# Colors (BGR)
GOLD = (0, 200, 215)
GOLD_TERANG = (0, 230, 255)
EMERALD = (80, 200, 80)
MERAH = (40, 40, 220)
PUTIH = (255, 255, 255)
ABU_TUA = (60, 60, 60)
ABU_TERANG = (180, 180, 180)

def _bgr_from_base64(data_url: str) -> np.ndarray:
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    raw = base64.b64decode(data_url)
    arr = np.frombuffer(raw, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Frame base64 tidak valid")
    return frame

def _encode_to_base64(frame_bgr: np.ndarray) -> str:
    _, buffer = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
    b64_bytes = base64.b64encode(buffer)
    return f"data:image/jpeg;base64,{b64_bytes.decode('utf-8')}"

def _overlay_transparan(frame, x1, y1, x2, y2, warna, alpha=0.55):
    overlay = frame.copy()
    cv2.rectangle(overlay, (int(x1), int(y1)), (int(x2), int(y2)), warna, -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

def _gambar_teks_shadow(frame, teks, pos, font, skala, warna, tebal=2, shadow_offset=2):
    x, y = pos
    cv2.putText(frame, teks, (x + shadow_offset, y + shadow_offset), font, skala, (0, 0, 0), tebal + 1, cv2.LINE_AA)
    cv2.putText(frame, teks, pos, font, skala, warna, tebal, cv2.LINE_AA)

def _gambar_meter_persen(frame, x, y, lebar, tinggi, persen, warna_bar):
    cv2.rectangle(frame, (x, y), (x + lebar, y + tinggi), (30, 30, 30), -1)
    cv2.rectangle(frame, (x, y), (x + lebar, y + tinggi), ABU_TUA, 1)
    isi = int(lebar * min(persen / 100.0, 1.0))
    if isi > 0:
        cv2.rectangle(frame, (x, y + 2), (x + isi, y + tinggi - 2), warna_bar, -1)
    label = f"{persen:.1f}%"
    (tw, _), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
    cv2.putText(frame, label, (x + lebar // 2 - tw // 2, y + tinggi - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, PUTIH, 1, cv2.LINE_AA)

def _mask_kulit(frame_bgr, frame_hsv, frame_ycrcb):
    mask_ycrcb = cv2.inRange(
        frame_ycrcb,
        np.array([60, 135, 85]),
        np.array([255, 168, 125]),
    )
    mask_hsv = cv2.inRange(
        frame_hsv,
        np.array([0, 25, 70]),
        np.array([18, 170, 255]),
    )
    B = frame_bgr[:, :, 0].astype(np.float32) + 1.0
    G = frame_bgr[:, :, 1].astype(np.float32) + 1.0
    R = frame_bgr[:, :, 2].astype(np.float32) + 1.0

    ratio_rg = R / G
    mask_bgr = (
        (R > 80)
        & (G > 40)
        & (B > 25)
        & (R > G)
        & (G > B)
        & (ratio_rg >= 1.08)
        & (ratio_rg <= 1.75)
    ).astype(np.uint8) * 255

    mask_kulit = cv2.bitwise_and(cv2.bitwise_and(mask_hsv, mask_ycrcb), mask_bgr)
    kernel = np.ones((5, 5), np.uint8)
    mask_kulit = cv2.morphologyEx(mask_kulit, cv2.MORPH_OPEN, kernel)
    mask_kulit = cv2.morphologyEx(mask_kulit, cv2.MORPH_CLOSE, kernel)
    return mask_kulit

def _mask_aurat(mode, kordinat, siluet_mask, w, h):
    mask_aurat = np.zeros((h, w), dtype=np.uint8)
    kernel_halus = np.ones((7, 7), np.uint8)

    if mode == "LAKI-LAKI":
        y_atas = 0
        y_bawah = h
        x_kiri = 0
        x_kanan = w

        if 11 in kordinat and 12 in kordinat:
            x_bahu_kiri = min(kordinat[11][0], kordinat[12][0])
            x_bahu_kanan = max(kordinat[11][0], kordinat[12][0])
            lebar_bahu = max(40, x_bahu_kanan - x_bahu_kiri)
            cx_bahu = (kordinat[11][0] + kordinat[12][0]) // 2
            y_bahu = (kordinat[11][1] + kordinat[12][1]) // 2

            if 23 in kordinat and 24 in kordinat:
                y_pinggul = (kordinat[23][1] + kordinat[24][1]) // 2
                tinggi_torso = max(30, y_pinggul - y_bahu)
                y_pusar = int(y_bahu + 0.45 * tinggi_torso)
                cx_pinggul = (kordinat[23][0] + kordinat[24][0]) // 2
                lebar_pinggul = max(30, abs(kordinat[23][0] - kordinat[24][0]))
                half_w = int(lebar_pinggul * 0.70)
                x_kiri = max(0, cx_pinggul - half_w)
                x_kanan = min(w, cx_pinggul + half_w)
            else:
                y_pusar = int(y_bahu + 0.55 * lebar_bahu)
                half_w = int(lebar_bahu * 0.35)
                x_kiri = max(0, cx_bahu - half_w)
                x_kanan = min(w, cx_bahu + half_w)

            y_atas = max(0, y_pusar - 15)

        elif 23 in kordinat and 24 in kordinat:
            cx_pinggul = (kordinat[23][0] + kordinat[24][0]) // 2
            y_pinggul = (kordinat[23][1] + kordinat[24][1]) // 2
            lebar_pinggul = max(30, abs(kordinat[23][0] - kordinat[24][0]))
            y_atas = max(0, int(y_pinggul - 60))
            half_w = int(lebar_pinggul * 0.70)
            x_kiri = max(0, cx_pinggul - half_w)
            x_kanan = min(w, cx_pinggul + half_w)
        else:
            y_idxs, x_idxs = np.where(siluet_mask > 0)
            if len(y_idxs) > 0:
                min_y, max_y = int(np.min(y_idxs)), int(np.max(y_idxs))
                min_x, max_x = int(np.min(x_idxs)), int(np.max(x_idxs))
                y_atas = min_y
                y_bawah = max_y
                x_kiri = min_x
                x_kanan = max_x

        if 25 in kordinat or 26 in kordinat:
            y_lutut_list = [kordinat[k][1] for k in (25, 26) if k in kordinat]
            y_bawah = min(h, max(y_lutut_list) + 30)

        cv2.rectangle(mask_aurat, (int(x_kiri), int(y_atas)), (int(x_kanan), int(y_bawah)), 255, -1)
        mask_aurat = cv2.bitwise_and(mask_aurat, siluet_mask)

        for arm_indices in [(11, 13, 15), (12, 14, 16)]:
            for idx in arm_indices:
                if idx in kordinat:
                    cv2.circle(mask_aurat, kordinat[idx], 40, 0, -1)
            if arm_indices[1] in kordinat and arm_indices[2] in kordinat:
                cv2.line(mask_aurat, kordinat[arm_indices[1]], kordinat[arm_indices[2]], 0, 50)

        for hand_idx in range(15, 23):
            if hand_idx in kordinat:
                cv2.circle(mask_aurat, kordinat[hand_idx], 45, 0, -1)

        mask_aurat = cv2.morphologyEx(mask_aurat, cv2.MORPH_CLOSE, kernel_halus)
    else:
        mask_aurat = siluet_mask.copy()
        mask_aurat = cv2.dilate(mask_aurat, kernel_halus, iterations=1)

        if 0 in kordinat:
            cx, cy = kordinat[0]
            jarak_wajah = 70
            if 7 in kordinat and 8 in kordinat:
                jarak_wajah = abs(kordinat[7][0] - kordinat[8][0])
            elif 2 in kordinat and 5 in kordinat:
                jarak_wajah = int(abs(kordinat[2][0] - kordinat[5][0]) * 2.2)

            radius_x = max(50, int(jarak_wajah * 0.58))
            radius_y = max(75, int(jarak_wajah * 0.95))
            cv2.ellipse(mask_aurat, (cx, cy), (radius_x, radius_y), 0, 0, 360, 0, -1)

        for hand_idx in range(15, 23):
            if hand_idx in kordinat:
                px, py = kordinat[hand_idx]
                cv2.circle(mask_aurat, (px, py), 40, 0, -1)

        mask_aurat = cv2.morphologyEx(mask_aurat, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    return mask_aurat

def detect_attire_from_frame(image_base64: str, mode: str = "PEREMPUAN", threshold: float | None = None):
    frame = _bgr_from_base64(image_base64)
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)

    result = pose.process(rgb)
    pose_detected = False
    pelanggaran = False
    persen_aurat = 0.0
    annotated_image = None

    # Header & Footer Overlays
    _overlay_transparan(frame, 0, 0, w, 50, (10, 8, 5), alpha=0.75)
    _gambar_teks_shadow(frame, "SMART MOSQUE GATE", (20, 35), cv2.FONT_HERSHEY_DUPLEX, 0.9, GOLD_TERANG, 2)
    cv2.putText(frame, "Aurat Detection System v2.0", (300, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, ABU_TERANG, 1, cv2.LINE_AA)

    if result.pose_landmarks and result.segmentation_mask is not None: # type: ignore
        lm = result.pose_landmarks.landmark # type: ignore

        fitur_wajah = [lm[i].visibility > 0.60 for i in [0, 1, 2, 4, 5, 7, 8]]
        wajah_valid = sum(fitur_wajah) >= 2
        bahu_valid = (lm[11].visibility > 0.55) or (lm[12].visibility > 0.55)

        siluet_raw = (result.segmentation_mask > 0.55).astype(np.uint8) * 255 # type: ignore
        pixel_siluet = cv2.countNonZero(siluet_raw)
        siluet_valid = pixel_siluet > 3500

        if wajah_valid and bahu_valid and siluet_valid:
            pose_detected = True
            kordinat = {
                i: (int(lm[i].x * w), int(lm[i].y * h))
                for i in range(33)
                if lm[i].visibility > 0.45
            }
            siluet_mask = cv2.morphologyEx(siluet_raw, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))

            mask_kulit = _mask_kulit(frame, hsv, ycrcb)
            mask_aurat = _mask_aurat(mode, kordinat, siluet_mask, w, h)

            kulit_di_aurat = cv2.bitwise_and(mask_kulit, mask_aurat)
            pixel_kulit = cv2.countNonZero(kulit_di_aurat)
            total_pixel_aurat = cv2.countNonZero(mask_aurat)
            persen_aurat = (pixel_kulit / total_pixel_aurat * 100) if total_pixel_aurat > 0 else 0.0

            th = threshold if threshold is not None else (2.0 if mode == "PEREMPUAN" else 3.5)
            history = [persen_aurat > th]
            for _ in range(3):
                history.append(history[-1])
            pelanggaran = sum(history) > len(history) // 2

            # ── DRAW SKELETON & HIGHLIGHT OVERLAY (EXACT LIKE AURAT.PY) ──
            mp_drawing.draw_landmarks(
                frame,
                result.pose_landmarks, # type: ignore
                mp_pose.POSE_CONNECTIONS, # type: ignore
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(200, 200, 0), thickness=2, circle_radius=2),
                connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 200, 180), thickness=2)
            )

            if pelanggaran and pixel_kulit > 200:
                overlay_merah = frame.copy()
                overlay_merah[kulit_di_aurat > 0] = (40, 40, 200)
                cv2.addWeighted(overlay_merah, 0.40, frame, 0.60, 0, frame)
                cnts, _ = cv2.findContours(kulit_di_aurat, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(frame, cnts, -1, (0, 0, 255), 2)
            else:
                overlay_hijau = frame.copy()
                area_badan = siluet_mask > 0
                overlay_hijau[area_badan] = (frame[area_badan] * 0.85 + np.array([0, 60, 0]) * 0.15).astype(np.uint8)
                cv2.addWeighted(overlay_hijau, 0.30, frame, 0.70, 0, frame)

    # Left Status Box Panel HUD (Exact from AURAT.PY)
    px, py = 15, 60
    pw, ph = 260, 180
    _overlay_transparan(frame, px, py, px + pw, py + ph, (12, 10, 8), alpha=0.70)
    cv2.rectangle(frame, (px, py), (px + pw, py + ph), GOLD, 1)

    _gambar_teks_shadow(frame, "STATUS DETEKSI", (px + 10, py + 25), cv2.FONT_HERSHEY_DUPLEX, 0.6, GOLD, 1)
    cv2.line(frame, (px + 10, py + 32), (px + pw - 10, py + 32), GOLD, 1)

    warna_mode = EMERALD if mode == "PEREMPUAN" else GOLD
    _gambar_teks_shadow(frame, f"MODE: {mode}", (px + 10, py + 55), cv2.FONT_HERSHEY_SIMPLEX, 0.55, warna_mode, 1)

    if pose_detected:
        _gambar_teks_shadow(frame, "POSE TERDETEKSI [OK]", (px + 10, py + 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, EMERALD, 1)
    else:
        _gambar_teks_shadow(frame, "MENUNGGU POSE...", (px + 10, py + 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, ABU_TERANG, 1)

    cv2.putText(frame, "Kulit Terekspos:", (px + 10, py + 105), cv2.FONT_HERSHEY_SIMPLEX, 0.5, PUTIH, 1, cv2.LINE_AA)
    warna_meter = MERAH if persen_aurat > 3.5 else (0, 200, 200) if persen_aurat > 1.5 else EMERALD
    _gambar_meter_persen(frame, px + 10, py + 112, pw - 20, 20, persen_aurat, warna_meter)

    status_txt = "PENGINGAT SOPAN" if pelanggaran else ("PAKAIAN SESUAI" if pose_detected else "MENUNGGU...")
    warna_st = MERAH if pelanggaran else (EMERALD if pose_detected else ABU_TERANG)
    _gambar_teks_shadow(frame, status_txt, (px + 10, py + 160), cv2.FONT_HERSHEY_DUPLEX, 0.6, warna_st, 1)

    annotated_image = _encode_to_base64(frame)

    if threshold is None:
        threshold = 2.0 if mode == "PEREMPUAN" else 3.5

    if not pose_detected:
        status = "MENUNGGU"
        message = "Silakan berdiri di depan kiosk untuk mengecek kesesuaian pakaian."
    elif pelanggaran:
        status = "PENGINGAT_SOPAN"
        message = "Yuk, rapikan dan sesuaikan pakaian sebelum masuk area ibadah."
    else:
        status = "RAPI"
        message = "Alhamdulillah, pakaian sudah rapi dan menutup aurat dengan baik."

    return {
        "pose_detected": pose_detected,
        "pelanggaran": pelanggaran,
        "persen_aurat": round(float(persen_aurat), 2),
        "status": status,
        "message": message,
        "threshold": threshold,
        "annotated_image": annotated_image,
    }
