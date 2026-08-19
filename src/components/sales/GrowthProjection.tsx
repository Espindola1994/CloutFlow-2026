"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp, ArrowDown } from "lucide-react";
import { PlatformTheme } from "@/config/service-sales.config";
import { PublicOfferItem } from "./OfferCard";

interface GrowthProjectionProps {
  platform: string;
  service: string;
  serviceUnit: string;
  theme: PlatformTheme;
  headline: string;
  description: string;
  socialUsername: string | null;
  targetValue: string | null;
  verifiedTargetData: Record<string, any> | null;
  offers: PublicOfferItem[];
  selectedOfferId?: string | null;
}

export function GrowthProjection({
  platform,
  service,
  serviceUnit,
  theme,
  headline,
  description,
  socialUsername,
  targetValue,
  verifiedTargetData,
  offers,
  selectedOfferId,
}: GrowthProjectionProps) {
  const currentCount = verifiedTargetData?.follower_count || verifiedTargetData?.followers_count || verifiedTargetData?.subscribers_count || null;
  const displayHandle = (socialUsername || targetValue || "yourprofile").replace(/^@+/, "");

  const defaultOffer = offers.find((o) => o.isPopular) || offers[Math.floor(offers.length / 2)] || offers[0];
  const [activeId, setActiveId] = useState<string | null>(selectedOfferId || (defaultOffer ? defaultOffer.id : null));

  const currentActiveOffer = offers.find((o) => o.id === (selectedOfferId || activeId)) || defaultOffer;
  if (!currentActiveOffer) return null;

  const packageQty = currentActiveOffer.quantity + (currentActiveOffer.bonusQuantity || 0);
  const projectedCount = currentCount !== null ? Number(currentCount) + packageQty : null;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-16">
      <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-[#0e131f]/90 border border-neutral-800/90 shadow-2xl space-y-8 backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: theme.gradient }}
        />

        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>SEE THE DIFFERENCE</span>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">{headline}</h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">{description}</p>
        </div>

        {/* Tier Selector Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 relative z-10">
          {offers.slice(0, 6).map((o) => {
            const isSelected = currentActiveOffer.id === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setActiveId(o.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-neutral-950 shadow-md scale-105"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                +{o.quantity.toLocaleString()} {serviceUnit}
              </button>
            );
          })}
        </div>

        {/* Interactive Comparison Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2 relative z-10">
          {/* 1. Baseline */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#080b12] border border-neutral-800 text-center space-y-1.5 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
              YOUR PROFILE TODAY
            </span>
            <p className="text-sm font-bold text-white truncate">@{displayHandle}</p>
            <p className="text-2xl sm:text-3xl font-black text-neutral-300 tracking-tight pt-1">
              {currentCount !== null ? Number(currentCount).toLocaleString() : "Verified Profile"}
            </p>
            <span className="text-[11px] text-neutral-400 font-medium">{serviceUnit}</span>
          </div>

          {/* 2. Selected Package Transformation Center */}
          <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-2">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-xl"
              style={{ background: theme.gradient }}
            >
              +
            </div>
            <p className="text-sm font-black text-white">
              +{packageQty.toLocaleString()} {serviceUnit}
            </p>
            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              SELECTED PACKAGE
            </span>
          </div>

          {/* 3. Projected Outcome */}
          <div
            className="p-5 sm:p-6 rounded-2xl bg-[#080b12] border-2 text-center space-y-1.5 relative overflow-hidden shadow-xl"
            style={{ borderColor: theme.primary }}
          >
            <div className="absolute top-2.5 right-2.5">
              <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              PROJECTED DISPLAY
            </span>
            <p className="text-sm font-bold text-white truncate">@{displayHandle}</p>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
              {projectedCount !== null ? `~${projectedCount.toLocaleString()}` : `+${packageQty.toLocaleString()} ${serviceUnit}`}
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold">
              Elevated Social Standing
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
