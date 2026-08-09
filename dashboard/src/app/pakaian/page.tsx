"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Camera,
  ArrowLeft,
  GenderFemale,
  GenderMale,
  CheckCircle,
  Warning,
  Sliders,
  ArrowClockwise,
  User,
} from "@phosphor-icons/react";

interface AttireResponse {
  pose_detected: boolean;
  pelanggaran: boolean;
  persen_aurat: number;
  status: string;
  message?: string;
  threshold: number;
  annotated_image?: string;
}

export default function ModestDressCheck() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<"PEREMPUAN" | "LAKI-LAKI">("PEREMPUAN");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [result, setResult] = useState<AttireResponse | null>(null);
  const [backendError, setBackendError] = useState(false);
  const [threshold, setThreshold] = useState<number>(2.0);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Kamera tidak dapat diakses.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    setThreshold(mode === "PEREMPUAN" ? 2.0 : 3.5);
  }, [mode]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    setIsScanning(true);
    setBackendError(false);

    try {
      const res = await fetch("http://localhost:8000/detect/attire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64Image,
          mode: mode,
          threshold: threshold,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status: ${res.status}`);
      }

      const data: AttireResponse = await res.json();
      setResult(data);
    } catch (err) {
      console.warn("Backend FastAPI not available:", err);
      setBackendError(true);
    } finally {
      setIsScanning(false);
    }
  }, [isCameraActive, mode, threshold]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoScan && isCameraActive && !backendError) {
      intervalId = setInterval(() => {
        captureAndAnalyze();
      }, 2500);
    }
    return () => clearInterval(intervalId);
  }, [autoScan, isCameraActive, backendError, captureAndAnalyze]);

  return (
    <main className="min-h-screen bg-[#fdfbf7] text-zinc-900 flex flex-col justify-between selection:bg-amber-100">
      {/* Stitch Design Top Header */}
      <header className="border-b border-amber-950/10 bg-[#fdfbf7] py-4 px-6 sticky top-0 z-20">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="text-xl font-serif font-bold text-zinc-900 tracking-wide">
              Ihsan.id
            </span>
          </div>

          <h1 className="text-base font-serif font-bold text-zinc-800 tracking-wider hidden sm:block">
            Modest Dress Check
          </h1>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium">
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>Privat & Anonim</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content - Stitch Layout */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Column: Camera Box & Action Button */}
        <div className="md:col-span-6 flex flex-col items-center gap-5">
          <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-600/60 bg-zinc-900 shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <canvas ref={canvasRef} className="hidden" />

            {result?.annotated_image ? (
              <img
                src={result.annotated_image}
                alt="Pratinjau Skeleton & Highlight"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
              />
            )}

            {!isCameraActive && (
              <div className="p-6 text-center space-y-3">
                <div className="mx-auto size-14 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center">
                  <Camera size={28} />
                </div>
                <p className="text-xs font-medium text-emerald-200">
                  {cameraError || "Kamera Kiosk Offline"}
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-600 transition"
                >
                  Nyalakan Kamera
                </button>
              </div>
            )}
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-full border border-amber-200 text-xs font-semibold">
            <button
              onClick={() => setMode("PEREMPUAN")}
              className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition ${
                mode === "PEREMPUAN"
                  ? "bg-[#064e3b] text-white shadow"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <GenderFemale size={14} />
              <span>Putri</span>
            </button>
            <button
              onClick={() => setMode("LAKI-LAKI")}
              className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition ${
                mode === "LAKI-LAKI"
                  ? "bg-[#064e3b] text-white shadow"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <GenderMale size={14} />
              <span>Putra</span>
            </button>
          </div>

          {/* Stitch Primary Green Action Button */}
          <button
            onClick={captureAndAnalyze}
            disabled={!isCameraActive || isScanning}
            className="w-full max-w-md py-4 rounded-full bg-[#047857] hover:bg-emerald-800 disabled:opacity-50 text-white font-serif font-bold text-base shadow-xl transition border border-emerald-500/40 flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <ArrowClockwise size={20} className="animate-spin" />
                <span>Memproses Evaluasi...</span>
              </>
            ) : (
              <span>Cek Sekarang</span>
            )}
          </button>
        </div>

        {/* Right Column: Stitch Prominent Privacy & Guidance Panel */}
        <div className="md:col-span-6 flex items-center gap-6 pl-0 md:pl-4">
          {/* Gold Vertical Divider Line */}
          <div className="hidden md:block w-1 bg-amber-500/40 self-stretch rounded-full" />

          <div className="space-y-6 flex-1">
            <div className="size-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-sm">
              <User size={36} weight="duotone" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 leading-tight">
                {result?.message || "Silakan pastikan pakaian menutup aurat dengan sempurna."}
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                Saran privat untuk menjaga kesucian tempat ibadah.
              </p>
            </div>

            {/* Dynamic Feedback Metric Badge */}
            {result && (
              <div className="p-4 rounded-2xl bg-white border border-amber-600/20 shadow-md space-y-2 text-xs">
                <div className="flex justify-between items-center font-semibold">
                  <span>Hasil Evaluasi:</span>
                  <span className={result.pelanggaran ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                    {result.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Persentase Kulit Terekspos:</span>
                  <span className="font-bold text-zinc-900">{result.persen_aurat}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stitch Design Bottom Links Bar */}
      <footer className="py-5 text-center text-xs text-zinc-600 border-t border-amber-950/10">
        <div className="flex justify-center gap-6 font-medium">
          <Link href="/" className="hover:text-emerald-800 transition">Home</Link>
          <Link href="/sholat" className="hover:text-emerald-800 transition">Prayer Times</Link>
          <Link href="/statistik" className="hover:text-emerald-800 transition">Visitor Stats</Link>
          <Link href="/bantuan" className="hover:text-emerald-800 transition">Help</Link>
        </div>
      </footer>
    </main>
  );
}
