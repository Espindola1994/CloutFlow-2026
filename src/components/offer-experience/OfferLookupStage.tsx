/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { Search, AlertCircle, ArrowLeft } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';

interface OfferLookupStageProps {
  targetPlatform: PlatformKey;
  setTargetPlatform: (p: PlatformKey) => void;
  lookupInput: string;
  setLookupInput: (val: string) => void;
  lookupError: string | null;
  onSearch: (input: string, platform: PlatformKey) => void;
  hasPreviousTarget: boolean;
  onBackToPrevious: () => void;
  theme: OfferPlatformTheme;
}

const PLATFORMS: { key: PlatformKey; label: string; icon: any }[] = [
  { key: 'instagram', label: 'Instagram', icon: instagramIcon },
  { key: 'tiktok', label: 'TikTok', icon: tiktokIcon },
  { key: 'twitter', label: 'X / Twitter', icon: twitterIcon },
  { key: 'youtube', label: 'YouTube', icon: youtubeIcon },
];

export function OfferLookupStage({
  targetPlatform,
  setTargetPlatform,
  lookupInput,
  setLookupInput,
  lookupError,
  onSearch,
  hasPreviousTarget,
  onBackToPrevious,
  theme,
}: OfferLookupStageProps) {
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
          Step 01 · Profile Lookup
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-[800] text-[#081126] tracking-tight mt-1.5">
          Find Your Profile
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#536176] mt-0.5 font-medium">
          Select your platform and enter your public handle or profile URL.
        </p>
      </div>

      {/* 2.5D Panel */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border relative overflow-hidden transition-all duration-200"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          borderColor: '#E2E8F0',
        }}
      >
        {/* Subtle top border highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        {/* Platform Selector Grid */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block mb-2">
            Select Platform
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORMS.map((p) => {
              const isSelected = targetPlatform === p.key;

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setTargetPlatform(p.key)}
                  className={`py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-[#081126] border-2 shadow-[0_4px_12px_rgba(0,0,0,0.06)] -translate-y-0.5'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white hover:border-[#CBD5E1] hover:text-[#081126]'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.primary : undefined,
                  }}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <Image src={p.icon} alt="" width={15} height={15} className="object-contain" />
                  </div>
                  <span className="capitalize">{p.key === 'twitter' ? 'X' : p.key}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Box: 46-48px compact */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block mb-2">
            {theme.name} Profile Username or Link
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="@username or profile link"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(lookupInput, targetPlatform)}
              className="w-full h-[46px] bg-[#FAFAFC] border border-[#CBD5E1] rounded-xl px-4 text-[14px] text-[#081126] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white transition font-medium shadow-2xs"
              style={{
                outlineColor: theme.primary,
              }}
            />
          </div>

          {lookupError && (
            <div className="mt-2.5 flex items-center gap-2 text-[12px] text-[#DC2626] font-medium bg-[#FEF2F2] border border-[#FEE2E2] p-2.5 rounded-lg animate-in fade-in duration-150">
              <AlertCircle size={15} className="shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}
        </div>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => onSearch(lookupInput, targetPlatform)}
            className="w-full sm:w-auto flex-1 h-[46px] rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-md hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: theme.ctaGradient,
              boxShadow: theme.buttonShadow,
            }}
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Find {theme.name} Profile</span>
          </button>

          {hasPreviousTarget && (
            <button
              type="button"
              onClick={onBackToPrevious}
              className="w-full sm:w-auto h-[46px] px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#081126] hover:bg-[#F8FAFC] font-bold text-[13px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Previous</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
