"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, LockKey, Heart, Question } from "@phosphor-icons/react";

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-100 bg-clean-grid">
      {/* Header */}
      <header className="border-b border-slate-200 py-4 px-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Islamic Smart Assistance Logo" className="h-8 w-auto" />
            <span className="text-base font-bold text-slate-900">Islamic Smart Assistance</span>
          </div>
          <div className="w-8" />
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-8">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <LockKey size={14} className="text-emerald-600" />
            Privasi & Martabat Jamaah Pertama
          </span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Visi & Standar Operasional Ihsan.id
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
            Asisten digital masjid modern yang memadukan teknologi Computer Vision ramah privasi untuk mendukung kekhusyu'an dan kerapian ibadah.
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              1. Jaminan Bebas Penyimpanan Foto (In-Memory Processing)
            </h3>
            <p>
              Seluruh pemrosesan deteksi pakaian dan rakaat sholat dilakukan secara real-time di dalam memori server (in-memory) dan frame gambar langsung dibuang detik itu juga. Tidak ada database foto atau rekaman video yang tersimpan secara permanen.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Heart size={18} className="text-emerald-600" />
              2. Bahasa Pengingat yang Sopan & Tidak Menghakimi
            </h3>
            <p>
              Peringatan yang ditampilkan di layar kiosk dirancang khusus sebagai panduan yang lembut ("Pengingat Sopan" & "Perlu Sujud Sahwi") untuk menjaga rasa hormat dan martabat setiap jamaah yang hadir.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Question size={18} className="text-emerald-600" />
              3. Graceful Degradation & Emergency Control
            </h3>
            <p>
              Apabila terdapat kendala teknis pada sistem deteksi atau kamera dimatikan oleh admin, kiosk akan beralih ke mode ramah jamaah tanpa memblokir atau menghambat akses jamaah ke dalam masjid.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} Ihsan.id • Modest. Calm. Connected.
      </footer>
    </main>
  );
}
