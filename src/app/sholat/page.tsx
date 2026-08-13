"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Stop,
  Warning,
  CheckCircle,
  VideoCamera,
  Eye,
  Power,
  LockKey,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import ThreeBackground from "../components/ThreeBackground";
import ThreeRakaatVisualizer from "../components/ThreeRakaatVisualizer";
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { logRakaatSession } from "../../lib/supabase";

interface RakaatResponse {
  session_id: string;
  prayer_type: string;
  max_rakaat: number;
  detected_rakaat: number;
  exceeded: boolean;
  step_gerakan: string;
  status_sekarang: string;
  visibilitas: number;
  message?: string;
  sudut_pinggul?: number;
  sudut_lutut?: number;
}

const PRAYERS = [
  { id: "SUBUH", name: "Subuh", rakaat: 2 },
  { id: "ZUHUR", name: "Dzuhur", rakaat: 4 },
  { id: "ASHAR", name: "Ashar", rakaat: 4 },
  { id: "MAGHRIB", name: "Maghrib", rakaat: 3 },
  { id: "ISYA", name: "Isya", rakaat: 4 },
  { id: "SUNNAH", name: "Sunnah", rakaat: 2 },
];

function hitungSudut(a: [number, number], b: [number, number], c: [number, number]): number {
  const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  return angle <= 180 ? angle : 360 - angle;
}

function getCoord(lm: { x: number; y: number }[], idx: number, w: number, h: number): [number, number] {
  return [lm[idx].x * w, lm[idx].y * h];
}

function deteksiPosisi(
  lm: { x: number; y: number }[],
  w: number,
  h: number
): { status_raw: string; sudut_pinggul: number; sudut_lutut: number } {
  const bahu_kiri = getCoord(lm, 11, w, h);
  const bahu_kanan = getCoord(lm, 12, w, h);
  const pinggul_kiri = getCoord(lm, 23, w, h);
  const pinggul_kanan = getCoord(lm, 24, w, h);
  const lutut_kiri = getCoord(lm, 25, w, h);
  const lutut_kanan = getCoord(lm, 26, w, h);

  const kepala_y = lm[0].y * h;
  const pinggul_y = (pinggul_kiri[1] + pinggul_kanan[1]) / 2;

  const sudut_pinggul =
    (hitungSudut(bahu_kiri, pinggul_kiri, lutut_kiri) +
      hitungSudut(bahu_kanan, pinggul_kanan, lutut_kanan)) /
    2;
  const sudut_lutut =
    (hitungSudut(pinggul_kiri, lutut_kiri, getCoord(lm, 27, w, h)) +
      hitungSudut(pinggul_kanan, lutut_kanan, getCoord(lm, 28, w, h))) /
    2;

  let status_raw = "BERDIRI";
  if (kepala_y > pinggul_y + 10) {
    status_raw = "SUJUD";
  } else if (sudut_pinggul < 115 && kepala_y < pinggul_y) {
    status_raw = "RUKU";
  } else if (sudut_lutut < 125 && kepala_y < pinggul_y) {
    status_raw = "DUDUK";
  }

  return { status_raw, sudut_pinggul, sudut_lutut };
}

function stepLabel(step: number): string {
  const labels = ["Awal", "Ruku", "I'tidal", "Sujud1", "Duduk", "Sujud2", "Tahiyat"];
  if (step >= 0 && step < labels.length) {
    return labels[step];
  }
  return "Tahiyat Akhir";
}

class RakaatTracker {
  session_id: string;
  prayer_type: string;
  max_rakaat: number;
  rakaat_sekarang: number = 0;
  step_gerakan: number = 0;
  status_sekarang: string = "TIDAK TERDETEKSI";
  status_sebelum: string = "";
  riwayat_gerakan: string[] = [];
  last_rakaat_time: number = 0;

  constructor(session_id: string, prayer_type: string, max_rakaat: number) {
    this.session_id = session_id;
    this.prayer_type = prayer_type;
    this.max_rakaat = max_rakaat;
  }

  updateState(status_raw: string): void {
    this.riwayat_gerakan.push(status_raw);
    if (this.riwayat_gerakan.length > 6) {
      this.riwayat_gerakan.shift();
    }

    if (
      this.riwayat_gerakan.length === 6 &&
      this.riwayat_gerakan.every((g) => g === this.riwayat_gerakan[0])
    ) {
      this.status_sekarang = this.riwayat_gerakan[0];
    } else {
      return;
    }

    const waktu_sekarang = Date.now() / 1000;
    const status_berubah = this.status_sekarang !== this.status_sebelum;
    if (!status_berubah) return;

    const step = this.step_gerakan;
    if (this.status_sekarang === "RUKU" && step === 0) {
      this.step_gerakan = 1;
    } else if (this.status_sekarang === "BERDIRI" && step === 1) {
      this.step_gerakan = 2;
    } else if (this.status_sekarang === "SUJUD" && step === 2) {
      this.step_gerakan = 3;
    } else if (this.status_sekarang === "DUDUK" && step === 3) {
      this.step_gerakan = 4;
    } else if (this.status_sekarang === "SUJUD" && step === 4) {
      this.step_gerakan = 5;
    } else if (
      (this.status_sekarang === "BERDIRI" || this.status_sekarang === "DUDUK") &&
      step === 5
    ) {
      if (waktu_sekarang - this.last_rakaat_time >= 3.0) {
        this.rakaat_sekarang += 1;
        this.last_rakaat_time = waktu_sekarang;
      }
      this.step_gerakan = this.status_sekarang === "BERDIRI" ? 0 : -1;
      if (this.step_gerakan === -1) {
        logRakaatSession(
          this.session_id,
          this.prayer_type,
          this.max_rakaat,
          this.rakaat_sekarang,
          this.rakaat_sekarang > this.max_rakaat
        );
      }
    }

    this.status_sebelum = this.status_sekarang;
  }
}

export default function PrayerAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedPrayer, setSelectedPrayer] = useState(PRAYERS[0]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [emergencyOff, setEmergencyOff] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<RakaatResponse | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [landmarkerReady, setLandmarkerReady] = useState(false);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const trackerRef = useRef<RakaatTracker | null>(null);

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
      
      // Hentikan stream yang ada sebelum mulai
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
          // Penting: Pastikan video di-play setelah stream terpasang
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
      setIsSessionActive(false);
      setEmergencyOff(true);
      setStatus(null);
    } else {
      setEmergencyOff(false);
      startCamera();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [emergencyOff, startCamera]);

  const handleStartSession = () => {
    if (emergencyOff) return;
    const newSessionId = `SESSION-${Date.now()}`;
    setSessionId(newSessionId);
    trackerRef.current = new RakaatTracker(newSessionId, selectedPrayer.id, selectedPrayer.rakaat);
    setIsSessionActive(true);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setStatus(null);
    trackerRef.current = null;
  };

  const isProcessingRef = useRef(false);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);

  const processFrame = useCallback(async () => {
    if (
      emergencyOff ||
      !isSessionActive ||
      !sessionId ||
      !videoRef.current ||
      !canvasRef.current ||
      isProcessingRef.current ||
      !landmarkerRef.current ||
      !trackerRef.current ||
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

      const tracker = trackerRef.current;
      let visibilitas = 0;
      let sudut_pinggul = 0;
      let sudut_lutut = 0;

      if (landmarkerResult.landmarks && landmarkerResult.landmarks.length > 0) {
        const lm = landmarkerResult.landmarks[0];
        const idx_utama = [0, 11, 12, 23, 24, 25, 26, 27, 28];
        const visibilities = idx_utama.map((i) => lm[i]?.visibility ?? 1);
        visibilitas = visibilities.reduce((a, b) => a + b, 0) / idx_utama.length;

        const pos = deteksiPosisi(lm, w, h);
        sudut_pinggul = pos.sudut_pinggul;
        sudut_lutut = pos.sudut_lutut;

        tracker.updateState(pos.status_raw);

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
      } else {
        tracker.status_sekarang = "TIDAK TERDETEKSI";
        tracker.riwayat_gerakan = [];
      }

      const exceeded = tracker.rakaat_sekarang > tracker.max_rakaat;
      let message = "";
      if (tracker.rakaat_sekarang === tracker.max_rakaat && tracker.step_gerakan === -1) {
        message = "SHOLAT SEMPURNA";
      } else if (exceeded) {
        message = "RAKAAT MELEBIHI BATAS";
      }

      const resData: RakaatResponse = {
        session_id: tracker.session_id,
        prayer_type: tracker.prayer_type,
        max_rakaat: tracker.max_rakaat,
        detected_rakaat: tracker.rakaat_sekarang,
        exceeded,
        step_gerakan: stepLabel(tracker.step_gerakan),
        status_sekarang: tracker.status_sekarang,
        visibilitas: Number((visibilitas * 100).toFixed(1)),
        message,
        sudut_pinggul: Number(sudut_pinggul.toFixed(1)),
        sudut_lutut: Number(sudut_lutut.toFixed(1)),
      };

      setStatus(resData);

      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (delta > 0) {
        setFps(Math.round(1 / delta));
      }
    } catch (err) {
      console.error("Pose detection error:", err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isSessionActive, sessionId, emergencyOff]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSessionActive && isCameraActive && !emergencyOff && landmarkerReady) {
      intervalId = setInterval(() => {
        processFrame();
      }, 100);
    }
    return () => clearInterval(intervalId);
  }, [isSessionActive, isCameraActive, emergencyOff, landmarkerReady, processFrame]);

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
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="text-base font-bold text-slate-900 hidden sm:block">
                Islamic Smart
              </span>
            </div>
          </div>

          {/* Prayer Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 justify-center">
            {PRAYERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPrayer(p)}
                disabled={isSessionActive || emergencyOff}
                className={`px-3 py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold transition ${
                  selectedPrayer.id === p.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Camera Controls */}
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

      {/* Main Content Area */}
      <section className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: CCTV Video Feed with Mobile 9:16 Support */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {emergencyOff && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center gap-3">
              <LockKey size={18} className="text-slate-600" />
              <span>
                Status Asisten Sholat: Dinonaktifkan oleh Admin. Anda tetap dapat melaksanakan ibadah sholat secara mandiri.
              </span>
            </div>
          )}

          <div className="relative w-full max-w-md mx-auto aspect-[9/16] rounded-2xl border border-slate-200 bg-slate-900 shadow-md overflow-hidden flex items-center justify-center">
            {/* HUD Top Bar */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 z-20 flex items-center justify-between pointer-events-none text-xs font-mono">
              <div className="flex items-center gap-3 text-slate-300">
                <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-medium">
                  KIOSK SHOLAT #02
                </span>
                <span>SHOLAT: {selectedPrayer.name}</span>
              </div>

              {isSessionActive && !emergencyOff && (
                <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-white font-bold">
                  {fps} FPS
                </span>
              )}
            </div>

            {/* Main Video Frame & Canvas Overlay */}
            <div className="relative w-full h-full aspect-[9/16] flex items-center justify-center bg-slate-950">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full aspect-[9/16] object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full aspect-[9/16] object-cover pointer-events-none z-10"
              />

              {(!isCameraActive || emergencyOff) && (
                <div className="p-8 text-center space-y-3 z-10 max-w-sm bg-white rounded-xl border border-slate-200 text-slate-900 shadow-sm">
                  <div className="mx-auto size-14 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <VideoCamera size={32} />
                  </div>
                  <h3 className="text-sm font-semibold">Kamera Standby</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {emergencyOff
                      ? "Fitur pendeteksi sholat dimatikan."
                      : "Hubungkan kamera untuk memulai sesi pendeteksi rakaat sholat."}
                  </p>
                </div>
              )}
            </div>

            {/* Controller Bar Overlay */}
            <div className="absolute bottom-4 inset-x-4 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl z-20 flex items-center justify-between text-slate-900">
              <span className="text-xs text-slate-600">
                Target: <strong className="text-slate-900">{selectedPrayer.name} ({selectedPrayer.rakaat} Rakaat)</strong>
              </span>

              {!isSessionActive ? (
                <button
                  onClick={handleStartSession}
                  disabled={emergencyOff}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs transition shadow-xs"
                >
                  Mulai Sesi Deteksi Rakaat
                </button>
              ) : (
                <button
                  onClick={handleStopSession}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition shadow-xs flex items-center gap-2"
                >
                  <Stop size={16} weight="fill" />
                  <span>Akhiri Sesi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Holographic Sajadah & Status HUD */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 3D Sajadah Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col items-center justify-center text-center">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Visualisasi Rakaat 3D
            </h3>

            <ThreeRakaatVisualizer
              rakaat={status ? status.detected_rakaat : 0}
              maxRakaat={selectedPrayer.rakaat}
              status={status?.status_sekarang}
            />

            {isSessionActive && (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Rakaat Berlangsung</span>
                <span className="text-3xl font-extrabold text-slate-900">
                  {status ? status.detected_rakaat : 0} / {selectedPrayer.rakaat}
                </span>
                <p className="text-[11px] text-slate-600 font-medium pt-1">Posisi: {status?.step_gerakan || "Berdiri"}</p>
              </div>
            )}
          </div>

          {/* Status & Guidelines Panel */}
          <div className={`rounded-2xl border p-6 shadow-xs space-y-3 transition ${
            status?.exceeded
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Sesi Sholat
            </h4>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Status Rakaat:</span>
              {status?.exceeded ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                  <Warning size={15} /> Perlu Sujud Sahwi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  <CheckCircle size={15} /> Sesuai Target
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {status?.exceeded
                ? "Pengingat Sopan: Rakaat sholat yang Anda lakukan telah melebihi target rakaat. Silakan lakukan Sujud Sahwi bila merasa ragu."
                : "Sesi sholat berjalan secara privat dan aman di kiosk personal."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <div className="flex justify-center items-center gap-6 font-medium mb-1">
          <Link href="/bantuan" className="hover:text-slate-900 transition">Panduan Doa</Link>
          <Link href="/statistik" className="hover:text-slate-900 transition">Statistik Pengunjung</Link>
          <Link href="/bantuan" className="hover:text-slate-900 transition">Bantuan</Link>
        </div>
      </footer>
    </main>
  );
}
