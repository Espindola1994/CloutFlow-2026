/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { BadgeCheck, UserRound } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

const PLATFORM_ICONS: Record<string, any> = { instagram: instagramIcon, tiktok: tiktokIcon, twitter: twitterIcon, youtube: youtubeIcon };

export interface RepeatProfileIdentity {
  platform: string;
  username: string;
  maskedEmail?: string | null;
  avatarUrl?: string | null;
  isConfirmed?: boolean;
  isLoadingAvatar?: boolean;
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

export function RepeatProfilePresentation({ identity, theme, size = 'md', showBadge = true, badgeText, actionButton, className = '' }: RepeatProfilePresentationProps) {
  const key = ['instagram','tiktok','twitter','youtube'].includes((identity.platform || '').toLowerCase()) ? identity.platform.toLowerCase() : 'instagram';
  const avatarClass = size === 'lg' ? 'is-lg' : size === 'sm' ? 'is-sm' : 'is-md';
  return (
    <div className={`cf-repeat-profile ${avatarClass} ${className}`}>
      <div className="cf-repeat-profile-main">
        <div className="cf-repeat-avatar" style={{ '--offer-accent': theme.primary } as React.CSSProperties}>
          {identity.isLoadingAvatar && <i className="cf-repeat-avatar-loading" style={{ borderTopColor: theme.primary }} />}
          {identity.avatarUrl ? <img src={identity.avatarUrl} alt={identity.username} /> : <span><UserRound /></span>}
          <b><Image src={PLATFORM_ICONS[key]} alt="" width={12} height={12} /></b>
        </div>
        <div className="cf-repeat-profile-copy">
          <div><small>{theme.label} profile</small>{showBadge && <em>{identity.isConfirmed && <BadgeCheck />}{identity.isConfirmed ? 'Confirmed' : badgeText || 'Saved'}</em>}</div>
          <strong>@{identity.username.replace(/^@+/, '')}</strong>
          {identity.maskedEmail && <span>{identity.maskedEmail}</span>}
        </div>
      </div>
      {actionButton && <div className="cf-repeat-profile-action">{actionButton}</div>}
    </div>
  );
}
