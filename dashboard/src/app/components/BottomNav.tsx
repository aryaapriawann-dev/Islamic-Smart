"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/pakaian", label: "Pakaian" },
  { href: "/sholat", label: "Sholat" },
  { href: "/statistik", label: "Statistik" },
  { href: "/bantuan", label: "Bantuan" },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 border-t border-border bg-card/80 backdrop-blur">
      <div className="mx-auto max-w-5xl grid grid-cols-5">
        {items.map(({ href, label }) => {
          const active = usePathname() === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2 text-xs hover:text-foreground ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="text-sm">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
