"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FilePdf,
  CalendarBlank,
  ArrowLeft,
  FileCsv,
} from "@phosphor-icons/react";

interface VisitorSummary {
  today_count: number;
  total_visitors: number;
  peak_prayer: string;
  prayer_breakdown: { [key: string]: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function VisitorStatistics() {
  const [summary, setSummary] = useState<VisitorSummary>({
    today_count: 0,
    total_visitors: 0,
    peak_prayer: "-",
    prayer_breakdown: {
      SUBUH: 0,
      ZUHUR: 0,
      ASHAR: 0,
      MAGHRIB: 0,
      ISYA: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/count/visitor/summary`)
      .then((res) => res.json())
      .then((data) => {
        const breakdown = data.prayer_breakdown || {
          SUBUH: 0,
          ZUHUR: 0,
          ASHAR: 0,
          MAGHRIB: 0,
          ISYA: 0,
        };

        const peakEntry = Object.entries(breakdown).reduce(
          (max, [key, val]) =>
            (val as number) > (max[1] as number) ? [key, val] : max,
          ["", 0]
        );

        const prayerTimeMap: Record<string, string> = {
          SUBUH: "04:30 - 05:30 (Subuh)",
          ZUHUR: "12:00 - 13:00 (Zuhur)",
          ASHAR: "15:00 - 16:00 (Ashar)",
          MAGHRIB: "18:00 - 19:00 (Maghrib)",
          ISYA: "19:15 - 20:15 (Isya)",
        };

        setSummary({
          today_count: data.total_today || 0,
          total_visitors: data.total_month || 0,
          peak_prayer:
            (peakEntry[1] as number) > 0
              ? prayerTimeMap[peakEntry[0] as string] || peakEntry[0] as string
              : "Belum ada data",
          prayer_breakdown: breakdown,
        });
      })
      .catch(() => {
        console.log("Backend tidak tersedia");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = (format: string) => {
    const today = new Date().toISOString().split("T")[0];
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/report/visitor";
    form.target = "_blank";

    const inputStart = document.createElement("input");
    inputStart.type = "hidden";
    inputStart.name = "startDate";
    inputStart.value = "2024-01-01";
    form.appendChild(inputStart);

    const inputEnd = document.createElement("input");
    inputEnd.type = "hidden";
    inputEnd.name = "endDate";
    inputEnd.value = today;
    form.appendChild(inputEnd);

    const inputFormat = document.createElement("input");
    inputFormat.type = "hidden";
    inputFormat.name = "format";
    inputFormat.value = format === "pdf" ? "html" : "csv";
    form.appendChild(inputFormat);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const maxVal = Math.max(
    ...Object.values(summary.prayer_breakdown),
    1
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-100 bg-clean-grid">
      <header className="border-b border-slate-200 py-4 px-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Islamic Smart Assistance Logo" className="h-8 w-auto" />
            <span className="text-base font-bold text-slate-900">
              Islamic Smart
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      <section className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Statistik Kunjungan Jamaah
          </h1>
          <p className="text-xs text-slate-500">
            Penghitungan otomatis teragregasi tanpa identifikasi wajah.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-xs">
          <CalendarBlank size={16} className="text-slate-500" />
          <span>Rentang Waktu: Hari Ini (Real-Time Jamaah)</span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-xs space-y-6 text-center">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
              Distribusi Kunjungan Jamaah Per Waktu Sholat
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : summary.today_count.toLocaleString("id-ID")} Jamaah Hari Ini
            </h2>
            <p className="text-xs text-emerald-700 font-semibold pt-1">
              Puncak Kunjungan: {summary.peak_prayer}
            </p>
          </div>

          <div className="h-48 rounded-xl bg-slate-50 border border-slate-200 p-6 flex items-end justify-between gap-4">
            {[
              { time: "Subuh", val: summary.prayer_breakdown.SUBUH },
              { time: "Zuhur", val: summary.prayer_breakdown.ZUHUR },
              { time: "Ashar", val: summary.prayer_breakdown.ASHAR },
              { time: "Maghrib", val: summary.prayer_breakdown.MAGHRIB },
              { time: "Isya", val: summary.prayer_breakdown.ISYA },
            ].map((item) => (
              <div key={item.time} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-bold text-slate-900">{item.val}</span>
                <div
                  className="w-full rounded-t-lg bg-slate-900 hover:bg-emerald-600 transition-all duration-300"
                  style={{ height: maxVal > 0 ? `${(item.val / maxVal) * 85}%` : "0%" }}
                />
                <span className="text-xs text-slate-600 font-semibold">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          <button
            onClick={() => handleDownloadReport("pdf")}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <FilePdf size={18} />
            <span>Unduh Laporan PDF</span>
          </button>
          <button
            onClick={() => handleDownloadReport("csv")}
            className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <FileCsv size={18} />
            <span>Unduh Format CSV Raw</span>
          </button>
        </div>
      </section>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} Ihsan.id • Data teragregasi secara anonim.
      </footer>
    </main>
  );
}
