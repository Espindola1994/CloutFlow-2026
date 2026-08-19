"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { ServiceCopy, PlatformTheme } from "@/config/service-sales.config";

interface HowItWorksProps {
  copy: ServiceCopy;
  theme: PlatformTheme;
  hasTarget: boolean;
}

export function HowItWorks({ copy, theme, hasTarget }: HowItWorksProps) {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          How It Works
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 max-w-sm mx-auto">
          3 simple steps to scale your presence with zero friction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {copy.howItWorks.map((item, i) => {
          const isStep1 = i === 0;
          const isCompleted = isStep1 && hasTarget;

          return (
            <div
              key={i}
              className={`p-6 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                isCompleted
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : "bg-neutral-900/60 border-neutral-800/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-lg text-white"
                  style={{ background: isCompleted ? "#10b981" : theme.primary }}
                >
                  {item.step}
                </span>

                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{item.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
