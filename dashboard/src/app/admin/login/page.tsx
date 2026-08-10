"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck } from "@phosphor-icons/react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.message || "Kata sandi salah");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 bg-clean-grid">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={16} />
            <span>Panel Terproteksi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Islamic Smart Assistance Logo" className="h-12 w-auto mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Login Admin Islamic Smart</h1>
            <p className="text-xs text-slate-500">
              Masukkan kata sandi admin untuk mengakses panel kontrol.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Kata Sandi Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 transition"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk ke Panel Admin"}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center">
            Kata sandi bawaan: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">admin123</code>
          </p>
        </div>
      </div>
    </main>
  );
}
