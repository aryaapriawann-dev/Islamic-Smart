"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShirtFolded, ChartBar, FileText, SignOut } from "@phosphor-icons/react";

const items = [
  { href: "/admin", label: "Dashboard", icon: House },
  { href: "/admin/visitor", label: "Pengunjung", icon: ChartBar },
  { href: "/admin/attire", label: "Pakaian", icon: ShirtFolded },
  { href: "/admin/report", label: "Laporan", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <img src="/logo.png" alt="Islamic Smart Assistance Logo" className="h-8 w-auto" />
            <div>
              <span className="text-sm font-bold text-slate-900 block">Islamic Smart</span>
              <span className="text-[10px] text-slate-500 block">Assistance Admin</span>
            </div>
          </div>

          <nav className="space-y-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={18} className={active ? "text-emerald-400" : "text-slate-500"} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <SignOut size={18} className="text-slate-500" />
            <span>Keluar Panel Admin</span>
          </button>
        </div>
      </aside>

      <main className="p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
