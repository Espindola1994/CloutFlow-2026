'use client';

import React from 'react';
import { Check, Copy, ArrowRight, Loader2, User, Package as PackageIcon, Tag, AlertCircle } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { SanitizedPackage } from './OfferPackageStage';

interface OfferReviewStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
  verifiedProfile: any;
  selectedPkg: SanitizedPackage;
  couponCode: string;
  copied: boolean;
  checkoutSubmitting: boolean;
  checkoutError: string | null;
  onCopyCoupon: () => void;
  onChangeProfile: () => void;
  onChangePackage: () => void;
  onExecuteCheckout: () => void;
}

export function OfferReviewStage({
  platform,
  theme,
  verifiedProfile,
  selectedPkg,
  couponCode,
  copied,
  checkoutSubmitting,
  checkoutError,
  onCopyCoupon,
  onChangeProfile,
  onChangePackage,
  onExecuteCheckout,
}: OfferReviewStageProps) {
  const price = (selectedPkg.priceCents / 100).toFixed(2);

  return (
    <div className="w-full max-w-[620px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Title */}
      <div className="mb-5 text-center sm:text-left">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#1376FF] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
          Step 04 · Review & Checkout
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-black text-[#0F172A] tracking-tight mt-1">
          Review Your Order
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 font-medium">
          Confirm your target account and package before proceeding to secure checkout.
        </p>
      </div>

      {/* 2.5D Order Summary Card */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 mb-5 border relative overflow-hidden transition-all duration-200 space-y-4"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          borderColor: '#E2E8F0',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        {/* Target Profile Row */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Target Account
              </span>
              <p className="text-[15px] font-black text-[#0F172A] mt-0.5">
                @{verifiedProfile?.username}
              </p>
              <span className="text-[11px] text-[#64748B] capitalize font-medium">
                {theme.name} Profile
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangeProfile}
            className="text-[12px] font-bold text-[#1376FF] hover:underline cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Selected Package Row */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0 mt-0.5">
              <PackageIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Selected Package
              </span>
              <p className="text-[15px] font-black text-[#0F172A] mt-0.5">
                {selectedPkg.name}
              </p>
              <span className="text-[12px] font-extrabold text-[#0F172A]">
                ${price} USD
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangePackage}
            className="text-[12px] font-bold text-[#1376FF] hover:underline cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Discount Row */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Repeat Purchase Discount
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[14px] font-black text-[#0F172A]">
                  {couponCode}
                </span>
                <span className="text-[11px] font-black text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full border border-[#A7F3D0]">
                  25% OFF
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCopyCoupon}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[11px] font-extrabold transition cursor-pointer border border-[#E2E8F0] shadow-2xs"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        {/* Checkout CTA */}
        <div className="pt-3">
          <button
            type="button"
            onClick={onExecuteCheckout}
            disabled={checkoutSubmitting}
            className="w-full py-3.5 px-6 rounded-xl text-white font-black text-[14px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:translate-y-0.5 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            style={{
              background: theme.ctaGradient,
              boxShadow: theme.buttonShadow,
            }}
          >
            {checkoutSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Secure Checkout...</span>
              </>
            ) : (
              <>
                <span>Continue to Secure Checkout</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          <p className="text-[11px] text-[#64748B] text-center mt-2.5 font-medium">
            You will enter <strong className="font-mono text-[#0F172A]">{couponCode}</strong> in the coupon field at checkout for 25% discount.
          </p>
        </div>

        {checkoutError && (
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-[12px] font-bold text-[#DC2626] text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
