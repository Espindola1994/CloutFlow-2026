/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import { Search, Clock, Sparkles, Package } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { RepeatProfilePresentation } from './RepeatProfilePresentation';

interface OfferWelcomeStageProps {
  previousTarget: {
    platform: string;
    username: string;
    targetType?: string;
    profileUrl?: string | null;
    avatarUrl?: string | null;
    maskedEmail?: string | null;
    previousPackageName?: string | null;
  };
  liveAvatarUrl?: string | null;
  isLoadingLiveAvatar?: boolean;
  timeLeft: string | null;
  theme: OfferPlatformTheme;
  onConfirm: () => void;
  onSwitchProfile: () => void;
}

export function OfferWelcomeStage({
  previousTarget,
  liveAvatarUrl,
  isLoadingLiveAvatar = false,
  timeLeft,
  theme,
  onConfirm,
  onSwitchProfile,
}: OfferWelcomeStageProps) {
  // Data Priority:
  // 1. Current live avatar returned by silent resolver
  // 2. Stored historical real avatar while resolver is loading
  // 3. Platform placeholder fallback
  const effectiveAvatarUrl = liveAvatarUrl || previousTarget.avatarUrl || null;

  return (
    <div className="w-full max-w-[680px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Header info */}
      <div className="mb-4 text-center sm:text-left">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            25% OFF Repeat Purchase
          </span>
          {timeLeft && (
            <span className="text-[12px] font-medium text-[#64748B] flex items-center gap-1.5 bg-white/80 border border-[#E2E8F0] px-2.5 py-0.5 rounded-full shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#1376FF]" />
              Expires in <strong className="text-[#081126] font-mono">{timeLeft}</strong>
            </span>
          )}
        </div>

        <h1 className="text-[26px] sm:text-[30px] font-[800] text-[#081126] tracking-tight">
          Welcome Back
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#536176] mt-0.5 font-medium">
          Ready for another boost? Continue with your confirmed profile or search a new one.
        </p>
      </div>

      {/* 2.5D Profile Panel */}
      <div
        className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 transition-all duration-200 border relative overflow-hidden"
        style={{
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
          borderColor: '#E2E8F0',
        }}
      >
        {/* Subtle platform top border highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: theme.gradient }}
        />

        {/* Unified Identity Presentation Component */}
        <div className="pb-4 border-b border-[#F1F5F9]">
          <RepeatProfilePresentation
            identity={{
              platform: previousTarget.platform,
              username: previousTarget.username,
              avatarUrl: effectiveAvatarUrl,
              maskedEmail: previousTarget.maskedEmail,
              isConfirmed: false,
              isLoadingAvatar: isLoadingLiveAvatar,
            }}
            theme={theme}
            size="lg"
            showBadge={true}
            badgeText="Last Used"
            actionButton={
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] font-bold text-[#475569]">
                <Sparkles className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                <span>25% Instant Savings</span>
              </div>
            }
          />
        </div>

        {/* Previous Purchase / Suggested Boost Context if Available */}
        {previousTarget.previousPackageName && (
          <div className="my-3.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                <Package className="w-3.5 h-3.5 text-[#1376FF]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Last Purchase / Suggested Boost
                </span>
                <span className="text-[13px] font-bold text-[#081126]">
                  {previousTarget.previousPackageName}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#BFDBFE] shrink-0">
              FLOW25 Eligible
            </span>
          </div>
        )}

        {/* Action Row */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-md hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: theme.ctaGradient,
              boxShadow: theme.buttonShadow,
            }}
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm & View Packages</span>
          </button>

          <button
            type="button"
            onClick={onSwitchProfile}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#081126] hover:bg-[#F8FAFC] font-bold text-[13px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Use another profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

