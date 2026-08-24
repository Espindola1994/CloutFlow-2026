/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/purity, react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OFFER_PLATFORM_THEMES, OfferPlatformTheme } from '@/components/offer-experience/theme';
import { OfferHeader, OfferTrustBar } from '@/components/offer-experience/OfferHeader';
import { OfferWelcomeStage } from '@/components/offer-experience/OfferWelcomeStage';
import { OfferLookupStage } from '@/components/offer-experience/OfferLookupStage';
import { OfferLoadingStage } from '@/components/offer-experience/OfferLoadingStage';
import { OfferPreviewStage } from '@/components/offer-experience/OfferPreviewStage';
import { OfferPackageStage, SanitizedPackage } from '@/components/offer-experience/OfferPackageStage';
import { OfferReviewStage } from '@/components/offer-experience/OfferReviewStage';
import { OfferStatusCard, OfferValidatingCard } from '@/components/offer-experience/OfferStatusCards';

interface OfferData {
  code: string;
  discountPercent: number;
  couponCode: string;
  status: string;
  expiresAt: string | null;
  formattedExpiresAt: string | null;
  previousTarget: { platform: string; username: string; targetType?: string; profileUrl?: string | null } | null;
  packages: SanitizedPackage[];
}

type FlowStep = 'PREFILL' | 'LOOKUP' | 'LOADING' | 'PREVIEW' | 'PACKAGE' | 'REVIEW';

type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';

export default function OfferLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flow State
  const [flowStep, setFlowStep] = useState<FlowStep>('PREFILL');

  // Lookup State
  const [targetPlatform, setTargetPlatform] = useState<PlatformKey>('instagram');
  const [lookupInput, setLookupInput] = useState('');
  const [verifiedProfile, setVerifiedProfile] = useState<any | null>(null);
  const [isProfileRestricted, setIsProfileRestricted] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const pollingRef = useRef({ active: false });

  // Package & Checkout State
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpiredLocally, setIsExpiredLocally] = useState(false);

  const fetchOffer = useCallback(async () => {
    if (!code) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/offers/${encodeURIComponent(code)}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setOfferData(json.data);
        if (json.data.previousTarget) {
          setFlowStep('PREFILL');
          const rawPlat = (json.data.previousTarget.platform || 'instagram').toLowerCase();
          const safePlat = (['instagram', 'tiktok', 'twitter', 'youtube'].includes(rawPlat) ? rawPlat : 'instagram') as PlatformKey;
          setTargetPlatform(safePlat);
        } else {
          setFlowStep('LOOKUP');
        }
      } else {
        setErrorMsg(json.error?.message || 'This offer is no longer available.');
      }
    } catch {
      setErrorMsg('This offer is no longer available.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  useEffect(() => {
    if (!offerData?.expiresAt) return;
    const targetDate = new Date(offerData.expiresAt).getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpiredLocally(true);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        setTimeLeft(`${days}d ${remHours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offerData?.expiresAt]);

  const handleCopyCouponOnly = async () => {
    if (!offerData?.couponCode) return;
    try {
      await navigator.clipboard.writeText(offerData.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const handleStartLookup = async (inputStr: string, platform: string) => {
    if (!inputStr.trim()) {
      setLookupError('Please enter your @username or profile link.');
      return;
    }

    setLookupError(null);
    setFlowStep('LOADING');
    pollingRef.current.active = true;

    try {
      const res = await fetch('/api/search/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputStr.trim(), selectedPlatform: platform }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data && data.resolvedType === 'profile') {
        checkRestrictionAndSetProfile(data.data, platform);
        return;
      }

      if (res.ok && data.success && data.status === 'pending' && data.requestId) {
        let currentRequestId = data.requestId;
        const startTime = Date.now();
        const maxPollDuration = 45000;

        while (pollingRef.current.active && Date.now() - startTime < maxPollDuration) {
          await new Promise((r) => setTimeout(r, 2500));
          if (!pollingRef.current.active) break;

          const statusRes = await fetch(`/api/search/status?requestId=${encodeURIComponent(currentRequestId)}`);
          const statusJson = await statusRes.json().catch(() => null);

          if (!statusJson) continue;
          if (statusJson.status === 'pending' && statusJson.requestId) {
            currentRequestId = statusJson.requestId;
          }
          if (statusJson.status === 'complete' && statusJson.data) {
            checkRestrictionAndSetProfile(statusJson.data, platform);
            return;
          }
          if (statusJson.status === 'failed') {
            setLookupError(statusJson.message || "We couldn't find this profile. Check the @ or link and try again.");
            setFlowStep('LOOKUP');
            return;
          }
        }
        if (pollingRef.current.active) {
          setLookupError('The search is taking longer than expected. Please try again.');
          setFlowStep('LOOKUP');
        }
        return;
      }

      setLookupError(data.message || "We couldn't find this profile. Check the @ or link and try again.");
      setFlowStep('LOOKUP');
    } catch {
      setLookupError('The search is taking longer than expected. Please try again.');
      setFlowStep('LOOKUP');
    }
  };

  const checkRestrictionAndSetProfile = (profile: any, platform: string) => {
    let restricted = false;
    if (profile.platform === 'instagram' && profile.is_private) restricted = true;
    if (profile.platform === 'tiktok' && (profile.is_private || profile.private_account || profile.privateAccount)) restricted = true;
    if (profile.platform === 'twitter' && (profile.is_protected || profile.protected)) restricted = true;
    if (profile.platform === 'youtube' && (profile.is_private || profile.is_hidden)) restricted = true;

    setIsProfileRestricted(restricted);
    setVerifiedProfile(profile);
    const safePlat = (['instagram', 'tiktok', 'twitter', 'youtube'].includes(platform.toLowerCase()) ? platform.toLowerCase() : 'instagram') as PlatformKey;
    setTargetPlatform(safePlat);
    setFlowStep('PREVIEW');
  };

  const cancelPolling = () => {
    pollingRef.current.active = false;
    setFlowStep('LOOKUP');
  };

  const confirmProfile = () => {
    if (isProfileRestricted || !offerData) return;
    const eligible = offerData.packages.filter((p) => p.platform.toLowerCase() === targetPlatform.toLowerCase());
    const match = eligible.find((p) => p.id === selectedPackageId) || eligible.find((p) => p.isPopular) || eligible[0];
    if (match) {
      setSelectedPackageId(match.id);
    }
    setFlowStep('PACKAGE');
  };

  const executeCheckout = async (offerId: string) => {
    if (!offerData || isExpiredLocally || !verifiedProfile) return;
    setSelectedPackageId(offerId);
    setCheckoutSubmitting(true);
    setCheckoutError(null);

    // Revalidate offer client-side
    try {
      const revRes = await fetch(`/api/offers/${encodeURIComponent(code)}`);
      if (!revRes.ok) {
        setCheckoutError('This offer is no longer available.');
        setCheckoutSubmitting(false);
        setIsExpiredLocally(true);
        return;
      }
    } catch {}

    const normalizedUsername = (verifiedProfile.username || '').replace(/^@+/, '').trim();
    const isYouTube = targetPlatform === 'youtube';
    const targetType = isYouTube ? 'channel' : 'profile';

    try {
      const payload = {
        offerId,
        targetType,
        targetValue: normalizedUsername,
        targetUrl: verifiedProfile.profile_url || null,
        socialUsername: normalizedUsername,
        profileUrl: verifiedProfile.profile_url || null,
        email: null,
        offerCode: offerData.code,
      };

      const res = await fetch('/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setCheckoutError(json.error?.message || 'Unable to prepare checkout. Please try again.');
        setCheckoutSubmitting(false);
      }
    } catch {
      setCheckoutError('Unable to prepare checkout. Please try again.');
      setCheckoutSubmitting(false);
    }
  };

  const currentTheme: OfferPlatformTheme = OFFER_PLATFORM_THEMES[targetPlatform] || OFFER_PLATFORM_THEMES.instagram;

  // Filter packages based on targetPlatform
  const eligiblePackages = offerData
    ? offerData.packages.filter((p) => p.platform.toLowerCase() === targetPlatform.toLowerCase())
    : [];

  const selectedPkg = eligiblePackages.find((p) => p.id === selectedPackageId) || eligiblePackages[0] || null;

  // Stepper helper
  const getStepNumber = (step: FlowStep): number => {
    switch (step) {
      case 'PREFILL':
      case 'LOOKUP':
      case 'LOADING':
        return 1;
      case 'PREVIEW':
        return 2;
      case 'PACKAGE':
        return 3;
      case 'REVIEW':
        return 4;
      default:
        return 1;
    }
  };

  const currentStepNum = getStepNumber(flowStep);

  // LOADING STATE
  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-white text-[#081126] flex flex-col justify-between relative overflow-hidden font-sans">
        <OfferHeader
          timeLeft={timeLeft}
          isExpiredLocally={isExpiredLocally}
          currentStepNum={1}
          platform={targetPlatform}
          theme={currentTheme}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <OfferValidatingCard />
        </div>
        <OfferTrustBar />
      </main>
    );
  }

  // EXPIRED OR INVALID STATE
  if (errorMsg || isExpiredLocally || !offerData) {
    return (
      <main className="min-h-[100dvh] bg-white text-[#081126] flex flex-col justify-between relative overflow-hidden font-sans">
        <OfferHeader
          timeLeft={null}
          isExpiredLocally={true}
          currentStepNum={1}
          platform={targetPlatform}
          theme={currentTheme}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <OfferStatusCard
            title="Offer Unavailable"
            description="This repeat-purchase offer is no longer active or has already reached its expiration date."
          />
        </div>
        <OfferTrustBar />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-white text-[#081126] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#1376FF]/20 font-sans">
      {/* Background Decorative Ambience Matching Public Pages */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ease-out"
        style={{
          background: `
            radial-gradient(circle at 9% 31%, rgba(120,170,255,.045), transparent 18%),
            radial-gradient(circle at 90% 33%, color-mix(in srgb, ${currentTheme.primary} 5%, transparent), transparent 20%),
            ${currentTheme.ambientGlowLeft},
            ${currentTheme.ambientGlowRight}
          `,
        }}
      />

      {/* Decorative Brand Dots / Outline Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30 select-none" aria-hidden="true">
        <span className="absolute top-[80px] right-[5%] text-[11px] font-bold text-[#1376FF]/25 border border-[#1376FF]/20 rounded-full px-2 py-0.5">✦ CloutFlow Direct</span>
      </div>

      {/* 2.5D Sticky Header & Stepper */}
      <OfferHeader
        timeLeft={timeLeft}
        isExpiredLocally={isExpiredLocally}
        currentStepNum={currentStepNum}
        platform={targetPlatform}
        theme={currentTheme}
      />

      {/* Main Content Area (adapts to viewport) */}
      <div className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 z-10 flex flex-col justify-center">
        {/* =========================================================================
            SCREEN 1: WELCOME BACK (PREFILL STAGE)
           ========================================================================= */}
        {flowStep === 'PREFILL' && offerData.previousTarget && (
          <OfferWelcomeStage
            previousTarget={offerData.previousTarget}
            timeLeft={timeLeft}
            theme={currentTheme}
            onConfirm={() =>
              handleStartLookup(
                offerData.previousTarget!.username,
                offerData.previousTarget!.platform
              )
            }
            onSwitchProfile={() => setFlowStep('LOOKUP')}
          />
        )}

        {/* =========================================================================
            SCREEN 2: SOCIAL LOOKUP STAGE
           ========================================================================= */}
        {flowStep === 'LOOKUP' && (
          <OfferLookupStage
            targetPlatform={targetPlatform}
            setTargetPlatform={(p) => {
              setTargetPlatform(p);
              setLookupError(null);
            }}
            lookupInput={lookupInput}
            setLookupInput={setLookupInput}
            lookupError={lookupError}
            onSearch={handleStartLookup}
            hasPreviousTarget={Boolean(offerData.previousTarget)}
            onBackToPrevious={() => setFlowStep('PREFILL')}
            theme={currentTheme}
          />
        )}

        {/* =========================================================================
            SCREEN 3: LOADING STAGE
           ========================================================================= */}
        {flowStep === 'LOADING' && (
          <OfferLoadingStage
            platform={targetPlatform}
            theme={currentTheme}
            onCancel={cancelPolling}
          />
        )}

        {/* =========================================================================
            SCREEN 4: CONFIRM PROFILE STAGE
           ========================================================================= */}
        {flowStep === 'PREVIEW' && verifiedProfile && (
          <OfferPreviewStage
            platform={targetPlatform}
            verifiedProfile={verifiedProfile}
            isProfileRestricted={isProfileRestricted}
            theme={currentTheme}
            onConfirm={confirmProfile}
            onBack={() => setFlowStep('LOOKUP')}
          />
        )}

        {/* =========================================================================
            SCREEN 5: PACKAGE SELECTION STAGE
           ========================================================================= */}
        {flowStep === 'PACKAGE' && (
          <OfferPackageStage
            platform={targetPlatform}
            theme={currentTheme}
            verifiedProfile={verifiedProfile}
            couponCode={offerData.couponCode}
            timeLeft={timeLeft}
            eligiblePackages={eligiblePackages}
            selectedPackageId={selectedPackageId}
            copied={copied}
            onCopyCoupon={handleCopyCouponOnly}
            onChangeProfile={() => setFlowStep('PREVIEW')}
            onSelectPackage={(pkgId) => {
              setSelectedPackageId(pkgId);
              setFlowStep('REVIEW');
            }}
          />
        )}

        {/* =========================================================================
            SCREEN 6: FINAL REVIEW STAGE
           ========================================================================= */}
        {flowStep === 'REVIEW' && selectedPkg && (
          <OfferReviewStage
            platform={targetPlatform}
            theme={currentTheme}
            verifiedProfile={verifiedProfile}
            selectedPkg={selectedPkg}
            couponCode={offerData.couponCode}
            copied={copied}
            checkoutSubmitting={checkoutSubmitting}
            checkoutError={checkoutError}
            onCopyCoupon={handleCopyCouponOnly}
            onChangeProfile={() => setFlowStep('PREVIEW')}
            onChangePackage={() => setFlowStep('PACKAGE')}
            onExecuteCheckout={() => executeCheckout(selectedPkg.id)}
          />
        )}
      </div>

      {/* 2.5D Trust Footer Bar */}
      <div className="z-10">
        <OfferTrustBar />
      </div>
    </main>
  );
}
