/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { InstagramPreview, TikTokPreview, TwitterPreview, YouTubePreview } from '@/components/social-preview';
import { OfferPlatformTheme } from './theme';

interface OfferPreviewStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  verifiedProfile: any;
  isProfileRestricted: boolean;
  theme: OfferPlatformTheme;
  onConfirm: () => void;
  onBack: () => void;
}

export function OfferPreviewStage({
  platform,
  verifiedProfile,
  isProfileRestricted,
  theme,
  onConfirm,
  onBack,
}: OfferPreviewStageProps) {
  return (
    <div className="w-full max-w-[560px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Title */}
      <div className="mb-3 text-center sm:text-left">
        <span
          className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs inline-block"
          style={{
            color: theme.primary,
            backgroundColor: theme.accentSubtle,
            borderColor: theme.cardBorder,
          }}
        >
          Step 02 · Confirm Profile
        </span>
        <h1 className="text-[24px] sm:text-[28px] font-[800] text-[#081126] tracking-tight mt-1">
          Confirm Your Profile
        </h1>
        <p className="text-[13px] text-[#536176] mt-0.5 font-medium">
          Verify that this is the exact public account you want to boost.
        </p>
      </div>

      {/* 2.5D Social Preview Container */}
      <div
        className="mb-4 rounded-2xl overflow-hidden border transition-all duration-200 bg-white"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          borderColor: theme.cardBorder,
        }}
      >
        {platform === 'instagram' && (
          <InstagramPreview profile={verifiedProfile} onClose={onBack} />
        )}
        {platform === 'tiktok' && (
          <TikTokPreview profile={verifiedProfile} onClose={onBack} />
        )}
        {platform === 'twitter' && (
          <TwitterPreview profile={verifiedProfile} onClose={onBack} />
        )}
        {platform === 'youtube' && (
          <YouTubePreview profile={verifiedProfile} onClose={onBack} />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isProfileRestricted}
          className={`w-full sm:w-auto flex-1 h-[46px] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-md ${
            isProfileRestricted
              ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none'
              : 'text-white active:translate-y-0 hover:-translate-y-0.5'
          }`}
          style={{
            background: isProfileRestricted ? undefined : theme.ctaGradient,
            boxShadow: isProfileRestricted ? undefined : theme.buttonShadow,
          }}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{isProfileRestricted ? 'Make account public to continue' : 'Use this profile'}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto h-[46px] px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#081126] hover:bg-[#F8FAFC] font-bold text-[13px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Search another profile</span>
        </button>
      </div>
    </div>
  );
}

