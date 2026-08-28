"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { PlatformTheme, ServiceCopy } from "@/config/service-sales.config";
import { SelectedTargetCard } from "./SelectedTargetCard";

interface ServiceHeroProps {
  platform: string;
  service: string;
  theme: PlatformTheme;
  copy: ServiceCopy;
  targetType: string | null;
  targetValue: string | null;
  targetUrl: string | null;
  socialUsername: string | null;
  profileUrl: string | null;
  verifiedTargetData: Record<string, any> | null;
  onSelectTarget: () => void;
  onScrollToPlans: () => void;
}

export function ServiceHero({
  platform,
  service,
  theme,
  copy,
  targetType,
  targetValue,
  targetUrl,
  socialUsername,
  profileUrl,
  verifiedTargetData,
  onSelectTarget,
  onScrollToPlans,
}: ServiceHeroProps) {
  const isFollowers = service === "followers";
  const hasTarget = Boolean(
    (isFollowers && (socialUsername || targetValue)) ||
    (!isFollowers && (targetUrl || socialUsername || targetValue))
  );

  return (
    <section className="cf-sales-hero w-full max-w-[1000px] mx-auto px-4 pt-3 pb-2 text-center space-y-3">
      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md border border-neutral-800 bg-[#0e131f]/90 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.primary }} />
        <span>{theme.eyebrow}</span>
      </div>

      {/* Main Headline */}
      <div className="space-y-2 max-w-4xl mx-auto">
        <h1 className="cf-sales-hero-title text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.02]">
          {copy.heroHeadline}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: theme.gradient }}
          >
            {copy.heroHighlight}
          </span>
        </h1>
        <p className="cf-sales-hero-sub text-xs sm:text-sm md:text-base text-neutral-300 max-w-2xl mx-auto leading-snug font-normal">
          {copy.heroSubheadline}
        </p>
      </div>

      {/* Target Card Surface */}
      <div className="cf-sales-target pt-0">
        <SelectedTargetCard
          platform={platform}
          service={service}
          theme={theme}
          targetType={targetType}
          targetValue={targetValue}
          targetUrl={targetUrl}
          socialUsername={socialUsername}
          profileUrl={profileUrl}
          verifiedTargetData={verifiedTargetData}
          onSelectTarget={onSelectTarget}
        />
      </div>

      {/* Hero CTAs */}
      <div className="cf-sales-hero-actions flex flex-col sm:flex-row items-center justify-center gap-2 pt-0">
        <button
          type="button"
          onClick={onScrollToPlans}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs md:text-sm font-extrabold text-white transition-all cursor-pointer shadow-xl hover:scale-105 flex items-center justify-center gap-2"
          style={{ background: theme.gradient }}
        >
          <span>View Growth Packages</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {hasTarget && (
          <button
            type="button"
            onClick={onSelectTarget}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all cursor-pointer"
          >
            <span>Change {isFollowers ? "Profile" : "Content"}</span>
          </button>
        )}
      </div>
    </section>
  );
}
