"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import { Clock, Users, Calendar, ChartLineUp } from "@phosphor-icons/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function VisitorDashboard() {
  const [metrics, setMetrics] = useState({
    today: 0,
    week: 0,
    month: 0,
  });
  const [breakdown, setBreakdown] = useState<Record<string, number>>({
    SUBUH: 0,
    ZUHUR: 0,
    ASHAR: 0,
    MAGHRIB: 0,
    ISYA: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/count/visitor/summary`)
      .then((res) => res.json())
      .then((data) => {
        setMetrics({
          today: data.total_today || 0,
          week: data.total_week || 0,
          month: data.total_month || 0,
        });
        if (data.prayer_breakdown) {
          setBreakdown(data.prayer_breakdown);
        }
      })
      .catch((err) => console.warn("Backend tidak tersedia:", err))
      .finally(() => setLoading(false));
  }, []);

  const maxVal = Math.max(...Object.values(breakdown), 1);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dasbor Pengunjung Masjid</h2>
          <p className="text-xs text-slate-500">
            Penghitungan otomatis jamaah di titik akses utama masjid secara teragregasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric label="Hari Ini" value={loading ? "..." : metrics.today.toLocaleString("id-ID")} helper="Terhitung otomatis" icon={<Clock size={20} className="text-emerald-600" />} />
          <Metric label="Minggu Ini" value={loading ? "..." : metrics.week.toLocaleString("id-ID")} helper="Akumulasi 7 hari" icon={<Calendar size={20} className="text-emerald-600" />} />
          <Metric label="Bulan Ini" value={loading ? "..." : metrics.month.toLocaleString("id-ID")} helper="Akumulasi bulan ini" icon={<Users size={20} className="text-emerald-600" />} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ChartLineUp size={18} className="text-emerald-600" />
              Tren Kehadiran Jamaah Harian
            </h3>
            <span className="text-xs text-slate-500 font-medium">Real-Time Aggregation</span>
          </div>

          <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-end justify-between gap-3">
            {[
              { time: "Subuh", val: breakdown.SUBUH || 0 },
              { time: "Zuhur", val: breakdown.ZUHUR || 0 },
              { time: "Ashar", val: breakdown.ASHAR || 0 },
              { time: "Maghrib", val: breakdown.MAGHRIB || 0 },
              { time: "Isya", val: breakdown.ISYA || 0 },
            ].map((item) => (
              <div key={item.time} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-700">{item.val}</span>
                <div
                  className="w-full rounded-t-lg bg-slate-900 transition hover:bg-emerald-600"
                  style={{ height: maxVal > 0 ? `${(item.val / maxVal) * 80}%` : "0%" }}
                />
                <span className="text-[11px] text-slate-500 font-medium">{item.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{helper}</p>
    </div>
  );
}
