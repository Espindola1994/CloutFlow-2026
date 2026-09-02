/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/purity, react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OFFER_PLATFORM_THEMES, OfferPlatformTheme } from '@/components/offer-experience/theme';
import { OfferHeader } from '@/components/offer-experience/OfferHeader';
import { OfferWelcomeStage } from '@/components/offer-experience/OfferWelcomeStage';
import { OfferLookupStage } from '@/components/offer-experience/OfferLookupStage';
import { OfferLoadingStage } from '@/components/offer-experience/OfferLoadingStage';
import { OfferPreviewStage } from '@/components/offer-experience/OfferPreviewStage';
import { OfferPackageStage, SanitizedPackage } from '@/components/offer-experience/OfferPackageStage';
import { OfferReviewStage } from '@/components/offer-experience/OfferReviewStage';
import { OfferStatusCard, OfferValidatingCard } from '@/components/offer-experience/OfferStatusCards';
import { OfferOption10Experience } from '@/components/offer-experience/OfferOption10Experience';

interface OfferData {
  code: string;
  discountPercent: number;
  couponCode: string;
  status: string;
  expiresAt: string | null;
  formattedExpiresAt: string | null;
  previousTarget: {
    platform: string;
    username: string;
    targetType?: string;
    profileUrl?: string | null;
    avatarUrl?: string | null;
    maskedEmail?: string | null;
    email?: string | null;
    previousPackageName?: string | null;
    service?: string | null;
  } | null;
  packages: SanitizedPackage[];
}

type FlowStep = 'PREFILL' | 'LOOKUP' | 'LOADING' | 'PREVIEW' | 'PACKAGE' | 'REVIEW';

type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';
type ServiceKey = 'followers' | 'likes' | 'views';

type LocalPreviewStage = 'profile' | 'package' | 'review';

const LOCAL_PREVIEW_PROFILE = {
  platform: 'instagram',
  username: 'cloutflow.preview',
  full_name: 'CloutFlow Creator',
  biography: 'Creator focused on social growth, content and community.',
  followers_count: 55800,
  following_count: 67,
  posts_count: 248,
  is_private: false,
  profile_url: 'https://instagram.com/cloutflow.preview',
  avatar_url: null,
  maskedEmail: 'lo*****@gmail.com',
};

const LOCAL_PREVIEW_PACKAGES: SanitizedPackage[] = [
  {
    id: 'preview-instagram-followers-1000',
    platform: 'instagram',
    service: 'followers',
    name: '1,000 Followers',
    slug: 'preview-instagram-followers-1000',
    quantity: 1000,
    bonusQuantity: 0,
    priceCents: 1999,
    currency: 'USD',
    badge: null,
    isPopular: false,
  },
  {
    id: 'preview-instagram-followers-2000',
    platform: 'instagram',
    service: 'followers',
    name: '2,000 Followers',
    slug: 'preview-instagram-followers-2000',
    quantity: 2000,
    bonusQuantity: 200,
    priceCents: 2999,
    currency: 'USD',
    badge: 'BEST VALUE',
    isPopular: true,
  },
  {
    id: 'preview-instagram-followers-5000',
    platform: 'instagram',
    service: 'followers',
    name: '5,000 Followers',
    slug: 'preview-instagram-followers-5000',
    quantity: 5000,
    bonusQuantity: 500,
    priceCents: 4999,
    currency: 'USD',
    badge: null,
    isPopular: false,
  },
  {
    id: 'preview-instagram-followers-10000',
    platform: 'instagram',
    service: 'followers',
    name: '10,000 Followers',
    slug: 'preview-instagram-followers-10000',
    quantity: 10000,
    bonusQuantity: 1000,
    priceCents: 7999,
    currency: 'USD',
    badge: null,
    isPopular: false,
  },
  {
    id: 'preview-instagram-followers-20000',
    platform: 'instagram',
    service: 'followers',
    name: '20,000 Followers',
    slug: 'preview-instagram-followers-20000',
    quantity: 20000,
    bonusQuantity: 2000,
    priceCents: 12999,
    currency: 'USD',
    badge: null,
    isPopular: false,
  },
  {
    id: 'preview-instagram-followers-50000',
    platform: 'instagram',
    service: 'followers',
    name: '50,000 Followers',
    slug: 'preview-instagram-followers-50000',
    quantity: 50000,
    bonusQuantity: 5000,
    priceCents: 24999,
    currency: 'USD',
    badge: null,
    isPopular: false,
  },
];

function isLocalOfferPreview(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const params = new URLSearchParams(window.location.search);
  return isLocalhost && params.get('preview') === '1';
}

function getLocalPreviewStage(): LocalPreviewStage {
  if (typeof window === 'undefined') return 'profile';
  const raw = new URLSearchParams(window.location.search).get('stage')?.toLowerCase();
  if (raw === 'package' || raw === 'review') return raw;
  return 'profile';
}

function createLocalPreviewOffer(code: string): OfferData {
  return {
    code: code || 'CF25-PREVIEW',
    discountPercent: 25,
    couponCode: 'FLOW25',
    status: 'LOCAL_PREVIEW',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    formattedExpiresAt: null,
    previousTarget: {
      platform: 'instagram',
      username: 'cloutflow.preview',
      targetType: 'profile',
      profileUrl: 'https://instagram.com/cloutflow.preview',
      avatarUrl: null,
      maskedEmail: 'lo*****@gmail.com',
      email: 'loyal.customer@gmail.com',
      previousPackageName: '2,000 followers',
      service: 'followers',
    },
    packages: LOCAL_PREVIEW_PACKAGES,
  };
}

export default function OfferLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flow State
  const [flowStep, setFlowStep] = useState<FlowStep>('PREFILL');

  // Silent Auto-Resolution State (Step 01 Live Avatar Enrichment)
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(null);
  const [isLoadingLiveAvatar, setIsLoadingLiveAvatar] = useState(false);
  const autoResolvedProfileRef = useRef<any | null>(null);
  const autoResolutionStartedRef = useRef(false);

  // Lookup State
  const [targetPlatform, setTargetPlatform] = useState<PlatformKey>('instagram');
  const [targetService, setTargetService] = useState<ServiceKey>('followers');
  const [customerEmail, setCustomerEmail] = useState('');
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
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [isValidationTransition, setIsValidationTransition] = useState(false);
  const [validationTransitionProgress, setValidationTransitionProgress] = useState(0);
  const validationTransitionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const validationTransitionDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOffer = useCallback(async () => {
    if (!code) return;

    // LOCALHOST-ONLY visual preview. Never bypasses production offer validation.
    if (isLocalOfferPreview()) {
      const previewOffer = createLocalPreviewOffer(code);
      const previewStage = getLocalPreviewStage();

      setIsLocalPreview(true);
      setLoading(false);
      setErrorMsg(null);
      setIsExpiredLocally(false);
      setOfferData(previewOffer);
      setTargetPlatform('instagram');
      setTargetService('followers');
      setCustomerEmail(previewOffer.previousTarget?.email || '');
      setLiveAvatarUrl(previewOffer.previousTarget?.avatarUrl || null);
      setIsLoadingLiveAvatar(false);
      setIsProfileRestricted(false);
      setLookupError(null);
      setCheckoutError(null);

      if (previewStage === 'profile') {
        setVerifiedProfile(LOCAL_PREVIEW_PROFILE);
        setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
        setFlowStep('PREFILL');
      } else if (previewStage === 'package') {
        setVerifiedProfile(LOCAL_PREVIEW_PROFILE);
        setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
        setFlowStep('PACKAGE');
      } else {
        setVerifiedProfile(LOCAL_PREVIEW_PROFILE);
        setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
        setFlowStep('PACKAGE');
      }
      return;
    }

    try {
      setIsLocalPreview(false);
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
          const rawService = String(
            json.data.previousTarget.service ||
            json.data.previousTarget.previousPackageName ||
            'followers'
          ).toLowerCase();
          const safeService = (
            rawService.includes('view') ? 'views' :
            rawService.includes('like') ? 'likes' :
            'followers'
          ) as ServiceKey;
          setTargetPlatform(safePlat);
          setTargetService(safeService);
          setCustomerEmail(String(json.data.previousTarget.email || ''));
          setLookupInput(json.data.previousTarget.username ? `@${String(json.data.previousTarget.username).replace(/^@+/, '')}` : '');
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
    return () => {
      if (validationTransitionTimerRef.current) {
        clearInterval(validationTransitionTimerRef.current);
      }
      if (validationTransitionDoneRef.current) {
        clearTimeout(validationTransitionDoneRef.current);
      }
    };
  }, []);


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
    // V622 — countdown temporarily frozen at the initial rendered value.
    updateTimer();
    return () => {};
  }, [offerData?.expiresAt]);

  const extractAvatarUrl = (profileData: any): string | null => {
    if (!profileData) return null;
    return (
      profileData.avatar_url ||
      profileData.profile_pic_url ||
      profileData.profile_pic_url_hd ||
      profileData.avatarUrl ||
      profileData.profileImageUrl ||
      profileData.avatar ||
      profileData.picture ||
      null
    );
  };

  const isMatchingIdentity = (
    expectedUsername: string,
    resolvedUsername: string | undefined
  ): boolean => {
    if (!expectedUsername || !resolvedUsername) return false;
    const cleanExpected = expectedUsername.replace(/^@+/, '').trim().toLowerCase();
    const cleanResolved = resolvedUsername.replace(/^@+/, '').trim().toLowerCase();
    return cleanExpected === cleanResolved;
  };

  // Step 01 Silent Auto-Resolution of Live Avatar
  useEffect(() => {
    const prev = offerData?.previousTarget;
    if (
      !offerData ||
      offerData.status !== 'ACTIVE' ||
      !prev ||
      !prev.platform ||
      !prev.username ||
      autoResolutionStartedRef.current
    ) {
      return;
    }

    autoResolutionStartedRef.current = true;
    let isCancelled = false;

    const performSilentAutoResolution = async () => {
      const requestedUsername = prev.username.trim();
      const requestedPlatform = prev.platform.trim().toLowerCase();

      try {
        setIsLoadingLiveAvatar(true);

        const res = await fetch('/api/search/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: requestedUsername,
            selectedPlatform: requestedPlatform,
          }),
        });
        const data = await res.json().catch(() => null);

        if (isCancelled) return;

        if (res.ok && data?.success && data?.data && data?.resolvedType === 'profile') {
          if (isMatchingIdentity(requestedUsername, data.data.username)) {
            const liveAvatar = extractAvatarUrl(data.data);
            if (liveAvatar) {
              setLiveAvatarUrl(liveAvatar);
            }
            autoResolvedProfileRef.current = data.data;
          }
          return;
        }

        // If pending, poll /api/search/status silently
        if (res.ok && data?.success && data?.status === 'pending' && data?.requestId) {
          let currentRequestId = data.requestId;
          const startTime = Date.now();
          const maxPollDuration = 35000;

          while (!isCancelled && Date.now() - startTime < maxPollDuration) {
            await new Promise((r) => setTimeout(r, 2500));
            if (isCancelled) return;

            const statusRes = await fetch(
              `/api/search/status?requestId=${encodeURIComponent(currentRequestId)}`
            );
            const statusJson = await statusRes.json().catch(() => null);

            if (!statusJson) continue;
            if (statusJson.status === 'pending' && statusJson.requestId) {
              currentRequestId = statusJson.requestId;
            }
            if (statusJson.status === 'complete' && statusJson.data) {
              if (isMatchingIdentity(requestedUsername, statusJson.data.username)) {
                const liveAvatar = extractAvatarUrl(statusJson.data);
                if (liveAvatar) {
                  setLiveAvatarUrl(liveAvatar);
                }
                autoResolvedProfileRef.current = statusJson.data;
              }
              return;
            }
            if (statusJson.status === 'failed') {
              // Silent failure: keep historical fallback, don't crash
              return;
            }
          }
        }
      } catch {
        // Silent failure: keep fallback
      } finally {
        if (!isCancelled) {
          setIsLoadingLiveAvatar(false);
        }
      }
    };

    performSilentAutoResolution();

    return () => {
      isCancelled = true;
    };
  }, [offerData]);

  const handleCopyCouponOnly = async () => {
    if (!offerData?.couponCode) return;
    try {
      await navigator.clipboard.writeText(offerData.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const handleConfirmWelcome = async () => {
    if (!offerData?.previousTarget) return;

    if (isLocalPreview) {
      const previewPlatform = (
        ['instagram', 'tiktok', 'twitter', 'youtube'].includes(targetPlatform)
          ? targetPlatform
          : 'instagram'
      ) as PlatformKey;

      setVerifiedProfile({
        ...LOCAL_PREVIEW_PROFILE,
        platform: previewPlatform,
      });
      setTargetPlatform(previewPlatform);
      setIsProfileRestricted(false);
      startValidationTransitionToPackages();
      return;
    }

    const { username, platform } = offerData.previousTarget;

    // If already auto-resolved and identity matches, reuse result directly!
    const cachedProfile = autoResolvedProfileRef.current;
    if (cachedProfile && isMatchingIdentity(username, cachedProfile.username)) {
      checkRestrictionAndSetProfile(cachedProfile, platform);
      return;
    }

    // Otherwise trigger normal lookup
    handleStartLookup(username, platform);
  };

  const handleStartLookup = async (inputStr: string, platform: string) => {
    if (isLocalPreview) {
      setLookupError(null);
      setFlowStep('LOADING');
      window.setTimeout(() => {
        setVerifiedProfile({
          ...LOCAL_PREVIEW_PROFILE,
          username: inputStr.trim().replace(/^@+/, '') || LOCAL_PREVIEW_PROFILE.username,
          platform,
        });
        setTargetPlatform((['instagram', 'tiktok', 'twitter', 'youtube'].includes(platform.toLowerCase()) ? platform.toLowerCase() : 'instagram') as PlatformKey);
        setIsProfileRestricted(false);
        setFlowStep('PREVIEW');
      }, 650);
      return;
    }

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
    // Merge server-side masked email if available on offerData
    const profileWithEmail = {
      ...profile,
      maskedEmail: offerData?.previousTarget?.maskedEmail || profile.maskedEmail || null,
    };
    setVerifiedProfile(profileWithEmail);
    const safePlat = (['instagram', 'tiktok', 'twitter', 'youtube'].includes(platform.toLowerCase()) ? platform.toLowerCase() : 'instagram') as PlatformKey;
    setTargetPlatform(safePlat);
    setFlowStep('PREVIEW');
  };

  const cancelPolling = () => {
    pollingRef.current.active = false;
    setFlowStep('LOOKUP');
  };

  const startValidationTransitionToPackages = () => {
    // V660 — frozen at 41%, while remaining directly accessible in Local Preview.
    if (validationTransitionTimerRef.current) {
      window.clearTimeout(validationTransitionTimerRef.current);
      validationTransitionTimerRef.current = null;
    }
    setValidationTransitionProgress(41);
    setIsValidationTransition(true);
  };

  const confirmProfile = () => {
    if (isProfileRestricted || !offerData) return;

    const exact = offerData.packages.filter(
      (p) =>
        p.platform.toLowerCase() === targetPlatform.toLowerCase() &&
        String(p.service || '').toLowerCase() === targetService
    );

    const eligible =
      exact.length > 0
        ? exact
        : offerData.packages.filter(
            (p) =>
              p.platform.toLowerCase() === 'instagram' &&
              String(p.service || '').toLowerCase() === targetService
          );

    const match =
      eligible.find((p) => p.id === selectedPackageId) ||
      eligible.find((p) => p.isPopular) ||
      eligible[0];

    if (match) {
      setSelectedPackageId(match.id);
    }

    startValidationTransitionToPackages();
  };

  const executeCheckout = async (offerId: string) => {
    if (!offerData || isExpiredLocally || !verifiedProfile) return;

    if (isLocalPreview) {
      setSelectedPackageId(offerId);
      setCheckoutSubmitting(false);
      setCheckoutError('Local preview only — checkout is intentionally disabled.');
      return;
    }

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
        email: customerEmail.trim() || null,
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

  // Step 2 always uses the same six Instagram card/package templates.
  // If the API does not return platform-specific packages for TikTok/X/YouTube,
  // reuse the Instagram follower packages as visual/package templates so the
  // grid never disappears when switching networks.
  const getPackagesForPlatform = (
    platform: PlatformKey,
    service: ServiceKey
  ): SanitizedPackage[] => {
    if (!offerData) return [];

    const exact = offerData.packages.filter(
      (p) =>
        p.platform.toLowerCase() === platform &&
        String(p.service || '').toLowerCase() === service
    );

    if (exact.length > 0) return exact;

    const instagramTemplates = offerData.packages.filter(
      (p) =>
        p.platform.toLowerCase() === 'instagram' &&
        String(p.service || '').toLowerCase() === service
    );

    // Preserve the real package IDs so the existing selection/checkout flow
    // remains wired exactly as before; only the visual network theme changes.
    return instagramTemplates.map((p) => ({
      ...p,
      platform,
    }));
  };

  const eligiblePackages = getPackagesForPlatform(targetPlatform, targetService);

  const selectedPkg = eligiblePackages.find((p) => p.id === selectedPackageId) || eligiblePackages[0] || null;

  // Stepper helper
  const getStepNumber = (step: FlowStep): number => {
    switch (step) {
      case 'PREFILL':
      case 'LOOKUP':
      case 'LOADING':
      case 'PREVIEW':
        return 1;
      case 'PACKAGE':
        return 2;
      case 'REVIEW':
        return 3;
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
</main>
    );
  }

  if (isValidationTransition) {
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
          <OfferValidatingCard progress={validationTransitionProgress} />
        </div>

        {isLocalPreview && (
          <div className="cf-local-preview-panel fixed right-2 xl:right-4 top-1/2 -translate-y-1/2 z-[100] opacity-70 hover:opacity-100 transition-opacity">
            <div className="cf-local-preview-card flex flex-col items-stretch gap-1.5 rounded-2xl border border-[#D8E1EF] bg-white/95 backdrop-blur-md px-2 py-2 shadow-[0_14px_40px_rgba(15,23,42,.14)] whitespace-nowrap">
              <span className="px-2 py-1 text-center text-[10px] font-black tracking-[.08em] text-[#1376FF]">LOCAL PREVIEW</span>

              <button type="button" className="w-full rounded-xl bg-[#F8FAFC] px-2.5 py-1.5 text-[10px] font-bold text-[#53617A]" onClick={() => { setIsValidationTransition(false); setFlowStep(offerData?.previousTarget ? 'PREFILL' : 'LOOKUP'); }}>
                01 Profile
              </button>

              <button type="button" className="w-full rounded-xl bg-[#081126] px-2.5 py-1.5 text-[10px] font-bold text-white" onClick={() => { startValidationTransitionToPackages(); }}>
                02 Validating
              </button>

              <button type="button" className="w-full rounded-xl bg-[#F8FAFC] px-2.5 py-1.5 text-[10px] font-bold text-[#53617A]" onClick={() => { setIsValidationTransition(false); setFlowStep('PACKAGE'); }}>
                03 Package
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="cf-offer-page min-h-[100dvh] bg-white text-[#081126] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#1376FF]/20 font-sans">
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
        
      </div>

      {/* 2.5D Sticky Header & Stepper */}
      <OfferHeader
        timeLeft={timeLeft}
        isExpiredLocally={isExpiredLocally}
        currentStepNum={currentStepNum}
        platform={targetPlatform}
        theme={currentTheme}
      />

      {isLocalPreview && flowStep !== 'REVIEW' && (
        <div className="cf-local-preview-panel fixed right-2 xl:right-4 top-1/2 -translate-y-1/2 z-[100] max-h-[calc(100vh-24px)] opacity-70 hover:opacity-100 transition-opacity">
          <div className="cf-local-preview-card flex flex-col items-stretch gap-1.5 rounded-2xl border border-[#D8E1EF] bg-white/95 backdrop-blur-md px-2 py-2 shadow-[0_14px_40px_rgba(15,23,42,.14)] whitespace-nowrap">
            <span className="px-2 py-1 text-center text-[10px] font-black tracking-[.08em] text-[#1376FF]">LOCAL PREVIEW</span>
            {([
              ['profile', '01 Profile'],
              ['validating', '02 Validating'],
              ['package', '03 Package'],
            ] as const).map(([stage, label]) => {
              const activeStage =
                (stage === 'profile' && !isValidationTransition && ['PREFILL','LOOKUP','LOADING','PREVIEW'].includes(flowStep)) ||
                (stage === 'validating' && isValidationTransition) ||
                (stage === 'package' && !isValidationTransition && flowStep === 'PACKAGE');

              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('preview', '1');
                    url.searchParams.set('stage', stage);
                    window.history.replaceState({}, '', url.toString());

                    if (stage === 'profile') {
                      setIsValidationTransition(false);
                      setVerifiedProfile(LOCAL_PREVIEW_PROFILE);
                      setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
                      setTargetPlatform('instagram');
                      setTargetService('followers');
                      setFlowStep(offerData?.previousTarget ? 'PREFILL' : 'LOOKUP');
                    } else if (stage === 'validating') {
                      startValidationTransitionToPackages();
                    } else if (stage === 'package') {
                      setIsValidationTransition(false);
                      setVerifiedProfile(LOCAL_PREVIEW_PROFILE);
                      setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
                      setTargetPlatform(targetPlatform);
                      setTargetService('followers');
                      setFlowStep('PACKAGE');
                    }
                  }}
                  className={`w-full rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${
                    activeStage
                      ? 'bg-[#081126] text-white'
                      : 'bg-[#F8FAFC] text-[#536176] hover:bg-[#EEF3F8] hover:text-[#081126]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved Option 10 — unified 3-column desktop experience */}
      <div className="cf-offer-main flex-1 max-w-[1440px] w-full mx-auto z-10">
        <OfferOption10Experience
          flowStep={flowStep}
          previousTarget={offerData.previousTarget}
          liveAvatarUrl={liveAvatarUrl}
          isLoadingLiveAvatar={isLoadingLiveAvatar}
          targetPlatform={targetPlatform}
          setTargetPlatform={(p) => { setTargetPlatform(p); setLookupError(null); }}
          targetService={targetService}
          setTargetService={(s) => { setTargetService(s); setLookupError(null); }}
          emailValue={customerEmail}
          setEmailValue={setCustomerEmail}
          lookupInput={lookupInput}
          setLookupInput={setLookupInput}
          lookupError={lookupError}
          verifiedProfile={verifiedProfile}
          isProfileRestricted={isProfileRestricted}
          theme={currentTheme}
          eligiblePackages={eligiblePackages}
          selectedPackageId={selectedPackageId}
          couponCode={offerData.couponCode}
          timeLeft={timeLeft}
          copied={copied}
          checkoutSubmitting={checkoutSubmitting}
          checkoutError={checkoutError}
          onUseSavedProfile={handleConfirmWelcome}
          onChooseAnother={() => {
            setLookupError(null);
            setVerifiedProfile(null);
            setLookupInput('');
            setFlowStep('PREFILL');
          }}
          onSearch={handleStartLookup}
          onCancelSearch={cancelPolling}
          onConfirmFound={confirmProfile}
          onBackToSaved={() => setFlowStep('PREFILL')}
          onSelectPackage={(pkgId) => { setSelectedPackageId(pkgId); setFlowStep('PACKAGE'); }}
          onChangeProfile={() => setFlowStep('PREFILL')}
          onCopyCoupon={handleCopyCouponOnly}
          onExecuteCheckout={(pkgId) => { setFlowStep('PACKAGE'); executeCheckout(pkgId); }}
        />
      </div>

      {/* 2.5D Trust Footer Bar */}
      <div className="z-10">
</div>
    </main>
  );
}
