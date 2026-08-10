"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Question, CaretDown, ShieldCheck, LockKey } from "@phosphor-icons/react";

const FAQS = [
  {
    q: "Apakah foto atau rekaman video saya disimpan saat pemeriksaan pakaian?",
    a: "Sama sekali TIDAK. Sistem Ihsan.id memproses gambar secara langsung di memori sementara (in-memory) selama beberapa milidetik untuk menghitung proporsi pakaian, lalu frame gambar langsung dihapus permanen. Tidak ada foto, video, atau identitas wajah yang disimpan.",
  },
  {
    q: "Bagaimana jika kamera kiosk atau backend mengalami gangguan?",
    a: "Sistem mengadopsi prinsip Graceful Degradation. Jika terjadi kendala koneksi atau kamera dinonaktifkan emergency off, layar kiosk akan menampilkan instruksi ramah dan jamaah tetap dipersilakan masuk tanpa ada hambatan.",
  },
  {
    q: "Bagaimana cara kerja asisten rakaat sholat pribadi?",
    a: "Asisten rakaat mendeteksi transisi pose tubuh (berdiri, ruku, sujud, duduk) menggunakan AI pose estimation. Jika jumlah rakaat melebihi target sholat yang dipilih, layar akan memberikan pengingat sopan untuk melakukan Sujud Sahwi.",
  },
  {
    q: "Siapa yang dapat melihat laporan kunjungan masjid?",
    a: "Laporan kunjungan hanya berisi angka agregat jamaah (misalnya total pengunjung per waktu sholat) dan dapat diunduh oleh Admin masjid dalam format CSV Data Raw atau Laporan Cetak PDF.",
  },
];

export default function BantuanPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

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
        <div className="space-y-2 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h1>
          <p className="text-xs text-slate-500">
            Informasi lengkap seputar privasi, keamanan, dan panduan penggunaan kiosk digital Ihsan.id.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-slate-900 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  <CaretDown
                    size={16}
                    className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} Ihsan.id • Pusat Informasi Kiosk Digital.
      </footer>
    </main>
  );
}
