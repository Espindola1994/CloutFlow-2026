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
  Search,
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
  const [cfGoalSelection, setCfGoalSelection] = useState<ServiceKey>(props.targetService);
  const [cfAnalyzeProgress, setCfAnalyzeProgress] = useState(0);
  const [cfIsAnalyzing, setCfIsAnalyzing] = useState(false);
  const cfAnalyzeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cfAnalyzeSavedFlowRef = useRef(false);
  const cfAnalyzeCompletedRef = useRef(false);

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
    setTargetPlatform(plat);
    const validServices = PLATFORM_SERVICES[plat as CommercialPlatform] || ['followers', 'likes', 'views'];
    if (!validServices.includes(targetService as CommercialService)) {
      const safe = validServices[0] as ServiceKey;
      setCfGoalSelection(safe);
      setTargetService(safe);
    }
  };


  const cfRunAnalyzeProfile = () => {
    if (cfIsAnalyzing) return;

    setCfAnalyzeProgress(0);
    setCfIsAnalyzing(true);
    cfAnalyzeCompletedRef.current = false;

    if (cfAnalyzeTimerRef.current) {
      clearInterval(cfAnalyzeTimerRef.current);
      cfAnalyzeTimerRef.current = null;
    }

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
    if (
      !cfIsAnalyzing ||
      cfAnalyzeSavedFlowRef.current ||
      flowStep !== 'PREVIEW' ||
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
      finishingProgress = Math.min(100, finishingProgress + 1);
      setCfAnalyzeProgress(finishingProgress);

      if (finishingProgress >= 100 && !cfAnalyzeCompletedRef.current) {
        cfAnalyzeCompletedRef.current = true;

        if (cfAnalyzeTimerRef.current) {
          clearInterval(cfAnalyzeTimerRef.current);
          cfAnalyzeTimerRef.current = null;
        }

        // 100% must be visible before the parent is allowed to switch to Step 2.
        window.setTimeout(() => {
          setCfIsAnalyzing(false);
          onConfirmFound();
        }, 420);
      }
    }, 55);

    return () => {
      if (cfAnalyzeTimerRef.current && cfAnalyzeCompletedRef.current) {
        clearInterval(cfAnalyzeTimerRef.current);
        cfAnalyzeTimerRef.current = null;
      }
    };
  }, [cfIsAnalyzing, flowStep, cfAnalyzeProgress, onConfirmFound]);

  const username = (identity.username || 'cloutflow.preview').replace(/^@+/, '');
  const avatar = avatarFrom(verifiedProfile, liveAvatarUrl || previousTarget?.avatarUrl || null);
  const maskedEmail = verifiedProfile?.maskedEmail || previousTarget?.maskedEmail || 'lo*****@gmail.com';
  const selectedPkg = eligiblePackages.find((p) => p.id === selectedPackageId) || eligiblePackages[1] || eligiblePackages[0] || null;
  const selectedNetwork = NETWORKS.find((network) => network.key === targetPlatform) || NETWORKS[0];
  const profileReady = Boolean(verifiedProfile);
  const profileMode = !cfIsAnalyzing && (flowStep === 'LOOKUP' || flowStep === 'LOADING' || flowStep === 'PREVIEW');

  return (
    <section className={`cf-o10-master cf-o10-platform-${targetPlatform}`} data-stage={flowStep.toLowerCase()} data-platform={targetPlatform}>
      <div className={`cf-o10-columns cf-o10-page-${flowStep.toLowerCase()}`}>
        {flowStep !== 'PACKAGE' && flowStep !== 'REVIEW' && <article className="cf-o10-panel cf-o10-profile-panel">
          {!profileMode ? (
            <>
              <div className="cf-o10-profile-hero-row">
                <div>
                  <h1>Ready to Take Your Growth <em>Further?</em></h1>
                  <p>Your 25% reward is ready.<br />Keep growing with CloutFlow.</p>
                </div>
                <Image className="cf-o10-rocket-image" src={rocketArt} alt="" width={72} height={72} priority />
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
                            onTouchEnd={() => cfSelectGoal('followers')}
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
                            onTouchEnd={() => cfSelectGoal('likes')}
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
                            onTouchEnd={() => cfSelectGoal('views')}
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
                      <h2>Choose the network</h2>
                      <p>We support all 4 platforms below</p>
                    </div>
                  </div>

                  <div className="cf-o10-gb-networks">
                    {NETWORKS.map((network) => (
                      <button
                        key={network.key}
                        type="button"
                        data-network={network.key}
                        aria-pressed={targetPlatform === network.key}
                        onClick={() => {
                          handleNetworkSelection(network.key);
                        }}
                        className={`cf-o10-gb-network ${targetPlatform === network.key ? 'is-active' : ''}`}
                      >
                        <span><Image src={network.icon} alt="" width={25} height={25} /></span>
                        <strong>{network.key === 'twitter' ? 'X (Twitter)' : network.label}</strong>
                        {targetPlatform === network.key && <b className="cf-o10-gb-check"><Check /></b>}
                      </button>
                    ))}
                  </div>

                  {previousTarget && (
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

                  <label className="cf-o10-gb-field-label">Email <span className="cf-o10-email-required">(required)</span></label>
                  <div className="cf-o10-gb-linked-row">
                    <div className="cf-o10-gb-input cf-o10-gb-linked-input">
                      <Mail />
                      <input
                        id="cf-o10-repurchase-email"
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        placeholder={previousTarget?.maskedEmail || 'Enter your email'}
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
                      {previousTarget && emailValue.trim().length > 0 && <em>Linked</em>}
                    </div>

                    {previousTarget && (
                      <button
                        type="button"
                        className="cf-o10-gb-unlink"
                        onClick={() => {
                          setEmailValue('');
                          window.setTimeout(() => {
                            const input = document.getElementById('cf-o10-repurchase-email') as HTMLInputElement | null;
                            input?.focus();
                          }, 0);
                        }}
                      >
                        <span>×</span>
                        Change profile
                      </button>
                    )}
                  </div>

                  {previousTarget && (
                    <div className="cf-o10-gb-helper cf-o10-gb-auto-helper">
                      <ShieldCheck />
                      <span>
                        Last purchase restored: @{username} · {targetService} · {NETWORKS.find((n) => n.key === targetPlatform)?.label || targetPlatform}. You can change the email before continuing.
                      </span>
                    </div>
                  )}
                </section>

                <section className="cf-o10-gb-section cf-o10-gb-analyze-section">
                  <div className="cf-o10-gb-head">
                    <span className="cf-o10-gb-num">3</span>
                    <div>
                      <h2>Analyze profile</h2>
                      <p>We'll fetch public data and confirm your profile.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`cf-o10-gb-analyze ${cfIsAnalyzing ? 'is-analyzing' : ''}`}
                    onClick={cfRunAnalyzeProfile}
                    disabled={cfIsAnalyzing}
                    aria-label={cfIsAnalyzing ? `Analyzing profile ${cfAnalyzeProgress}%` : 'Analyze Profile'}
                  >
                    {cfIsAnalyzing && (
                      <span
                        className="cf-o10-analyze-button-progress"
                        style={{ width: `${cfAnalyzeProgress}%` }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="cf-o10-analyze-button-content">
                      <ScanSearch />
                      <strong>
                        {cfIsAnalyzing ? `Analyzing Profile... ${cfAnalyzeProgress}%` : 'Analyze Profile'}
                      </strong>
                    </span>
                  </button>
                </section>
              </div>
            </>
          ) : (
            <div className="cf-o10-search-mode">
              <div className="cf-o10-profile-hero-row compact">
                <div>
                  <h1>{flowStep === 'PREVIEW' ? <>Profile <em>found!</em></> : <>Find your <em>profile.</em></>}</h1>
                  <p>{flowStep === 'PREVIEW' ? 'Confirm the destination before continuing.' : 'Choose a network and enter your public profile.'}</p>
                </div>
                <Image className="cf-o10-rocket-image" src={rocketArt} alt="" width={72} height={72} priority />
              </div>

              {flowStep !== 'PREVIEW' && (
                <>
                  <div className="cf-o10-label">Choose your goal</div>
                  <div className="cf-o10-service-quick">
                    {(PLATFORM_SERVICES[targetPlatform as CommercialPlatform] || ['followers', 'likes', 'views']).map((service) => (
                      <button
                        type="button"
                        key={service}
                        onClick={() => setTargetService(service)}
                        className={targetService === service ? 'is-active' : ''}
                      >
                        {service === 'followers' ? 'Followers' : service === 'likes' ? 'Likes' : 'Views'}
                      </button>
                    ))}
                  </div>

                  <div className="cf-o10-label">Choose your network</div>
                  <div className="cf-o10-net-grid">
                    {NETWORKS.map((n) => (
                      <button key={n.key} type="button" className={targetPlatform === n.key ? 'active' : ''} disabled={flowStep === 'LOADING'} onClick={() => handleNetworkSelection(n.key)}>
                        <Image src={n.icon} alt="" width={20} height={20} />
                        <span>{n.label}</span>
                        {targetPlatform === n.key && <BadgeCheck />}
                      </button>
                    ))}
                  </div>
                  <div className="cf-o10-search-input"><Search /><input value={lookupInput} disabled={flowStep === 'LOADING'} onChange={(e) => setLookupInput(e.target.value)} placeholder="@username or profile link" onKeyDown={(e) => e.key === 'Enter' && flowStep !== 'LOADING' && onSearch(lookupInput, targetPlatform)} /></div>
                  {lookupError && <div className="cf-o10-error">{lookupError}</div>}
                  <small className="cf-o10-public-note"><ShieldCheck /> Public data only. No password required.</small>
                </>
              )}

              {flowStep === 'LOADING' && (
                <div className="cf-o10-analyzing"><Loader2 /><strong>Locating profile...</strong><span>Checking public account data.</span></div>
              )}

              {flowStep === 'PREVIEW' && verifiedProfile && (
                <div className="cf-o10-profile-box confirm">
                  <div className="cf-o10-avatar-wrap">
                    {avatar ? <img src={avatar} alt="" /> : <UserRound />}
                    <Image src={NETWORKS.find((n) => n.key === targetPlatform)?.icon || instagramIcon} alt="" width={18} height={18} />
                  </div>
                  <div className="cf-o10-profile-id"><strong>@{username}</strong><span>{maskedEmail}</span></div>
                  <b>{isProfileRestricted ? 'Restricted' : 'Confirmed'}</b>
                </div>
              )}

              {flowStep === 'LOOKUP' && <button type="button" className="cf-o10-purple-btn" onClick={() => onSearch(lookupInput, targetPlatform)}><Search /> Analyze profile <ArrowRight /></button>}
              {flowStep === 'LOADING' && <button type="button" className="cf-o10-outline-btn" onClick={onCancelSearch}><ArrowLeft /> Cancel search</button>}
              {flowStep === 'PREVIEW' && <button type="button" className="cf-o10-purple-btn" disabled={isProfileRestricted} onClick={onConfirmFound}><Check /> Continue to packages <ArrowRight /></button>}
              <button type="button" className="cf-o10-text-btn" onClick={onBackToSaved}><ArrowLeft /> Back to saved profile</button>
            </div>
          )}
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
                  onClick={() => onSelectPackage(pkg.id)}
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
                    {index === 0 || !pkg.bonusQuantity ? (
                      <div className="cf-o10-package-ref-no-bonus">
                        <span aria-hidden="true">×</span> No bonus included
                      </div>
                    ) : pkg.bonusQuantity > 0 ? (
                      <div className="cf-o10-package-ref-bonus">
                        <Sparkles /> +{pkg.bonusQuantity.toLocaleString('en-US')} Bonus Included
                      </div>
                    ) : null}
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
                    <div><ShieldCheck /><span>100% real followers</span></div>
                    <div><RefreshCw /><span>Refill guaranteed</span></div>
                  </div>

                  <button
                    type="button"
                    className="cf-o10-package-ref-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPackage(pkg.id);
                    }}
                  >
                    <span className="cf-o10-cta-default">
                      Get {(planQuantity + (pkg.bonusQuantity || 0)).toLocaleString('en-US')} {serviceLabel} <ArrowRight />
                    </span>
                    <span className="cf-o10-cta-hover">
                      Selected <Check />
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </article>}

        {flowStep === 'REVIEW' && (
          <div className="cf-checkout3-shell">
            <aside className="cf-checkout3-side">
              <div className="cf-checkout3-step is-done">
                <span className="cf-checkout3-step-circle"><Check /></span>
                <div>
                  <small>01</small>
                  <strong>Profile</strong>
                  <em>@{username}</em>
                </div>
              </div>
              <span className="cf-checkout3-line" />

              <div className="cf-checkout3-step is-done">
                <span className="cf-checkout3-step-circle"><Check /></span>
                <div>
                  <small>02</small>
                  <strong>Package</strong>
                  <em>{selectedPkg?.name || '2,000 Followers'}</em>
                </div>
              </div>
              <span className="cf-checkout3-line" />

              <div className="cf-checkout3-step is-current">
                <span className="cf-checkout3-step-circle">03</span>
                <div>
                  <strong>Checkout</strong>
                  <em>Review & pay</em>
                </div>
              </div>

              <div className="cf-checkout3-timer">
                <span className="cf-checkout3-timer-icon"><Clock3 /></span>
                <div>
                  <strong>{timeLeft || '20:57'}</strong>
                  <small>Offer expires in</small>
                </div>
              </div>

              <div className="cf-checkout3-safe">
                <span><ShieldCheck /></span>
                <div>
                  <strong>Safe & Secure</strong>
                  <small>Your data is protected with bank-level encryption.</small>
                </div>
              </div>
            </aside>

            <main className="cf-checkout3-card">
              <header className="cf-checkout3-title">
                <span><ShoppingBag /></span>
                <div>
                  <h2>Review & checkout</h2>
                  <p>You're ready to grow!</p>
                </div>
              </header>

              <section className="cf-checkout3-summary">
                <div className="cf-checkout3-summary-row">
                  <span className="cf-checkout3-summary-icon profile">
                    {avatar ? <img src={avatar} alt="" /> : <UserRound />}
                  </span>
                  <div className="cf-checkout3-summary-copy">
                    <small>PROFILE</small>
                    <strong>@{username}</strong>
                  </div>
                  <button type="button" onClick={onChangeProfile}>Change <ArrowRight /></button>
                </div>

                <div className="cf-checkout3-summary-row">
                  <span className="cf-checkout3-summary-icon network">
                    <Image src={selectedNetwork.icon} alt="" />
                  </span>
                  <div className="cf-checkout3-summary-copy">
                    <small>PACKAGE</small>
                    <strong>{selectedPkg?.name || '2,000 Followers'}</strong>
                    <em>{selectedNetwork.label}</em>
                  </div>
                  <button type="button" onClick={() => selectedPkg && onSelectPackage(selectedPkg.id)}>Change <ArrowRight /></button>
                </div>

                <div className="cf-checkout3-summary-row">
                  <span className="cf-checkout3-summary-icon reward"><Gift /></span>
                  <div className="cf-checkout3-summary-copy">
                    <small>REWARD</small>
                    <strong>25% Repeat Reward</strong>
                  </div>
                  <span className="cf-checkout3-applied">Applied <Check /></span>
                </div>
              </section>

              <section className="cf-checkout3-total">
                <span className="cf-checkout3-total-icon"><Tag /></span>
                <div>
                  <small>Total</small>
                  <strong>${selectedPkg ? ((selectedPkg.priceCents * 0.75) / 100).toFixed(2) : '0.00'}</strong>
                </div>
                <i />
                <div className="save">
                  <small>You save</small>
                  <strong>${selectedPkg ? ((selectedPkg.priceCents * 0.25) / 100).toFixed(2) : '0.00'} (25%)</strong>
                </div>
                <button type="button">View details <ArrowRight /></button>
              </section>

              <button
                type="button"
                className="cf-checkout3-cta"
                disabled={!selectedPkg || checkoutSubmitting || !profileReady}
                onClick={() => selectedPkg && onExecuteCheckout(selectedPkg.id)}
              >
                {checkoutSubmitting
                  ? <><Loader2 className="animate-spin" /> Preparing checkout...</>
                  : <><LockKeyhole /> Continue to Secure Checkout <ArrowRight /></>}
              </button>

              <p className="cf-checkout3-note"><ShieldCheck /> Secure checkout. No password required.</p>

              <section className="cf-checkout3-benefits">
                <div>
                  <span className="purple"><ShieldCheck /></span>
                  <p><strong>100% Secure</strong><small>Bank-level encryption</small></p>
                </div>
                <div>
                  <span className="blue"><LockKeyhole /></span>
                  <p><strong>Privacy First</strong><small>We never share your data</small></p>
                </div>
                <div>
                  <span className="green"><Zap /></span>
                  <p><strong>Instant Start</strong><small>Your order will begin immediately</small></p>
                </div>
                <div>
                  <span className="orange"><Headphones /></span>
                  <p><strong>24/7 Support</strong><small>We're here to help you</small></p>
                </div>
              </section>

              {checkoutError && <div className="cf-o10-error">{checkoutError}</div>}
            </main>

            <footer className="cf-checkout3-footer">
              <span>© 2025 CloutFlow. All rights reserved.</span>
              <nav><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a></nav>
            </footer>
          </div>
        )}
      </div>
    </section>
  );
}
