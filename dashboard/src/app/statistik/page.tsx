"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FilePdf,
  CalendarBlank,
  Users,
  TrendUp,
  ArrowLeft,
  Sparkle,
  DownloadSimple,
} from "@phosphor-icons/react";

interface VisitorSummary {
  today_count: number;
  total_visitors: number;
  peak_hour: string;
  weekly_trend: { day: string; count: number }[];
}

export default function VisitorStatistics() {
  const [summary, setSummary] = useState<VisitorSummary>({
    today_count: 1420,
    total_visitors: 15800,
    peak_hour: "12:00 - 13:00 (Zuhur)",
    weekly_trend: [
      { day: "Jan 1", count: 600 },
      { day: "Jan 15", count: 1300 },
      { day: "Feb 1", count: 1700 },
      { day: "Feb 15", count: 1750 },
      { day: "Mar 1", count: 2300 },
      { day: "Mar 15", count: 1600 },
      { day: "Apr 1", count: 550 },
    ],
  });

  const [dateRange, setDateRange] = useState("January 2024 - March 2024");

  useEffect(() => {
    fetch("http://localhost:8000/count/visitor/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.total_visitors) {
          setSummary((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        console.log("Using local initial summary state");
      });
  }, []);

  const handleDownloadPDF = () => {
    window.open("http://localhost:8000/api/report/visitor?format=pdf", "_blank");
  };

  return (
    <main className="min-h-screen bg-[#fdfbf7] text-zinc-900 flex flex-col justify-between selection:bg-amber-100">
      {/* Stitch Top Header */}
      <header className="border-b border-amber-950/10 py-5 px-6 sticky top-0 z-20 bg-[#fdfbf7]">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/"
            className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-[#064e3b] text-amber-300 flex items-center justify-center font-bold text-sm shadow">
              🕌
            </div>
            <span className="text-xl font-serif font-bold text-zinc-900 tracking-wide">
              Ihsan.id
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8 text-center">
        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">
            Visitor Statistics
          </h1>
        </div>

        {/* Date Range Selector Pill */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-semibold text-zinc-700 shadow-sm">
          <CalendarBlank size={16} className="text-amber-800" />
          <span>Date Range: {dateRange}</span>
          <span className="text-amber-800">▼</span>
        </div>

        {/* Stitch Large White Chart Card */}
        <div className="rounded-3xl bg-white border border-amber-600/20 p-8 shadow-xl space-y-6 text-center">
          <h2 className="text-2xl font-serif font-bold text-[#047857]">
            Total Visitors: {summary.total_visitors.toLocaleString()}
          </h2>

          {/* Curved SVG Area Chart */}
          <div className="relative w-full h-64 border-b border-zinc-200 flex items-end pt-4 pb-2 px-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 0,160 Q 100,80 200,60 T 400,60 T 500,20 T 600,80 T 700,160 L 700,200 L 0,200 Z"
                fill="url(#areaGradient)"
              />
              <path
                d="M 0,160 Q 100,80 200,60 T 400,60 T 500,20 T 600,80 T 700,160"
                fill="none"
                stroke="#047857"
                strokeWidth="3"
              />
              {/* Dots */}
              <circle cx="0" cy="160" r="4" fill="#047857" />
              <circle cx="116" cy="100" r="4" fill="#047857" />
              <circle cx="233" cy="60" r="4" fill="#047857" />
              <circle cx="350" cy="60" r="4" fill="#047857" />
              <circle cx="466" cy="20" r="5" fill="#047857" stroke="#fff" strokeWidth="2" />
              <circle cx="583" cy="80" r="4" fill="#047857" />
              <circle cx="700" cy="160" r="4" fill="#047857" />
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="grid grid-cols-7 text-[11px] text-zinc-500 font-medium pt-1">
            {summary.weekly_trend.map((item, idx) => (
              <span key={idx}>{item.day}</span>
            ))}
          </div>
        </div>

        {/* Stitch Download PDF Action Button */}
        <div>
          <button
            onClick={handleDownloadPDF}
            className="px-8 py-3.5 rounded-full bg-[#047857] hover:bg-emerald-800 text-white font-serif font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 mx-auto border border-emerald-500/40"
          >
            <span>Download PDF Report</span>
            <FilePdf size={20} weight="fill" className="text-amber-300" />
          </button>
        </div>
      </section>

      {/* Stitch Design Bottom Footer with Islamic Pattern */}
      <footer className="py-5 text-center text-[11px] text-zinc-500 border-t border-amber-950/10 bg-gradient-to-r from-amber-50 via-white to-amber-50">
        &copy; 2024 Ihsan.id. Calm. Modest. Connected. No login required for public data.
      </footer>
    </main>
  );
}
