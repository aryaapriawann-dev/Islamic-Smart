"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import { ShieldCheck, CheckCircle, WarningCircle, EyeClosed } from "@phosphor-icons/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function AttireStats() {
  const [stats, setStats] = useState({
    total_checks_today: 0,
    reminders_today: 0,
    compliance_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/detect/attire/summary`)
      .then((res) => res.json())
      .then((data) => {
        setStats({
          total_checks_today: data.total_checks_today || 0,
          reminders_today: data.reminders_today || 0,
          compliance_rate: data.compliance_rate || 0,
        });
      })
      .catch((err) => console.warn("Backend tidak tersedia:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Statistik Kesesuaian Pakaian (Aurat)</h2>
          <p className="text-xs text-slate-500">
            Data teragregasi secara anonim. Identitas pribadi dan foto jamaah <strong>TIDAK PERNAH DISIMPAN</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric
            label="Pemeriksaan Hari Ini"
            value={loading ? "..." : stats.total_checks_today.toLocaleString("id-ID")}
            helper="Pemeriksaan otomatis di kiosk"
            icon={<CheckCircle size={20} className="text-emerald-600" />}
          />
          <Metric
            label="Pengingat Sopan Terkirim"
            value={loading ? "..." : stats.reminders_today.toLocaleString("id-ID")}
            helper="Pengingat privat di layar kiosk"
            icon={<WarningCircle size={20} className="text-amber-600" />}
          />
          <Metric
            label="Kesesuaian Pakaian"
            value={loading ? "..." : `${stats.compliance_rate}%`}
            helper="Memenuhi standar menutup aurat"
            icon={<ShieldCheck size={20} className="text-emerald-600" />}
          />
        </div>

        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
            <EyeClosed size={20} className="text-emerald-600" />
            <span>Prinsip Perlindungan Privasi & Kehormatan Jamaah</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Sistem deteksi pakaian dipasang khusus untuk kenyamanan jamaah. Seluruh frame kamera diproses in-memory dan langsung dibuang setelah evaluasi. Admin masjid hanya dapat melihat data statistik agregat jumlah pengingat tanpa data foto atau pengenalan wajah.
          </p>
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
