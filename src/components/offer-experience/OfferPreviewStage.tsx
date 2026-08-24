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
    <div className="w-full max-w-[580px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Title */}
      <div className="mb-4 text-center sm:text-left">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#10B981] bg-[#ECFDF5] px-2.5 py-0.5 rounded-md border border-[#A7F3D0]">
          Step 02 · Confirm Profile
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-black text-[#0F172A] tracking-tight mt-1">
          Confirm Profile
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 font-medium">
          Ensure this is the correct public account you want to boost.
        </p>
      </div>

      {/* 2.5D Social Preview Container */}
      <div
        className="mb-4 rounded-2xl overflow-hidden border transition-all duration-200 bg-white"
        style={{
          boxShadow: '0 10px 28px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          borderColor: '#E2E8F0',
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
          className={`w-full sm:w-auto flex-1 py-3 px-5 rounded-xl font-black text-[13px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-md ${
            isProfileRestricted
              ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none'
              : 'text-white active:translate-y-0.5 hover:-translate-y-0.5'
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
          className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] font-bold text-[13px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Search another profile</span>
        </button>
      </div>
    </div>
  );
}
