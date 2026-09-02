/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import { ArrowRight, Clock3, Gift, RefreshCw, Sparkles, Zap } from 'lucide-react';
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
  const effectiveAvatarUrl = liveAvatarUrl || previousTarget.avatarUrl || null;

  return (
    <section className="cf-offer-stage cf-offer-welcome">
      <div className="cf-offer-copy">
        <span className="cf-offer-kicker"><Gift /> 25% repeat reward unlocked</span>
        <h1>Welcome back. <em>Let&apos;s grow again.</em></h1>
        <p>Your last profile is ready. Keep it, switch it, and use your repeat-customer reward in seconds.</p>

        <div className="cf-offer-mini-benefits">
          <span><Zap /> Fast setup</span>
          <span><Sparkles /> 25% already reserved</span>
          {timeLeft && <span><Clock3 /> {timeLeft} left</span>}
        </div>
      </div>

      <div className="cf-offer-focus-card" style={{ '--offer-accent': theme.primary } as React.CSSProperties}>
        <div className="cf-offer-focus-glow" style={{ background: theme.gradient }} />
        <div className="cf-offer-card-topline">
          <span>Continue where you left off</span>
          <span className="cf-offer-reward-chip"><Sparkles /> 25% reward</span>
        </div>

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
          badgeText="Saved profile"
        />

        {previousTarget.previousPackageName && (
          <div className="cf-offer-last-order">
            <div><small>Last growth</small><strong>{previousTarget.previousPackageName}</strong></div>
            <span>Reward ready</span>
          </div>
        )}

        <div className="cf-offer-actions">
          <button type="button" onClick={onConfirm} className="cf-offer-primary" style={{ background: theme.ctaGradient, boxShadow: theme.buttonShadow }}>
            Continue with this profile <ArrowRight />
          </button>
          <button type="button" onClick={onSwitchProfile} className="cf-offer-secondary">
            <RefreshCw /> Choose another profile
          </button>
        </div>
      </div>
    </section>
  );
}
