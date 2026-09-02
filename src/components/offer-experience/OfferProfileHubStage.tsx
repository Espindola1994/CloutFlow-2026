/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Lightbulb,
  Loader2,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { RepeatProfilePresentation } from './RepeatProfilePresentation';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';
type ProfileMode = 'PREFILL' | 'LOOKUP' | 'LOADING' | 'PREVIEW';

interface PreviousTarget {
  platform: string;
  username: string;
  targetType?: string;
  profileUrl?: string | null;
  avatarUrl?: string | null;
  maskedEmail?: string | null;
  previousPackageName?: string | null;
}

interface OfferProfileHubStageProps {
  mode: ProfileMode;
  previousTarget: PreviousTarget | null;
  liveAvatarUrl?: string | null;
  isLoadingLiveAvatar?: boolean;
  timeLeft: string | null;
  targetPlatform: PlatformKey;
  setTargetPlatform: (p: PlatformKey) => void;
  lookupInput: string;
  setLookupInput: (v: string) => void;
  lookupError: string | null;
  verifiedProfile: any | null;
  isProfileRestricted: boolean;
  theme: OfferPlatformTheme;
  onUseSavedProfile: () => void;
  onChooseAnother: () => void;
  onSearch: (input: string, platform: PlatformKey) => void;
  onCancelSearch: () => void;
  onConfirmFound: () => void;
  onBackToSaved: () => void;
}

const PLATFORMS = [
  { key: 'instagram' as const, label: 'Instagram', icon: instagramIcon },
  { key: 'tiktok' as const, label: 'TikTok', icon: tiktokIcon },
  { key: 'youtube' as const, label: 'YouTube', icon: youtubeIcon },
  { key: 'twitter' as const, label: 'X', icon: twitterIcon },
];

const fmt = (value: unknown) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.0','')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace('.0','')}K`;
  return n.toLocaleString('en-US');
};

export function OfferProfileHubStage({
  mode,
  previousTarget,
  liveAvatarUrl,
  isLoadingLiveAvatar = false,
  timeLeft,
  targetPlatform,
  setTargetPlatform,
  lookupInput,
  setLookupInput,
  lookupError,
  verifiedProfile,
  isProfileRestricted,
  theme,
  onUseSavedProfile,
  onChooseAnother,
  onSearch,
  onCancelSearch,
  onConfirmFound,
  onBackToSaved,
}: OfferProfileHubStageProps) {
  const foundUsername = verifiedProfile?.username || previousTarget?.username || 'your.profile';
  const foundAvatar =
    verifiedProfile?.avatar_url ||
    verifiedProfile?.profile_pic_url ||
    verifiedProfile?.avatarUrl ||
    verifiedProfile?.profileImageUrl ||
    verifiedProfile?.avatar ||
    verifiedProfile?.picture ||
    liveAvatarUrl ||
    previousTarget?.avatarUrl ||
    null;



  return (
    <section className="cf-o10-profile-stage" style={{ '--offer-accent': theme.primary, '--offer-gradient': theme.ctaGradient } as React.CSSProperties}>
      <div className="cf-o10-profile-shell">
        <div className="cf-o10-profile-hero">
          <div className="cf-o10-profile-copy">
            <span className="cf-o10-step-kicker">01 PROFILE</span>
            <h1>{mode === 'PREFILL' ? <>Welcome Back! <em>🔥</em></> : mode === 'LOOKUP' ? <>Find Your <em>Profile.</em></> : mode === 'LOADING' ? <>Finding Your <em>Profile...</em></> : <>Profile <em>Confirmed.</em></>}</h1>
            <p>{mode === 'PREFILL' ? "Let's boost your growth even more." : mode === 'LOOKUP' ? 'Choose your network and enter a public profile.' : mode === 'LOADING' ? 'Checking public profile details. This only takes a moment.' : 'Everything looks good. Continue to your package.'}</p>
          </div>

          <div className="cf-o10-rocket" aria-hidden="true">
            <div className="cf-o10-rocket-halo" />
            <div className="cf-o10-rocket-body"><Rocket /></div>
            <i className="cf-o10-orb one" /><i className="cf-o10-orb two" /><i className="cf-o10-orb three" />
            <div className="cf-o10-cloud c1" /><div className="cf-o10-cloud c2" />
          </div>
        </div>

        {mode === 'PREFILL' && previousTarget && (
          <>
            <div className="cf-o10-block-title">Last used profile</div>
            <div className="cf-o10-profile-card">
              <RepeatProfilePresentation
                identity={{
                  platform: previousTarget.platform,
                  username: previousTarget.username,
                  avatarUrl: liveAvatarUrl || previousTarget.avatarUrl || null,
                  maskedEmail: previousTarget.maskedEmail,
                  isLoadingAvatar: isLoadingLiveAvatar,
                }}
                theme={theme}
                size="lg"
                showBadge
                badgeText="Ready"
              />
              {previousTarget.previousPackageName && (
                <div className="cf-o10-last-growth">
                  <span>Last growth</span><strong>{previousTarget.previousPackageName}</strong>
                </div>
              )}
            </div>

            <button type="button" className="cf-o10-primary" onClick={onUseSavedProfile}>
              Continue with this profile <ArrowRight />
            </button>
            <button type="button" className="cf-o10-secondary" onClick={onChooseAnother}>
              <Search /> Search another profile
            </button>

            <div className="cf-o10-tips">
              <div className="cf-o10-tips-title"><Lightbulb /> Tips</div>
              <p><Check /> Make sure your account is public</p>
              <p><Check /> Real followers only, no bots</p>
              <p><Check /> Results start showing in minutes</p>
            </div>
          </>
        )}

        {(mode === 'LOOKUP' || mode === 'LOADING') && (
          <div className="cf-o10-search-panel">
            <div className="cf-o10-block-title">Choose your network</div>
            <div className="cf-o10-networks">
              {PLATFORMS.map((platform) => {
                const active = targetPlatform === platform.key;
                return (
                  <button
                    key={platform.key}
                    type="button"
                    disabled={mode === 'LOADING'}
                    className={active ? 'is-active' : ''}
                    onClick={() => setTargetPlatform(platform.key)}
                  >
                    <Image src={platform.icon} alt="" width={22} height={22} />
                    <span>{platform.label}</span>
                    {active && <BadgeCheck />}
                  </button>
                );
              })}
            </div>

            <label>{theme.name} username or profile link</label>
            <div className="cf-o10-input">
              <Search />
              <input
                value={lookupInput}
                disabled={mode === 'LOADING'}
                onChange={(e) => setLookupInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mode !== 'LOADING' && onSearch(lookupInput, targetPlatform)}
                placeholder="@username or profile link"
              />
            </div>
            {lookupError && <div className="cf-offer-hub-error">{lookupError}</div>}
            <div className="cf-o10-safe"><ShieldCheck /> Public data only. No password required.</div>

            {mode === 'LOADING' ? (
              <div className="cf-o10-loading">
                <div><Loader2 /><Image src={PLATFORMS.find((p) => p.key === targetPlatform)?.icon || instagramIcon} alt="" width={22} height={22} /></div>
                <strong>Locating profile...</strong>
                <span>Checking public account data</span>
                <button type="button" onClick={onCancelSearch}><ArrowLeft /> Cancel search</button>
              </div>
            ) : (
              <>
                <button type="button" className="cf-o10-primary" onClick={() => onSearch(lookupInput, targetPlatform)}>
                  Analyze profile <ArrowRight />
                </button>
                {previousTarget && <button type="button" className="cf-o10-text-button" onClick={onBackToSaved}><ArrowLeft /> Back to saved profile</button>}
              </>
            )}
          </div>
        )}

        {mode === 'PREVIEW' && verifiedProfile && (
          <div className="cf-o10-confirm-panel">
            <div className="cf-o10-block-title">Confirm this profile</div>
            <div className="cf-o10-profile-card">
              <RepeatProfilePresentation
                identity={{
                  platform: targetPlatform,
                  username: foundUsername,
                  avatarUrl: foundAvatar,
                  maskedEmail: verifiedProfile?.maskedEmail || previousTarget?.maskedEmail || null,
                  isConfirmed: !isProfileRestricted,
                }}
                theme={theme}
                size="lg"
                showBadge
                badgeText={isProfileRestricted ? 'Restricted' : 'Confirmed'}
              />
              <div className="cf-offer-found-stats">
                <span><strong>{fmt(verifiedProfile?.followers_count)}</strong><small>Followers</small></span>
                <span><strong>{fmt(verifiedProfile?.following_count)}</strong><small>Following</small></span>
                <span><strong>{fmt(verifiedProfile?.posts_count)}</strong><small>Posts</small></span>
              </div>
            </div>
            {isProfileRestricted ? (
              <div className="cf-offer-hub-error">This profile is private or restricted. Choose another public profile.</div>
            ) : (
              <div className="cf-offer-found-ok"><Check /> Public profile confirmed</div>
            )}
            <button type="button" disabled={isProfileRestricted} className="cf-o10-primary" onClick={onConfirmFound}>
              Continue to packages <ArrowRight />
            </button>
            <button type="button" className="cf-o10-secondary" onClick={onChooseAnother}><RefreshCw /> Search another profile</button>
          </div>
        )}
      </div>
    </section>
  );
}
