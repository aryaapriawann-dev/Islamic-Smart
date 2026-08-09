"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  home: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3l8 6v12H4V9z" />
    </svg>
  ),
  shirt: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3 3 3-3-2 2v5h-2V6l-2-2z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M3 3v16h18V3H3zm16 14H5V5h14v12z" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M6 4h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 0v4h4" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M7 6h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm6 8v4h4" />
    </svg>
  ),
};

const items = [
  { href: "/admin", label: "Dashboard", icon: icons.home },
  { href: "/admin/visitor", label: "Pengunjung", icon: icons.chart },
  { href: "/admin/attire", label: "Pakaian", icon: icons.shirt },
  { href: "/admin/report", label: "Laporan", icon: icons.file },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-r border-border bg-card">
        <div className="h-14 flex items-center px-4">
          <span className="text-sm font-semibold text-primary">Ihsan.id</span>
        </div>
        <nav className="p-2 space-y-1">
          {items.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center justify-center">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-2">
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span className="flex items-center justify-center">{icons.logout}</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>
      <main className="p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
