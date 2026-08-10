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
          <h2 className="text-xl font-bold text-slate-900">Laporan Kunjungan Masjid</h2>
          <p className="text-xs text-slate-500">
            Unduh laporan rekapitulasi jumlah pengunjung per waktu sholat dalam format CSV Data Raw atau Laporan Cetak PDF/HTML.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
          <form
            action="/api/report/visitor"
            method="POST"
            target="_blank"
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Dari Tanggal
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Sampai Tanggal
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Format Laporan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                    format === "csv"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <FileCsv size={18} />
                  <span>Format CSV Data Raw</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("html")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                    format === "html"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <FilePdf size={18} />
                  <span>Laporan Cetak (PDF / HTML)</span>
                </button>
              </div>
              <input type="hidden" name="format" value={format} />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <DownloadSimple size={18} />
                <span>Unduh Laporan ({format.toUpperCase()})</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
