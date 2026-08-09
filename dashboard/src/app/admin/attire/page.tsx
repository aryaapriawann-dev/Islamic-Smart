"use client";

import React from "react";
import AdminLayout from "../AdminLayout";
import { ShieldCheck, CheckCircle, WarningCircle, EyeClosed } from "@phosphor-icons/react";

export default function AttireStats() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Statistik Deteksi Pakaian (Aurat)</h2>
          <p className="text-xs text-muted-foreground">
            Data teragregasi secara anonim. Identitas pribadi dan foto jamaah <strong>TIDAK PERNAH DISIMPAN</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric
            label="Pemeriksaan Hari Ini"
            value="342"
            helper="Pemeriksaan otomatis di kiosk"
            icon={<CheckCircle size={20} className="text-emerald-500" />}
          />
          <Metric
            label="Pengingat Sopan Terkirim"
            value="28"
            helper="Pengingat privat di layar kiosk"
            icon={<WarningCircle size={20} className="text-amber-500" />}
          />
          <Metric
            label="Kesesuaian Pakaian"
            value="91.8%"
            helper="Memenuhi standar menutup aurat"
            icon={<ShieldCheck size={20} className="text-emerald-500" />}
          />
        </div>

        <section className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <EyeClosed size={18} />
            <span>Prinsip Perlindungan Privasi & Kehormatan (Non-Negotiable)</span>
          </div>
          <p className="text-emerald-300/80 leading-relaxed">
            Sistem deteksi pakaian dipasang khusus untuk kenyamanan jamaah. Seluruh frame kamera diproses in-memory dan langsung dibuang setelah evaluasi. Admin masjid hanya dapat melihat data statistik agregat jumlah pengingat tanpa data foto atau pengenalan wajah.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-semibold">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}
