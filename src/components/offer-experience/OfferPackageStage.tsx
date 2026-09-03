/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { ArrowRight, Check, Clock3, Copy, Gift, Sparkles, UserRound } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { RepeatProfilePresentation } from './RepeatProfilePresentation';

export interface SanitizedPackage {
  id: string;
  platform: string;
  service: string;
  name: string;
  slug: string;
  quantity: number;
  bonusQuantity: number;
  priceCents: number;
  oldPriceCents?: number | null;
  currency: string;
  badge?: string | null;
  isPopular?: boolean;
}

interface OfferPackageStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
  verifiedProfile: any;
  couponCode: string;
  timeLeft: string | null;
  eligiblePackages: SanitizedPackage[];
  selectedPackageId: string | null;
  copied: boolean;
  onCopyCoupon: () => void;
  onChangeProfile: () => void;
  onSelectPackage: (pkgId: string) => void;
}

export function OfferPackageStage({ platform, theme, verifiedProfile, couponCode, timeLeft, eligiblePackages, selectedPackageId, copied, onCopyCoupon, onChangeProfile, onSelectPackage }: OfferPackageStageProps) {
  return (
    <section className="cf-offer-packages-stage cf-o10-package-stage">
      <div className="cf-offer-packages-head">
        <div>
          <span className="cf-o10-step-kicker">02 PACKAGE</span>
          <h1>Choose your <em>growth package.</em></h1>
          <p>Your 25% reward is already included.</p>
        </div>
        <div className="cf-offer-profile-chip">
          <RepeatProfilePresentation
            identity={{
              platform,
              username: verifiedProfile?.username || '',
              avatarUrl: verifiedProfile?.avatar_url || verifiedProfile?.profile_pic_url || verifiedProfile?.avatarUrl || verifiedProfile?.profileImageUrl || verifiedProfile?.avatar || verifiedProfile?.picture || null,
              maskedEmail: verifiedProfile?.maskedEmail || null,
              isConfirmed: true,
            }}
            theme={theme}
            size="sm"
            showBadge={false}
          />
          <button type="button" onClick={onChangeProfile}>Change</button>
        </div>
      </div>

      <div className="cf-offer-reward-strip cf-o10-reward-strip" style={{ '--offer-accent': theme.primary } as React.CSSProperties}>
        <div><Sparkles /><span><small>Your reward code</small><strong>{couponCode}</strong></span></div>
        <div className="cf-offer-reward-strip-right">
          {timeLeft && <span><Clock3 /> {timeLeft}</span>}
          <button type="button" onClick={onCopyCoupon}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy code'}</button>
        </div>
      </div>

      <div className={`cf-offer-plan-grid ${eligiblePackages.length <= 2 ? 'is-compact' : ''}`}>
        {eligiblePackages.map((pkg, index) => {
          const selected = selectedPackageId === pkg.id;
          const price = (pkg.priceCents / 100).toFixed(2);
          const discountedPrice = ((pkg.priceCents * .75) / 100).toFixed(2);
          const badge = pkg.badge || (pkg.isPopular ? 'Most popular' : index === 1 ? 'Best value' : null);
          return (
            <article key={pkg.id} className={`cf-offer-plan-card ${selected ? 'is-selected' : ''}`} style={{ '--offer-accent': theme.primary, '--offer-gradient': theme.ctaGradient } as React.CSSProperties} onClick={() => onSelectPackage(pkg.id)}>
              {badge && <span className="cf-offer-plan-badge"><Sparkles /> {badge}</span>}
              <div className="cf-offer-plan-icon"><UserRound /></div>
              <small>{pkg.service}</small>
              <h3>{pkg.name}</h3>
              {pkg.bonusQuantity > 0 && <p className="cf-offer-plan-bonus">+{pkg.bonusQuantity.toLocaleString()} bonus included</p>}
              <div className="cf-offer-plan-price"><strong>${discountedPrice}</strong><del>${price}</del></div>
              <span className="cf-offer-plan-save">25% reward applied</span>
              <ul>
                <li><Check /> No password required</li>
                <li><Check /> Fast delivery start</li>
                <li><Check /> Priority support</li>
              </ul>
              <button type="button" className="cf-offer-plan-cta" onClick={(e) => { e.stopPropagation(); onSelectPackage(pkg.id); }}>
                {selected ? 'Selected' : 'Select & Continue'} <ArrowRight />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
