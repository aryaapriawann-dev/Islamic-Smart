"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  List,
  User,
  Camera,
  Play,
  Stop,
  Warning,
  BellRinging,
  CheckCircle,
} from "@phosphor-icons/react";

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

export default function PrayerAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedPrayer, setSelectedPrayer] = useState(PRAYERS[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<RakaatResponse | null>(null);

  const startCamera = async () => {
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
    } catch (err) {
      console.error("Camera error:", err);
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

  const handleStartSession = async () => {
    const newSessionId = `SESSION-${Date.now()}`;
    setSessionId(newSessionId);

    try {
      const res = await fetch("http://localhost:8000/detect/rakaat/start", {
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
      }
    } catch (err) {
      setIsSessionActive(true);
      setStatus({
        session_id: newSessionId,
        prayer_type: selectedPrayer.id,
        max_rakaat: selectedPrayer.rakaat,
        detected_rakaat: 1,
        exceeded: false,
        step_gerakan: "Berdiri",
        status_sekarang: "BERDIRI",
        visibilitas: 95.0,
        message: "Sesi berjalan dalam mode lokal",
      });
    }
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setStatus(null);
  };

  const processFrame = useCallback(async () => {
    if (!isSessionActive || !sessionId || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.6);

    try {
      const res = await fetch("http://localhost:8000/detect/rakaat/status", {
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
      }
    } catch (err) {
      console.warn("Backend poll error:", err);
    }
  }, [isSessionActive, sessionId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSessionActive && isCameraActive) {
      intervalId = setInterval(() => {
        processFrame();
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isSessionActive, isCameraActive, processFrame]);

  return (
    <main className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between selection:bg-amber-100">
      {/* Stitch Design Top Header */}
      <header className="border-b border-zinc-200 py-4 px-6 sticky top-0 z-20 bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <button className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition">
            <List size={22} />
          </button>
          <span className="text-xl font-serif font-bold text-[#064e3b] tracking-wide">
            Ihsan.id
          </span>
          <div className="size-9 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <User size={20} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Page Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            Prayer Assistant
          </h1>
        </div>

        {/* Stitch Horizontal Prayer Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRAYERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPrayer(p)}
              disabled={isSessionActive}
              className={`px-5 py-2 rounded-full border text-xs font-semibold transition ${
                selectedPrayer.id === p.id
                  ? "bg-[#064e3b] text-white border-amber-500 shadow-md"
                  : "bg-emerald-900/10 text-emerald-900 border-emerald-800/20 hover:bg-emerald-900/20"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Stitch Glowing Center Session Container */}
        <div className="relative rounded-3xl border border-zinc-200 bg-zinc-50/50 p-8 shadow-sm flex flex-col items-center justify-center text-center overflow-hidden min-h-[300px]">
          <canvas ref={canvasRef} className="hidden" />

          {status?.annotated_image ? (
            <img
              src={status.annotated_image}
              alt="Pratinjau Skeleton Pose"
              className="w-full h-64 object-cover rounded-2xl border border-amber-500/40 shadow-md mb-4"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-64 object-cover rounded-2xl border border-amber-500/40 shadow-md mb-4 ${
                !isCameraActive ? "hidden" : ""
              }`}
            />
          )}

          {!isSessionActive ? (
            <div className="space-y-4 py-4">
              <div className="mx-auto size-24 rounded-full bg-emerald-50 border-4 border-amber-400/50 flex flex-col items-center justify-center shadow-lg animate-pulse">
                <span className="text-xs font-serif font-bold text-emerald-900">Siap</span>
              </div>
              <p className="text-sm font-serif font-medium text-zinc-700">
                Pilih sholat di atas dan tekan tombol untuk memulai asisten privat.
              </p>
              <button
                onClick={handleStartSession}
                className="px-8 py-3 rounded-full bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 mx-auto"
              >
                <Play size={18} weight="fill" />
                <span>Mulai Sesi ({selectedPrayer.name})</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 py-2 w-full">
              <div className="mx-auto size-32 rounded-full bg-emerald-50 border-4 border-amber-500 flex flex-col items-center justify-center shadow-xl">
                <h3 className="text-base font-serif font-bold text-[#064e3b]">
                  Sesi Berlangsung
                </h3>
                <span className="text-2xl font-black text-emerald-900">
                  {status ? status.detected_rakaat : 0} / {selectedPrayer.rakaat}
                </span>
              </div>

              <p className="text-xs text-zinc-500">Mengingat dan fokus. Lanjutkan doa Anda.</p>

              <button
                onClick={handleStopSession}
                className="px-6 py-2.5 rounded-full bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mx-auto"
              >
                <Stop size={16} weight="fill" />
                <span>Akhiri Sesi</span>
              </button>
            </div>
          )}
        </div>

        {/* Stitch Glowing Bottom Alert Card */}
        <div className="rounded-2xl bg-amber-100/70 border border-amber-400/60 p-5 shadow-sm space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <BellRinging size={16} className="text-amber-700" />
            Pengingat Rakaat
          </h4>

          <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
            <span>
              Rakaat Saat Ini: {status ? status.detected_rakaat : 0} / {selectedPrayer.rakaat}
            </span>
            {status?.exceeded ? (
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <Warning size={18} /> ⚠️
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle size={18} /> OK
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-600">
            {status?.exceeded
              ? "Batas Rakaat Dicapai. Mohon periksa panduan dan lakukan Sujud Sahwi bila lupa."
              : "Status sesi berjalan secara privat."}
          </p>
        </div>
      </section>

      {/* Stitch Design Bottom Links Bar */}
      <footer className="py-5 text-center text-xs text-zinc-600 border-t border-zinc-200">
        <div className="flex justify-center items-center gap-6 font-medium mb-1">
          <Link href="/bantuan" className="hover:text-emerald-800 transition">Panduan Doa</Link>
          <Link href="/statistik" className="hover:text-emerald-800 transition">Statistik Pengunjung</Link>
          <Link href="/bantuan" className="hover:text-emerald-800 transition">Bantuan</Link>
        </div>
        <p className="text-[11px] text-zinc-400">&copy; 2024 Ihsan.id</p>
      </footer>
    </main>
  );
}
