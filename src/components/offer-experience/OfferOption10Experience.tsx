'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Gift,
  Globe2,
  Lightbulb,
  Loader2,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
  Mail,
  ScanSearch,
  TrendingUp,
  Crown,
  UserRoundPlus,
  Tag,
  Flame,
  Gem,
  Star,
  Headphones,
  ShoppingBag
} from 'lucide-react';
import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';
import rocketArt from '@/assets/offer-option10-rocket-social.png';
import { PLATFORM_SERVICES, CommercialPlatform, CommercialService } from '@/services/commercial-offer.resolver';
import type { OfferPlatformTheme } from './theme';
import type { SanitizedPackage } from './OfferPackageStage';

type FlowStep = 'PREFILL' | 'LOOKUP' | 'LOADING' | 'PREVIEW' | 'PACKAGE' | 'REVIEW';
type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';
type ServiceKey = 'followers' | 'likes' | 'views';

type PreviousTarget = {
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

interface Props {
  flowStep: FlowStep;
  previousTarget: PreviousTarget;
  liveAvatarUrl: string | null;
  isLoadingLiveAvatar: boolean;
  targetPlatform: PlatformKey;
  setTargetPlatform: (p: PlatformKey) => void;
  targetService: ServiceKey;
  setTargetService: (s: ServiceKey) => void;
  emailValue: string;
  setEmailValue: (v: string) => void;
  lookupInput: string;
  setLookupInput: (v: string) => void;
  lookupError: string | null;
  verifiedProfile: any | null;
  isProfileRestricted: boolean;
  theme: OfferPlatformTheme;
  eligiblePackages: SanitizedPackage[];
  selectedPackageId: string | null;
  couponCode: string;
  timeLeft: string | null;
  copied: boolean;
  checkoutSubmitting: boolean;
  checkoutError: string | null;
  onUseSavedProfile: () => void;
  onChooseAnother: () => void;
  onSearch: (input: string, platform: string) => void;
  onCancelSearch: () => void;
  onConfirmFound: () => void;
  onBackToSaved: () => void;
  onSelectPackage: (pkgId: string) => void;
  onChangeProfile: () => void;
  onCopyCoupon: () => void;
  onExecuteCheckout: (pkgId: string) => void;
}

const NETWORKS = [
  { key: 'instagram' as const, label: 'Instagram', icon: instagramIcon },
  { key: 'tiktok' as const, label: 'TikTok', icon: tiktokIcon },
  { key: 'youtube' as const, label: 'YouTube', icon: youtubeIcon },
  { key: 'twitter' as const, label: 'X', icon: twitterIcon },
];

const avatarFrom = (profile: any, fallback?: string | null) =>
  profile?.avatar_url || profile?.profile_pic_url || profile?.avatarUrl || profile?.profileImageUrl || profile?.avatar || profile?.picture || fallback || null;

export function OfferOption10Experience(props: Props) {
  const [cfCouponCopied, setCfCouponCopied] = useState(false);
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<PlatformKey>(props.targetPlatform);
  const [cfGoalSelection, setCfGoalSelection] = useState<ServiceKey>(props.targetService);
  const [cfAnalyzeProgress, setCfAnalyzeProgress] = useState(0);
  const [cfIsAnalyzing, setCfIsAnalyzing] = useState(false);
  const cfAnalyzeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cfAnalyzeSavedFlowRef = useRef(false);
  const cfAnalyzeCompletedRef = useRef(false);

  useEffect(() => {
    setSelectedNetworkKey(props.targetPlatform);
  }, [props.targetPlatform]);

  useEffect(() => {
    setCfGoalSelection(props.targetService);
  }, [props.targetService]);

  const cfSaveFlow25Coupon = () => {
    try {
      localStorage.setItem("cloutflow_coupon", "FLOW25");
      localStorage.setItem("cloutflow_coupon_code", "FLOW25");
      sessionStorage.setItem("cloutflow_coupon", "FLOW25");
    } catch {}
  };

  const cfCopyFlow25Coupon = async () => {
    cfSaveFlow25Coupon();

    let copied = false;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText("FLOW25");
        copied = true;
      }
    } catch {}

    if (!copied) {
      try {
        if (typeof document !== "undefined") {
          const el = document.createElement("textarea");
          el.value = "FLOW25";
          el.setAttribute("readonly", "");
          el.style.position = "fixed";
          el.style.opacity = "0";
          document.body.appendChild(el);
          el.select();
          copied = document.execCommand("copy");
          document.body.removeChild(el);
        }
      } catch {}
    }

    if (copied) {
      setCfCouponCopied(true);
      window.setTimeout(() => setCfCouponCopied(false), 1800);
    }
  };

  const {
    flowStep,
    previousTarget,
    liveAvatarUrl,
    isLoadingLiveAvatar,
    targetPlatform,
    setTargetPlatform,
    targetService,
    setTargetService,
    emailValue,
    setEmailValue,
    lookupInput,
    setLookupInput,
    lookupError,
    verifiedProfile,
    isProfileRestricted,
    eligiblePackages,
    selectedPackageId,
    couponCode,
    timeLeft,
    copied,
    checkoutSubmitting,
    checkoutError,
    onUseSavedProfile,
    onChooseAnother,
    onSearch,
    onCancelSearch,
    onConfirmFound,
    onBackToSaved,
    onSelectPackage,
    onChangeProfile,
    onCopyCoupon,
    onExecuteCheckout,
  } = props;

  const cfSelectGoal = (service: ServiceKey) => {
    const validServices = PLATFORM_SERVICES[targetPlatform as CommercialPlatform] || ['followers', 'likes', 'views'];
    if (!validServices.includes(service as CommercialService)) return;
    setCfGoalSelection(service);
    setTargetService(service);
  };

  const handleNetworkSelection = (plat: PlatformKey) => {
    setSelectedNetworkKey(plat);
    const validServices = PLATFORM_SERVICES[plat as CommercialPlatform] || ['followers', 'likes', 'views'];
    if (!validServices.includes(targetService as CommercialService)) {
      const safe = validServices[0] as ServiceKey;
      setCfGoalSelection(safe);
    }
    setTargetPlatform(plat);
  };


  const cfRunAnalyzeProfile = () => {
    // If analyzing, reset first to allow fresh search if called again
    if (cfIsAnalyzing && cfAnalyzeTimerRef.current) {
      clearInterval(cfAnalyzeTimerRef.current);
      cfAnalyzeTimerRef.current = null;
    }

    setCfAnalyzeProgress(0);
    setCfIsAnalyzing(true);
    cfAnalyzeCompletedRef.current = false;

    const previousPlatform = previousTarget?.platform?.toLowerCase();
    const canReuseSavedProfile =
      Boolean(previousTarget) &&
      flowStep === 'PREFILL' &&
      previousPlatform === targetPlatform;

    cfAnalyzeSavedFlowRef.current = canReuseSavedProfile;

    const selectedNetworkInput =
      lookupInput.trim() ||
      (previousTarget?.username
        ? `@${String(previousTarget.username).replace(/^@+/, '')}`
        : '');

    // For a fresh/changed profile, start the real lookup immediately.
    // For a saved database profile, DO NOT navigate yet; visually confirm 0→100 first.
    if (!canReuseSavedProfile) {
      onSearch(selectedNetworkInput, targetPlatform);
      if (!selectedNetworkInput.trim()) {
        setCfIsAnalyzing(false);
        return;
      }
    }

    let progress = 0;

    const cadenceByPlatform: Record<string, number> = {
      instagram: 70,
      tiktok: 78,
      twitter: 74,
      youtube: 84,
    };
    const cadence = cadenceByPlatform[targetPlatform] ?? 76;

    cfAnalyzeTimerRef.current = setInterval(() => {
      if (cfAnalyzeSavedFlowRef.current) {
        // Saved profile: complete the full confirmation cycle before navigation.
        const step =
          progress < 40 ? 6 :
          progress < 72 ? 4 :
          progress < 90 ? 2 : 1;

        progress = Math.min(100, progress + step);
        setCfAnalyzeProgress(progress);

        if (progress >= 100 && !cfAnalyzeCompletedRef.current) {
          cfAnalyzeCompletedRef.current = true;

          if (cfAnalyzeTimerRef.current) {
            clearInterval(cfAnalyzeTimerRef.current);
            cfAnalyzeTimerRef.current = null;
          }

          // Keep 100% visible briefly, then move directly to Step 2.
          window.setTimeout(() => {
            setCfIsAnalyzing(false);
            onUseSavedProfile();
          }, 420);
        }

        return;
      }

      // Live lookup: progress follows the search but waits near 94%
      // until the real profile resolution reaches PREVIEW.
      const next =
        progress < 34 ? progress + 7 :
        progress < 64 ? progress + 4 :
        progress < 84 ? progress + 2 :
        progress < 94 ? progress + 1 :
        progress;

      progress = Math.min(94, next);
      setCfAnalyzeProgress(progress);
    }, cadence);
  };

  const identity = verifiedProfile || previousTarget || {};

  useEffect(() => {
    if (lookupError && cfIsAnalyzing) {
      if (cfAnalyzeTimerRef.current) {
        clearInterval(cfAnalyzeTimerRef.current);
        cfAnalyzeTimerRef.current = null;
      }
      setCfIsAnalyzing(false);
      setCfAnalyzeProgress(0);
      cfAnalyzeCompletedRef.current = false;
    }
  }, [lookupError, cfIsAnalyzing]);

  useEffect(() => {
    if (
      !cfIsAnalyzing ||
      cfAnalyzeSavedFlowRef.current ||
      !verifiedProfile ||
      cfAnalyzeCompletedRef.current
    ) {
      return;
    }

    if (cfAnalyzeTimerRef.current) {
      clearInterval(cfAnalyzeTimerRef.current);
      cfAnalyzeTimerRef.current = null;
    }

    let finishingProgress = cfAnalyzeProgress;

    cfAnalyzeTimerRef.current = setInterval(() => {
      const step = finishingProgress < 60 ? 14 : finishingProgress < 88 ? 8 : 4;
      finishingProgress = Math.min(100, finishingProgress + step);
      setCfAnalyzeProgress(finishingProgress);

      if (finishingProgress >= 100 && !cfAnalyzeCompletedRef.current) {
        cfAnalyzeCompletedRef.current = true;

        if (cfAnalyzeTimerRef.current) {
          clearInterval(cfAnalyzeTimerRef.current);
          cfAnalyzeTimerRef.current = null;
        }

        // 100% must be visible briefly, then stop analyzing and await explicit confirmation via "Yes, This is my profile".
        window.setTimeout(() => {
          setCfIsAnalyzing(false);
        }, 150);
      }
    }, 25);

    return () => {
      if (cfAnalyzeTimerRef.current && cfAnalyzeCompletedRef.current) {
        clearInterval(cfAnalyzeTimerRef.current);
        cfAnalyzeTimerRef.current = null;
      }
    };
  }, [cfIsAnalyzing, verifiedProfile, cfAnalyzeProgress]);

  const username = (identity.username || 'cloutflow.preview').replace(/^@+/, '');
  const avatar = avatarFrom(verifiedProfile, liveAvatarUrl || previousTarget?.avatarUrl || null);
  const maskedEmail = verifiedProfile?.maskedEmail || previousTarget?.maskedEmail || 'lo*****@gmail.com';
  const selectedPkg = eligiblePackages.find((p) => p.id === selectedPackageId) || eligiblePackages[1] || eligiblePackages[0] || null;
  const selectedNetwork = NETWORKS.find((network) => network.key === targetPlatform) || NETWORKS[0];
  const profileReady = Boolean(verifiedProfile);
  const getInputPlaceholder = () => {
    if (targetService === 'followers') {
      if (targetPlatform === 'youtube') return '@username or channel link...';
      return '@username or profile link...';
    }
    switch (targetPlatform) {
      case 'tiktok':
        return 'https://www.tiktok.com/@username/video/...';
      case 'twitter':
        return 'https://x.com/username/status/...';
      case 'youtube':
        return 'https://www.youtube.com/watch?v=...';
      case 'instagram':
      default:
        return 'https://www.instagram.com/p/... or /reel/...';
    }
  };

  return (
    <section className={`cf-o10-master cf-o10-platform-${targetPlatform}`} data-stage={flowStep.toLowerCase()} data-platform={targetPlatform}>
      <div className={`cf-o10-columns cf-o10-page-${flowStep.toLowerCase()}`}>
        {flowStep !== 'PACKAGE' && flowStep !== 'REVIEW' && <article className="cf-o10-panel cf-o10-profile-panel">
          <div className="cf-o10-profile-hero-row">
            <div>
              <h1>Ready to Take Your Growth <em>Further?</em></h1>
              <p>Your 25% reward is ready.<br />Keep growing with CloutFlow.</p>
            </div>
            <Image
              className="cf-o10-rocket-image"
              src={rocketArt}
              alt=""
              width={1309}
              height={1201}
              sizes="(max-width: 700px) 138px, (max-width: 900px) 120px, 205px"
              quality={100}
              priority
            />
          </div>

              <div className="cf-o10-goal-builder" data-network={targetPlatform}>
                <section className="cf-o10-gb-section cf-o10-gb-goal">
                  <div className="cf-o10-gb-head">
                    <span className="cf-o10-gb-num">1</span>
                    <div>
                      <h2>Choose your goal</h2>
                      <p>What do you want to achieve?</p>
                    </div>
                  </div>

                  <div className="cf-o10-gb-goals">
                    {(PLATFORM_SERVICES[targetPlatform as CommercialPlatform] || ['followers', 'likes', 'views']).map((serviceKey) => {
                      if (serviceKey === 'followers') {
                        return (
                          <button
                            key="followers"
                            type="button"
                            data-service="followers"
                            data-platform={targetPlatform}
                            aria-pressed={cfGoalSelection === 'followers'}
                            onClick={() => cfSelectGoal('followers')}
                            className={`cf-o10-gb-goal-card ${cfGoalSelection === 'followers' ? 'is-active' : ''}`}
                          >
                            <span className="cf-o10-gb-goal-icon cf-o10-gb-goal-icon-reference"><img src={`/offer/goal-followers-${targetPlatform}.png`} alt="" /></span>
                            <strong>Followers</strong>
                            {cfGoalSelection === 'followers' && <b className="cf-o10-gb-check"><Check /></b>}
                          </button>
                        );
                      }
                      if (serviceKey === 'likes') {
                        return (
                          <button
                            key="likes"
                            type="button"
                            data-service="likes"
                            data-platform={targetPlatform}
                            aria-pressed={cfGoalSelection === 'likes'}
                            onClick={() => cfSelectGoal('likes')}
                            className={`cf-o10-gb-goal-card ${cfGoalSelection === 'likes' ? 'is-active' : ''}`}
                          >
                            <span className="cf-o10-gb-goal-icon cf-o10-gb-goal-icon-reference"><img src={`/offer/goal-likes-${targetPlatform}.png`} alt="" /></span>
                            <strong>Likes</strong>
                            {cfGoalSelection === 'likes' && <b className="cf-o10-gb-check"><Check /></b>}
                          </button>
                        );
                      }
                      if (serviceKey === 'views') {
                        return (
                          <button
                            key="views"
                            type="button"
                            data-service="views"
                            data-platform={targetPlatform}
                            aria-pressed={cfGoalSelection === 'views'}
                            onClick={() => cfSelectGoal('views')}
                            className={`cf-o10-gb-goal-card ${cfGoalSelection === 'views' ? 'is-active' : ''}`}
                          >
                            <span className="cf-o10-gb-goal-icon cf-o10-gb-goal-icon-reference"><img src={`/offer/goal-views-${targetPlatform}.png`} alt="" /></span>
                            <strong>Views</strong>
                            {cfGoalSelection === 'views' && <b className="cf-o10-gb-check"><Check /></b>}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </section>

                <section className="cf-o10-gb-section cf-o10-gb-network-section">
                  <div className="cf-o10-gb-head">
                    <span className="cf-o10-gb-num">2</span>
                    <div>
                      <h2>Choose your network</h2>
                      <p>We support all 4 platforms below</p>
                    </div>
                  </div>

                  <div className="cf-o10-gb-networks">
                    {NETWORKS.map((network) => {
                      const isSelected = selectedNetworkKey === network.key;
                      return (
                        <button
                          key={network.key}
                          type="button"
                          data-network={network.key}
                          aria-pressed={isSelected}
                          onClick={() => {
                            handleNetworkSelection(network.key);
                          }}
                          className={`cf-o10-gb-network ${isSelected ? 'is-active' : ''}`}
                        >
                          <span><Image src={network.icon} alt="" width={25} height={25} /></span>
                          <strong>{network.key === 'twitter' ? 'X (Twitter)' : network.label}</strong>
                          {isSelected && <b className="cf-o10-gb-check"><Check /></b>}
                        </button>
                      );
                    })}
                  </div>

                  {previousTarget && !verifiedProfile && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 10,
                        padding: '8px 10px',
                        minHeight: 50,
                        border: '1px solid #e2e6ee',
                        borderRadius: 10,
                        background: '#fff'
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: 38,
                          height: 38,
                          minWidth: 38,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: '#f3f5f9',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={username || "profile avatar"}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <UserRound size={20} />
                        )}
                      </div>

                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="cf-o10-last-profile-label" style={{ color: 'rgb(138, 150, 170)', fontSize: 11, fontWeight: 600 }}>
                          Last purchased profile
                        </span>
                        <strong style={{ color: '#111a2e', fontSize: 12.5, lineHeight: 1.15 }}>
                          @{username}
                        </strong>
                      </div>

                      <div
                        className="cf-o10-last-profile-network"
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: 'rgb(101, 114, 138)',
                          fontSize: 11.5,
                          fontWeight: 700
                        }}
                      >
                        <Image
                          className="cf-o10-last-profile-network-icon"
                          src={NETWORKS.find((n) => n.key === targetPlatform)?.icon || instagramIcon}
                          alt=""
                          width={18}
                          height={18}
                        />
                        <span>{NETWORKS.find((n) => n.key === targetPlatform)?.label || targetPlatform}</span>
                      </div>
                    </div>
                  )}

                  {(!previousTarget || verifiedProfile) && (
                    <div style={{ marginBottom: 12 }}>
                      <label className="cf-o10-gb-field-label" htmlFor="cf-o10-new-target-input">
                        {targetService === 'followers'
                          ? 'Profile or @username'
                          : targetService === 'views'
                            ? (targetPlatform === 'youtube' ? 'Video or Short URL' : targetPlatform === 'tiktok' ? 'TikTok video URL' : targetPlatform === 'twitter' ? 'Post/status URL' : 'Reel or video URL')
                            : 'Post, video or content URL'} <span className="cf-o10-email-required">(required)</span>
                      </label>
                      <div className="cf-o10-search-input">
                        <ScanSearch />
                        <input
                          id="cf-o10-new-target-input"
                          data-clarity-mask="true"
                          className="clarity-mask"
                          value={lookupInput}
                          onChange={(e) => setLookupInput(e.target.value)}
                          placeholder={getInputPlaceholder()}
                          aria-label="Profile username or link"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              cfRunAnalyzeProfile();
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {verifiedProfile && !cfIsAnalyzing && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                        padding: '10px 14px',
                        minHeight: 52,
                        border: '1.5px solid #d0f0de',
                        borderRadius: 12,
                        background: '#f4fbf7'
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: 38,
                          height: 38,
                          minWidth: 38,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: '#e2f0e8',
                          display: 'grid',
                          placeItems: 'center',
                          border: '1.5px solid #a3e3c0'
                        }}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={username || "profile avatar"}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <UserRound size={20} color="#0b9467" />
                        )}
                      </div>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <strong style={{ color: '#111a2e', fontSize: 13.5, lineHeight: 1.2, fontWeight: 750 }}>
                          @{username}
                        </strong>
                        <span style={{ color: '#55657e', fontSize: 12, lineHeight: 1.1, fontWeight: 600 }}>
                          {targetService === 'followers' ? 'Followers' : targetService === 'likes' ? 'Likes' : 'Views'}
                        </span>
                      </div>
                      <div
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#07875e',
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        <Image
                          src={NETWORKS.find((n) => n.key === targetPlatform)?.icon || instagramIcon}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </div>
                    </div>
                  )}

                  <label className="cf-o10-gb-field-label">Email <span className="cf-o10-email-required">(required)</span></label>
                  <div className={`cf-o10-gb-linked-row ${!previousTarget ? 'is-unlinked' : ''}`}>
                    <div className="cf-o10-gb-input cf-o10-gb-linked-input">
                      <Mail />
                      <input
                        id="cf-o10-repurchase-email"
                        type="email"
                        data-clarity-mask="true"
                        className="clarity-mask"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        placeholder="Enter your email"
                        autoComplete="email"
                        inputMode="email"
                        aria-label="Email"
                        style={{
                          flex: '1 1 auto',
                          minWidth: 0,
                          width: '100%',
                          border: 0,
                          outline: 0,
                          background: 'transparent',
                          color: '#344054',
                          font: 'inherit',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      />
                      {previousTarget && !verifiedProfile && emailValue.trim().length > 0 && <em>Linked</em>}
                    </div>

                    {previousTarget && (
                      <button
                        type="button"
                        className="cf-o10-gb-unlink"
                        onClick={() => {
                          onChooseAnother();
                        }}
                      >
                        <span>×</span>
                        Change profile
                      </button>
                    )}
                  </div>

                  {previousTarget && !verifiedProfile && (
                    <div className="cf-o10-gb-helper cf-o10-gb-auto-helper">
                      <ShieldCheck />
                      <span className="cf-o10-gb-helper-text-desktop">
                        Last purchase restored: @{username} · {targetService} · {NETWORKS.find((n) => n.key === targetPlatform)?.label || targetPlatform}. You can change the email before continuing.
                      </span>
                      <span className="cf-o10-gb-helper-text-mobile">
                        Last purchase restored. You can change the email before continuing.
                      </span>
                    </div>
                  )}
                </section>

                <section className="cf-o10-gb-section cf-o10-gb-analyze-section">
                  <div className="cf-o10-gb-head">
                    <span className="cf-o10-gb-num">3</span>
                    <div>
                      <h2>Analyze profile</h2>
                      <p>
                        <span className="cf-o10-gb-analyze-sub-desktop">We'll fetch public data and confirm your profile.</span>
                        <span className="cf-o10-gb-analyze-sub-mobile">We'll confirm your public profile.</span>
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const isConfirmedReady = !cfIsAnalyzing && Boolean(verifiedProfile);
                    return (
                      <button
                        type="button"
                        className={`cf-o10-gb-analyze ${cfIsAnalyzing ? 'is-analyzing' : ''} ${isConfirmedReady ? 'is-confirmed' : ''}`}
                        onClick={() => {
                          if (isConfirmedReady) {
                            onConfirmFound();
                          } else {
                            cfRunAnalyzeProfile();
                          }
                        }}
                        aria-label={isConfirmedReady ? 'Yes, This is my profile' : 'Analyze Profile'}
                      >
                        {cfIsAnalyzing && (
                          <span
                            className="cf-o10-analyze-button-progress"
                            style={{ width: `${cfAnalyzeProgress}%` }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="cf-o10-analyze-button-content">
                          {isConfirmedReady ? <Check /> : <ScanSearch />}
                          <strong>
                            {cfIsAnalyzing
                              ? `Analyzing Profile... ${cfAnalyzeProgress}%`
                              : isConfirmedReady
                                ? 'Yes, This is my profile'
                                : 'Analyze Profile'}
                          </strong>
                        </span>
                      </button>
                    );
                  })()}
                  {lookupError && <div className="cf-o10-error" style={{ marginTop: 10 }}>{lookupError}</div>}
                </section>
              </div>
        </article>}

        {flowStep === 'PACKAGE' && <article className="cf-o10-panel cf-o10-package-panel cf-o10-package-ref">
          <div className="cf-o10-panel-title-row cf-o10-package-ref-head">
            <div>
              <h2>Choose your <span className="cf-o10-package-title-gradient">growth package</span></h2>
              <div className="cf-o10-flow25-wrap">
              <button
                type="button"
                className="cf-o10-flow25-badge"
                data-platform={targetPlatform}
                aria-label="Copy coupon FLOW25"
                title="Click to copy"
                onClick={cfCopyFlow25Coupon}
              >
                <Image
                  src={NETWORKS.find((network) => network.key === targetPlatform)?.icon ?? instagramIcon}
                  alt=""
                  className="cf-o10-flow25-network-icon"
                  aria-hidden="true"
                />
                <span className="cf-o10-flow25-prefix">Coupon</span>
                <span className="cf-o10-flow25-code">#FLOW25</span>
              </button>
              {cfCouponCopied && (
                <div className="cf-o10-flow25-copied" role="status" aria-live="polite">
                  Copied!
                </div>
              )}
            </div>
              <p>Your 25% reward is already included.</p>
            </div>
          </div>

          {checkoutError && <div className="cf-o10-error" style={{ marginBottom: 16 }}>{checkoutError}</div>}

          <div className="cf-o10-package-ref-grid">
            {eligiblePackages.slice(0, 6).map((pkg, index) => {
              const selected = selectedPkg?.id === pkg.id;
              const discounted = ((pkg.priceCents * .75) / 100).toFixed(2);
              const regular = (pkg.priceCents / 100).toFixed(2);
              const serviceLabel = pkg.service.charAt(0).toUpperCase() + pkg.service.slice(1);
              const isBestValue = index === 3 || index === 5;
              const planNames = ['Starter', 'Boost', 'Growth', 'Pro', 'Elite', 'Max'];
              const planQuantity = pkg.quantity;
              const currentPlanPrice = pkg.priceCents / 100;
              const comparisonPlanPrice = pkg.oldPriceCents ? pkg.oldPriceCents / 100 : Number((currentPlanPrice * 1.35).toFixed(2));
              const planDiscountPercent = comparisonPlanPrice > currentPlanPrice
                ? Math.round(((comparisonPlanPrice - currentPlanPrice) / comparisonPlanPrice) * 100)
                : 25;
              const planName = pkg.name || planNames[index] || `Plan ${index + 1}`;
              const planIconKey = ['starter', 'growth', 'pro', 'authority', 'influencer', 'scale'][index] || 'starter';

              return (
                <article
                  key={pkg.id}
                  className={`cf-o10-package-ref-card ${selected ? 'is-selected' : ''} ${isBestValue ? 'is-best-value' : ''}`}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
                      return;
                    }
                    if (checkoutSubmitting) return;
                    onSelectPackage(pkg.id);
                  }}
                >
                  {index === 3 && (
                    <span className="cf-o10-package-ref-best cf-o10-package-ref-best--popular">
                      <Star /> MOST POPULAR
                    </span>
                  )}
                  {index === 5 && (
                    <span className="cf-o10-package-ref-best cf-o10-package-ref-best--deal">
                      <Sparkles /> BEST DEAL
                    </span>
                  )}

                  <div className="cf-o10-package-ref-topline">
                    <div className="cf-o10-package-ref-plan">
                      <div className="cf-o10-package-ref-plan-name">
                        <span className={`cf-plan-premium-icon cf-plan-premium-icon--${planIconKey} cf-plan-premium-icon--network-${targetPlatform}`} aria-hidden="true">
                          <img
                            src={
                              planIconKey === 'growth'
                                ? '/offer/package-plan-icons/growth-exact.png'
                                : planIconKey === 'influencer'
                                  ? '/offer/package-plan-icons/influencer-exact.png'
                                  : `/offer/package-plan-icons/${planIconKey}.png`
                            }
                            alt=""
                            draggable={false}
                          />
                        </span>
                        <strong>{planName}</strong>
                      </div>
                    </div>
                    <b className={`cf-o10-discount-badge cf-o10-discount-badge--${planIconKey}`}>
                      {index === 0 && <Tag />}
                      {index === 1 && <Flame />}
                      {index === 2 && <ShieldCheck />}
                      {index === 3 && <Zap />}
                      {index === 4 && <Gem />}
                      {index === 5 && <Star />}
                      <span>{planDiscountPercent}% OFF</span>
                    </b>
                  </div>

                  <h3 className="cf-o10-package-ref-qty">{planQuantity.toLocaleString('en-US')} {serviceLabel}</h3>

                  <div className="cf-o10-package-ref-bonus-slot">
                    <div className="cf-o10-package-ref-bonus">
                      <Sparkles /> 5% Promo
                    </div>
                  </div>

                  <div className="cf-o10-package-ref-price">
                    <strong>${currentPlanPrice.toFixed(2)}</strong>
                    <del>${comparisonPlanPrice.toFixed(2)}</del>
                  </div>

                  <p className={`cf-o10-package-ref-coupon ${index === 0 ? "cf-o10-package-ref-coupon--starter" : ""}`}>With coupon {couponCode}</p>

                  <div className="cf-o10-package-ref-divider" />

                  <ul className="cf-o10-package-ref-benefits">
                    <li><span><Check /></span>No password required</li>
                    <li><span><Check /></span>Fast delivery start</li>
                    <li><span><Check /></span>24/7 priority support</li>
                  </ul>

                  <div className="cf-o10-package-assurance">
                    <div><ShieldCheck /><span>100% real {pkg.service}</span></div>
                    <div><RefreshCw /><span>Refill guaranteed</span></div>
                  </div>

                  <button
                    type="button"
                    className={`cf-o10-package-ref-cta ${checkoutSubmitting && selected ? 'is-mobile-loading' : ''}`}
                    disabled={checkoutSubmitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (checkoutSubmitting) return;
                      onSelectPackage(pkg.id);
                    }}
                  >
                    {checkoutSubmitting && selected ? (
                      <span className="cf-o10-cta-mobile-loading">
                        <Loader2 className="cf-cta-spinner" />
                        <span>Opening checkout...</span>
                      </span>
                    ) : (
                      <>
                        <span className="cf-o10-cta-default">
                          Get {planQuantity.toLocaleString('en-US')} {serviceLabel} <ArrowRight />
                        </span>
                        <span className="cf-o10-cta-hover">
                          Selected <Check />
                        </span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </article>}
      </div>
    </section>
  );
}
