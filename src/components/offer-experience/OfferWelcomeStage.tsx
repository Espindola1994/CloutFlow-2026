'use client';

import React from 'react';
import Image from 'next/image';
import { User, Search, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
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

interface OfferWelcomeStageProps {
  previousTarget: {
    platform: string;
    username: string;
    targetType?: string;
    profileUrl?: string | null;
  };
  timeLeft: string | null;
  theme: OfferPlatformTheme;
  onConfirm: () => void;
  onSwitchProfile: () => void;
}

export function OfferWelcomeStage({
  previousTarget,
  timeLeft,
  theme,
  onConfirm,
  onSwitchProfile,
}: OfferWelcomeStageProps) {
  const platKey = (
    ['instagram', 'tiktok', 'twitter', 'youtube'].includes(
      previousTarget.platform.toLowerCase()
    )
      ? previousTarget.platform.toLowerCase()
      : 'instagram'
  ) as 'instagram' | 'tiktok' | 'twitter' | 'youtube';

  return (
    <div className="w-full max-w-[720px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Header info */}
      <div className="mb-5 text-center sm:text-left">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            25% OFF Repeat Purchase
          </span>
          {timeLeft && (
            <span className="text-[12px] font-medium text-[#64748B] flex items-center gap-1.5 bg-white/80 border border-[#E2E8F0] px-2.5 py-0.5 rounded-full shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#10B981]" />
              Expires in <strong className="text-[#0F172A] font-mono">{timeLeft}</strong>
            </span>
          )}
        </div>

        <h1 className="text-[26px] sm:text-[32px] font-black text-[#0F172A] tracking-tight">
          Welcome Back
        </h1>
        <p className="text-[14px] text-[#475569] mt-0.5 font-medium">
          Ready for another boost?
        </p>
        <p className="text-[13px] text-[#64748B] font-medium mt-0.5">
          Boost the same profile again?
        </p>
      </div>

      {/* 2.5D Profile Panel */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 transition-all duration-200 border relative overflow-hidden"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          borderColor: '#E2E8F0',
        }}
      >
        {/* Subtle platform top border highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#F1F5F9]">
          {/* Avatar + Handle */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border-2 flex items-center justify-center text-[#64748B] shadow-inner"
                style={{ borderColor: theme.primary }}
              >
                <User className="w-7 h-7 text-[#64748B]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center p-1 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                <Image
                  src={PLATFORM_ICONS[platKey]}
                  alt=""
                  width={14}
                  height={14}
                  className="object-contain"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  {previousTarget.platform} Profile
                </span>
                <span className="text-[10px] bg-[#F1F5F9] text-[#475569] font-bold px-1.5 py-0.5 rounded-full border border-[#E2E8F0]">
                  Last Used
                </span>
              </div>
              <p className="text-[18px] sm:text-[21px] font-black text-[#0F172A] tracking-tight">
                @{previousTarget.username}
              </p>
            </div>
          </div>

          {/* Confirm Action CTA with 2.5D button styling */}
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-extrabold text-[13px] transition-all duration-150 cursor-pointer active:translate-y-0.5 hover:-translate-y-0.5 hover:shadow-lg shrink-0"
            style={{
              background: theme.ctaGradient,
              boxShadow: theme.buttonShadow,
            }}
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Find / Confirm Profile</span>
          </button>
        </div>

        {/* Bottom switch row */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span className="text-[12px] text-[#64748B]">
            Want to boost a different account or platform?
          </span>
          <button
            type="button"
            onClick={onSwitchProfile}
            className="text-[12px] font-bold text-[#0F172A] hover:text-[#1376FF] transition cursor-pointer underline underline-offset-2"
          >
            Use another profile
          </button>
        </div>
      </div>
    </div>
  );
}
