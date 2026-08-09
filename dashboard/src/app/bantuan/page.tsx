"use client";

import React from "react";
import Link from "next/link";
import { ShirtFolded, HandsPraying, TrendUp, ArrowLeft } from "@phosphor-icons/react";

export default function HelpScreen() {
  return (
    <main className="min-h-screen bg-[#fdfbf7] text-zinc-900 flex flex-col justify-between selection:bg-amber-100">
      <header className="border-b border-amber-950/10 py-5 px-6 sticky top-0 z-20 bg-[#fdfbf7]">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            href="/"
            className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition"
          >
            <ArrowLeft size={18} />
          </Link>

          <span className="text-xl font-serif font-bold text-zinc-900 tracking-wide">
            Ihsan.id Help & Guide
          </span>

          <div className="w-8" />
        </div>
      </header>

      {/* Stitch Modal Card Container */}
      <section className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full bg-[#fdfbf7] rounded-3xl border-2 border-amber-600/50 shadow-2xl p-8 space-y-6 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-zinc-900">Quick Help</h1>
            <p className="text-xs text-zinc-500">Panduan Ringkas Penggunaan Kiosk Digital</p>
          </div>

          <div className="space-y-4 text-xs font-medium text-zinc-700 text-left">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-amber-600/20 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                <ShirtFolded size={24} />
              </div>
              <span>Tap to check dress modesty.</span>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-amber-600/20 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                <HandsPraying size={24} />
              </div>
              <span>Tap to start a private prayer count.</span>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-amber-600/20 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                <TrendUp size={24} />
              </div>
              <span>View public stats at the bottom.</span>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 rounded-2xl bg-[#064e3b] hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition border border-amber-400/40 block"
          >
            Mengerti
          </Link>
        </div>
      </section>

      <footer className="py-5 text-center text-xs text-zinc-500 border-t border-amber-950/10">
        &copy; {new Date().getFullYear()} Ihsan.id. Calm. Modest. Connected.
      </footer>
    </main>
  );
}
