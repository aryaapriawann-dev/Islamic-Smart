"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShirtFolded,
  HandsPraying,
  ChartBar,
  Info,
  Question,
  ShieldCheck,
  X,
  TrendUp,
} from "@phosphor-icons/react";

export default function Home() {
  const [showQuickHelp, setShowQuickHelp] = useState(false);

  return (
    <main className="min-h-screen bg-[#fdfbf7] text-zinc-900 flex flex-col justify-between selection:bg-amber-100">
      {/* Top Header Section - Stitch Design */}
      <header className="relative bg-[#064e3b] geometric-bg text-amber-100 py-10 px-4 shadow-lg border-b border-amber-600/30 text-center">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-4xl font-serif font-bold tracking-wider text-amber-200 drop-shadow-md">
            Ihsan.id
          </h1>
          <button
            onClick={() => setShowQuickHelp(true)}
            className="p-2.5 rounded-full bg-emerald-900/60 border border-amber-500/40 text-amber-200 hover:bg-emerald-800/80 transition"
            title="Bantuan Cepat"
          >
            <Question size={20} weight="bold" />
          </button>
        </div>
      </header>

      {/* Main Content Cards Section */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Card 1: Cek Kesesuaian Pakaian */}
          <Link
            href="/pakaian"
            className="group rounded-3xl bg-white border border-amber-600/20 p-8 shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-5 cursor-pointer relative overflow-hidden"
          >
            <div className="size-20 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-inner border border-amber-200/60 group-hover:scale-110 transition duration-300">
              <ShirtFolded size={44} weight="duotone" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-zinc-900 group-hover:text-[#064e3b] transition">
                Cek Kesesuaian Pakaian
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
                Dapatkan bimbingan visual untuk memastikan pakaian yang sopan dan pantas saat berada di masjid.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#064e3b] text-white text-xs font-semibold shadow-md group-hover:bg-emerald-600 transition">
                <span>Mulai Pemeriksaan</span>
              </span>
            </div>
          </Link>

          {/* Card 2: Sesi Sholat Pribadi */}
          <Link
            href="/sholat"
            className="group rounded-3xl bg-white border border-amber-600/20 p-8 shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-5 cursor-pointer relative overflow-hidden"
          >
            <div className="size-20 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-inner border border-amber-200/60 group-hover:scale-110 transition duration-300">
              <HandsPraying size={44} weight="duotone" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-zinc-900 group-hover:text-[#064e3b] transition">
                Sesi Sholat Pribadi
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
                Panduan langkah demi langkah untuk melaksanakan sholat pribadi dengan khusyuk.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#064e3b] text-white text-xs font-semibold shadow-md group-hover:bg-emerald-600 transition">
                <span>Mulai Sesi Sholat</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Navigation Pills */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-3 text-xs">
          <Link
            href="/statistik"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-amber-600/20 text-zinc-700 font-semibold shadow-sm hover:border-emerald-600 hover:text-emerald-700 transition"
          >
            <ChartBar size={16} className="text-emerald-700" />
            <span>Statistik Pengunjung</span>
          </Link>
          <Link
            href="/tentang"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-amber-600/20 text-zinc-700 font-semibold shadow-sm hover:border-emerald-600 hover:text-emerald-700 transition"
          >
            <Info size={16} className="text-emerald-700" />
            <span>Tentang Ihsan.id</span>
          </Link>
          <Link
            href="/bantuan"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-amber-600/20 text-zinc-700 font-semibold shadow-sm hover:border-emerald-600 hover:text-emerald-700 transition"
          >
            <Question size={16} className="text-emerald-700" />
            <span>Bantuan</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-amber-600/20 text-zinc-700 font-semibold shadow-sm hover:border-emerald-600 hover:text-emerald-700 transition"
          >
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>Admin Dasbor</span>
          </Link>
        </div>
      </section>

      {/* Quick Help Overlay Modal - Stitch Screen 5 */}
      {showQuickHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#fdfbf7] rounded-3xl border-2 border-amber-600/50 shadow-2xl p-6 relative space-y-6">
            <button
              onClick={() => setShowQuickHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-100 text-zinc-700 hover:bg-amber-200 transition"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-serif font-bold text-zinc-900">Quick Help</h3>
              <p className="text-xs text-zinc-500">Panduan Ringkas Penggunaan Kiosk</p>
            </div>

            <div className="space-y-4 text-xs font-medium text-zinc-700">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-amber-600/20 shadow-sm">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShirtFolded size={22} />
                </div>
                <span>Tekan "Cek Pakaian" untuk mengecek kesesuaian aurat secara privat.</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-amber-600/20 shadow-sm">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <HandsPraying size={22} />
                </div>
                <span>Tekan "Sesi Sholat" untuk memulai penghitung rakaat pribadi.</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-amber-600/20 shadow-sm">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendUp size={22} />
                </div>
                <span>Lihat statistik kehadiran jamaah di tombol bagian bawah.</span>
              </div>
            </div>

            <button
              onClick={() => setShowQuickHelp(false)}
              className="w-full py-3 rounded-2xl bg-[#064e3b] hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition border border-amber-400/40"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-500 border-t border-amber-950/10">
        &copy; {new Date().getFullYear()} Ihsan.id. Calm. Modest. Connected.
      </footer>
    </main>
  );
}
