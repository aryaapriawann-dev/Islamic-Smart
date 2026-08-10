"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Camera,
  ArrowLeft,
  GenderFemale,
  GenderMale,
  User,
  VideoCamera,
  Eye,
  CheckCircle,
  Warning,
  Power,
  LockKey,
  ArrowsClockwise,
  Gear,
} from "@phosphor-icons/react";
import ThreeBackground from "../components/ThreeBackground";

interface AttireResponse {
  pose_detected: boolean;
  pelanggaran: boolean;
  persen_aurat: number;
  status: string;
  message?: string;
  threshold: number;
  annotated_image?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function ModestDressCheck() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioPeringatanRef = useRef<HTMLAudioElement | null>(null);
  const audioAmanRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioStateRef = useRef<string>("IDLE");

  const [mode, setMode] = useState<"PEREMPUAN" | "LAKI-LAKI">("PEREMPUAN");
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [emergencyOff, setEmergencyOff] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<AttireResponse | null>(null);
  const [backendError, setBackendError] = useState(false);
  const [threshold, setThreshold] = useState<number>(2.0);
  const [fps, setFps] = useState<number>(0);

  // API Base Configuration with localStorage support
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>("");

  useEffect(() => {
    audioPeringatanRef.current = new Audio("/suara_ai.mp3");
    audioPeringatanRef.current.loop = true;
    audioAmanRef.current = new Audio("/suara_aman.mp3");
    audioAmanRef.current.loop = false;

    const savedUrl = localStorage.getItem("ISLAMIC_SMART_API_BASE");
    if (savedUrl) {
      setApiUrl(savedUrl);
      setCustomUrlInput(savedUrl);
    } else {
      setCustomUrlInput(DEFAULT_API_BASE);
    }

    return () => {
      if (audioPeringatanRef.current) {
        audioPeringatanRef.current.pause();
      }
      if (audioAmanRef.current) {
        audioAmanRef.current.pause();
      }
    };
  }, []);

  const handleSaveApiUrl = (newUrl: string) => {
    const trimmed = newUrl.trim().replace(/\/+$/, "");
    if (trimmed) {
      localStorage.setItem("ISLAMIC_SMART_API_BASE", trimmed);
      setApiUrl(trimmed);
    } else {
      localStorage.removeItem("ISLAMIC_SMART_API_BASE");
      setApiUrl(DEFAULT_API_BASE);
    }
    setShowApiModal(false);
    setBackendError(false);
  };

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
      setCameraError(null);
      const modeToUse = targetFacingMode || facingMode;

      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: modeToUse } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (err: any) {
        console.warn("Target camera mode failed, trying fallback:", err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play();
            setIsCameraActive(true);
          }
        } catch (fallbackErr: any) {
          console.error("Camera access error:", fallbackErr);
          setCameraError("Kamera/CCTV tidak dapat diakses atau izin ditolak.");
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
    startCamera();
    setThreshold(mode === "PEREMPUAN" ? 2.0 : 3.5);
    return () => {
      stopCamera();
    };
  }, [emergencyOff, mode]);

  const isProcessingRef = useRef(false);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (emergencyOff || !videoRef.current || !canvasRef.current || !isCameraActive || isProcessingRef.current) return;

    isProcessingRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isProcessingRef.current = false;
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.4);

    try {
      const res = await fetch(`${apiUrl}/detect/attire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64Image,
          mode: mode,
          threshold: threshold,
        }),
      });

      if (res.ok) {
        const data: AttireResponse = await res.json();
        setResult(data);
        setBackendError(false);

        if (data.pose_detected) {
          if (data.pelanggaran) {
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
      } else {
        setBackendError(true);
      }
    } catch (err) {
      setBackendError(true);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isCameraActive, mode, threshold, emergencyOff, apiUrl]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isCameraActive && !emergencyOff) {
      intervalId = setInterval(() => {
        captureAndAnalyze();
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [isCameraActive, emergencyOff, captureAndAnalyze]);

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
                Deteksi Aurat
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

          {/* Controls: Camera Switch & Emergency Off & API Settings */}
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
              onClick={() => setShowApiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-medium transition"
              title="Atur Server Backend Deteksi"
            >
              <Gear size={14} className="text-slate-600" />
              <span className="hidden md:inline">Server API</span>
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
        {/* Backend Warning / Information Banner */}
        {backendError && !emergencyOff && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <Warning size={22} className="text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Sensor Deteksi Backend Terputus / Tidak Terjangkau</p>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  {typeof window !== "undefined" && window.location.protocol === "https:" && apiUrl.startsWith("http://")
                    ? `Situs disajikan via HTTPS (Firebase Hosting), sehingga browser memblokir koneksi HTTP ke ${apiUrl} (Mixed Content Security Block).`
                    : `Gagal terhubung ke URL backend: ${apiUrl}. Pastikan server Python FastAPI (MediaPipe) sedang berjalan.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowApiModal(true)}
              className="px-3.5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Gear size={14} />
              <span>Atur URL Backend Server</span>
            </button>
          </div>
        )}

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

        {/* Full-Scale CCTV Screen Frame */}
        <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-900 shadow-md overflow-hidden aspect-[16/9] md:aspect-[16/8] flex items-center justify-center">
          <canvas ref={canvasRef} className="hidden" />

          {/* HUD Top Bar */}
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 z-20 flex items-center justify-between pointer-events-none text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/90 text-white border border-slate-700 font-medium">
                <span className={`size-2 rounded-full ${isCameraActive && !emergencyOff ? "bg-emerald-500" : "bg-slate-500"}`} />
                MONITOR KIOSK #01
              </span>
              <span className="text-slate-300">MODE: {mode}</span>
              <span className="text-slate-400 text-[11px]">[{facingMode === "user" ? "KAMERA DEPAN" : "KAMERA BELAKANG"}]</span>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-emerald-400" />
                PRIVACY-FIRST CV ENGINE
              </span>
              {isCameraActive && !emergencyOff && (
                <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-white font-bold">
                  {fps} FPS
                </span>
              )}
            </div>
          </div>

          {/* Video Stream & Realtime Overlay */}
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-contain ${!isCameraActive || emergencyOff ? "hidden" : ""}`}
            />

            {result?.annotated_image && !emergencyOff && (
              <img
                src={result.annotated_image}
                alt="Feed AI Pose Overlay"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
            )}

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

      {/* Modal Settings Server API */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Gear size={18} className="text-emerald-600" />
                <span>Pengaturan Server Backend Deteksi</span>
              </h3>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Fitur deteksi aurat &amp; rakaat sholat memerlukan server backend Python (FastAPI + MediaPipe).
              Saat di-host di Firebase (HTTPS), browser memblokir koneksi HTTP ke <code>localhost</code>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                URL Backend Server (HTTPS / ngrok / Cloud)
              </label>
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://xxxx.ngrok-free.app atau https://api.domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Jalankan di terminal laptop Anda: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">ngrok http 8000</code> lalu salin URL HTTPS-nya di sini.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleSaveApiUrl("")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
              >
                Reset (Default)
              </button>
              <button
                onClick={() => handleSaveApiUrl(customUrlInput)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Simpan URL
              </button>
            </div>
          </div>
        </div>
      )}

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

