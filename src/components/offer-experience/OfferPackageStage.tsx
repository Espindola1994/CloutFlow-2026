'use client';

import React from 'react';
import Image from 'next/image';
import { Check, Copy, ArrowRight, Sparkles } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

const PLATFORM_ICONS = {
  instagram: instagramIcon,
  tiktok: tiktokIcon,
  twitter: twitterIcon,
  youtube: youtubeIcon,
};

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
  return (
    <div className="w-full max-w-[1080px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Bar: Profile Strip + Coupon Strip with 2.5D elevation */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 mb-6 border relative overflow-hidden transition-all"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          borderColor: '#E2E8F0',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Profile Strip */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={verifiedProfile?.avatar_url || '/placeholder-avatar.png'}
                alt=""
                className="w-12 h-12 rounded-full object-cover bg-[#F1F5F9] border-2 shadow-xs"
                style={{ borderColor: theme.primary }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center p-0.5 shadow-xs">
                <Image
                  src={PLATFORM_ICONS[platform]}
                  alt=""
                  width={11}
                  height={11}
                  className="object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                  {theme.name} Profile
                </span>
                <button
                  type="button"
                  onClick={onChangeProfile}
                  className="text-[11px] font-bold text-[#1376FF] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
              <p className="text-[16px] font-black text-[#0F172A] tracking-tight">
                @{verifiedProfile?.username}
              </p>
            </div>
          </div>

          {/* Coupon Strip */}
          <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                25% OFF
              </span>
              <span className="font-mono text-[14px] font-black text-[#0F172A] tracking-wide">
                {couponCode}
              </span>
              {timeLeft && (
                <span className="text-[11px] text-[#64748B] hidden sm:inline font-medium">
                  · expires in <strong className="font-mono text-[#0F172A]">{timeLeft}</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onCopyCoupon}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-extrabold transition cursor-pointer shadow-xs"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="mb-5 text-center sm:text-left">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#1376FF] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
          Step 03 · Available Packages
        </span>
        <h1 className="text-[24px] sm:text-[28px] font-black text-[#0F172A] tracking-tight mt-1">
          Select Your Next Boost
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 font-medium">
          Choose your package tier. The 25% discount coupon ({couponCode}) will be ready for checkout.
        </p>
      </div>

      {/* 2.5D Package Cards Grid */}
      <div
        className={`grid gap-4 mb-6 ${
          eligiblePackages.length === 1
            ? 'grid-cols-1 max-w-[380px] mx-auto'
            : eligiblePackages.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-[720px] mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {eligiblePackages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const price = (pkg.priceCents / 100).toFixed(2);
          const isPopular = Boolean(pkg.isPopular || pkg.badge);

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage(pkg.id)}
              className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 relative cursor-pointer group ${
                isSelected
                  ? 'border-2 shadow-lg -translate-y-1'
                  : isPopular
                  ? 'border-[#CBD5E1] shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:border-[#94A3B8]'
                  : 'border-[#E2E8F0] shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-[#CBD5E1]'
              }`}
              style={{
                borderColor: isSelected ? theme.primary : undefined,
                boxShadow: isSelected ? theme.cardSelectedGlow : undefined,
              }}
            >
              {/* Popular / Badge */}
              {isPopular && (
                <div className="absolute -top-3 right-4">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
                    style={{ background: theme.ctaGradient }}
                  >
                    {pkg.badge || 'POPULAR'}
                  </span>
                </div>
              )}

              <div>
                {/* Header info */}
                <div className="mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    {pkg.name}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[28px] font-black text-[#0F172A] tracking-tight">
                      {pkg.quantity.toLocaleString()}
                    </span>
                    <span className="text-[13px] font-bold text-[#64748B] uppercase">
                      {pkg.service}
                    </span>
                  </div>
                  {pkg.bonusQuantity > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#10B981] mt-0.5">
                      <Sparkles className="w-3 h-3" />
                      +{pkg.bonusQuantity.toLocaleString()} Bonus Included
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] mb-4 flex items-baseline justify-between shadow-2xs">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[22px] font-black text-[#0F172A] tracking-tight">
                      ${price}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-bold">USD</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full border border-[#A7F3D0]">
                    25% OFF COUPON
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-[12px] text-[#475569] mb-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                    <span>No password required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                    <span>Instant queue & high retention</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                    <span>24/7 priority customer support</span>
                  </li>
                </ul>
              </div>

              {/* Select Package CTA */}
              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
                }`}
                style={{
                  background: isSelected ? theme.ctaGradient : undefined,
                  boxShadow: isSelected ? theme.buttonShadow : undefined,
                }}
              >
                <span>{isSelected ? 'Package Selected' : 'Select Package'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
