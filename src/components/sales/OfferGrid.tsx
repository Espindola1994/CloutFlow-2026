"use client";

import React from "react";
import { OfferCard, PublicOfferItem } from "./OfferCard";
import { PlatformTheme } from "@/config/service-sales.config";
import { Sparkles, PackageOpen, ArrowRight } from "lucide-react";

interface OfferGridProps {
  offers: PublicOfferItem[];
  serviceUnit: string;
  theme: PlatformTheme;
  hasTarget: boolean;
  targetHandle: string | null;
  onCheckout: (offerId: string) => Promise<void>;
  onRequireTarget: () => void;
  onSelectOfferHover?: (offerId: string) => void;
}

export function OfferGrid({
  offers,
  serviceUnit,
  theme,
  hasTarget,
  targetHandle,
  onCheckout,
  onRequireTarget,
  onSelectOfferHover,
}: OfferGridProps) {
  if (offers.length === 0) {
    return (
      <section id="plans" className="w-full max-w-xl mx-auto py-16 px-6 text-center rounded-3xl bg-[#0e131f]/80 border border-neutral-800/80 space-y-4 shadow-xl">
        <PackageOpen className="w-12 h-12 text-neutral-500 mx-auto stroke-1" />
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">Packages Are Being Updated</h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            We are currently refreshing our available packages for this service. Please check back shortly or explore another network.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          <span>Choose Another Service</span>
        </button>
      </section>
    );
  }

  // Up to 6 offers strictly supported
  const visibleOffers = offers.slice(0, 6);
  const count = visibleOffers.length;

  // Responsive balanced grid classes for 1, 2, 3, 4, 5, 6 cards
  const getGridClasses = () => {
    if (count === 1) return "flex justify-center max-w-md mx-auto";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6";
    if (count === 4) return "grid grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto gap-6";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6";
  };

  const displayHandle = (targetHandle || "").replace(/^@+/, "");

  return (
    <section id="plans" className="cf-sales-offers w-full max-w-[1000px] mx-auto px-4 py-2 space-y-3">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-neutral-300 bg-[#0e131f] border border-neutral-800">
          <Sparkles className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          <span>CHOOSE YOUR PACKAGE</span>
        </div>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          Pick the Growth Level That Fits Your Goal.
        </h2>

        {displayHandle ? (
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-medium">
            Select an offer package configured for <strong className="text-white">@{displayHandle}</strong>
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
            Select from 6 calibrated tiers with instant queue dispatch and verified delivery.
          </p>
        )}
      </div>

      <div className={getGridClasses()}>
        {visibleOffers.map((offer) => (
          <div key={offer.id} className={count === 1 ? "w-full" : ""}>
            <OfferCard
              offer={offer}
              serviceUnit={serviceUnit}
              theme={theme}
              hasTarget={hasTarget}
              onCheckout={onCheckout}
              onRequireTarget={onRequireTarget}
              onHover={() => onSelectOfferHover && onSelectOfferHover(offer.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
