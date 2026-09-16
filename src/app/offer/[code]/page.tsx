/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/purity, react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OFFER_PLATFORM_THEMES, OfferPlatformTheme } from '@/components/offer-experience/theme';
import { PLATFORM_SERVICES, CommercialPlatform, CommercialService, resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';
import { OfferHeader } from '@/components/offer-experience/OfferHeader';
import { OfferWelcomeStage } from '@/components/offer-experience/OfferWelcomeStage';
import { OfferLookupStage } from '@/components/offer-experience/OfferLookupStage';
import { OfferLoadingStage } from '@/components/offer-experience/OfferLoadingStage';
import { OfferPreviewStage } from '@/components/offer-experience/OfferPreviewStage';
import { OfferPackageStage, SanitizedPackage } from '@/components/offer-experience/OfferPackageStage';
import { OfferReviewStage } from '@/components/offer-experience/OfferReviewStage';
import { OfferStatusCard, OfferValidatingCard } from '@/components/offer-experience/OfferStatusCards';
import { OfferOption10Experience } from '@/components/offer-experience/OfferOption10Experience';
import { formatOfferCountdown } from '@/services/offers/offer-status';
import { buildCanonicalProfileUrl } from '@/lib/social/normalize';

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

/**
 * Storage key prefix for completed offer journeys in sessionStorage.
 * Scoped specifically to a journey ID to avoid blocking new explicit navigations to the same offer code.
 */
const OFFER_JOURNEY_STORAGE_PREFIX = 'cf_offer_journey_completed_';

function markOfferJourneyCompleted(journeyId: string) {
  if (typeof window === 'undefined' || !journeyId) return;
  try {
    sessionStorage.setItem(`${OFFER_JOURNEY_STORAGE_PREFIX}${journeyId}`, '1');
    const currentState = window.history.state || {};
    window.history.replaceState({ ...currentState, cfOfferJourneyCompleted: true, cfOfferJourneyId: journeyId }, '');
  } catch {}
}

function isOfferJourneyMarkedCompleted(journeyId: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (journeyId && sessionStorage.getItem(`${OFFER_JOURNEY_STORAGE_PREFIX}${journeyId}`) === '1') {
      return true;
    }
    const state = window.history.state;
    if (state && typeof state === 'object' && state.cfOfferJourneyCompleted === true) {
      if (!journeyId || state.cfOfferJourneyId === journeyId) {
        return true;
      }
    }
  } catch {}
  return false;
}

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

const LOCAL_PREVIEW_PACKAGES: SanitizedPackage[] = (['instagram', 'tiktok', 'twitter', 'youtube'] as CommercialPlatform[]).flatMap((plat) => {
  const services = PLATFORM_SERVICES[plat];
  return services.flatMap((serv) => {
    const cards = resolveCommercialCardsForService(plat, serv, [], 'offer_step3');
    return cards.map((rc) => ({
      id: rc.id || `step3-${rc.platform}-${rc.service}-${rc.plan}`,
      platform: rc.platform,
      service: rc.service,
      name: rc.planDisplayName,
      slug: `${rc.platform}-${rc.service}-${rc.plan}`,
      quantity: rc.quantity,
      bonusQuantity: rc.bonusQuantity,
      priceCents: rc.priceCents,
      oldPriceCents: rc.compareAtPriceCents,
      currency: 'USD',
      badge: rc.badge,
      isPopular: rc.plan === 'pro' || rc.plan === 'max',
    }));
  });
});

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
  // Keep the offer's previousTarget as history, but track whether it is still
  // the target the customer chose to reuse in this experience.
  const [useSavedTarget, setUseSavedTarget] = useState(true);

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
  const searchGenerationRef = useRef(0);

  // Package & Checkout State
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Journey Lifecycle & Navigation Isolation
  const journeyIdRef = useRef<string>('');
  const journeyCompletedRef = useRef<boolean>(false);
  const [isJourneyEnded, setIsJourneyEnded] = useState<boolean>(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpiredLocally, setIsExpiredLocally] = useState(false);
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [isValidationTransition, setIsValidationTransition] = useState(false);
  const [validationTransitionProgress, setValidationTransitionProgress] = useState(0);
  const validationTransitionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const validationTransitionDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize journey lifecycle on mount, handle BFCache pageshow & popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect navigation type if supported by PerformanceNavigationTiming
    let navType = 'navigate';
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        navType = (navEntries[0] as PerformanceNavigationTiming).type;
      } else if (performance.navigation) {
        navType = performance.navigation.type === 2 ? 'back_forward' : performance.navigation.type === 1 ? 'reload' : 'navigate';
      }
    } catch {}

    const state = window.history.state;
    const existingJourneyId = state && typeof state === 'object' ? state.cfOfferJourneyId : null;

    // If returning via back/forward and this entry was completed, block restoration
    if (navType === 'back_forward' && (isOfferJourneyMarkedCompleted(existingJourneyId) || state?.cfOfferJourneyCompleted)) {
      journeyCompletedRef.current = true;
      setIsJourneyEnded(true);
      return;
    }

    // Check if current history state or sessionStorage already marked this journey as completed
    if (existingJourneyId && (isOfferJourneyMarkedCompleted(existingJourneyId) || state?.cfOfferJourneyCompleted)) {
      journeyCompletedRef.current = true;
      setIsJourneyEnded(true);
      return;
    }

    // Assign a fresh journey ID for a new navigation, or preserve current one for reload
    if (!existingJourneyId || (navType === 'navigate' && !state?.cfOfferJourneyCompleted)) {
      const freshJourneyId = `oj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      journeyIdRef.current = freshJourneyId;
      try {
        window.history.replaceState(
          { ...(state && typeof state === 'object' ? state : {}), cfOfferJourneyId: freshJourneyId, cfOfferJourneyCompleted: false },
          ''
        );
      } catch {}
    } else {
      journeyIdRef.current = existingJourneyId;
      if (isOfferJourneyMarkedCompleted(existingJourneyId) || state?.cfOfferJourneyCompleted) {
        journeyCompletedRef.current = true;
        setIsJourneyEnded(true);
        return;
      }
    }

    // BFCache (Safari/iOS and Chrome back/forward cache) listener
    const handlePageShow = (event: PageTransitionEvent) => {
      const currentState = window.history.state;
      const currentJourneyId = currentState?.cfOfferJourneyId || journeyIdRef.current;
      if (
        event.persisted ||
        journeyCompletedRef.current ||
        isOfferJourneyMarkedCompleted(currentJourneyId) ||
        currentState?.cfOfferJourneyCompleted
      ) {
        if (journeyCompletedRef.current || isOfferJourneyMarkedCompleted(currentJourneyId) || currentState?.cfOfferJourneyCompleted) {
          journeyCompletedRef.current = true;
          setIsJourneyEnded(true);
        }
      }
    };

    // Popstate listener (when user traverses history)
    const handlePopState = (event: PopStateEvent) => {
      const poppedState = event.state;
      const poppedJourneyId = poppedState?.cfOfferJourneyId || journeyIdRef.current;
      if (
        journeyCompletedRef.current ||
        poppedState?.cfOfferJourneyCompleted ||
        isOfferJourneyMarkedCompleted(poppedJourneyId)
      ) {
        journeyCompletedRef.current = true;
        setIsJourneyEnded(true);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
      setUseSavedTarget(true);
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
        setUseSavedTarget(Boolean(json.data.previousTarget));
        if (json.data.previousTarget) {
          setFlowStep('PREFILL');
          const rawPlat = (json.data.previousTarget.platform || 'instagram').toLowerCase();
          const safePlat = (['instagram', 'tiktok', 'twitter', 'youtube'].includes(rawPlat) ? rawPlat : 'instagram') as PlatformKey;
          const rawService = String(
            json.data.previousTarget.service ||
            json.data.previousTarget.previousPackageName ||
            'followers'
          ).toLowerCase();
          const candidateService = (
            rawService.includes('view') ? 'views' :
            rawService.includes('like') ? 'likes' :
            'followers'
          ) as ServiceKey;
          const validServices = PLATFORM_SERVICES[safePlat as CommercialPlatform] || ['followers'];
          const safeService = validServices.includes(candidateService as CommercialService)
            ? candidateService
            : (validServices[0] as ServiceKey);
          setTargetPlatform(safePlat);
          setTargetService(safeService);
          setCustomerEmail(String(json.data.previousTarget.email || ''));
          setLookupInput(json.data.previousTarget.username ? `@${String(json.data.previousTarget.username).replace(/^@+/, '')}` : '');
        } else {
          // Offer without previousTarget: starts in PREFILL on the main screen with empty lookup
          setFlowStep('PREFILL');
          setTargetPlatform('instagram');
          setTargetService('followers');
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
        setTimeLeft(formatOfferCountdown(0));
        setIsExpiredLocally(true);
        return;
      }
      setTimeLeft(formatOfferCountdown(diff));
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

  // The offer history remains immutable; only this UI-facing target can be
  // disabled when the customer chooses to search for another profile.
  const activePreviousTarget = useSavedTarget ? offerData?.previousTarget ?? null : null;

  // Step 01 Silent Auto-Resolution of Live Avatar

  useEffect(() => {
    const prev = offerData?.previousTarget;
    if (
      !useSavedTarget ||
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
    const autoResolutionGeneration = searchGenerationRef.current;

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

        if (isCancelled || searchGenerationRef.current !== autoResolutionGeneration || !useSavedTarget) return;

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

            if (isCancelled || searchGenerationRef.current !== autoResolutionGeneration || !useSavedTarget) return;
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
  }, [offerData, useSavedTarget]);

  const handleCopyCouponOnly = async () => {
    if (!offerData?.couponCode) return;
    try {
      await navigator.clipboard.writeText(offerData.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const handleConfirmWelcome = async () => {
    if (!offerData || !activePreviousTarget) return;

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
      setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
      setFlowStep('PACKAGE');
      return;
    }

    const { username, platform } = activePreviousTarget;

    // If already auto-resolved and identity matches, reuse result directly!
    const cachedProfile = autoResolvedProfileRef.current;
    if (cachedProfile && isMatchingIdentity(username, cachedProfile.username)) {
      checkRestrictionAndSetProfile(cachedProfile, platform, username, targetService);
      setFlowStep('PACKAGE');
      return;
    }

    // Otherwise trigger normal lookup
    handleStartLookup(username, platform, targetService);
  };

  const handleStartLookup = async (inputStr: string, platform: string, serviceParam?: string) => {
    const activeService = serviceParam || targetService;
    const isContent = activeService === 'likes' || activeService === 'views';
    const searchGeneration = searchGenerationRef.current + 1;
    searchGenerationRef.current = searchGeneration;

    if (isLocalPreview) {
      setLookupError(null);
      setFlowStep('LOADING');
      window.setTimeout(() => {
        setVerifiedProfile({
          ...LOCAL_PREVIEW_PROFILE,
          username: inputStr.trim().replace(/^@+/, '') || LOCAL_PREVIEW_PROFILE.username,
          platform,
          resolvedTargetUrl: isContent ? inputStr.trim() : `https://instagram.com/${inputStr.trim().replace(/^@+/, '')}`,
          resolvedTargetValue: isContent ? inputStr.trim() : (inputStr.trim().replace(/^@+/, '') || LOCAL_PREVIEW_PROFILE.username),
          resolvedTargetType: isContent
            ? ((platform === 'youtube' || platform === 'tiktok' || (platform === 'twitter' && activeService === 'views') || (platform === 'instagram' && activeService === 'views')) ? 'video' : 'post')
            : (platform === 'youtube' ? 'channel' : 'profile'),
        });
        setTargetPlatform((['instagram', 'tiktok', 'twitter', 'youtube'].includes(platform.toLowerCase()) ? platform.toLowerCase() : 'instagram') as PlatformKey);
        setIsProfileRestricted(false);
        setSelectedPackageId(LOCAL_PREVIEW_PACKAGES[1].id);
        setFlowStep('PACKAGE');
      }, 650);
      return;
    }

    if (!inputStr.trim()) {
      setLookupError(isContent ? 'Paste the exact public post or video link.' : 'Enter an @username or profile/channel link.');
      return;
    }

    // Client-side format validation identical to HOME (growth-package-builder)
    // Only perform URL syntax check if input looks like a URL or is not a handle/test input
    if (isContent && (inputStr.trim().startsWith('http://') || inputStr.trim().startsWith('https://'))) {
      try {
        const u = new URL(inputStr.trim());
        if (!/^https?:$/.test(u.protocol)) throw new Error();

        const hostname = u.hostname.toLowerCase();
        const pathname = u.pathname.toLowerCase();

        if (platform === 'instagram') {
          const isStory = pathname.includes('/stories/');
          const isPost = pathname.includes('/p/');
          const isVideo = pathname.includes('/reel/') || pathname.includes('/reels/') || pathname.includes('/tv/');

          if (isStory || (activeService === 'views' ? !isVideo : !(isPost || isVideo))) {
            setLookupError(
              activeService === 'views'
                ? 'Instagram Views accepts only public video/reel links. Photo posts and Stories are not accepted.'
                : 'Instagram Likes accepts public feed posts, videos and reels. Stories are not accepted.'
            );
            return;
          }
        }

        if (platform === 'tiktok') {
          const isVideo = pathname.includes('/video/') || hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com';
          if (!isVideo) {
            setLookupError('TikTok Likes or Views requires a direct public video link.');
            return;
          }
        }

        if (platform === 'twitter') {
          const isPost = pathname.includes('/status/') || pathname.includes('/statuses/');
          if (!isPost) {
            setLookupError('X / Twitter Likes or Views requires a direct post/video status link.');
            return;
          }
        }

        if (platform === 'youtube') {
          const isChannel = pathname.includes('/channel/') || pathname.includes('/@') || pathname.includes('/c/') || pathname.includes('/user/');
          const isVideo = pathname.includes('/watch') || hostname === 'youtu.be' || pathname.includes('/shorts/');
          if (isChannel || !isVideo) {
            setLookupError('YouTube Likes or Views requires a direct video or Shorts link. Channel links are not accepted.');
            return;
          }
        }
      } catch {
        setLookupError('For Likes or Views, paste a valid public post/video URL.');
        return;
      }
    }

    setLookupError(null);
    setFlowStep('LOADING');
    pollingRef.current.active = true;

    // Optional service param: pass service to /api/search/resolve if provided and valid
    const searchBody: Record<string, any> = { input: inputStr.trim(), selectedPlatform: platform };
    if (activeService) {
      searchBody.service = activeService;
    }

    try {
      const res = await fetch('/api/search/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchBody),
      });
      const data = await res.json();

      // A response from a superseded search must never update this flow.
      if (searchGenerationRef.current !== searchGeneration || !pollingRef.current.active) return;

      if (res.ok && data.success && data.data && data.resolvedType === 'profile') {
        checkRestrictionAndSetProfile(data.data, platform, inputStr.trim(), activeService);
        return;
      }

      if (res.ok && data.success && data.status === 'pending' && data.requestId) {
        let currentRequestId = data.requestId;
        const startTime = Date.now();
        const maxPollDuration = 10 * 60 * 1000;

        while (
          pollingRef.current.active &&
          searchGenerationRef.current === searchGeneration &&
          Date.now() - startTime < maxPollDuration
        ) {
          await new Promise((r) => setTimeout(r, 2500));
          if (!pollingRef.current.active || searchGenerationRef.current !== searchGeneration) return;

          const statusRes = await fetch(
            `/api/search/status?requestId=${encodeURIComponent(currentRequestId)}&service=${encodeURIComponent(activeService)}`,
            { cache: 'no-store' }
          );
          const statusJson = await statusRes.json().catch(() => null);

          if (searchGenerationRef.current !== searchGeneration || !pollingRef.current.active) return;

          if (!statusRes.ok) {
            setLookupError(statusJson?.message || 'Search failed. Please try again.');
            setFlowStep('LOOKUP');
            return;
          }
          if (!statusJson) continue;

          if (statusJson.status === 'pending' && statusJson.requestId) {
            currentRequestId = statusJson.requestId;
          }
          if (statusJson.status === 'complete' && statusJson.data) {
            checkRestrictionAndSetProfile(statusJson.data, platform, inputStr.trim(), activeService);
            return;
          }
          if (statusJson.status === 'failed' || statusJson.success === false) {
            setLookupError(statusJson.message || "We couldn't find this profile.");
            setFlowStep('LOOKUP');
            return;
          }
        }
        if (pollingRef.current.active && searchGenerationRef.current === searchGeneration) {
          setLookupError('The search is taking longer than expected. Please try again.');
          setFlowStep('LOOKUP');
        }
        return;
      }

      if (searchGenerationRef.current !== searchGeneration || !pollingRef.current.active) return;
      setLookupError(data.message || "We couldn't find this profile. Check the @ or link and try again.");
      setFlowStep('LOOKUP');
    } catch (e: any) {
      if (searchGenerationRef.current !== searchGeneration || !pollingRef.current.active) return;
      setLookupError(e instanceof Error ? e.message : 'The search is taking longer than expected. Please try again.');
      setFlowStep('LOOKUP');
    }
  };

  const checkRestrictionAndSetProfile = (
    profile: any,
    platform: string,
    rawInput?: string,
    activeService?: string
  ) => {
    let restricted = false;
    if (profile.platform === 'instagram' && profile.is_private) restricted = true;
    if (profile.platform === 'tiktok' && (profile.is_private || profile.private_account || profile.privateAccount)) restricted = true;
    if (profile.platform === 'twitter' && (profile.is_protected || profile.protected)) restricted = true;
    if (profile.platform === 'youtube' && (profile.is_private || profile.is_hidden)) restricted = true;

    setIsProfileRestricted(restricted);

    const s = activeService || targetService;
    const isContent = s === 'likes' || s === 'views';
    const normalizedUsername = (profile.username || '').replace(/^@+/, '').trim();
    const canonicalProfileUrl = buildCanonicalProfileUrl(platform, normalizedUsername);
    const targetUrl = isContent ? (rawInput || lookupInput).trim() : canonicalProfileUrl;
    const targetType = isContent
      ? ((platform === 'youtube' || platform === 'tiktok' || (platform === 'twitter' && s === 'views') || (platform === 'instagram' && s === 'views')) ? 'video' : 'post')
      : (platform === 'youtube' ? 'channel' : 'profile');

    const profileWithEmail = {
      ...profile,
      maskedEmail: activePreviousTarget?.maskedEmail || profile.maskedEmail || null,
      resolvedTargetType: targetType,
      resolvedTargetValue: isContent ? (rawInput || lookupInput).trim() : normalizedUsername,
      resolvedTargetUrl: targetUrl,
    };
    setVerifiedProfile(profileWithEmail);
    const safePlat = (['instagram', 'tiktok', 'twitter', 'youtube'].includes(platform.toLowerCase()) ? platform.toLowerCase() : 'instagram') as PlatformKey;
    setTargetPlatform(safePlat);

    if (restricted) {
      setLookupError('This profile is private or restricted. Please choose a public profile to continue.');
      setFlowStep('LOOKUP');
      return;
    }

    if (!offerData) {
      setFlowStep('PACKAGE');
      return;
    }

    const exact = offerData.packages.filter(
      (p) =>
        p.platform.toLowerCase() === safePlat.toLowerCase() &&
        String(p.service || '').toLowerCase() === s.toLowerCase()
    );

    const eligible =
      exact.length > 0
        ? exact
        : resolveCommercialCardsForService(safePlat, s, [], 'offer_step3').map((rc) => ({
            id: rc.id || `step3-${rc.platform}-${rc.service}-${rc.plan}`,
            platform: rc.platform,
            service: rc.service,
            name: rc.planDisplayName,
            slug: `${rc.platform}-${rc.service}-${rc.plan}`,
            quantity: rc.quantity,
            bonusQuantity: rc.bonusQuantity,
            priceCents: rc.priceCents,
            oldPriceCents: rc.compareAtPriceCents,
            currency: 'USD',
            badge: rc.badge,
            isPopular: rc.plan === 'pro' || rc.plan === 'max',
          }));

    const match =
      eligible.find((p) => p.id === selectedPackageId) ||
      eligible.find((p) => p.isPopular) ||
      eligible[0];

    if (match) {
      setSelectedPackageId(match.id);
    }

    // If reusing saved previous target, advance directly to PACKAGE
    const canReuseSaved =
      Boolean(activePreviousTarget) &&
      activePreviousTarget?.platform?.toLowerCase() === safePlat.toLowerCase() &&
      normalizedUsername.toLowerCase() === (activePreviousTarget?.username || '').replace(/^@+/, '').toLowerCase();

    if (canReuseSaved) {
      setFlowStep('PACKAGE');
      return;
    }

    // New/changed target: do NOT automatically advance to PACKAGE.
    // Keep user in PREFILL awaiting explicit "Yes, This is my profile" confirmation.
    setFlowStep('PREFILL');
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
        String(p.service || '').toLowerCase() === targetService.toLowerCase()
    );

    const eligible =
      exact.length > 0
        ? exact
        : resolveCommercialCardsForService(targetPlatform, targetService, [], 'offer_step3').map((rc) => ({
            id: rc.id || `step3-${rc.platform}-${rc.service}-${rc.plan}`,
            platform: rc.platform,
            service: rc.service,
            name: rc.planDisplayName,
            slug: `${rc.platform}-${rc.service}-${rc.plan}`,
            quantity: rc.quantity,
            bonusQuantity: rc.bonusQuantity,
            priceCents: rc.priceCents,
            oldPriceCents: rc.compareAtPriceCents,
            currency: 'USD',
            badge: rc.badge,
            isPopular: rc.plan === 'pro' || rc.plan === 'max',
          }));

    const match =
      eligible.find((p) => p.id === selectedPackageId) ||
      eligible.find((p) => p.isPopular) ||
      eligible[0];

    if (match) {
      setSelectedPackageId(match.id);
    }

    setFlowStep('PACKAGE');
  };

  const executeCheckout = async (offerId: string) => {
    if (!offerData || isExpiredLocally || !verifiedProfile) return;
    if (checkoutSubmitting) return;

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

    const isContent = targetService === 'likes' || targetService === 'views';
    const normalizedUsername = (verifiedProfile.username || '').replace(/^@+/, '').trim();
    const canonicalProfileUrl = buildCanonicalProfileUrl(targetPlatform, normalizedUsername);
    const resolvedTargetUrl = verifiedProfile.resolvedTargetUrl || (isContent ? (lookupInput.trim() || verifiedProfile.profile_url) : canonicalProfileUrl);
    const resolvedTargetType = verifiedProfile.resolvedTargetType || (isContent ? (targetPlatform === 'youtube' || targetPlatform === 'tiktok' || (targetPlatform === 'twitter' && targetService === 'views') || (targetPlatform === 'instagram' && targetService === 'views') ? 'video' : 'post') : (targetPlatform === 'youtube' ? 'channel' : 'profile'));
    const resolvedTargetValue = verifiedProfile.resolvedTargetValue || (isContent ? (lookupInput.trim() || normalizedUsername) : normalizedUsername);

    try {
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('cf_asid_v1') : null;
      const visitorId = typeof window !== 'undefined' ? localStorage.getItem('cf_aid_v1') : null;

      const payload = {
        offerId,
        targetType: resolvedTargetType,
        targetValue: resolvedTargetValue,
        targetUrl: resolvedTargetUrl || null,
        socialUsername: normalizedUsername || (isContent ? 'content_order' : null),
        profileUrl: verifiedProfile.profile_url || canonicalProfileUrl || null,
        email: customerEmail.trim() || null,
        offerCode: offerData.code,
        sessionId: sessionId || undefined,
        visitorId: visitorId || undefined,
      };

      const res = await fetch('/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.checkoutUrl) {
        // Mark current journey as completed prior to redirection so history back cannot restore it
        const currentJourneyId = journeyIdRef.current;
        journeyCompletedRef.current = true;
        markOfferJourneyCompleted(currentJourneyId);

        // Keep visual PACKAGE state with checkoutSubmitting loading active.
        // DO NOT call setIsJourneyEnded(true) here, as that causes an immediate React re-render
        // of "Session Completed" right before window.location.replace, creating an unwanted visual flash.
        // Back/BFCache/popstate restoration handlers will invoke setIsJourneyEnded(true) if the user returns.

        // Perform external navigation via location replace to avoid creating a new forward history entry for /offer
        if (typeof window.location.replace === 'function') {
          window.location.replace(json.data.checkoutUrl);
        } else {
          window.location.href = json.data.checkoutUrl;
        }
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

  // Canonical resolution of plans for the selected platform + service.
  // Reuses the real plans from the offer payload, with fallback to the central commercial resolver.
  const getPackagesForPlatform = (
    platform: PlatformKey,
    service: ServiceKey
  ): SanitizedPackage[] => {
    if (!offerData) return [];

    const exact = offerData.packages.filter(
      (p) =>
        p.platform.toLowerCase() === platform.toLowerCase() &&
        String(p.service || '').toLowerCase() === service.toLowerCase()
    );

    if (exact.length > 0) return exact;

    const fallbackCards = resolveCommercialCardsForService(platform, service, [], 'offer_step3');
    return fallbackCards.map((rc) => ({
      id: rc.id || `step3-${rc.platform}-${rc.service}-${rc.plan}`,
      platform: rc.platform,
      service: rc.service,
      name: rc.planDisplayName,
      slug: `${rc.platform}-${rc.service}-${rc.plan}`,
      quantity: rc.quantity,
      bonusQuantity: rc.bonusQuantity,
      priceCents: rc.priceCents,
      oldPriceCents: rc.compareAtPriceCents,
      currency: 'USD',
      badge: rc.badge,
      isPopular: rc.plan === 'pro' || rc.plan === 'max',
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
      <main className="cf-offer-page min-h-[100dvh] bg-white text-[#081126] flex flex-col justify-between relative overflow-hidden font-sans">
        <OfferHeader
          timeLeft={timeLeft}
          isExpiredLocally={isExpiredLocally}
          currentStepNum={1}
          platform={targetPlatform}
          theme={currentTheme}
        />
        <div className="flex-1 flex items-center justify-center p-4" aria-busy="true" />
      </main>
    );
  }

  // TERMINATED / ENDED JOURNEY STATE (e.g. user pressed Back after initiating external checkout)
  if (isJourneyEnded) {
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
            title="Session Completed"
            description="Your previous offer checkout session has ended. To start a new session, please reopen your original link from your email."
          />
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

      {isLocalPreview && (
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
          previousTarget={activePreviousTarget}
          liveAvatarUrl={liveAvatarUrl}
          isLoadingLiveAvatar={isLoadingLiveAvatar}
          targetPlatform={targetPlatform}
          setTargetPlatform={(p) => {
            setTargetPlatform(p);
            setLookupError(null);
            // Invalidate confirmed/resolved profile if network changed
            setVerifiedProfile(null);
            const validServices = PLATFORM_SERVICES[p as CommercialPlatform] || ['followers', 'likes', 'views'];
            if (!validServices.includes(targetService as CommercialService)) {
              setTargetService(validServices[0] as ServiceKey);
            }
          }}
          targetService={targetService}
          setTargetService={(s) => {
            const validServices = PLATFORM_SERVICES[targetPlatform as CommercialPlatform] || ['followers', 'likes', 'views'];
            const safeService = validServices.includes(s as CommercialService) ? s : (validServices[0] as ServiceKey);
            setTargetService(safeService);
            setLookupError(null);
            // Invalidate confirmed/resolved profile if service changed
            setVerifiedProfile(null);
          }}
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
            // Invalidate every in-flight search before opening a fresh lookup.
            pollingRef.current.active = false;
            searchGenerationRef.current += 1;
            autoResolvedProfileRef.current = null;
            setUseSavedTarget(false);
            setLookupError(null);
            setVerifiedProfile(null);
            setLookupInput('');
            setLiveAvatarUrl(null);
            setIsProfileRestricted(false);
            // Stay in PREFILL so the UI stays entirely on "Ready to Take Your Growth Further?"
            setFlowStep('PREFILL');
          }}
          onSearch={handleStartLookup}
          onCancelSearch={cancelPolling}
          onConfirmFound={confirmProfile}
          onBackToSaved={() => {
            setUseSavedTarget(true);
            setFlowStep('PREFILL');
          }}
          onSelectPackage={(pkgId) => {
            setSelectedPackageId(pkgId);
            executeCheckout(pkgId);
          }}
          onChangeProfile={() => {
            pollingRef.current.active = false;
            searchGenerationRef.current += 1;
            autoResolvedProfileRef.current = null;
            setUseSavedTarget(false);
            setLookupError(null);
            setVerifiedProfile(null);
            setLookupInput('');
            setLiveAvatarUrl(null);
            setIsProfileRestricted(false);
            // Stay in PREFILL so the UI stays entirely on "Ready to Take Your Growth Further?"
            setFlowStep('PREFILL');
          }}
          onCopyCoupon={handleCopyCouponOnly}
          onExecuteCheckout={(pkgId) => { executeCheckout(pkgId); }}
        />
      </div>

      {/* 2.5D Trust Footer Bar */}
      <div className="z-10">
</div>
    </main>
  );
}
