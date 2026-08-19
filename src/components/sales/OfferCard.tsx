"use client";

import React, { useState } from "react";
import { Check, Sparkles, ArrowRight, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { PlatformTheme } from "@/config/service-sales.config";

export interface PublicOfferItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  quantity: number;
  bonusQuantity: number;
  priceCents: number;
  oldPriceCents: number | null;
  currency: string;
  badge: string | null;
  isPopular: boolean;
  sortOrder: number;
  benefits?: string[] | null;
  ctaText?: string | null;
}

interface OfferCardProps {
  offer: PublicOfferItem;
  serviceUnit: string;
  theme: PlatformTheme;
  hasTarget: boolean;
  onCheckout: (offerId: string) => Promise<void>;
  onRequireTarget: () => void;
  onHover?: () => void;
}

export function OfferCard({
  offer,
  serviceUnit,
  theme,
  hasTarget,
  onCheckout,
  onRequireTarget,
  onHover,
}: OfferCardProps) {
  const [loading, setLoading] = useState(false);

  const price = (offer.priceCents / 100).toFixed(2);
  const oldPrice = offer.oldPriceCents ? (offer.oldPriceCents / 100).toFixed(2) : null;
  const savingsPercent = offer.oldPriceCents && offer.oldPriceCents > offer.priceCents
    ? Math.round(((offer.oldPriceCents - offer.priceCents) / offer.oldPriceCents) * 100)
    : null;

  const defaultBenefits = [
    "No password required",
    "Fast order preparation",
    "Encrypted secure checkout",
    "Dedicated support included",
  ];

  const benefitsList = (offer.benefits && offer.benefits.length > 0) ? offer.benefits.slice(0, 4) : defaultBenefits;

  const handleClick = async () => {
    if (!hasTarget) {
      onRequireTarget();
      return;
    }
    if (loading) return;

    try {
      setLoading(true);
      await onCheckout(offer.id);
    } catch {
      // handled upstream
    } finally {
      setLoading(false);
    }
  };

  const isFeatured = offer.isPopular;

  return (
    <div
      onMouseEnter={onHover}
      className={`group relative flex flex-col justify-between rounded-3xl transition-all duration-300 ${
        isFeatured
          ? "bg-[#0e131f] border-2 p-6 md:p-7 shadow-2xl scale-[1.02] z-10"
          : "bg-[#0c101a]/90 border border-neutral-800/80 p-5 md:p-6 hover:border-neutral-700 shadow-xl"
      }`}
      style={{
        borderColor: isFeatured ? theme.primary : undefined,
        boxShadow: isFeatured ? `0 20px 45px -15px ${theme.borderGlow}` : undefined,
      }}
    >
      {/* Top Suspended Badge */}
      {(offer.badge || isFeatured) && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="px-4 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap"
            style={{ background: theme.gradient }}
          >
            <Sparkles className="w-3 h-3" />
            <span>{offer.badge || "MOST POPULAR"}</span>
          </span>
        </div>
      )}

      {/* Card Content Top */}
      <div className="space-y-4 pt-1">
        {/* Tier Name & Discount Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
            {offer.name}
          </span>
          {savingsPercent && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold tracking-wide">
              SAVE {savingsPercent}%
            </span>
          )}
        </div>

        {/* Quantity Headline Dominant */}
        <div className="pb-4 border-b border-neutral-800/80">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {offer.quantity.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-neutral-400 uppercase tracking-wider">
              {serviceUnit}
            </span>
          </div>
          {offer.bonusQuantity > 0 && (
            <span className="inline-block mt-1.5 text-xs font-bold text-emerald-400">
              +{offer.bonusQuantity.toLocaleString()} Extra Bonus
            </span>
          )}
          {offer.description && (
            <p className="text-xs text-neutral-400 mt-1 font-medium">{offer.description}</p>
          )}
        </div>

        {/* Price Presentation */}
        <div className="py-1 flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ${price}
          </span>
          {oldPrice && (
            <span className="text-sm sm:text-base font-semibold text-neutral-500 line-through">
              ${oldPrice}
            </span>
          )}
          <span className="text-[11px] text-neutral-400 font-medium ml-auto">
            One-time order
          </span>
        </div>

        {/* Bullets List */}
        <ul className="space-y-2.5 py-3 border-t border-neutral-800/80">
          {benefitsList.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
              <span className="font-medium">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Card Bottom CTA & Microcopy */}
      <div className="pt-4 mt-auto space-y-2.5 text-center">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
            isFeatured ? "hover:scale-[1.02]" : "hover:bg-neutral-800"
          }`}
          style={{
            background: isFeatured ? theme.gradient : "#1a2233",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparing Checkout...</span>
            </>
          ) : !hasTarget ? (
            <>
              <span>Select Profile First</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          ) : (
            <>
              <span>{offer.ctaText || "Get Started"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Secure checkout • No password needed</span>
        </p>
      </div>
    </div>
  );
}
