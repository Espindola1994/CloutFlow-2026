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
    <section className="w-full max-w-5xl mx-auto px-4 pt-8 pb-6 md:pt-14 md:pb-10 text-center space-y-6 md:space-y-8">
      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md border border-neutral-800 bg-[#0e131f]/90 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.primary }} />
        <span>{theme.eyebrow}</span>
      </div>

      {/* Main Headline */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
          {copy.heroHeadline}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: theme.gradient }}
          >
            {copy.heroHighlight}
          </span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {copy.heroSubheadline}
        </p>
      </div>

      {/* Target Card Surface */}
      <div className="pt-2">
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onScrollToPlans}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-extrabold text-white transition-all cursor-pointer shadow-xl hover:scale-105 flex items-center justify-center gap-2"
          style={{ background: theme.gradient }}
        >
          <span>View Growth Packages</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {hasTarget && (
          <button
            type="button"
            onClick={onSelectTarget}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-neutral-300 hover:text-white bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all cursor-pointer"
          >
            <span>Change {isFollowers ? "Profile" : "Content"}</span>
          </button>
        )}
      </div>
    </section>
  );
}
