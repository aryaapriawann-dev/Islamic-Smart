import cv2
import mediapipe as mp
import numpy as np
import time
import math

# ================================================================
#   SMART MOSQUE GATE — AURAT DETECTION SYSTEM  v2.0
#   Kompatibel Python 3.10 | MediaPipe 0.10.x | OpenCV
# ================================================================

try:
    import pygame
    pygame.mixer.init()
    try:
        suara_peringatan = pygame.mixer.Sound("suara_ai.mp3")
        suara_aman       = pygame.mixer.Sound("suara_aman.mp3")
    except Exception:
        suara_peringatan = suara_aman = None
    PYGAME_OK = True
except ImportError:
    PYGAME_OK = False
    suara_peringatan = suara_aman = None

# ── MediaPipe ────────────────────────────────────────────────────
mp_pose    = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(
    min_detection_confidence=0.75,
    min_tracking_confidence=0.75,
    enable_segmentation=True,
    model_complexity=1
)

# ── Palet Warna ──────────────────────────────────────────────────
# Tema: Masjid Modern — Gold + Deep Navy + Emerald
GOLD       = (  0, 200, 215)   # Kuning keemasan (BGR)
GOLD_TERANG= (  0, 230, 255)
NAVY       = ( 30,  15,   5)   # Biru tua (BGR)
EMERALD    = ( 80, 200,  80)
MERAH      = ( 40,  40, 220)
PUTIH      = (255, 255, 255)
ABU_TUA    = ( 60,  60,  60)
ABU_TERANG = (180, 180, 180)
TRANSPARAN_BIRU = (120, 80, 20)  # Sentuhan aksen biru

# ── State global ─────────────────────────────────────────────────
mode_gate            = "PEREMPUAN"
last_audio_state     = "IDLE"   # "IDLE", "PERINGATAN", "AMAN"
mode_switch_cooldown = 0.0      # Cooldown setelah ganti mode agar audio stabil
history_status       = []       # Smoothing frame terakhir
SMOOTH_N             = 4        # Respon ultra-cepat (~100ms)

# ── Timestamp animasi ────────────────────────────────────────────
t_start = time.time()


# ════════════════════════════════════════════════════════════════
# FUNGSI UTILITAS UI
# ════════════════════════════════════════════════════════════════

def overlay_transparan(frame, x1, y1, x2, y2, warna, alpha=0.55, radius=0):
    """Gambar kotak transparan (opsional rounded)."""
    overlay = frame.copy()
    if radius > 0:
        # Simulasi rounded rect dengan 4 lingkaran + 1 rect
        cv2.rectangle(overlay, (x1 + radius, y1), (x2 - radius, y2), warna, -1)
        cv2.rectangle(overlay, (x1, y1 + radius), (x2, y2 - radius), warna, -1)
        for cx, cy in [(x1+radius, y1+radius), (x2-radius, y1+radius),
                       (x1+radius, y2-radius), (x2-radius, y2-radius)]:
            cv2.circle(overlay, (cx, cy), radius, warna, -1)
    else:
        cv2.rectangle(overlay, (x1, y1), (x2, y2), warna, -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)


def gambar_garis_hias(frame, w, h, t):
    """Garis ornamen bawah + atas (animasi gelombang)."""
    # Garis atas
    for x in range(0, w, 2):
        y = int(3 + 3 * math.sin(x * 0.04 + t * 2))
        cv2.circle(frame, (x, y), 1, GOLD, -1)
    # Garis bawah
    for x in range(0, w, 2):
        y = int(h - 4 + 3 * math.sin(x * 0.04 - t * 2))
        cv2.circle(frame, (x, y), 1, GOLD, -1)


def gambar_teks_shadow(frame, teks, pos, font, skala, warna, tebal=2, shadow_offset=2):
    """Teks dengan efek shadow."""
    x, y = pos
    cv2.putText(frame, teks, (x + shadow_offset, y + shadow_offset),
                font, skala, (0, 0, 0), tebal + 1, cv2.LINE_AA)
    cv2.putText(frame, teks, pos, font, skala, warna, tebal, cv2.LINE_AA)


def gambar_meter_persen(frame, x, y, lebar, tinggi, persen, warna_bar):
    """Meter horizontal dengan animasi gradien."""
    # Background
    cv2.rectangle(frame, (x, y), (x + lebar, y + tinggi), (30, 30, 30), -1)
    cv2.rectangle(frame, (x, y), (x + lebar, y + tinggi), ABU_TUA, 1)
    # Bar isi
    isi = int(lebar * min(persen / 100.0, 1.0))
    if isi > 0:
        cv2.rectangle(frame, (x, y + 2), (x + isi, y + tinggi - 2), warna_bar, -1)
    # Label %
    label = f"{persen:.1f}%"
    (tw, _), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    cv2.putText(frame, label, (x + lebar // 2 - tw // 2, y + tinggi - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, PUTIH, 1, cv2.LINE_AA)


def gambar_ikon_mode(frame, mode, x, y, ukuran=40):
    """Ikon siluet orang (sederhana)."""
    warna = EMERALD if mode == "PEREMPUAN" else GOLD
    # Kepala
    cv2.circle(frame, (x, y - ukuran // 2), ukuran // 4, warna, -1)
    # Badan
    if mode == "PEREMPUAN":
        # Segitiga / jubah
        pts = np.array([[x, y - ukuran // 4],
                        [x - ukuran // 2, y + ukuran // 2],
                        [x + ukuran // 2, y + ukuran // 2]], np.int32)
        cv2.fillPoly(frame, [pts], warna)
    else:
        cv2.rectangle(frame, (x - ukuran // 4, y - ukuran // 4),
                      (x + ukuran // 4, y + ukuran // 2), warna, -1)


# ════════════════════════════════════════════════════════════════
# FUNGSI DETEKSI AURAT — AKURASI DITINGKATKAN
# ════════════════════════════════════════════════════════════════

def hitung_sudut(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    r = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = abs(np.degrees(r))
    return angle if angle <= 180 else 360 - angle


def bangun_mask_aurat(mode, lm, kordinat, siluet_mask, w, h):
    """
    Bangun mask area aurat yang lebih akurat menggunakan:
    - Koordinat landmark anatomis
    - Sudut sendi untuk estimasi batas tubuh
    - Dilation/erosion untuk kehalusan tepi
    """
    mask_aurat = np.zeros((h, w), dtype=np.uint8)
    kernel_halus = np.ones((7, 7), np.uint8)

    if mode == "LAKI-LAKI":
        # Aurat pria: pusat/pusar → lutut (khusus area TORSO, PERUT, & PAHA)
        y_atas  = 0
        y_bawah = h
        x_kiri  = 0
        x_kanan = w

        if 11 in kordinat and 12 in kordinat:
            x_bahu_kiri  = min(kordinat[11][0], kordinat[12][0])
            x_bahu_kanan = max(kordinat[11][0], kordinat[12][0])
            lebar_bahu   = max(40, x_bahu_kanan - x_bahu_kiri)
            cx_bahu      = (kordinat[11][0] + kordinat[12][0]) // 2
            y_bahu       = (kordinat[11][1] + kordinat[12][1]) // 2

            if 23 in kordinat and 24 in kordinat:
                y_pinggul = (kordinat[23][1] + kordinat[24][1]) // 2
                tinggi_torso = max(30, y_pinggul - y_bahu)
                y_pusar = int(y_bahu + 0.45 * tinggi_torso)
                cx_pinggul = (kordinat[23][0] + kordinat[24][0]) // 2
                lebar_pinggul = max(30, abs(kordinat[23][0] - kordinat[24][0]))
                half_w = int(lebar_pinggul * 0.70)
                x_kiri  = max(0, cx_pinggul - half_w)
                x_kanan = min(w, cx_pinggul + half_w)
            else:
                y_pusar = int(y_bahu + 0.55 * lebar_bahu)
                half_w = int(lebar_bahu * 0.35)  # Kolom torso rapat, tanpa lengan
                x_kiri  = max(0, cx_bahu - half_w)
                x_kanan = min(w, cx_bahu + half_w)

            y_atas = max(0, y_pusar - 15)

        elif 23 in kordinat and 24 in kordinat:
            cx_pinggul = (kordinat[23][0] + kordinat[24][0]) // 2
            y_pinggul  = (kordinat[23][1] + kordinat[24][1]) // 2
            lebar_pinggul = max(30, abs(kordinat[23][0] - kordinat[24][0]))
            y_atas  = max(0, int(y_pinggul - 60))
            half_w  = int(lebar_pinggul * 0.70)
            x_kiri  = max(0, cx_pinggul - half_w)
            x_kanan = min(w, cx_pinggul + half_w)
        else:
            y_indices, x_indices = np.where(siluet_mask > 0)
            if len(y_indices) > 0:
                min_y, max_y = np.min(y_indices), np.max(y_indices)
                min_x, max_x = np.min(x_indices), np.max(x_indices)
                cx_body = (min_x + max_x) // 2
                half_w  = int((max_x - min_x) * 0.28)
                y_atas  = int(min_y + 0.45 * (max_y - min_y))
                y_bawah = max_y
                x_kiri  = max(0, cx_body - half_w)
                x_kanan = min(w, cx_body + half_w)

        # Batas bawah lutut
        if 25 in kordinat or 26 in kordinat:
            y_lutut_list = [kordinat[k][1] for k in (25, 26) if k in kordinat]
            y_bawah = min(h, max(y_lutut_list) + 30)

        # Buat rectangle torso
        cv2.rectangle(mask_aurat, (int(x_kiri), int(y_atas)), (int(x_kanan), int(y_bawah)), 255, -1)
        mask_aurat = cv2.bitwise_and(mask_aurat, siluet_mask)

        # ── KECUALIKAN LENGAN & TANGAN SECARA EKSPLISIT (Lengan bukan aurat pria) ──
        for arm_indices in [(11, 13, 15), (12, 14, 16)]:
            for idx in arm_indices:
                if idx in kordinat:
                    cv2.circle(mask_aurat, kordinat[idx], 40, 0, -1)
            if arm_indices[1] in kordinat and arm_indices[2] in kordinat:
                cv2.line(mask_aurat, kordinat[arm_indices[1]], kordinat[arm_indices[2]], 0, 50)

        # Potong pergelangan tangan hingga jari-jari
        for hand_idx in range(15, 23):
            if hand_idx in kordinat:
                cv2.circle(mask_aurat, kordinat[hand_idx], 45, 0, -1)

        mask_aurat = cv2.morphologyEx(mask_aurat, cv2.MORPH_CLOSE, kernel_halus)

    else:  # PEREMPUAN
        # Aurat wanita: seluruh tubuh KECUALI wajah + telapak tangan
        mask_aurat = siluet_mask.copy()
        mask_aurat = cv2.dilate(mask_aurat, kernel_halus, iterations=1)

        # ── Kecualikan WAJAH PENUH (dahi, pipi, mata, hidung, mulut, dagu) ──
        if 0 in kordinat:
            cx, cy = kordinat[0]
            jarak_wajah = 70
            if 7 in kordinat and 8 in kordinat:
                jarak_wajah = abs(kordinat[7][0] - kordinat[8][0])
            elif 2 in kordinat and 5 in kordinat:
                jarak_wajah = int(abs(kordinat[2][0] - kordinat[5][0]) * 2.2)

            # Oval wajah manusia penuh (menutup dahi atas hingga dagu bawah)
            radius_x = max(50, int(jarak_wajah * 0.58))
            radius_y = max(75, int(jarak_wajah * 0.95))
            cv2.ellipse(mask_aurat, (cx, cy),
                        (radius_x, radius_y),
                        0, 0, 360, 0, -1)

        # ── Kecualikan TELAPAK TANGAN & BARANG/HP DI TANGAN ──
        for hand_idx in range(15, 23):
            if hand_idx in kordinat:
                px, py = kordinat[hand_idx]
                cv2.circle(mask_aurat, (px, py), 40, 0, -1)

        mask_aurat = cv2.morphologyEx(mask_aurat, cv2.MORPH_OPEN,
                                       np.ones((5, 5), np.uint8))

    return mask_aurat


def deteksi_warna_kulit_multi(frame_bgr, frame_hsv, frame_ycrcb):
    """
    Deteksi KULIT MANUSIA ASLI presisi tinggi.
    Membedakan secara ketat antara kulit manusia asli vs kain merah, gorden, atau motif baju.
    """
    # 1. YCrCb Strict Human Skin Range
    # Cr: 135-168 (presisi kulit manusia, menolak kain merah/gorden yang Cr > 170)
    # Cb: 85-125
    mask_ycrcb = cv2.inRange(frame_ycrcb, np.array([60, 135, 85]), np.array([255, 168, 125]))

    # 2. HSV Strict Human Skin Range
    # H: 0-18 (kulit manusia), S: 25-170 (menolak kain merah mencolok S > 175)
    mask_hsv = cv2.inRange(frame_hsv, np.array([0, 25, 70]), np.array([18, 170, 255]))

    # 3. BGR Ratio Human Skin Rule
    B = frame_bgr[:, :, 0].astype(np.float32) + 1.0
    G = frame_bgr[:, :, 1].astype(np.float32) + 1.0
    R = frame_bgr[:, :, 2].astype(np.float32) + 1.0

    ratio_rg = R / G
    # Skin R/G ratio strictly between 1.08 and 1.75 (menolak gorden/kain merah di mana R/G > 1.8)
    mask_bgr = ((R > 80) & (G > 40) & (B > 25) &
                (R > G) & (G > B) &
                (ratio_rg >= 1.08) & (ratio_rg <= 1.75)).astype(np.uint8) * 255

    # Gabung ketiga mask (AND): Hanya piksel yang MEMENUHI KETIGA ATURAN KULIT MANUSIA ASLI
    mask_kulit = cv2.bitwise_and(cv2.bitwise_and(mask_hsv, mask_ycrcb), mask_bgr)

    # Clean noise dengan morphological opening & closing
    kernel = np.ones((5, 5), np.uint8)
    mask_kulit = cv2.morphologyEx(mask_kulit, cv2.MORPH_OPEN,  kernel)
    mask_kulit = cv2.morphologyEx(mask_kulit, cv2.MORPH_CLOSE, kernel)

    return mask_kulit


# ════════════════════════════════════════════════════════════════
# MAIN LOOP
# ════════════════════════════════════════════════════════════════
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)
cv2.namedWindow('Smart Mosque Gate — Aurat Detection v2', cv2.WINDOW_NORMAL)

# FPS
prev_time = time.time()
fps_val   = 0.0

print("╔══════════════════════════════════════════╗")
print("║   SMART MOSQUE GATE — v2.0               ║")
print("║   [P] Mode Perempuan  [L] Mode Laki-Laki ║")
print("║   [Q] Keluar                             ║")
print("╚══════════════════════════════════════════╝")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    t = time.time() - t_start

    # ── Konversi warna ────────────────────────────────────────
    rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    hsv      = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    ycrcb    = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)

    # ── FPS ───────────────────────────────────────────────────
    now     = time.time()
    fps_val = 0.9 * fps_val + 0.1 * (1.0 / max(now - prev_time, 1e-5))
    prev_time = now

    # ── Proses MediaPipe ──────────────────────────────────────
    hasil = pose.process(rgb)

    # ── Default status ────────────────────────────────────────
    persen_aurat = 0.0
    pelanggaran  = False
    pose_detected = False

    # ── Latar belakang: panel utama gelap ─────────────────────
    # Overlay ringan agar teks terbaca
    overlay_transparan(frame, 0, 0, w, 65,   (10, 8, 5), alpha=0.75)   # header
    overlay_transparan(frame, 0, h-55, w, h, (10, 8, 5), alpha=0.75)   # footer

    if hasil.pose_landmarks and hasil.segmentation_mask is not None:
        lm = hasil.pose_landmarks.landmark

        # ── VERIFIKASI MANUSIA ASLI (Mencegah skeleton palsu pada ember / benda mati) ──
        # 1. Hidung/mata/telinga harus terdeteksi minimal 2 fitur dengan visibilitas > 0.60
        fitur_wajah = [lm[i].visibility > 0.60 for i in [0, 1, 2, 4, 5, 7, 8]]
        wajah_valid = sum(fitur_wajah) >= 2

        # 2. Minimal satu bahu (11 atau 12) harus terdeteksi dengan visibilitas > 0.55
        bahu_valid  = (lm[11].visibility > 0.55) or (lm[12].visibility > 0.55)

        # 3. Luas siluet tubuh manusia harus mencukupi (> 3500 piksel)
        siluet_raw   = (hasil.segmentation_mask > 0.55).astype(np.uint8) * 255
        pixel_siluet = cv2.countNonZero(siluet_raw)
        siluet_valid = pixel_siluet > 3500

        # Hanya anggap Pose Valid jika TERBUKTI MANUSIA ASLI di depan kamera!
        if wajah_valid and bahu_valid and siluet_valid:
            pose_detected = True

            # Koordinat landmark (hanya yang visibility cukup)
            kordinat = {
                i: (int(lm[i].x * w), int(lm[i].y * h))
                for i in range(33) if lm[i].visibility > 0.45
            }

            # Siluet badan dari segmentation mask
            siluet_mask = cv2.morphologyEx(
                siluet_raw, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8)
            )

        # ── Deteksi Kulit Manusia Presisi ───────────────────────
        mask_kulit = deteksi_warna_kulit_multi(frame, hsv, ycrcb)

        # ── Bangun Mask Aurat ──────────────────────────────────
        mask_aurat = bangun_mask_aurat(
            mode_gate, lm, kordinat, siluet_mask, w, h
        )

        # ── Hitung Pelanggaran Kulit Terekspos ───────────────────
        kulit_di_aurat    = cv2.bitwise_and(mask_kulit, mask_aurat)
        pixel_kulit       = cv2.countNonZero(kulit_di_aurat)
        total_pixel_aurat = cv2.countNonZero(mask_aurat)
        persen_aurat = (pixel_kulit / total_pixel_aurat * 100) \
                       if total_pixel_aurat > 0 else 0.0

        # Threshold: 2.0% untuk PEREMPUAN, 3.5% untuk LAKI-LAKI
        THRESHOLD = 2.0 if mode_gate == "PEREMPUAN" else 3.5

        # Smoothing status pelanggaran
        history_status.append(persen_aurat > THRESHOLD)
        if len(history_status) > SMOOTH_N:
            history_status.pop(0)
        pelanggaran = sum(history_status) > SMOOTH_N // 2

        # ── Gambar kerangka tubuh ──────────────────────────────
        mp_drawing.draw_landmarks(
            frame,
            hasil.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(
                color=(200, 200, 0), thickness=2, circle_radius=2),
            connection_drawing_spec=mp_drawing.DrawingSpec(
                color=(0, 200, 180), thickness=2)
        )

        # ── Highlight area bocor ───────────────────────────────
        if pelanggaran and pixel_kulit > 200:
            # Overlay merah semi-transparan pada area yang bocor
            overlay_merah = frame.copy()
            overlay_merah[kulit_di_aurat > 0] = (40, 40, 200)
            cv2.addWeighted(overlay_merah, 0.40, frame, 0.60, 0, frame)
            # Kontur area bocor
            cnts, _ = cv2.findContours(
                kulit_di_aurat, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            cv2.drawContours(frame, cnts, -1, (0, 0, 255), 2)
        else:
            # Overlay hijau sangat tipis saat aman
            overlay_hijau = frame.copy()
            area_badan = siluet_mask > 0
            overlay_hijau[area_badan] = (
                frame[area_badan] * 0.85 + np.array([0, 60, 0]) * 0.15
            ).astype(np.uint8)
            cv2.addWeighted(overlay_hijau, 0.30, frame, 0.70, 0, frame)

        # ── Suara dengan Repetisi Kontinu saat Pelanggaran ─────────
        if PYGAME_OK and time.time() > mode_switch_cooldown:
            if pelanggaran:
                if last_audio_state != "PERINGATAN":
                    pygame.mixer.stop()
                    if suara_peringatan:
                        suara_peringatan.play(loops=-1)  # Berulang terus sampai aurat ditutup
                    last_audio_state = "PERINGATAN"
                else:
                    # Pastikan audio terus berulang jika sempat terhenti
                    if suara_peringatan and not pygame.mixer.get_busy():
                        suara_peringatan.play(loops=-1)
            else:
                if last_audio_state != "AMAN":
                    pygame.mixer.stop()  # Hentikan peringatan seketika begitu aurat ditutup!
                    if suara_aman:
                        suara_aman.play(loops=0)  # Ucapkan terima kasih 1x
                    last_audio_state = "AMAN"
    else:
        # Jika tidak ada pose terdeteksi (tidak ada orang)
        if PYGAME_OK and last_audio_state != "IDLE":
            pygame.mixer.stop()
            last_audio_state = "IDLE"
        history_status.clear()

    # ════════════════════════════════════════════════════════
    # UI — HEADER
    # ════════════════════════════════════════════════════════
    # Judul
    gambar_teks_shadow(frame, "SMART MOSQUE GATE", (20, 42),
                       cv2.FONT_HERSHEY_DUPLEX, 1.1, GOLD_TERANG, 2)
    # Versi
    cv2.putText(frame, "Aurat Detection System v2.0",
                (320, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.55, ABU_TERANG, 1, cv2.LINE_AA)

    # FPS (kanan atas)
    warna_fps = EMERALD if fps_val >= 24 else (0, 200, 200) if fps_val >= 15 else MERAH
    gambar_teks_shadow(frame, f"FPS {fps_val:4.1f}",
                       (w - 140, 42), cv2.FONT_HERSHEY_DUPLEX, 0.8, warna_fps)

    # ════════════════════════════════════════════════════════
    # UI — PANEL KIRI: Status Deteksi
    # ════════════════════════════════════════════════════════
    px, py = 15, 80
    pw, ph = 360, 330
    overlay_transparan(frame, px, py, px + pw, py + ph, (12, 10, 8), alpha=0.70, radius=12)
    # Border
    cv2.rectangle(frame, (px, py), (px + pw, py + ph), GOLD, 1)

    # Judul panel
    gambar_teks_shadow(frame, "STATUS DETEKSI", (px + 15, py + 32),
                       cv2.FONT_HERSHEY_DUPLEX, 0.75, GOLD, 2)
    cv2.line(frame, (px + 10, py + 42), (px + pw - 10, py + 42), GOLD, 1)

    # Mode gate + ikon
    gambar_ikon_mode(frame, mode_gate, px + 40, py + 100, ukuran=35)
    warna_mode = EMERALD if mode_gate == "PEREMPUAN" else GOLD
    gambar_teks_shadow(frame, f"MODE: {mode_gate}", (px + 80, py + 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.75, warna_mode, 2)

    # Status pose
    if pose_detected:
        gambar_teks_shadow(frame, "POSE TERDETEKSI  [OK]", (px + 15, py + 130),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, EMERALD, 1)
    else:
        gambar_teks_shadow(frame, "POSE TIDAK TERDETEKSI", (px + 15, py + 130),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, ABU_TERANG, 1)

    # Meter % aurat terekspos
    cv2.putText(frame, "Kulit Terekspos:", (px + 15, py + 165),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, PUTIH, 1, cv2.LINE_AA)
    warna_meter = MERAH if persen_aurat > 3.5 else (0, 200, 200) if persen_aurat > 1.5 else EMERALD
    gambar_meter_persen(frame, px + 15, py + 172, pw - 30, 24,
                        persen_aurat, warna_meter)

    # Status utama — BESAR
    if not pose_detected:
        status_txt  = "MENUNGGU..."
        warna_status = ABU_TERANG
        bg_status    = (30, 30, 30)
    elif pelanggaran:
        status_txt  = "AKSES DITOLAK"
        warna_status = MERAH
        bg_status    = (20, 20, 80)
    else:
        status_txt  = "AKSES DITERIMA"
        warna_status = EMERALD
        bg_status    = (10, 50, 10)

    overlay_transparan(frame, px + 10, py + 210, px + pw - 10, py + 270,
                       bg_status, alpha=0.85, radius=8)
    (tw, th), _ = cv2.getTextSize(status_txt, cv2.FONT_HERSHEY_DUPLEX, 0.9, 2)
    tx = px + 10 + (pw - 20 - tw) // 2
    gambar_teks_shadow(frame, status_txt, (tx, py + 252),
                       cv2.FONT_HERSHEY_DUPLEX, 0.9, warna_status, 2)

    # Sub-status (aman/aurat)
    if pose_detected:
        sub = "Hijab / Pakaian: SESUAI" if not pelanggaran else f"Aurat Terekspos: {persen_aurat:.1f}%"
        warna_sub = EMERALD if not pelanggaran else MERAH
        cv2.putText(frame, sub, (px + 20, py + 305),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, warna_sub, 1, cv2.LINE_AA)

    # ════════════════════════════════════════════════════════
    # UI — PANEL KANAN: Panduan & Info
    # ════════════════════════════════════════════════════════
    rx = w - 280
    ry = 80
    rw = 265
    rh = 220
    overlay_transparan(frame, rx, ry, rx + rw, ry + rh, (12, 10, 8), alpha=0.70, radius=12)
    cv2.rectangle(frame, (rx, ry), (rx + rw, ry + rh), GOLD, 1)

    gambar_teks_shadow(frame, "PANDUAN", (rx + 15, ry + 32),
                       cv2.FONT_HERSHEY_DUPLEX, 0.75, GOLD, 2)
    cv2.line(frame, (rx + 10, ry + 42), (rx + rw - 10, ry + 42), GOLD, 1)

    panduan = [
        ("[P]", "Mode Perempuan"),
        ("[L]", "Mode Laki-Laki"),
        ("[Q]", "Keluar"),
    ]
    for i, (tombol, label) in enumerate(panduan):
        y_p = ry + 75 + i * 40
        overlay_transparan(frame, rx + 10, y_p - 18, rx + 70, y_p + 8,
                           (40, 30, 5), alpha=0.85, radius=5)
        gambar_teks_shadow(frame, tombol, (rx + 18, y_p),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.65, GOLD_TERANG, 2)
        cv2.putText(frame, label, (rx + 80, y_p),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, PUTIH, 1, cv2.LINE_AA)

    # Info threshold
    cv2.putText(frame, f"Threshold: 3.5% | Smooth: {SMOOTH_N}f",
                (rx + 10, ry + rh - 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, ABU_TERANG, 1, cv2.LINE_AA)

    # ════════════════════════════════════════════════════════
    # UI — BORDER PERINGATAN ANIMASI
    # ════════════════════════════════════════════════════════
    if pose_detected and pelanggaran:
        # Kedip merah (ganti intensitas sesuai sinus waktu)
        alpha_border = int(180 + 75 * math.sin(t * 6))
        tebal_border = 10 if int(t * 4) % 2 == 0 else 6
        cv2.rectangle(frame, (0, 0), (w, h), MERAH, tebal_border)
        gambar_teks_shadow(frame, "!! AURAT TERLIHAT !!",
                           (w // 2 - 220, h // 2),
                           cv2.FONT_HERSHEY_DUPLEX, 1.5, MERAH, 3)
    elif pose_detected and not pelanggaran:
        # Border hijau tipis
        cv2.rectangle(frame, (0, 0), (w, h), EMERALD, 3)

    # ════════════════════════════════════════════════════════
    # UI — GARIS ORNAMEN + FOOTER
    # ════════════════════════════════════════════════════════
    gambar_garis_hias(frame, w, h, t)

    cv2.putText(frame,
                "Tekan [P] Perempuan  |  [L] Laki-Laki  |  [Q] Keluar",
                (w // 2 - 320, h - 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, ABU_TERANG, 1, cv2.LINE_AA)

    cv2.imshow('Smart Mosque Gate — Aurat Detection v2', frame)

    # ── Keyboard ──────────────────────────────────────────────
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('l'):
        mode_gate = "LAKI-LAKI"
        history_status.clear()
        if PYGAME_OK:
            pygame.mixer.stop()
        last_audio_state = "IDLE"
        mode_switch_cooldown = time.time() + 0.6
        print("[MODE] Beralih ke LAKI-LAKI")
    elif key == ord('p'):
        mode_gate = "PEREMPUAN"
        history_status.clear()
        if PYGAME_OK:
            pygame.mixer.stop()
        last_audio_state = "IDLE"
        mode_switch_cooldown = time.time() + 0.6
        print("[MODE] Beralih ke PEREMPUAN")

cap.release()
cv2.destroyAllWindows()
print("Sesi selesai.")