'use client';

import React from 'react';
import Image from 'next/image';
import { RotateCcw, ScanSearch } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

const PLATFORM_ICONS = { instagram: instagramIcon, tiktok: tiktokIcon, twitter: twitterIcon, youtube: youtubeIcon };

interface OfferLoadingStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
  onCancel: () => void;
}

export function OfferLoadingStage({ platform, theme, onCancel }: OfferLoadingStageProps) {
  return (
    <section className="cf-offer-loading-stage">
      <div className="cf-offer-loading-orb" style={{ '--offer-accent': theme.primary } as React.CSSProperties}>
        <div className="cf-offer-loading-ring" style={{ borderTopColor: theme.primary, borderRightColor: theme.primary }} />
        <div className="cf-offer-loading-icon"><Image src={PLATFORM_ICONS[platform]} alt="" width={27} height={27} /></div>
      </div>
      <span className="cf-offer-kicker"><ScanSearch /> Checking {theme.name}</span>
      <h1>Finding your profile<span className="cf-offer-dots">...</span></h1>
      <p>We&apos;re checking public profile details so you can confirm the right destination.</p>
      <div className="cf-offer-loading-bars"><i /><i /><i /></div>
      <button type="button" className="cf-offer-secondary cf-offer-cancel" onClick={onCancel}><RotateCcw /> Cancel search</button>
    </section>
  );
}
