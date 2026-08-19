"use client";

import React from "react";
import { Compass, HelpCircle } from "lucide-react";
import { ServiceCopy } from "@/config/service-sales.config";

interface PlanGuideProps {
  copy: ServiceCopy;
}

export function PlanGuide({ copy }: PlanGuideProps) {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
          <Compass className="w-3.5 h-3.5" />
          <span>Buyer's Guide</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Not Sure Which Package Fits You?
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 max-w-md mx-auto">
          Here is a breakdown of our package tiers to help you make the right choice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {copy.planGuide.map((g, i) => (
          <div key={i} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
            <h3 className="text-sm font-bold text-white tracking-tight">{g.tier}</h3>
            <span className="inline-block text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
              Ideal for: {g.idealFor}
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed pt-1">{g.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
