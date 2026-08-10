"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChartBar,
  Info,
  Question,
  ShieldCheck,
  X,
  TrendUp,
  ShirtFolded,
  HandsPraying,
  LockKey,
} from "@phosphor-icons/react";
import ThreeBackground from "./components/ThreeBackground";
import Interactive3DCard from "./components/Interactive3DCard";

export default function Home() {
  const [showQuickHelp, setShowQuickHelp] = useState(false);

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between overflow-hidden selection:bg-emerald-100 selection:text-emerald-900 bg-clean-grid">
      {/* 3D WebGL Background */}
      <ThreeBackground className="fixed inset-0 pointer-events-none z-0 opacity-40" />

      {/* Top Header */}
      <header className="relative z-10 py-5 px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Islamic Smart Assistance Logo" className="h-14 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Islamic Smart
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Assistance • Privacy First
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowQuickHelp(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition text-xs font-medium"
            title="Bantuan Cepat"
          >
            <Question size={16} className="text-emerald-600" />
            <span>Panduan Kiosk</span>
          </button>
        </div>
      </header>

      {/* Hero Header & 3D Interactive Feature Section */}
      <section className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center space-y-10">
        {/* Title Badge & Hero Typography */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium shadow-xs">
            <LockKey size={15} className="text-emerald-600" />
            <span>Pemrosesan Lokal In-Memory • Bebas Penyimpanan Foto</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Asisten Digital Masjid yang Sopan & Menjaga Privasi
          </h2>

          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Membantu kesesuaian pakaian jamaah di area ibadah serta menghitung rakaat sholat pribadi secara otomatis tanpa menyimpan data identitas.
          </p>
        </div>

        {/* 3D Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <Interactive3DCard
            title="Cek Kesesuaian Pakaian"
            description="Bimbingan visual privat untuk mengecek standar aurat dan kerapian pakaian sebelum memasuki area utama masjid."
            badge="Mulai Pemeriksaan"
            iconType="shirt"
            href="/pakaian"
          />

          <Interactive3DCard
            title="Sesi Sholat Pribadi"
            description="Penghitung rakaat visual privat dan pedoman gerakan sholat real-time tanpa pengenalan identitas."
            badge="Mulai Asisten Sholat"
            iconType="prayer"
            href="/sholat"
          />
        </div>

        {/* Quick Navigation Pills */}
        <div className="flex flex-wrap justify-center items-center gap-3 text-xs z-10 pt-2">
          <Link
            href="/statistik"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-xs hover:border-emerald-500 hover:text-emerald-700 transition"
          >
            <ChartBar size={16} className="text-emerald-600" />
            <span>Statistik Pengunjung</span>
          </Link>
          <Link
            href="/tentang"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-xs hover:border-emerald-500 hover:text-emerald-700 transition"
          >
            <Info size={16} className="text-emerald-600" />
            <span>Tentang Ihsan.id</span>
          </Link>
          <Link
            href="/bantuan"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-xs hover:border-emerald-500 hover:text-emerald-700 transition"
          >
            <Question size={16} className="text-emerald-600" />
            <span>Bantuan</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-xs hover:border-emerald-500 hover:text-emerald-700 transition"
          >
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Admin Dasbor</span>
          </Link>
        </div>
      </section>

      {/* Quick Help Modal */}
      {showQuickHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative space-y-5 text-slate-900">
            <button
              onClick={() => setShowQuickHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Panduan Ringkas Kiosk</h3>
              <p className="text-xs text-slate-500">Penggunaan Layanan Ihsan.id Digital</p>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <ShirtFolded size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Pemeriksaan Pakaian</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Tekan tombol "Cek Kesesuaian Pakaian" untuk menganalisis kerapian aurat menggunakan kamera secara steril & privat.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <HandsPraying size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Asisten Sholat</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Gunakan fitur ini untuk mendeteksi rakaat sholat pribadi dan membantu Anda tetap fokus tanpa gangguan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <TrendUp size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Statistik Kehadiran</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Akses data kehadiran jamaah dan laporan analitik masjid melalui menu di bagian bawah.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQuickHelp(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
            >
              Mengerti & Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} Ihsan.id • Respectful Digital Mosque Infrastructure.
      </footer>
    </main>
  );
}
