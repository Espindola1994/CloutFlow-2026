/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, ShieldCheck } from 'lucide-react';
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

export function OfferPreviewStage({ platform, verifiedProfile, isProfileRestricted, theme, onConfirm, onBack }: OfferPreviewStageProps) {
  return (
    <section className="cf-offer-stage cf-offer-preview-stage">
      <div className="cf-offer-copy">
        <span className="cf-offer-kicker"><BadgeCheck /> Profile found</span>
        <h1>Make sure this is <em>the right profile.</em></h1>
        <p>One quick confirmation and your 25% reward will be applied to the available growth packages.</p>
        <div className="cf-offer-note"><ShieldCheck /> We never ask for your social password.</div>
        <div className="cf-offer-actions cf-offer-preview-actions">
          <button type="button" onClick={onConfirm} disabled={isProfileRestricted} className="cf-offer-primary" style={{ background: isProfileRestricted ? '#cbd5e1' : theme.ctaGradient, boxShadow: isProfileRestricted ? 'none' : theme.buttonShadow }}>
            {isProfileRestricted ? 'Make account public to continue' : 'Yes, this is my profile'} <ArrowRight />
          </button>
          <button type="button" onClick={onBack} className="cf-offer-secondary"><ArrowLeft /> Search again</button>
        </div>
      </div>

      <div className="cf-offer-social-frame" style={{ '--offer-accent': theme.primary } as React.CSSProperties}>
        <div className="cf-offer-social-frame-head"><span>{theme.name} preview</span><small>Public profile</small></div>
        <div className="cf-offer-social-preview-inner">
          {platform === 'instagram' && <InstagramPreview profile={verifiedProfile} onClose={onBack} />}
          {platform === 'tiktok' && <TikTokPreview profile={verifiedProfile} onClose={onBack} />}
          {platform === 'twitter' && <TwitterPreview profile={verifiedProfile} onClose={onBack} />}
          {platform === 'youtube' && <YouTubePreview profile={verifiedProfile} onClose={onBack} />}
        </div>
      </div>
    </section>
  );
}
