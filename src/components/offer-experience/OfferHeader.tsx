'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Tag, Check, ArrowUpRight } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

interface OfferHeaderProps {
  timeLeft: string | null;
  isExpiredLocally: boolean;
  currentStepNum: number;
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
}

const PLATFORM_ICONS = {
  instagram: instagramIcon,
  tiktok: tiktokIcon,
  twitter: twitterIcon,
  youtube: youtubeIcon,
};

const STEPS = [
  { num: 1, label: 'Profile' },
  { num: 2, label: 'Confirm' },
  { num: 3, label: 'Package' },
  { num: 4, label: 'Checkout' },
];

export function OfferHeader({
  timeLeft,
  isExpiredLocally,
  currentStepNum,
  platform,
  theme,
}: OfferHeaderProps) {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-40 transition-colors duration-300 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
      {/* Top Navbar Row */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-1 text-[#0F172A] font-black text-[18px] tracking-tight hover:opacity-90 transition-opacity"
        >
          <span>Clout</span>
          <span className="text-[#1376FF]">Flow</span>
          <ArrowUpRight className="w-4 h-4 text-[#1376FF] -mt-2 -ml-0.5 stroke-[3]" />
        </Link>

        {/* Right Status Badges */}
        <div className="flex items-center gap-2.5">
          {timeLeft && !isExpiredLocally && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
              <Clock className="w-3.5 h-3.5 text-[#1376FF]" />
              <span>
                Expires: <strong className="text-[#0F172A] font-mono">{timeLeft}</strong>
              </span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[12px] font-bold text-[#1D4ED8] shadow-[0_2px_6px_rgba(29,78,216,0.06)]">
            <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Repeat Purchase · 25% Off</span>
          </div>
        </div>
      </div>

      {/* 2.5D Adaptive Stepper */}
      <div className="border-t border-[#F1F5F9] bg-[#FAFAFC]/90">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between sm:justify-center sm:gap-8 text-[12px]">
          {STEPS.map((st, idx) => {
            const isCompleted = currentStepNum > st.num;
            const isCurrent = currentStepNum === st.num;

            return (
              <React.Fragment key={st.num}>
                <div
                  className={`flex items-center gap-2 transition-transform duration-200 ${
                    isCurrent ? 'scale-[1.02]' : ''
                  }`}
                >
                  {/* Step Bubble with 2.5D elevation */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#10B981] text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                        : isCurrent
                        ? 'text-white shadow-[0_3px_10px_rgba(0,0,0,0.18)] ring-2 ring-white'
                        : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]'
                    }`}
                    style={{
                      background: isCurrent
                        ? theme.stepActiveBg
                        : isCompleted
                        ? '#10B981'
                        : undefined,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <div className="flex items-center justify-center">
                        <Image
                          src={PLATFORM_ICONS[platform]}
                          alt=""
                          width={11}
                          height={11}
                          className="object-contain brightness-0 invert"
                        />
                      </div>
                    ) : (
                      st.num
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`font-bold tracking-tight text-[12px] sm:text-[13px] ${
                      isCurrent
                        ? 'text-[#0F172A]'
                        : isCompleted
                        ? 'text-[#475569]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    <span className="hidden sm:inline text-[#94A3B8] font-normal mr-1">
                      0{st.num}
                    </span>
                    {st.label}
                  </span>
                </div>

                {/* Stepper Divider */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-5 sm:w-10 h-[1.5px] rounded transition-colors duration-300 ${
                      currentStepNum > idx + 1 ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export function OfferTrustBar() {
  return (
    <footer className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 py-4 border-t border-[#E2E8F0]/80">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-[12px]">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 backdrop-blur-xs border border-[#E2E8F0] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] transition-colors">
          <div className="w-5 h-5 rounded-md bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="font-bold text-[#334155] text-[11px] sm:text-[12px]">100% Safe & Secure</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 backdrop-blur-xs border border-[#E2E8F0] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] transition-colors">
          <div className="w-5 h-5 rounded-md bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="font-bold text-[#334155] text-[11px] sm:text-[12px]">No Password Required</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 backdrop-blur-xs border border-[#E2E8F0] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] transition-colors">
          <div className="w-5 h-5 rounded-md bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="font-bold text-[#334155] text-[11px] sm:text-[12px]">Fast Order Delivery</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 backdrop-blur-xs border border-[#E2E8F0] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] transition-colors">
          <div className="w-5 h-5 rounded-md bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="font-bold text-[#334155] text-[11px] sm:text-[12px]">24/7 Order Support</span>
        </div>
      </div>
    </footer>
  );
}
