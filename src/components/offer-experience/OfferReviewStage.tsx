/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { AlertCircle, ArrowRight, BadgeCheck, Check, Copy, Gift, Loader2, PackageCheck, ShieldCheck } from 'lucide-react';
import { OfferPlatformTheme } from './theme';
import { SanitizedPackage } from './OfferPackageStage';
import { RepeatProfilePresentation } from './RepeatProfilePresentation';

interface OfferReviewStageProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  theme: OfferPlatformTheme;
  verifiedProfile: any;
  selectedPkg: SanitizedPackage;
  couponCode: string;
  copied: boolean;
  checkoutSubmitting: boolean;
  checkoutError: string | null;
  onCopyCoupon: () => void;
  onChangeProfile: () => void;
  onChangePackage: () => void;
  onExecuteCheckout: () => void;
}

export function OfferReviewStage({ platform, theme, verifiedProfile, selectedPkg, couponCode, copied, checkoutSubmitting, checkoutError, onCopyCoupon, onChangeProfile, onChangePackage, onExecuteCheckout }: OfferReviewStageProps) {
  const price = (selectedPkg.priceCents / 100).toFixed(2);
  const discountedPrice = ((selectedPkg.priceCents * .75) / 100).toFixed(2);

  return (
    <section className="cf-offer-stage cf-offer-review-stage cf-o10-review-stage">
      <div className="cf-offer-copy">
        <span className="cf-o10-step-kicker">03 CHECKOUT</span>
        <h1>Review & <em>checkout.</em></h1>
        <p>You're ready to grow!</p>
        
      </div>

      <div className="cf-offer-checkout-card" style={{ '--offer-accent': theme.primary, '--offer-gradient': theme.ctaGradient } as React.CSSProperties}>
        <div className="cf-offer-checkout-head"><span>Order summary</span><span><Gift /> 25% Repeat Reward</span></div>
        <div className="cf-offer-checkout-profile">
          <RepeatProfilePresentation
            identity={{
              platform,
              username: verifiedProfile?.username || '',
              avatarUrl: verifiedProfile?.avatar_url || verifiedProfile?.profile_pic_url || verifiedProfile?.avatarUrl || verifiedProfile?.profileImageUrl || verifiedProfile?.avatar || verifiedProfile?.picture || null,
              maskedEmail: verifiedProfile?.maskedEmail || null,
              isConfirmed: true,
            }}
            theme={theme}
            size="md"
            showBadge={false}
          />
          <button type="button" onClick={onChangeProfile}>Change</button>
        </div>

        <div className="cf-offer-checkout-package">
          <div className="cf-offer-checkout-package-icon"><PackageCheck /></div>
          <div><small>Selected growth</small><strong>{selectedPkg.name}</strong><span>${discountedPrice} <del>${price}</del></span></div>
          <button type="button" onClick={onChangePackage}>Change</button>
        </div>

        <div className="cf-offer-coupon-box">
          <span><small>Reward code</small><strong>{couponCode}</strong></span>
          <button type="button" onClick={onCopyCoupon}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}</button>
        </div>

        <button type="button" onClick={onExecuteCheckout} disabled={checkoutSubmitting} className="cf-offer-primary cf-offer-checkout-cta" style={{ background: theme.ctaGradient, boxShadow: theme.buttonShadow }}>
          {checkoutSubmitting ? <><Loader2 className="animate-spin" /> Preparing checkout...</> : <>Continue to Checkout <ArrowRight /></>}
        </button>
        <p className="cf-offer-checkout-fineprint">Secure checkout. No password required.</p><div className="cf-o10-secure-box"><ShieldCheck /><span><strong>100% Safe & Secure</strong><small>Your data is protected with bank-level encryption.</small></span></div>
        {checkoutError && <div className="cf-offer-error"><AlertCircle /> {checkoutError}</div>}
      </div>
    </section>
  );
}
