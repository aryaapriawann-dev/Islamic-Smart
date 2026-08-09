import cv2
import mediapipe as mp
import numpy as np
import time
import csv
import os
from datetime import datetime

# =============================================
# DETEKTOR RAKAAT SHOLAT CERDAS - ENHANCED
# By: ARYA APRIAWAN | Python 3.10 + MediaPipe
# =============================================

try:
    import winsound
    BISA_SIRINE = True
except ImportError:
    BISA_SIRINE = False

mp_pose    = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_styles  = mp.solutions.drawing_styles

# ── Warna Palet ──────────────────────────────
CYAN    = (255, 255,   0)
HIJAU   = (  0, 255,   0)
MERAH   = (  0,   0, 255)
PUTIH   = (255, 255, 255)
HITAM   = (  0,   0,   0)
KUNING  = (  0, 220, 255)
ABU     = ( 50,  50,  50)
BIRU    = (255, 100,   0)
UNGU    = (200,   0, 200)

# ── Util: hitung sudut 3 titik ───────────────
def hitung_sudut(a, b, c):
    """Hitung sudut (derajat) di titik B antara A-B-C."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - \
              np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))
    return angle if angle <= 180 else 360 - angle

def get_coord(lm, idx, w, h):
    return [lm[idx].x * w, lm[idx].y * h]

def get_coord_raw(lm, idx):
    return [lm[idx].x, lm[idx].y]

# ── Util: gambar progress bar ─────────────────
def gambar_progress_bar(frame, x, y, lebar, tinggi, nilai, maksimal, warna_bar, label=""):
    persen = min(nilai / maksimal, 1.0)
    cv2.rectangle(frame, (x, y), (x + lebar, y + tinggi), ABU, -1)
    cv2.rectangle(frame, (x, y), (x + int(lebar * persen), y + tinggi), warna_bar, -1)
    cv2.rectangle(frame, (x, y), (x + lebar, y + tinggi), PUTIH, 1)
    teks = f"{label} {nilai}/{maksimal}"
    cv2.putText(frame, teks, (x + 5, y + tinggi - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, PUTIH, 1)

# ── Util: gambar panel gelap semi-transparan ──
def gambar_panel(frame, x1, y1, x2, y2, alpha=0.55):
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), (10, 10, 10), -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

# ── Logger sesi sholat ────────────────────────
class LoggerSesi:
    def __init__(self, nama_sholat):
        ts  = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.filename = f"log_sholat_{nama_sholat}_{ts}.csv"
        with open(self.filename, 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(["Waktu", "Rakaat", "Gerakan", "Step"])
        print(f"[LOG] Sesi disimpan ke: {self.filename}")

    def catat(self, rakaat, gerakan, step):
        with open(self.filename, 'a', newline='') as f:
            w = csv.writer(f)
            w.writerow([datetime.now().strftime("%H:%M:%S"), rakaat, gerakan, step])

# ── Deteksi pose berbasis sudut (AKURAT) ──────
def deteksi_posisi(lm, w, h):
    """
    Klasifikasi posisi: BERDIRI / RUKU / SUJUD / DUDUK
    Menggunakan sudut pinggul, lutut, dan rasio posisi kepala-pinggul.
    """
    # Koordinat piksel
    bahu_kiri  = get_coord(lm, 11, w, h)
    bahu_kanan = get_coord(lm, 12, w, h)
    pinggul_kiri  = get_coord(lm, 23, w, h)
    pinggul_kanan = get_coord(lm, 24, w, h)
    lutut_kiri    = get_coord(lm, 25, w, h)
    lutut_kanan   = get_coord(lm, 26, w, h)
    pergelangan_kaki_kiri  = get_coord(lm, 27, w, h)
    pergelangan_kaki_kanan = get_coord(lm, 28, w, h)

    kepala_y  = lm[0].y * h
    pinggul_y = (pinggul_kiri[1]+ pinggul_kanan[1]) / 2

    # Sudut pinggul (kemiringan tubuh) — kiri & kanan, rata-rata
    sudut_pinggul_kiri  = hitung_sudut(bahu_kiri,  pinggul_kiri,  lutut_kiri)
    sudut_pinggul_kanan = hitung_sudut(bahu_kanan, pinggul_kanan, lutut_kanan)
    sudut_pinggul = (sudut_pinggul_kiri + sudut_pinggul_kanan) / 2

    # Sudut lutut
    sudut_lutut_kiri  = hitung_sudut(pinggul_kiri,  lutut_kiri,  pergelangan_kaki_kiri)
    sudut_lutut_kanan = hitung_sudut(pinggul_kanan, lutut_kanan, pergelangan_kaki_kanan)
    sudut_lutut = (sudut_lutut_kiri + sudut_lutut_kanan) / 2

    # ── Klasifikasi ──────────────────────────
    # SUJUD: kepala lebih rendah dari pinggul
    if kepala_y > pinggul_y:
        return "SUJUD", sudut_pinggul, sudut_lutut

    # RUKU: badan membungkuk ~90° (sudut pinggul kecil)
    if sudut_pinggul < 110:
        return "RUKU", sudut_pinggul, sudut_lutut

    # DUDUK: lutut menekuk tajam, pinggul lebih rendah dari lutut tidak terlalu jauh
    if sudut_lutut < 120 and kepala_y < pinggul_y:
        return "DUDUK", sudut_pinggul, sudut_lutut

    # BERDIRI: default
    return "BERDIRI", sudut_pinggul, sudut_lutut


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    daftar_sholat = {
        '1': {"nama": "SUBUH",   "target": 2},
        '2': {"nama": "ZUHUR",   "target": 4},
        '3': {"nama": "ASHAR",   "target": 4},
        '4': {"nama": "MAGHRIB", "target": 3},
        '5': {"nama": "ISYA",    "target": 4},
    }

    pilihan_aktif   = '1'
    rakaat_sekarang = 0
    step_gerakan    = 0
    status_sekarang = "TIDAK TERDETEKSI"
    status_sebelum  = ""

    riwayat_gerakan = []   # 5 frame terakhir untuk smoothing
    SMOOTH_N        = 6    # Butuh N frame konsisten baru update status

    # Cooldown: cegah double-count
    last_rakaat_time = 0.0
    COOLDOWN_DETIK   = 1.5

    # FPS
    prev_time = time.time()
    fps       = 0

    logger = LoggerSesi(daftar_sholat[pilihan_aktif]["nama"])

    pose = mp_pose.Pose(
        min_detection_confidence=0.65,
        min_tracking_confidence=0.65,
        model_complexity=1
    )

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cv2.namedWindow('Detektor Rakaat Sholat — AI Enhanced', cv2.WINDOW_NORMAL)

    print("╔══════════════════════════════════════╗")
    print("║   DETEKTOR RAKAAT SHOLAT — ENHANCED  ║")
    print("╠══════════════════════════════════════╣")
    print("║  [1] Subuh (2)  [2] Zuhur (4)        ║")
    print("║  [3] Ashar (4)  [4] Maghrib (3)       ║")
    print("║  [5] Isya (4)   [R] Reset  [Q] Keluar ║")
    print("╚══════════════════════════════════════╝")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        # ── FPS ──────────────────────────────
        now = time.time()
        fps = 0.9 * fps + 0.1 * (1.0 / max(now - prev_time, 1e-5))
        prev_time = now

        # ── Proses pose ──────────────────────
        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        hasil  = pose.process(rgb)

        target_rakaat = daftar_sholat[pilihan_aktif]["target"]
        nama_sholat   = daftar_sholat[pilihan_aktif]["nama"]

        sudut_pinggul_disp = 0.0
        sudut_lutut_disp   = 0.0
        visibilitas        = 0.0

        if hasil.pose_landmarks:
            lm = hasil.pose_landmarks.landmark

            # Visibility rata-rata titik utama
            idx_utama  = [0, 11, 12, 23, 24, 25, 26, 27, 28]
            visibilitas = np.mean([lm[i].visibility for i in idx_utama])

            status_raw, sudut_pinggul_disp, sudut_lutut_disp = deteksi_posisi(lm, w, h)

            # ── Smoothing status ──────────────
            riwayat_gerakan.append(status_raw)
            if len(riwayat_gerakan) > SMOOTH_N:
                riwayat_gerakan.pop(0)

            if len(riwayat_gerakan) == SMOOTH_N and \
               all(g == riwayat_gerakan[0] for g in riwayat_gerakan):
                status_sekarang = riwayat_gerakan[0]
            # else: tetap status sebelumnya (tidak berubah tergesa)

            # ── State machine rakaat ──────────
            waktu_sekarang = time.time()
            status_berubah = (status_sekarang != status_sebelum)

            if status_berubah:
                if status_sekarang == "RUKU" and step_gerakan == 0:
                    step_gerakan = 1
                elif status_sekarang == "BERDIRI" and step_gerakan == 1:
                    step_gerakan = 2
                elif status_sekarang == "SUJUD" and step_gerakan == 2:
                    step_gerakan = 3
                elif status_sekarang == "DUDUK" and step_gerakan == 3:
                    step_gerakan = 4
                elif status_sekarang == "SUJUD" and step_gerakan == 4:
                    step_gerakan = 5
                elif status_sekarang in ("BERDIRI", "DUDUK") and step_gerakan == 5:
                    if waktu_sekarang - last_rakaat_time >= COOLDOWN_DETIK:
                        rakaat_sekarang += 1
                        last_rakaat_time = waktu_sekarang
                        logger.catat(rakaat_sekarang, status_sekarang, step_gerakan)
                        print(f"[✓] Rakaat ke-{rakaat_sekarang} selesai — {nama_sholat}")
                        if BISA_SIRINE:
                            winsound.Beep(800, 150)
                    step_gerakan = 0 if status_sekarang == "BERDIRI" else -1

                status_sebelum = status_sekarang

            # ── Gambar kerangka tubuh ─────────
            mp_drawing.draw_landmarks(
                frame,
                hasil.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing.DrawingSpec(
                    color=(0, 255, 200), thickness=2, circle_radius=3),
                connection_drawing_spec=mp_drawing.DrawingSpec(
                    color=(200, 200, 0), thickness=2)
            )

        # ════════════════════════════════════════
        # UI PANEL KIRI ATAS — Info Sholat
        # ════════════════════════════════════════
        panel_w = 420
        gambar_panel(frame, 10, 10, 10 + panel_w, 260)

        # Judul sholat
        cv2.putText(frame, f"SHOLAT {nama_sholat}", (20, 45),
                    cv2.FONT_HERSHEY_DUPLEX, 1.0, KUNING, 2)

        # Rakaat
        cv2.putText(frame, "Rakaat:", (20, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, PUTIH, 1)
        cv2.putText(frame, f"{rakaat_sekarang}/{target_rakaat}", (110, 90),
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, HIJAU, 2)

        # Progress bar rakaat
        gambar_progress_bar(frame, 20, 100, panel_w - 30, 22,
                            rakaat_sekarang, target_rakaat, HIJAU)

        # Posisi & Step
        warna_posisi = {
            "BERDIRI": PUTIH, "RUKU": KUNING,
            "SUJUD": BIRU,    "DUDUK": CYAN,
            "TIDAK TERDETEKSI": ABU
        }.get(status_sekarang, PUTIH)

        cv2.putText(frame, f"Posisi : {status_sekarang}", (20, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, warna_posisi, 2)

        label_step = ["Awal", "Ruku✓", "I'tidal✓", "Sujud1✓",
                      "Duduk✓", "Sujud2✓", "Tahiyat"]
        step_label = label_step[step_gerakan] if 0 <= step_gerakan < len(label_step) else "Tahiyat Akhir"
        cv2.putText(frame, f"Step   : {step_label}", (20, 185),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, PUTIH, 1)

        # Sudut sendi
        cv2.putText(frame, f"Sudut Pinggul: {sudut_pinggul_disp:5.1f}°", (20, 215),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, ABU if not hasil.pose_landmarks else PUTIH, 1)
        cv2.putText(frame, f"Sudut Lutut  : {sudut_lutut_disp:5.1f}°", (20, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, ABU if not hasil.pose_landmarks else PUTIH, 1)

        # ════════════════════════════════════════
        # UI PANEL KANAN ATAS — Teknis
        # ════════════════════════════════════════
        gambar_panel(frame, w - 260, 10, w - 10, 150)

        warna_fps = HIJAU if fps >= 24 else KUNING if fps >= 15 else MERAH
        cv2.putText(frame, f"FPS: {fps:5.1f}", (w - 250, 45),
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, warna_fps, 2)

        vis_pct = int(visibilitas * 100)
        warna_vis = HIJAU if vis_pct > 70 else KUNING if vis_pct > 40 else MERAH
        cv2.putText(frame, f"Visibilitas: {vis_pct}%", (w - 250, 85),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, warna_vis, 2)
        gambar_progress_bar(frame, w - 250, 95, 230, 18, vis_pct, 100, warna_vis)

        cv2.putText(frame, f"Log: {os.path.basename(logger.filename)}", (w - 250, 130),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, ABU, 1)

        # ════════════════════════════════════════
        # OVERLAY PERINGATAN / SEMPURNA
        # ════════════════════════════════════════
        if rakaat_sekarang > target_rakaat:
            # Batas lampu merah
            cv2.rectangle(frame, (0, 0), (w, h), MERAH, 12)
            gambar_panel(frame, 40, h // 2 - 55, w - 40, h // 2 + 55, alpha=0.75)
            cv2.putText(frame, "!! RAKAAT MELEBIHI BATAS !!", (60, h // 2 + 15),
                        cv2.FONT_HERSHEY_DUPLEX, 1.3, MERAH, 4)
            if BISA_SIRINE:
                winsound.Beep(1500, 180)

        elif rakaat_sekarang == target_rakaat and step_gerakan == -1:
            # Sempurna — hijau
            cv2.rectangle(frame, (0, 0), (w, h), HIJAU, 12)
            gambar_panel(frame, 40, h // 2 - 55, w - 40, h // 2 + 55, alpha=0.75)
            cv2.putText(frame, "SHOLAT SEMPURNA \u2014 ALHAMDULILLAH", (55, h // 2 + 15),
                        cv2.FONT_HERSHEY_DUPLEX, 1.1, HIJAU, 3)

        # ════════════════════════════════════════
        # PANDUAN KEYBOARD — bawah layar
        # ════════════════════════════════════════
        gambar_panel(frame, 0, h - 35, w, h, alpha=0.65)
        cv2.putText(frame,
                    "[1] Subuh  [2] Zuhur  [3] Ashar  [4] Maghrib  [5] Isya  |  [R] Reset  [Q] Keluar",
                    (20, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, PUTIH, 1)

        cv2.imshow('Detektor Rakaat Sholat — AI Enhanced', frame)

        # ── Keyboard ─────────────────────────
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            rakaat_sekarang = 0
            step_gerakan    = 0
            riwayat_gerakan = []
            status_sekarang = "TIDAK TERDETEKSI"
            status_sebelum  = ""
            print("[R] Rakaat direset.")
        elif chr(key) in daftar_sholat and key != 255:
            lama = pilihan_aktif
            pilihan_aktif   = chr(key)
            rakaat_sekarang = 0
            step_gerakan    = 0
            riwayat_gerakan = []
            if lama != pilihan_aktif:
                logger = LoggerSesi(daftar_sholat[pilihan_aktif]["nama"])
            print(f"[MODE] Beralih ke Sholat {daftar_sholat[pilihan_aktif]['nama']}")

    cap.release()
    cv2.destroyAllWindows()
    print("\nSesi selesai. File log tersimpan.")


if __name__ == "__main__":
    main()   