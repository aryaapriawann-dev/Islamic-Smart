"use client";

import React from "react";
import Link from "next/link";
import { Eye, HandPointing, ShieldCheck } from "@phosphor-icons/react";

export default function AboutIhsan() {
  return (
    <main className="min-h-screen bg-[#fdfbf7] text-zinc-900 flex flex-col justify-between selection:bg-amber-100">
      {/* Stitch Design Header */}
      <header className="relative bg-[#064e3b] geometric-bg text-amber-100 py-12 px-4 shadow-lg border-b border-amber-600/30 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-200 tracking-wider drop-shadow-md">
          About Ihsan.id
        </h1>
      </header>

      {/* Main Content Area: 3 Cards */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Card 1: Visi Kami */}
          <div className="rounded-3xl bg-[#fdfbf7] border border-amber-600/30 p-8 shadow-md hover:shadow-xl transition flex flex-col items-center text-center space-y-5">
            <div className="size-16 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center shadow-inner">
              <Eye size={36} weight="duotone" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-zinc-900">
              Visi Kami
            </h2>

            <p className="text-xs text-zinc-600 leading-relaxed font-sans">
              Visi kami adalah mendukung kekhusyukan dan kesucian masjid dengan menyediakan alat bantu yang tenang dan bermartabat untuk mengingatkan tentang tata krama berpakaian sopan, membantu dalam ibadah, dan memberikan data kunjungan yang bermanfaat tanpa mengganggu privasi.
            </p>
          </div>

          {/* Card 2: Panduan Penggunaan */}
          <div className="rounded-3xl bg-[#fdfbf7] border border-amber-600/30 p-8 shadow-md hover:shadow-xl transition flex flex-col items-center text-center space-y-5">
            <div className="size-16 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center shadow-inner">
              <HandPointing size={36} weight="duotone" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-zinc-900">
              Panduan Penggunaan
            </h2>

            <p className="text-xs text-zinc-600 leading-relaxed font-sans">
              Ihsan.id berfungsi sebagai kios non-intrusif yang terletak di area masjid. Pengunjung dapat berinteraksi dengan layar sentuh untuk mengakses informasi waktu salat, panduan tata krama, dan statistik pengunjung secara real-time.
            </p>
          </div>

          {/* Card 3: Privasi Pengguna */}
          <div className="rounded-3xl bg-[#fdfbf7] border border-amber-600/30 p-8 shadow-md hover:shadow-xl transition flex flex-col items-center text-center space-y-5">
            <div className="size-16 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center shadow-inner">
              <ShieldCheck size={36} weight="duotone" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-zinc-900">
              Privasi Pengguna
            </h2>

            <p className="text-xs text-zinc-600 leading-relaxed font-sans">
              Kami sangat menghargai privasi Anda. Ihsan.id dirancang dengan prinsip transparansi. Tidak ada data pribadi, gambar, atau informasi identifikasi apa pun yang disimpan, direkam, atau dibagikan. Sistem hanya menghitung statistik kunjungan secara anonim.
            </p>
          </div>
        </div>

        {/* Stitch Primary Green Action Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#047857] hover:bg-emerald-800 text-white font-serif font-bold text-sm shadow-xl transition border border-emerald-500/40"
          >
            Kembali ke Menu Utama
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-zinc-500 border-t border-amber-950/10">
        &copy; {new Date().getFullYear()} Ihsan.id. Calm. Modest. Connected.
      </footer>
    </main>
  );
}
