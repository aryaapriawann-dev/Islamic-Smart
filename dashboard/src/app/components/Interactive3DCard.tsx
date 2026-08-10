"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

interface Interactive3DCardProps {
  title: string;
  description: string;
  badge: string;
  iconType: "shirt" | "prayer";
  href: string;
}

export default function Interactive3DCard({
  title,
  description,
  badge,
  iconType,
  href,
}: Interactive3DCardProps) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-4 cursor-pointer overflow-hidden w-full"
    >
      <div className="relative w-full h-32 sm:h-44 flex items-center justify-center">
        <img
          src={iconType === "shirt" ? "/logo-aurat.png" : "/logo-sholat.png"}
          alt={title}
          className="h-24 sm:h-32 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="space-y-1 sm:space-y-2 z-10">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-emerald-700 transition">
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed max-w-xs font-sans">
          {description}
        </p>
      </div>

      <div className="pt-2 z-10 w-full">
        <span className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 sm:py-2 rounded-lg bg-slate-900 text-white text-xs font-medium group-hover:bg-emerald-600 transition duration-300">
          <span>{badge}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-300" />
        </span>
      </div>
    </Link>
  );
}
