"use client";

import React, { useState } from "react";
import AdminLayout from "@/app/admin/AdminLayout";
import { DownloadSimple, FilePdf, FileCsv } from "@phosphor-icons/react";

export default function ReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [format, setFormat] = useState<"csv" | "html">("csv");

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-lg font-bold">Laporan Kunjungan Masjid</h2>
          <p className="text-xs text-muted-foreground">
            Unduh laporan rekapitulasi jumlah pengunjung per waktu sholat dalam format CSV atau Laporan Siap Cetak (PDF/HTML).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-md space-y-6">
          <form
            action="/api/report/visitor"
            method="POST"
            target="_blank"
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Dari Tanggal
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Sampai Tanggal
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Pilih Format Laporan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    format === "csv"
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  <FileCsv size={18} />
                  <span>Format CSV Data Raw</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("html")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    format === "html"
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  <FilePdf size={18} />
                  <span>Laporan Siap Cetak (HTML/PDF)</span>
                </button>
              </div>
              <input type="hidden" name="format" value={format} />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2"
              >
                <DownloadSimple size={18} />
                <span>Unduh Laporan Kunjungan ({format.toUpperCase()})</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
