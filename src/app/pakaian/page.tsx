"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GenderFemale,
  GenderMale,
  VideoCamera,
  Eye,
  CheckCircle,
  Warning,
  Power,
  LockKey,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import ThreeBackground from "../components/ThreeBackground";
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { logAttireCheck } from "../../lib/supabase";

interface AttireResponse {
  pose_detected: boolean;
  pelanggaran: boolean;
  persen_aurat: number;
  status: string;
  message?: string;
  threshold: number;
}

function maskKulit(imgData: ImageData): Uint8Array {
  const data = imgData.data;
  const len = data.length;
  const skinMask = new Uint8Array(len / 4);

  for (let i = 0; i < len; i += 4) {
    const R = data[i];
    const G = data[i + 1];
    const B = data[i + 2];

    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const delta = max - min;

    let H = 0;
    if (delta !== 0) {
      if (max === R) {
        H = ((G - B) / delta) % 6;
      } else if (max === G) {
        H = (B - R) / delta + 2;
      } else {
        H = (R - G) / delta + 4;
      }
      H = Math.round(H * 60);
      if (H < 0) H += 360;
    }

    const V = Math.round((max / 255) * 100);
    const S = Math.round(max === 0 ? 0 : (delta / max) * 100);

    const H_hsv = H / 2;
    const S_hsv = Math.round((S / 100) * 255);
    const V_hsv = Math.round((V / 100) * 255);

    const Y = 0.299 * R + 0.587 * G + 0.114 * B;
    const Cr = (R - Y) * 0.713 + 128;
    const Cb = (B - Y) * 0.564 + 128;

    const r_f = R + 1.0;
    const g_f = G + 1.0;
    const b_f = B + 1.0;
    const ratio_rg = r_f / g_f;

    const hsv_match = H_hsv >= 0 && H_hsv <= 22 && S_hsv >= 20 && S_hsv <= 180 && V_hsv >= 70 && V_hsv <= 255;
    const ycrcb_match = Y >= 50 && Y <= 255 && Cr >= 133 && Cr <= 173 && Cb >= 77 && Cb <= 127;
    const bgr_match = R > 75 && G > 35 && B > 20 && R > G && G > B && ratio_rg >= 1.05 && ratio_rg <= 1.80;

    if (hsv_match && ycrcb_match && bgr_match) {
      skinMask[i / 4] = 255;
    }
  }

  return skinMask;
}

function createAuratMask(
  mode: "PEREMPUAN" | "LAKI-LAKI",
  landmarks: { x: number; y: number; visibility?: number }[],
  w: number,
  h: number
): Uint8Array {
  const auratMask = new Uint8Array(w * h);

  const kordinat: Record<number, [number, number]> = {};
  landmarks.forEach((lm, i) => {
    if ((lm.visibility ?? 1) > 0.45) {
      kordinat[i] = [Math.floor(lm.x * w), Math.floor(lm.y * h)];
    }
  });

  if (mode === "LAKI-LAKI") {
    let y_atas = 0;
    let y_bawah = h;
    let x_kiri = 0;
    let x_kanan = w;

    if (11 in kordinat && 12 in kordinat) {
      const x_bahu_kiri = Math.min(kordinat[11][0], kordinat[12][0]);
      const x_bahu_kanan = Math.max(kordinat[11][0], kordinat[12][0]);
      const lebar_bahu = Math.max(40, x_bahu_kanan - x_bahu_kiri);
      const cx_bahu = Math.floor((kordinat[11][0] + kordinat[12][0]) / 2);
      const y_bahu = Math.floor((kordinat[11][1] + kordinat[12][1]) / 2);

      if (23 in kordinat && 24 in kordinat) {
        const y_pinggul = Math.floor((kordinat[23][1] + kordinat[24][1]) / 2);
        const tinggi_torso = Math.max(30, y_pinggul - y_bahu);
        const y_pusar = Math.floor(y_bahu + 0.45 * tinggi_torso);
        const cx_pinggul = Math.floor((kordinat[23][0] + kordinat[24][0]) / 2);
        const lebar_pinggul = Math.max(30, Math.abs(kordinat[23][0] - kordinat[24][0]));
        const half_w = Math.floor(lebar_pinggul * 0.7);
        x_kiri = Math.max(0, cx_pinggul - half_w);
        x_kanan = Math.min(w, cx_pinggul + half_w);
        y_atas = Math.max(0, y_pusar - 15);
      } else {
        const y_pusar = Math.floor(y_bahu + 0.55 * lebar_bahu);
        const half_w = Math.floor(lebar_bahu * 0.35);
        x_kiri = Math.max(0, cx_bahu - half_w);
        x_kanan = Math.min(w, cx_bahu + half_w);
        y_atas = Math.max(0, y_pusar - 15);
      }
    } else if (23 in kordinat && 24 in kordinat) {
      const cx_pinggul = Math.floor((kordinat[23][0] + kordinat[24][0]) / 2);
      const y_pinggul = Math.floor((kordinat[23][1] + kordinat[24][1]) / 2);
      const lebar_pinggul = Math.max(30, Math.abs(kordinat[23][0] - kordinat[24][0]));
      y_atas = Math.max(0, y_pinggul - 60);
      const half_w = Math.floor(lebar_pinggul * 0.7);
      x_kiri = Math.max(0, cx_pinggul - half_w);
      x_kanan = Math.min(w, cx_pinggul + half_w);
    }

    if (25 in kordinat || 26 in kordinat) {
      const lututY = [];
      if (25 in kordinat) lututY.push(kordinat[25][1]);
      if (26 in kordinat) lututY.push(kordinat[26][1]);
      y_bawah = Math.min(h, Math.max(...lututY) + 30);
    }

    for (let y = y_atas; y < y_bawah; y++) {
      for (let x = x_kiri; x < x_kanan; x++) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          auratMask[y * w + x] = 255;
        }
      }
    }

    const clearCircle = (cx: number, cy: number, r: number) => {
      const r2 = r * r;
      for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++) {
        for (let x = Math.max(0, cx - r); x <= Math.min(w - 1, cx + r); x++) {
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) {
            auratMask[y * w + x] = 0;
          }
        }
      }
    };

    [11, 12, 13, 14, 15, 16].forEach((idx) => {
      if (idx in kordinat) clearCircle(kordinat[idx][0], kordinat[idx][1], 40);
    });
    for (let handIdx = 15; handIdx <= 22; handIdx++) {
      if (handIdx in kordinat) clearCircle(kordinat[handIdx][0], kordinat[handIdx][1], 45);
    }
  } else {
    auratMask.fill(255);

    if (0 in kordinat) {
      const [cx, cy] = kordinat[0];
      let jarak_wajah = 70;
      if (7 in kordinat && 8 in kordinat) {
        jarak_wajah = Math.abs(kordinat[7][0] - kordinat[8][0]);
      } else if (2 in kordinat && 5 in kordinat) {
        jarak_wajah = Math.floor(Math.abs(kordinat[2][0] - kordinat[5][0]) * 2.2);
      }
      const rx = Math.max(50, Math.floor(jarak_wajah * 0.58));
      const ry = Math.max(75, Math.floor(jarak_wajah * 0.95));

      const rx2 = rx * rx;
      const ry2 = ry * ry;
      for (let y = Math.max(0, cy - ry); y <= Math.min(h - 1, cy + ry); y++) {
        for (let x = Math.max(0, cx - rx); x <= Math.min(w - 1, cx + rx); x++) {
          const dx = x - cx;
          const dy = y - cy;
          if ((dx * dx) / rx2 + (dy * dy) / ry2 <= 1) {
            auratMask[y * w + x] = 0;
          }
        }
      }
    }

    const clearCircle = (cx: number, cy: number, r: number) => {
      const r2 = r * r;
      for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++) {
        for (let x = Math.max(0, cx - r); x <= Math.min(w - 1, cx + r); x++) {
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) {
            auratMask[y * w + x] = 0;
          }
        }
      }
    };

    for (let handIdx = 15; handIdx <= 22; handIdx++) {
      if (handIdx in kordinat) {
        clearCircle(kordinat[handIdx][0], kordinat[handIdx][1], 40);
      }
    }
  }

  return auratMask;
}

export default function ModestDressCheck() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioPeringatanRef = useRef<HTMLAudioElement | null>(null);
  const audioAmanRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioStateRef = useRef<string>("IDLE");

  const [mode, setMode] = useState<"PEREMPUAN" | "LAKI-LAKI">("PEREMPUAN");
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [emergencyOff, setEmergencyOff] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<AttireResponse | null>(null);
  const [threshold, setThreshold] = useState<number>(2.0);
  const [fps, setFps] = useState<number>(0);
  const [landmarkerReady, setLandmarkerReady] = useState(false);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    async function initLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        landmarkerRef.current = poseLandmarker;
        setLandmarkerReady(true);
      } catch (err) {
        console.error("Gagal inisialisasi PoseLandmarker:", err);
      }
    }
    initLandmarker();
  }, []);

  useEffect(() => {
    audioPeringatanRef.current = new Audio("/suara_ai.mp3");
    audioPeringatanRef.current.loop = true;
    audioAmanRef.current = new Audio("/suara_aman.mp3");
    audioAmanRef.current.loop = false;

    return () => {
      if (audioPeringatanRef.current) {
        audioPeringatanRef.current.pause();
      }
      if (audioAmanRef.current) {
        audioAmanRef.current.pause();
      }
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = useCallback(
    async (targetFacingMode?: "user" | "environment") => {
      if (emergencyOff) return;
      
      stopCamera();

      const modeToUse = targetFacingMode || facingMode;
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: modeToUse }
        },
        audio: false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (err) {
        console.warn("Kamera gagal, mencoba fallback:", err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            setIsCameraActive(true);
          }
        } catch (fallbackErr) {
          console.error("Camera access error:", fallbackErr);
          setIsCameraActive(false);
        }
      }
    },
    [emergencyOff, facingMode]
  );

  const toggleCameraFacing = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const toggleEmergencyOff = () => {
    if (!emergencyOff) {
      stopCamera();
      setEmergencyOff(true);
      setResult(null);
    } else {
      setEmergencyOff(false);
      startCamera();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
      setThreshold(mode === "PEREMPUAN" ? 2.0 : 3.5);
    }, 0);
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [emergencyOff, mode, startCamera]);

  const isProcessingRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const lastLogTimeRef = useRef<number>(0);

  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (
      emergencyOff ||
      !videoRef.current ||
      !canvasRef.current ||
      !isCameraActive ||
      isProcessingRef.current ||
      !landmarkerRef.current ||
      videoRef.current.readyState < 2
    ) {
      return;
    }

    isProcessingRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isProcessingRef.current = false;
      return;
    }

    ctx.drawImage(video, 0, 0, w, h);

    try {
      const startTime = performance.now();
      const landmarkerResult = landmarkerRef.current.detectForVideo(video, startTime);

      let pose_detected = false;
      let pelanggaran = false;
      let persen_aurat = 0.0;

      if (landmarkerResult.landmarks && landmarkerResult.landmarks.length > 0) {
        const lm = landmarkerResult.landmarks[0];
        const fitur_wajah = [0, 1, 2, 4, 5, 7, 8].map((i) => (lm[i]?.visibility ?? 1) > 0.6);
        const wajah_valid = fitur_wajah.filter(Boolean).length >= 2;
        const bahu_valid = (lm[11]?.visibility ?? 1) > 0.55 || (lm[12]?.visibility ?? 1) > 0.55;

        if (wajah_valid && bahu_valid) {
          pose_detected = true;

          const imgData = ctx.getImageData(0, 0, w, h);
          const skinMask = maskKulit(imgData);
          const auratMask = createAuratMask(mode, lm, w, h);

          let pixel_kulit = 0;
          let total_pixel_aurat = 0;
          const totalPixels = w * h;

          for (let i = 0; i < totalPixels; i++) {
            if (auratMask[i] > 0) {
              total_pixel_aurat++;
              if (skinMask[i] > 0) {
                pixel_kulit++;
              }
            }
          }

          persen_aurat = total_pixel_aurat > 0 ? (pixel_kulit / total_pixel_aurat) * 100 : 0.0;
          const th = threshold;
          pelanggaran = persen_aurat > th;

          const drawingUtils = new DrawingUtils(ctx);
          for (const landmark of landmarkerResult.landmarks) {
            drawingUtils.drawLandmarks(landmark, {
              color: "#00C8B4",
              lineWidth: 2,
              radius: 3,
            });
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
              color: "#C8C800",
              lineWidth: 2,
            });
          }
        }
      }

      let statusStr = "MENUNGGU";
      let messageStr = "Silakan berdiri di depan kiosk untuk mengecek kesesuaian pakaian.";

      if (pose_detected) {
        if (pelanggaran) {
          statusStr = "PENGINGAT_SOPAN";
          messageStr = "Yuk, rapikan dan sesuaikan pakaian sebelum masuk area ibadah.";
        } else {
          statusStr = "RAPI";
          messageStr = "Alhamdulillah, pakaian sudah rapi dan menutup aurat dengan baik.";
        }
      }

      const resData: AttireResponse = {
        pose_detected,
        pelanggaran,
        persen_aurat: Number(persen_aurat.toFixed(2)),
        status: statusStr,
        message: messageStr,
        threshold,
      };

      setResult(resData);

      if (pose_detected) {
        const nowSec = Date.now();
        if (nowSec - lastLogTimeRef.current > 5000) {
          lastLogTimeRef.current = nowSec;
          logAttireCheck(statusStr, resData.persen_aurat, mode);
        }
      }

      if (pose_detected) {
        if (pelanggaran) {
          if (lastAudioStateRef.current !== "PERINGATAN") {
            if (audioAmanRef.current) {
              audioAmanRef.current.pause();
              audioAmanRef.current.currentTime = 0;
            }
            if (audioPeringatanRef.current) {
              audioPeringatanRef.current.play().catch(() => {});
            }
            lastAudioStateRef.current = "PERINGATAN";
          }
        } else {
          if (lastAudioStateRef.current !== "AMAN") {
            if (audioPeringatanRef.current) {
              audioPeringatanRef.current.pause();
              audioPeringatanRef.current.currentTime = 0;
            }
            if (audioAmanRef.current) {
              audioAmanRef.current.play().catch(() => {});
            }
            lastAudioStateRef.current = "AMAN";
          }
        }
      } else {
        if (lastAudioStateRef.current !== "IDLE") {
          if (audioPeringatanRef.current) {
            audioPeringatanRef.current.pause();
            audioPeringatanRef.current.currentTime = 0;
          }
          lastAudioStateRef.current = "IDLE";
        }
      }

      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (delta > 0) {
        setFps(Math.round(1 / delta));
      }
    } catch (err) {
      console.error("Frame analysis error:", err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isCameraActive, mode, threshold, emergencyOff]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isCameraActive && !emergencyOff && landmarkerReady) {
      intervalId = setInterval(() => {
        captureAndAnalyze();
      }, 100);
    }
    return () => clearInterval(intervalId);
  }, [isCameraActive, emergencyOff, landmarkerReady, captureAndAnalyze]);

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between overflow-hidden selection:bg-emerald-100 bg-clean-grid">
      <ThreeBackground className="fixed inset-0 pointer-events-none z-0 opacity-30" />

      {/* Header */}
      <header className="relative z-10 py-4 px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Islamic Smart Assistance Logo" className="h-8 w-auto" />
              <span className="text-base font-bold text-slate-900 hidden sm:inline">
                Islamic Smart
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200 font-medium">
                Deteksi Aurat Client-Side
              </span>
            </div>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setMode("PEREMPUAN")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mode === "PEREMPUAN"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GenderFemale size={15} />
              <span>Putri</span>
            </button>
            <button
              onClick={() => setMode("LAKI-LAKI")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mode === "LAKI-LAKI"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GenderMale size={15} />
              <span>Putra</span>
            </button>
          </div>

          {/* Controls: Camera Switch & Emergency Off */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCameraFacing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-medium transition"
              title="Ganti Kamera Depan / Belakang"
            >
              <ArrowsClockwise size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Kamera:</span>
              <span className="font-semibold">{facingMode === "user" ? "Depan" : "Belakang"}</span>
            </button>

            <button
              onClick={toggleEmergencyOff}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                emergencyOff
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <Power size={14} className={emergencyOff ? "text-rose-600" : "text-slate-500"} />
              <span className="hidden sm:inline">{emergencyOff ? "Non-Aktif" : "Emergency Off"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* Graceful Degradation Banner if Emergency Off */}
        {emergencyOff && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LockKey size={18} className="text-slate-600" />
              <span>
                Status Kamera: Dinonaktifkan oleh Admin. Silakan jamaah tetap dapat langsung memasuki area masjid tanpa hambatan.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Graceful Degradation Active
            </span>
          </div>
        )}

        {/* Full-Scale CCTV Screen Frame Mobile 9:16 aspect ratio */}
        <div className="relative w-full max-w-md mx-auto aspect-[9/16] rounded-2xl border border-slate-200 bg-slate-900 shadow-md overflow-hidden flex items-center justify-center">
          {/* HUD Top Bar */}
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 z-20 flex items-center justify-between pointer-events-none text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/90 text-white border border-slate-700 font-medium">
                <span className={`size-2 rounded-full ${isCameraActive && !emergencyOff ? "bg-emerald-500" : "bg-slate-500"}`} />
                MONITOR KIOSK #01
              </span>
              <span className="text-slate-300">MODE: {mode}</span>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 hidden sm:inline-flex">
                <Eye size={14} className="text-emerald-400" />
                CLIENT CV ENGINE
              </span>
              {isCameraActive && !emergencyOff && (
                <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-white font-bold">
                  {fps} FPS
                </span>
              )}
            </div>
          </div>

          {/* Video Stream & Realtime Canvas Overlay */}
          <div className="relative w-full h-full aspect-[9/16] flex items-center justify-center bg-slate-950">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full aspect-[9/16] object-cover ${!isCameraActive || emergencyOff ? "hidden" : ""}`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full aspect-[9/16] object-cover pointer-events-none z-10 ${
                !isCameraActive || emergencyOff ? "hidden" : ""
              }`}
            />

            {(!isCameraActive || emergencyOff) && (
              <div className="p-8 text-center space-y-4 z-10 max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm text-slate-900">
                <div className="mx-auto size-14 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <VideoCamera size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Kamera Kiosk Non-Aktif</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {emergencyOff
                      ? "Fitur kamera dimatikan. Jamaah dipersilakan langsung memasuki masjid."
                      : cameraError || "Nyalakan kamera untuk mulai pemeriksaan kesesuaian pakaian."}
                  </p>
                </div>
                {!emergencyOff && (
                  <button
                    onClick={() => startCamera()}
                    className="w-full py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
                  >
                    Aktifkan Kamera
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Live AI Overlay Banner inside Video Player */}
          {result && !emergencyOff && (
            <div className="absolute bottom-4 inset-x-4 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl z-20 flex flex-wrap items-center justify-between gap-4 text-slate-900">
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center font-bold ${
                    result.pelanggaran
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {result.pelanggaran ? <Warning size={20} /> : <CheckCircle size={20} />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">{result.message || result.status}</h4>
                  <p className="text-[11px] text-slate-500">
                    {result.pose_detected ? "Analisis Posisi Tubuh Aktif • Pengingat Sopan" : "Mencari Posisi Jamaah..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Status Pakaian</span>
                  <span
                    className={`text-xs font-bold ${
                      result.pelanggaran ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                <div className="text-right border-l border-slate-200 pl-6">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Kulit Terekspos</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{result.persen_aurat}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <div className="flex justify-center gap-6 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">Beranda</Link>
          <Link href="/sholat" className="hover:text-slate-900 transition">Asisten Sholat</Link>
          <Link href="/statistik" className="hover:text-slate-900 transition">Statistik</Link>
          <Link href="/bantuan" className="hover:text-slate-900 transition">Bantuan</Link>
        </div>
      </footer>
    </main>
  );
}

