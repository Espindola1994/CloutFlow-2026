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
    <div className="w-full max-w-[640px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Title */}
      <div className="mb-5 text-center sm:text-left">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#E1306C] bg-[#FFF0F5] px-2.5 py-0.5 rounded-md border border-[#FCE7F3]">
          Step 01
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-black text-[#0F172A] tracking-tight mt-1.5">
          Social Lookup
        </h1>
        <p className="text-[14px] text-[#64748B] mt-0.5 font-medium">
          Choose your platform and enter your username or public link.
        </p>
      </div>

      {/* 2.5D Panel */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border relative overflow-hidden transition-all duration-200"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
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
          <label className="text-[11px] font-black uppercase tracking-wider text-[#475569] block mb-2">
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
                      ? 'bg-white text-[#0F172A] border-2 shadow-[0_4px_12px_rgba(0,0,0,0.06)] -translate-y-0.5'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white hover:border-[#CBD5E1] hover:text-[#0F172A]'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.primary : undefined,
                  }}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <Image src={p.icon} alt="" width={15} height={15} className="object-contain" />
                  </div>
                  <span className="capitalize">{p.key === 'twitter' ? 'X / Twitter' : p.key}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Box */}
        <div className="mb-5">
          <label className="text-[11px] font-black uppercase tracking-wider text-[#475569] block mb-2">
            {theme.name} Profile Username or Link
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="@username or profile link"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(lookupInput, targetPlatform)}
              className="w-full bg-[#FAFAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#1376FF] focus:ring-2 focus:ring-[#1376FF]/20 transition font-medium shadow-2xs"
            />
          </div>

          {lookupError && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-[12px] text-[#DC2626] flex items-center gap-2 font-bold animate-in fade-in duration-150">
              <AlertCircle size={15} className="shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => onSearch(lookupInput, targetPlatform)}
            className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl text-white font-extrabold text-[13px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:translate-y-0.5 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: theme.ctaGradient,
              boxShadow: theme.buttonShadow,
            }}
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Locate Profile</span>
          </button>

          {hasPreviousTarget && (
            <button
              type="button"
              onClick={onBackToPrevious}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] hover:bg-[#F8FAFC] hover:text-[#0F172A] hover:border-[#CBD5E1] transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to previous</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
