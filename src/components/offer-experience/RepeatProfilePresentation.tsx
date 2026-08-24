/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import Image from 'next/image';
import { User, CheckCircle2 } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: instagramIcon,
  tiktok: tiktokIcon,
  twitter: twitterIcon,
  youtube: youtubeIcon,
};

export interface RepeatProfileIdentity {
  platform: string;
  username: string;
  maskedEmail?: string | null;
  avatarUrl?: string | null;
  isConfirmed?: boolean;
}

interface RepeatProfilePresentationProps {
  identity: RepeatProfileIdentity;
  theme: OfferPlatformTheme;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  badgeText?: string;
  actionButton?: React.ReactNode;
  className?: string;
}

export function RepeatProfilePresentation({
  identity,
  theme,
  size = 'md',
  showBadge = true,
  badgeText,
  actionButton,
  className = '',
}: RepeatProfilePresentationProps) {
  const rawPlat = (identity.platform || 'instagram').toLowerCase();
  const platKey = ['instagram', 'tiktok', 'twitter', 'youtube'].includes(rawPlat)
    ? rawPlat
    : 'instagram';

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const avatarSizeClass = isLg
    ? 'w-14 h-14 sm:w-16 sm:h-16'
    : isSm
    ? 'w-9 h-9'
    : 'w-11 h-11 sm:w-12 sm:h-12';

  const iconBadgeSize = isLg ? 'w-5 h-5' : isSm ? 'w-4 h-4' : 'w-4.5 h-4.5';
  const iconImgSize = isLg ? 12 : isSm ? 9 : 11;

  const usernameClass = isLg
    ? 'text-[18px] sm:text-[21px] font-black'
    : isSm
    ? 'text-[14px] sm:text-[15px] font-extrabold'
    : 'text-[16px] sm:text-[18px] font-black';

  return (
    <div className={`flex items-center justify-between gap-3.5 ${className}`}>
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Avatar Container */}
        <div className="relative shrink-0">
          {identity.avatarUrl ? (
            <img
              src={identity.avatarUrl}
              alt={identity.username}
              className={`${avatarSizeClass} rounded-full object-cover bg-[#F1F5F9] border-2 shadow-2xs transition-all duration-150`}
              style={{ borderColor: theme.primary }}
              onError={(e) => {
                // Neutral fallback on image error
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                const fallback = parent?.querySelector('.identity-fallback-avatar');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}

          <div
            className={`identity-fallback-avatar ${avatarSizeClass} rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border-2 flex items-center justify-center text-[#64748B] shadow-inner ${
              identity.avatarUrl ? 'hidden' : 'flex'
            }`}
            style={{ borderColor: theme.primary }}
          >
            <User className={isLg ? 'w-6 h-6 sm:w-7 sm:h-7' : isSm ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>

          {/* Platform Badge Overlay */}
          <div
            className={`absolute -bottom-1 -right-1 ${iconBadgeSize} rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center p-0.5 shadow-2xs`}
          >
            <Image
              src={PLATFORM_ICONS[platKey] || PLATFORM_ICONS.instagram}
              alt=""
              width={iconImgSize}
              height={iconImgSize}
              className="object-contain"
            />
          </div>
        </div>

        {/* Identity Texts */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              {theme.name} Profile
            </span>
            {showBadge && (
              <span className="text-[10px] bg-[#F1F5F9] text-[#475569] font-bold px-1.5 py-0.2 rounded-full border border-[#E2E8F0] inline-flex items-center gap-1">
                {identity.isConfirmed ? (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#16A34A]" />
                    Confirmed
                  </>
                ) : (
                  badgeText || 'Last Used'
                )}
              </span>
            )}
          </div>

          <p className={`${usernameClass} text-[#081126] tracking-tight truncate leading-snug mt-0.5`}>
            @{identity.username.replace(/^@+/, '')}
          </p>

          {identity.maskedEmail && (
            <p className="text-[11px] sm:text-[12px] font-mono text-[#64748B] truncate mt-0.2">
              {identity.maskedEmail}
            </p>
          )}
        </div>
      </div>

      {/* Optional Right Action Button */}
      {actionButton && <div className="shrink-0">{actionButton}</div>}
    </div>
  );
}
