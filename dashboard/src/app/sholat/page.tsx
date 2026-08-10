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
  Gear,
} from "@phosphor-icons/react";
import ThreeBackground from "../components/ThreeBackground";
import ThreeRakaatVisualizer from "../components/ThreeRakaatVisualizer";

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
  annotated_image?: string;
}

const PRAYERS = [
  { id: "SUBUH", name: "Subuh", rakaat: 2 },
  { id: "ZUHUR", name: "Dzuhur", rakaat: 4 },
  { id: "ASHAR", name: "Ashar", rakaat: 4 },
  { id: "MAGHRIB", name: "Maghrib", rakaat: 3 },
  { id: "ISYA", name: "Isya", rakaat: 4 },
  { id: "SUNNAH", name: "Sunnah", rakaat: 2 },
];

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function PrayerAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedPrayer, setSelectedPrayer] = useState(PRAYERS[0]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [emergencyOff, setEmergencyOff] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<RakaatResponse | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [backendError, setBackendError] = useState(false);

  // API Base Configuration with localStorage support
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>("");

  useEffect(() => {
    const savedUrl = localStorage.getItem("ISLAMIC_SMART_API_BASE");
    if (savedUrl) {
      setApiUrl(savedUrl);
      setCustomUrlInput(savedUrl);
    } else {
      setCustomUrlInput(DEFAULT_API_BASE);
    }
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
      } catch (err) {
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
    startCamera();
    return () => {
      stopCamera();
    };
  }, [emergencyOff, startCamera]);

  const handleStartSession = async () => {
    if (emergencyOff) return;
    const newSessionId = `SESSION-${Date.now()}`;
    setSessionId(newSessionId);

    try {
      const res = await fetch(`${apiUrl}/detect/rakaat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: newSessionId,
          prayer_type: selectedPrayer.id,
          max_rakaat: selectedPrayer.rakaat,
        }),
      });

      if (res.ok) {
        setIsSessionActive(true);
        setBackendError(false);
      } else {
        setBackendError(true);
      }
    } catch (err) {
      console.warn("Gagal terhubung ke backend sholat:", err);
      setBackendError(true);
      setIsSessionActive(false);
    }
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setStatus(null);
  };

  const isProcessingRef = useRef(false);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);

  const processFrame = useCallback(async () => {
    if (emergencyOff || !isSessionActive || !sessionId || !videoRef.current || !canvasRef.current || isProcessingRef.current) return;

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
      const res = await fetch(`${apiUrl}/detect/rakaat/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          image_base64: base64Image,
        }),
      });

      if (res.ok) {
        const data: RakaatResponse = await res.json();
        setStatus(data);
        setBackendError(false);

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
      console.warn("Backend poll error:", err);
      setBackendError(true);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isSessionActive, sessionId, emergencyOff, apiUrl]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSessionActive && isCameraActive && !emergencyOff) {
      intervalId = setInterval(() => {
        processFrame();
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [isSessionActive, isCameraActive, emergencyOff, processFrame]);

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

          {/* Camera & Server Controls */}
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

      {/* Main Content Area */}
      <section className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: CCTV Video Feed */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {backendError && !emergencyOff && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <Warning size={22} className="text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Sensor Deteksi Sholat Terputus / Backend Offline</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                    {typeof window !== "undefined" && window.location.protocol === "https:" && apiUrl.startsWith("http://")
                      ? `Website disajikan via HTTPS (Firebase Hosting), sehingga browser memblokir koneksi HTTP ke ${apiUrl} (Mixed Content Security Block).`
                      : `Gagal terhubung ke URL backend: ${apiUrl}. Pastikan server Python FastAPI berjalan.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApiModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
              >
                <Gear size={14} />
                <span>Atur URL Server API</span>
              </button>
            </div>
          )}

          {emergencyOff && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center gap-3">
              <LockKey size={18} className="text-slate-600" />
              <span>
                Status Asisten Sholat: Dinonaktifkan oleh Admin. Anda tetap dapat melaksanakan ibadah sholat secara mandiri.
              </span>
            </div>
          )}

          <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-900 shadow-md overflow-hidden aspect-[16/9] flex items-center justify-center">
            <canvas ref={canvasRef} className="hidden" />

            {/* HUD Top Bar */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 z-20 flex items-center justify-between pointer-events-none text-xs font-mono">
              <div className="flex items-center gap-3 text-slate-300">
                <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-medium">
                  KIOSK SHOLAT #02
                </span>
                <span>SHOLAT: {selectedPrayer.name}</span>
                <span className="text-slate-400 text-[11px]">[{facingMode === "user" ? "KAMERA DEPAN" : "KAMERA BELAKANG"}]</span>
              </div>

              {isSessionActive && !emergencyOff && (
                <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-white font-bold">
                  {fps} FPS
                </span>
              )}
            </div>

            {/* Main Video Frame */}
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 aspect-video lg:aspect-[16/9] w-full">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {status?.annotated_image && !emergencyOff && (
                <img
                  src={status.annotated_image}
                  alt="Feed AI Rakaat Pose"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                />
              )}

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
        <div className="flex justify-center items-center gap-6 font-medium mb-1">
          <Link href="/bantuan" className="hover:text-slate-900 transition">Panduan Doa</Link>
          <Link href="/statistik" className="hover:text-slate-900 transition">Statistik Pengunjung</Link>
          <Link href="/bantuan" className="hover:text-slate-900 transition">Bantuan</Link>
        </div>
      </footer>
    </main>
  );
}
