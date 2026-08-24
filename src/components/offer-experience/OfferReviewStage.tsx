/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import { Check, Copy, ArrowRight, Loader2, Package as PackageIcon, Tag, AlertCircle } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { SanitizedPackage } from './OfferPackageStage';
import { RepeatProfilePresentation } from './RepeatProfilePresentation';

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
  const discountedPrice = ((selectedPkg.priceCents * 0.75) / 100).toFixed(2);

  return (
    <div className="w-full max-w-[620px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Title */}
      <div className="mb-4 text-center sm:text-left">
        <span
          className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs inline-block"
          style={{
            color: theme.primary,
            backgroundColor: theme.accentSubtle,
            borderColor: theme.cardBorder,
          }}
        >
          Step 04 · Review & Checkout
        </span>
        <h1 className="text-[24px] sm:text-[28px] font-[800] text-[#081126] tracking-tight mt-1">
          Review Your Order
        </h1>
        <p className="text-[13px] text-[#536176] mt-0.5 font-medium">
          Confirm your target profile and package before continuing to secure checkout.
        </p>
      </div>

      {/* 2.5D Order Summary Card */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 mb-4 border relative overflow-hidden transition-all duration-200 space-y-4"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          borderColor: '#E2E8F0',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        {/* Target Profile Row via Shared Component */}
        <div className="pb-3.5 border-b border-[#F1F5F9]">
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
                className="text-[12px] font-bold text-[#1376FF] hover:underline cursor-pointer ml-1 shrink-0"
              >
                Change
              </button>
            }
          />
        </div>

        {/* Selected Package Row */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0 mt-0.5">
              <PackageIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Selected Boost
              </span>
              <p className="text-[15px] font-[800] text-[#081126] mt-0.5">
                {selectedPkg.name}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[13px] font-black text-[#081126]">
                  ${discountedPrice} USD
                </span>
                <span className="text-[11px] text-[#94A3B8] line-through font-medium">
                  ${price}
                </span>
              </div>
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

        {/* Discount Object Row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
              25% OFF
            </span>
            <span className="font-mono text-[14px] font-black text-[#081126] tracking-wide">
              {couponCode}
            </span>
          </div>
          <button
            type="button"
            onClick={onCopyCoupon}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F1F5F9] text-[#081126] text-[11px] font-bold transition cursor-pointer border border-[#CBD5E1] shadow-2xs"
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
        <div className="pt-2">
          <button
            type="button"
            onClick={onExecuteCheckout}
            disabled={checkoutSubmitting}
            className="w-full h-[48px] rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:translate-y-0 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
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

          <p className="text-[12px] text-[#536176] text-center mt-2.5 font-medium">
            Copy <strong className="font-mono text-[#081126] font-bold">{couponCode}</strong> and enter it in the coupon field at checkout to receive 25% off.
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
