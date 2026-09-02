/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Search, ShieldCheck } from 'lucide-react';
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
  { key: 'twitter', label: 'X', icon: twitterIcon },
  { key: 'youtube', label: 'YouTube', icon: youtubeIcon },
];

export function OfferLookupStage({ targetPlatform, setTargetPlatform, lookupInput, setLookupInput, lookupError, onSearch, hasPreviousTarget, onBackToPrevious, theme }: OfferLookupStageProps) {
  return (
    <section className="cf-offer-stage cf-offer-lookup">
      <div className="cf-offer-copy">
        <span className="cf-offer-kicker"><Search /> Find a profile</span>
        <h1>Choose where you want to <em>grow next.</em></h1>
        <p>Select the social network and paste a public username or profile link. We&apos;ll confirm the destination before you choose a package.</p>
        <div className="cf-offer-note"><ShieldCheck /> No password. We only check public profile data.</div>
      </div>

      <div className="cf-offer-focus-card cf-offer-search-card" style={{ '--offer-accent': theme.primary } as React.CSSProperties}>
        <div className="cf-offer-focus-glow" style={{ background: theme.gradient }} />
        <div className="cf-offer-card-topline"><span>Social network</span><small>1 of 2</small></div>
        <div className="cf-offer-networks">
          {PLATFORMS.map((p) => {
            const selected = targetPlatform === p.key;
            return (
              <button key={p.key} type="button" className={selected ? 'is-selected' : ''} onClick={() => setTargetPlatform(p.key)} style={selected ? { borderColor: theme.primary, boxShadow: `0 0 0 3px ${theme.accentSubtle}` } : undefined}>
                <Image src={p.icon} alt="" width={23} height={23} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        <label className="cf-offer-input-label">{theme.name} username or profile link</label>
        <div className="cf-offer-search-input">
          <Search />
          <input value={lookupInput} onChange={(e) => setLookupInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch(lookupInput, targetPlatform)} placeholder="@username or profile link" />
        </div>
        {lookupError && <div className="cf-offer-error">{lookupError}</div>}

        <div className="cf-offer-actions">
          <button type="button" onClick={() => onSearch(lookupInput, targetPlatform)} className="cf-offer-primary" style={{ background: theme.ctaGradient, boxShadow: theme.buttonShadow }}>
            Find my profile <ArrowRight />
          </button>
          {hasPreviousTarget && <button type="button" onClick={onBackToPrevious} className="cf-offer-secondary"><ArrowLeft /> Back</button>}
        </div>
      </div>
    </section>
  );
}
