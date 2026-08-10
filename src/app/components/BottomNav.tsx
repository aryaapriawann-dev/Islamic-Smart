"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShirtFolded, HandsPraying, ChartBar, Question } from "@phosphor-icons/react";

const items = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/pakaian", label: "Pakaian", icon: ShirtFolded },
  { href: "/sholat", label: "Sholat", icon: HandsPraying },
  { href: "/statistik", label: "Statistik", icon: ChartBar },
  { href: "/bantuan", label: "Bantuan", icon: Question },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="sticky bottom-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-xl grid grid-cols-5 py-2 px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition ${
                active
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} weight={active ? "bold" : "regular"} className={active ? "text-emerald-600" : ""} />
              <span className="text-[10px] tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
