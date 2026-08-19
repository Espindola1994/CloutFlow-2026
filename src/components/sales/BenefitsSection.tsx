"use client";

import React from "react";
import { ShieldCheck, Zap, Users, TrendingUp, Lock, Heart } from "lucide-react";
import { ServiceCopy, PlatformTheme } from "@/config/service-sales.config";

interface BenefitsSectionProps {
  copy: ServiceCopy;
  theme: PlatformTheme;
}

const iconMap = {
  shield: ShieldCheck,
  zap: Zap,
  users: Users,
  trending: TrendingUp,
  lock: Lock,
  heart: Heart,
};

export function BenefitsSection({ copy, theme }: BenefitsSectionProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Why Grow With CloutFlow?
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 max-w-md mx-auto">
          Built with an emphasis on speed, reliability, and security to support your long-term presence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {copy.benefits.map((b, i) => {
          const Icon = iconMap[b.iconName] || ShieldCheck;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all space-y-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: theme.gradient }}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">{b.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{b.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
