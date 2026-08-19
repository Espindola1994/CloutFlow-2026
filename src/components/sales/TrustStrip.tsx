"use client";

import React from "react";
import { ShieldCheck, Zap, Lock, Headphones } from "lucide-react";

export function TrustStrip() {
  const items = [
    { icon: Lock, label: "No Password Required", desc: "100% credential-free" },
    { icon: ShieldCheck, label: "Secure Checkout", desc: "Encrypted transactions" },
    { icon: Zap, label: "Target Verified", desc: "Locked to your target" },
    { icon: Headphones, label: "Support Available", desc: "24/7 order tracking" },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-[#0e131f]/70 border border-neutral-800/80 backdrop-blur-md shadow-lg">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center text-neutral-200 shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">{item.label}</p>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
