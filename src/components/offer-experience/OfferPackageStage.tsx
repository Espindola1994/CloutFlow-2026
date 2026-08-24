/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import React from 'react';
import Image from 'next/image';
import { Check, Copy, ArrowRight, Sparkles } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { RepeatProfilePresentation } from './RepeatProfilePresentation';

export interface SanitizedPackage {
  id: string;
  platform: string;
  service: string;
  name: string;
  slug: string;
  quantity: number;
  bonusQuantity: number;
  priceCents: number;
  currency: string;
  badge?: string | null;
  isPopular?: boolean;
}

interface OfferPackageStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
  verifiedProfile: any;
  couponCode: string;
  timeLeft: string | null;
  eligiblePackages: SanitizedPackage[];
  selectedPackageId: string | null;
  copied: boolean;
  onCopyCoupon: () => void;
  onChangeProfile: () => void;
  onSelectPackage: (pkgId: string) => void;
}

export function OfferPackageStage({
  platform,
  theme,
  verifiedProfile,
  couponCode,
  timeLeft,
  eligiblePackages,
  selectedPackageId,
  copied,
  onCopyCoupon,
  onChangeProfile,
  onSelectPackage,
}: OfferPackageStageProps) {
  // Grid layout class based on number of packages
  const getGridClass = (count: number) => {
    if (count === 1) return 'flex justify-center';
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 max-w-[720px] mx-auto gap-4';
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-4';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  };

  return (
    <div className="w-full max-w-[1080px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Bar: Profile Strip + Coupon Strip */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 mb-5 border relative overflow-hidden transition-all"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          borderColor: '#E2E8F0',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Profile Strip via Shared Component */}
          <div className="min-w-0 flex-1">
            <RepeatProfilePresentation
              identity={{
                platform,
                username: verifiedProfile?.username || '',
                avatarUrl: verifiedProfile?.avatar_url || verifiedProfile?.profile_pic_url,
                maskedEmail: verifiedProfile?.maskedEmail || null,
                isConfirmed: true,
              }}
              theme={theme}
              size="md"
              showBadge={true}
              actionButton={
                <button
                  type="button"
                  onClick={onChangeProfile}
                  className="text-[11px] font-bold text-[#1376FF] hover:underline cursor-pointer ml-1 shrink-0"
                >
                  Change
                </button>
              }
            />
          </div>

          {/* Coupon Strip */}
          <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl shadow-2xs shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                25% OFF
              </span>
              <span className="font-mono text-[13px] font-black text-[#081126] tracking-wide">
                {couponCode}
              </span>
              {timeLeft && (
                <span className="text-[11px] text-[#64748B] hidden sm:inline font-medium">
                  · expires in <strong className="font-mono text-[#081126]">{timeLeft}</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onCopyCoupon}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#475569] hover:text-[#081126] bg-white border border-[#CBD5E1] px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Package Header */}
      <div className="mb-4 text-center sm:text-left">
        <span
          className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs inline-block"
          style={{
            color: theme.primary,
            backgroundColor: theme.accentSubtle,
            borderColor: theme.cardBorder,
          }}
        >
          Step 03 · Select Boost Package
        </span>
        <h2 className="text-[22px] sm:text-[26px] font-[800] text-[#081126] tracking-tight mt-1">
          Choose Your {theme.name} Package
        </h2>
        <p className="text-[13px] text-[#536176] font-medium mt-0.5">
          Select the package you want to apply with your 25% discount.
        </p>
      </div>

      {/* Packages Grid */}
      <div className={getGridClass(eligiblePackages.length)}>
        {eligiblePackages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const price = (pkg.priceCents / 100).toFixed(2);
          const discountedPrice = ((pkg.priceCents * 0.75) / 100).toFixed(2);

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage(pkg.id)}
              className={`group relative flex flex-col justify-between rounded-2xl p-5 bg-white border transition-all duration-200 cursor-pointer ${
                eligiblePackages.length === 1 ? 'w-full max-w-[380px]' : ''
              } ${
                isSelected
                  ? 'border-2 shadow-lg -translate-y-0.5'
                  : 'hover:border-[#CBD5E1] hover:shadow-md hover:-translate-y-px'
              }`}
              style={{
                borderColor: isSelected ? theme.primary : '#E2E8F0',
                boxShadow: isSelected ? theme.cardSelectedGlow : undefined,
              }}
            >
              {/* Suspended Badge */}
              {(pkg.badge || pkg.isPopular) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1 whitespace-nowrap"
                    style={{ background: theme.ctaGradient }}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{pkg.badge || 'POPULAR'}</span>
                  </span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    {pkg.service}
                  </span>
                  <span className="text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-full">
                    25% OFF
                  </span>
                </div>

                {/* Package Name & Quantity */}
                <h3 className="text-[17px] font-[800] text-[#081126] tracking-tight mb-1">
                  {pkg.name}
                </h3>

                {pkg.bonusQuantity > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold mt-0.5" style={{ color: theme.primary }}>
                    <Sparkles className="w-3 h-3" />
                    +{pkg.bonusQuantity.toLocaleString()} Bonus Included
                  </span>
                )}

                {/* Price Display */}
                <div className="my-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-black text-[#081126]">
                      ${discountedPrice}
                    </span>
                    <span className="text-[13px] text-[#94A3B8] line-through font-medium">
                      ${price}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    With coupon {couponCode}
                  </span>
                </div>

                {/* Feature checklist */}
                <ul className="space-y-2 mb-4 text-[12px] text-[#475569]">
                  <li className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 text-[10px]"
                      style={{ background: theme.primary }}
                    >
                      ✓
                    </div>
                    <span>No password required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 text-[10px]"
                      style={{ background: theme.primary }}
                    >
                      ✓
                    </div>
                    <span>Fast delivery start</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 text-[10px]"
                      style={{ background: theme.primary }}
                    >
                      ✓
                    </div>
                    <span>24/7 priority support</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition duration-150 ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#081126]'
                }`}
                style={{
                  background: isSelected ? theme.ctaGradient : undefined,
                  boxShadow: isSelected ? theme.buttonShadow : undefined,
                }}
              >
                <span>Select & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
