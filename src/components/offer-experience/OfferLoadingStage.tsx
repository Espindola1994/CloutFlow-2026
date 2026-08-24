'use client';

import React from 'react';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
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

interface OfferLoadingStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
  onCancel: () => void;
}

export function OfferLoadingStage({ platform, theme, onCancel }: OfferLoadingStageProps) {
  return (
    <div className="w-full max-w-[520px] mx-auto py-6 animate-in fade-in zoom-in-95 duration-200">
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-7 text-center border relative overflow-hidden transition-all"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          borderColor: '#E2E8F0',
        }}
      >
        {/* Top platform bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        {/* 2.5D Animated Spinner with Platform Icon in Center */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-3 border-t-transparent animate-spin"
            style={{
              borderColor: `${theme.primary} transparent ${theme.primary} ${theme.primary}`,
            }}
          />
          <div className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shadow-inner">
            <Image
              src={PLATFORM_ICONS[platform]}
              alt=""
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
        </div>

        <span
          className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
          style={{
            color: theme.primary,
            backgroundColor: theme.accentSubtle,
            borderColor: theme.cardBorder,
          }}
        >
          {theme.name} Verification
        </span>

        <h2 className="text-[20px] sm:text-[22px] font-[800] text-[#081126] tracking-tight mt-2 mb-1">
          Locating Profile...
        </h2>
        <p className="text-[13px] text-[#64748B] mb-5 max-w-sm mx-auto font-medium">
          Checking live public account information. This takes just a few seconds...
        </p>

        {/* Cancel Action */}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFC] hover:bg-white hover:text-[#081126] text-[12px] font-bold text-[#64748B] transition cursor-pointer shadow-2xs"
        >
          <RotateCcw size={13} />
          <span>Cancel search</span>
        </button>
      </div>
    </div>
  );
}

