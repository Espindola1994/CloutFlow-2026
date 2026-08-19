"use client";

import React from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { PlatformTheme } from "@/config/service-sales.config";

interface FinalCTAProps {
  platformName: string;
  theme: PlatformTheme;
  socialUsername: string | null;
  targetValue: string | null;
  onScrollToPlans: () => void;
}

export function FinalCTA({
  platformName,
  theme,
  socialUsername,
  targetValue,
  onScrollToPlans,
}: FinalCTAProps) {
  const displayHandle = (socialUsername || targetValue || "").replace(/^@+/, "");

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-20">
      <div
        className="p-8 sm:p-12 md:p-16 rounded-3xl text-center space-y-6 sm:space-y-8 relative overflow-hidden border border-neutral-800/80 shadow-2xl backdrop-blur-xl"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.45), rgba(8, 12, 20, 0.95))",
        }}
      >
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white bg-neutral-800/90 border border-neutral-700/60 shadow-lg">
            <Sparkles className="w-3 h-3" style={{ color: theme.primary }} />
            <span>READY WHEN YOU ARE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {displayHandle ? `Ready to Grow @${displayHandle}?` : `Ready to Elevate Your ${platformName}?`}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-lg mx-auto leading-relaxed">
            {displayHandle
              ? `Your target is verified and linked. Choose from 6 calibrated packages to build a stronger first impression today.`
              : `Pick from 6 calibrated packages and start building lasting social credibility.`}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onScrollToPlans}
            className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-4 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-2xl transition-all duration-200 cursor-pointer hover:scale-105"
            style={{ background: theme.gradient }}
          >
            <span>Choose Your Package</span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
