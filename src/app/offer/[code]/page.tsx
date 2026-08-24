/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/purity, react-hooks/set-state-in-effect, @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Copy,
  Check,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  User,
  ChevronRight,
  LockKeyhole,
  Headphones,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

import { InstagramPreview, TikTokPreview, TwitterPreview, YouTubePreview } from '@/components/social-preview';
import { OfferCard } from '@/components/sales/OfferCard';
import { PLATFORM_THEMES, Platform, SERVICE_COPY_MAP } from '@/config/service-sales.config';

interface SanitizedPackage {
  id: string;
  platform: string;
  service: string;
  name: string;
  slug: string;
  quantity: number;
  bonusQuantity: number;
  priceCents: number;
  currency: string;
  badge?: string | null;
  isPopular?: boolean;
}

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

type FlowStep = 'PREFILL' | 'LOOKUP' | 'LOADING' | 'PREVIEW' | 'PACKAGE' | 'FLOW25';

type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';

interface PlatformMetaConfig {
  key: PlatformKey;
  name: string;
  label: string;
  icon: any;
  accent: string;
  accent2: string;
  soft: string;
  gradient: string;
  bgGlow: string;
}

const PLATFORM_CONFIGS: Record<PlatformKey, PlatformMetaConfig> = {
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    label: 'Instagram',
    icon: instagramIcon,
    accent: '#E1306C',
    accent2: '#F56040',
    soft: '#FFF0F5',
    gradient: 'linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)',
    bgGlow: 'radial-gradient(circle at 50% 0%, rgba(225, 48, 108, 0.12) 0%, rgba(193, 53, 132, 0.06) 40%, transparent 70%)',
  },
  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    label: 'TikTok',
    icon: tiktokIcon,
    accent: '#000000',
    accent2: '#FE2C55',
    soft: '#FFF0F3',
    gradient: 'linear-gradient(110deg, #080808 0%, #0a0d0e 30%, #155054 66%, #9b2948 100%)',
    bgGlow: 'radial-gradient(circle at 50% 0%, rgba(37, 244, 238, 0.10) 0%, rgba(254, 44, 85, 0.08) 45%, transparent 70%)',
  },
  twitter: {
    key: 'twitter',
    name: 'X / Twitter',
    label: 'X / Twitter',
    icon: twitterIcon,
    accent: '#0F1419',
    accent2: '#536471',
    soft: '#F7F9FA',
    gradient: 'linear-gradient(110deg, #0F1419 0%, #272C30 50%, #0F1419 100%)',
    bgGlow: 'radial-gradient(circle at 50% 0%, rgba(15, 20, 25, 0.07) 0%, rgba(83, 100, 113, 0.04) 45%, transparent 70%)',
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    label: 'YouTube',
    icon: youtubeIcon,
    accent: '#FF0000',
    accent2: '#CC0000',
    soft: '#FFF0F0',
    gradient: 'linear-gradient(90deg, #FF0000 0%, #CC0000 100%)',
    bgGlow: 'radial-gradient(circle at 50% 0%, rgba(255, 0, 0, 0.10) 0%, rgba(204, 0, 0, 0.05) 45%, transparent 70%)',
  },
};

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

  // Package State
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
        setTimeLeft(`${days}d ${remHours}h remaining`);
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

    const normalizedUsername = verifiedProfile.username.replace(/^@+/, '').trim();
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

  const platformMeta = PLATFORM_CONFIGS[targetPlatform] || PLATFORM_CONFIGS.instagram;
  const salesTheme = PLATFORM_THEMES[targetPlatform as Platform] || PLATFORM_THEMES.instagram;

  // Filter packages based on targetPlatform
  const eligiblePackages = offerData
    ? offerData.packages.filter((p) => p.platform.toLowerCase() === targetPlatform.toLowerCase())
    : [];

  const serviceKey = (eligiblePackages[0]?.service.toLowerCase() || 'followers') as 'followers' | 'likes' | 'views' | 'comments';
  const serviceIsValid = ['followers', 'likes', 'views', 'comments'].includes(serviceKey);
  const safeService = serviceIsValid ? serviceKey : 'followers';
  const copy = SERVICE_COPY_MAP[safeService]?.[targetPlatform as Platform] || SERVICE_COPY_MAP.followers.instagram;

  const selectedPkg = eligiblePackages.find((p) => p.id === selectedPackageId) || eligiblePackages[0] || null;

  // Global Shell Background & Decorative Assets
  const publicDecoElements = (
    <>
      <div className="cf-v68-deco cf-v68-deco-top" aria-hidden="true">
        <span className="cf-v68-chip">👥 +1K</span>
        <span className="cf-v68-heart">♥</span>
        <span className="cf-v68-growth-line" />
        <span className="cf-v68-growth-bars">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="cf-v68-dotgrid" />
      </div>

      <div className="cf-v68-deco cf-v68-deco-bottom" aria-hidden="true">
        <span className="cf-v68-outline ig">◎</span>
        <span className="cf-v68-outline tk">♪</span>
        <span className="cf-v68-outline yt">▶</span>
        <span className="cf-v68-outline x">X</span>
        <span className="cf-v68-dashpath" />
        <span className="cf-v68-chip cf-v68-chip-bottom">👥 +2.5K</span>
        <span className="cf-v68-dotgrid cf-v68-dotgrid-bottom" />
      </div>
    </>
  );

  // Global Header
  const publicHeader = (
    <header className="cf-v68-navbar relative z-30">
      <Link href="/" className="cf-v68-logo" aria-label="CloutFlow home">
        <span>Clout</span>
        <b>Flow</b>
        <ArrowUpRight />
      </Link>

      <div className="cf-v68-nav-actions">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-pink-50 border border-pink-200/80 text-[#E1306C] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#E1306C] animate-pulse" />
          <span>Repeat Purchase · 25% Off</span>
        </div>
      </div>

      <div className="cf-v71-mobile-mark" aria-hidden="true">
        ✦
      </div>
    </header>
  );

  // Trust Bar
  const publicTrustBar = (
    <section className="cf-v68-trustbar mt-14" aria-label="Service benefits">
      <div>
        <ShieldCheck />
        <span>100% Safe &amp; Secure</span>
      </div>
      <div>
        <LockKeyhole />
        <span>No Password Required</span>
      </div>
      <div>
        <Zap />
        <span>Fast Delivery</span>
      </div>
      <div>
        <Headphones />
        <span>24/7 Support</span>
      </div>
    </section>
  );

  const publicSecurityNote = (
    <div className="cf-v68-security-note mt-6">
      <LockKeyhole />
      <span>Your information is 100% secure and protected.</span>
    </div>
  );

  if (loading) {
    return (
      <main className="cf-v68-home font-sans min-h-screen relative flex flex-col justify-between">
        {publicDecoElements}
        <div className="cf-v68-page">
          {publicHeader}
          <div className="cf-v68-main flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 border-3 border-[#1376ff] border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-black text-[#0b1025] tracking-tight">Validating Promotional Offer...</h2>
            <p className="text-sm text-[#647088] mt-1">Preparing your verified repeat-purchase discount.</p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMsg || isExpiredLocally || !offerData) {
    return (
      <main className="cf-v68-home font-sans min-h-screen relative flex flex-col justify-between">
        {publicDecoElements}
        <div className="cf-v68-page">
          {publicHeader}
          <div className="cf-v68-main flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-[#0b1025] tracking-tight mb-2">Offer Unavailable</h1>
            <p className="text-sm text-[#647088] max-w-md mx-auto mb-8 font-medium">
              This promotional offer is no longer available or has already reached its expiration date.
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#1376ff] hover:bg-[#0f64dc] text-white font-extrabold text-sm transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              <span>Explore CloutFlow Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`cf-v68-home font-sans min-h-screen relative flex flex-col justify-between overflow-x-hidden ${
        targetPlatform === 'instagram' ? 'bg-[#FFFDFE]' : targetPlatform === 'tiktok' ? 'bg-[#FAFCFF]' : 'bg-[#FFFFFF]'
      }`}
      style={
        {
          '--accent': platformMeta.accent,
          '--accent-2': platformMeta.accent2,
          '--pale': platformMeta.soft,
          '--gradient': platformMeta.gradient,
        } as React.CSSProperties
      }
    >
      {/* Ambient Platform Radial Background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[550px] pointer-events-none opacity-80 z-0 transition-all duration-700"
        style={{ background: platformMeta.bgGlow }}
        aria-hidden="true"
      />

      {publicDecoElements}

      <div className="cf-v68-page relative z-10">
        {publicHeader}

        <div className="cf-v68-main pt-6 pb-12">
          {/* =========================================================================
              SCREEN 1: WELCOME BACK (PREFILL PROMPT)
             ========================================================================= */}
          {flowStep === 'PREFILL' && offerData.previousTarget && (
            <div className="w-full max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-[#E1306C] bg-pink-50 border border-pink-200 shadow-sm mb-5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>25% OFF REPEAT PURCHASE</span>
              </div>

              {/* Hero Headline */}
              <div className="cf-v68-hero mb-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#081126] tracking-tight leading-[1.08] mb-3">
                  <span>Welcome Back</span>
                </h1>
                <p className="text-base sm:text-lg text-[#556480] max-w-lg mx-auto font-medium">
                  Boost the same profile again and save 25%.
                </p>
                <p className="text-base text-[#556480] font-medium mt-1">Boost the same profile again?</p>
                {timeLeft && (
                  <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                    <Clock size={14} className="text-emerald-600" />
                    <span>Offer expires in {timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Previous Profile Card - CloutFlow Public White Card Surface */}
              <div className="bg-white/95 backdrop-blur-md border border-[#e3e8ef] rounded-3xl p-7 sm:p-9 shadow-[0_12px_35px_rgba(36,51,79,0.08)] max-w-lg mx-auto transition-all hover:shadow-[0_16px_42px_rgba(36,51,79,0.12)]">
                <div className="flex flex-col items-center justify-center gap-4 mb-7">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-50 to-purple-50 border-2 border-[#e3e8ef] flex items-center justify-center text-[#35415a] shadow-inner overflow-hidden">
                      <User size={38} className="text-[#647088]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md border border-[#e3e8ef] flex items-center justify-center p-1">
                      <Image src={platformMeta.icon} alt="" width={18} height={18} className="object-contain" />
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#647088] bg-neutral-100 px-2.5 py-0.5 rounded-full">
                      {offerData.previousTarget.platform} TARGET
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-[#081126] mt-2 tracking-tight">
                      @{offerData.previousTarget.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleStartLookup(offerData.previousTarget!.username, offerData.previousTarget!.platform)}
                    className="w-full py-4 px-6 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(225,48,108,0.25)] hover:shadow-[0_8px_25px_rgba(225,48,108,0.35)] hover:scale-[1.01]"
                    style={{ background: platformMeta.gradient }}
                  >
                    <Search className="w-5 h-5" />
                    <span>Find / Confirm Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlowStep('LOOKUP')}
                    className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-neutral-50 text-[#35415a] hover:text-[#081126] border border-[#e3e8ef] font-extrabold text-sm transition-all cursor-pointer shadow-xs"
                  >
                    Use another profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 2: SOCIAL LOOKUP (PLATFORM SELECTOR & INPUT)
             ========================================================================= */}
          {flowStep === 'LOOKUP' && (
            <div className="w-full max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-[#E1306C] bg-pink-50 border border-pink-200 shadow-sm mb-5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>25% OFF REPEAT PURCHASE</span>
              </div>

              <div className="cf-v68-hero mb-6">
                <h1 className="text-4xl sm:text-5xl font-black text-[#081126] tracking-tight leading-[1.08] mb-3">
                  <span>Social Lookup</span>
                </h1>
                <p className="text-base sm:text-lg text-[#556480] max-w-lg mx-auto font-medium">
                  Which social profile would you like to boost?
                </p>
                {timeLeft && (
                  <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                    <Clock size={14} className="text-emerald-600" />
                    <span>Offer expires in {timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Lookup Card Surface */}
              <div className="bg-white/95 backdrop-blur-md border border-[#e3e8ef] rounded-3xl p-6 sm:p-9 shadow-[0_12px_35px_rgba(36,51,79,0.08)] max-w-xl mx-auto text-left">
                {/* Platform Selector Grid */}
                <div className="mb-6">
                  <label className="text-xs font-extrabold text-[#556480] uppercase tracking-wider block mb-3">
                    Select Social Platform
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['instagram', 'tiktok', 'twitter', 'youtube'] as const).map((p) => {
                      const isSelected = targetPlatform === p;
                      const pConfig = PLATFORM_CONFIGS[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTargetPlatform(p)}
                          className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#081126] shadow-[0_4px_16px_rgba(36,51,79,0.12)] border-[#1376ff]'
                              : 'bg-[#fbfcfd] border-[#e3e8ef] text-[#556480] hover:bg-white hover:text-[#081126] hover:border-[#ccd6e2]'
                          }`}
                          style={{
                            borderColor: isSelected ? pConfig.accent : undefined,
                            boxShadow: isSelected ? `0 4px 14px ${pConfig.soft}` : undefined,
                          }}
                        >
                          <Image src={pConfig.icon} alt="" width={24} height={24} className="object-contain" />
                          <span className="capitalize">{p === 'twitter' ? 'X / Twitter' : p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Username Input Field */}
                <div className="mb-6">
                  <label className="text-xs font-extrabold text-[#556480] uppercase tracking-wider block mb-2">
                    Target Profile
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="@username or profile link"
                      value={lookupInput}
                      onChange={(e) => setLookupInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartLookup(lookupInput, targetPlatform)}
                      className="w-full bg-[#fbfcfd] border border-[#d9e1ec] rounded-xl px-4 py-3.5 text-base text-[#081126] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:border-[#1376ff] focus:ring-2 focus:ring-[#1376ff]/20 transition-all font-medium shadow-inner"
                    />
                  </div>
                  {lookupError && (
                    <p className="mt-2.5 text-xs text-red-600 flex items-center gap-1.5 font-bold">
                      <AlertCircle size={14} /> {lookupError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleStartLookup(lookupInput, targetPlatform)}
                  className="w-full py-4 px-6 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(19,118,255,0.22)] hover:scale-[1.01]"
                  style={{ background: platformMeta.gradient }}
                >
                  <span>Locate Profile</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 3: LOOKUP LOADING (PRESERVES FULL BRANDED SHELL)
             ========================================================================= */}
          {flowStep === 'LOADING' && (
            <div className="w-full max-w-lg mx-auto text-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/95 backdrop-blur-md border border-[#e3e8ef] rounded-3xl p-10 shadow-[0_12px_35px_rgba(36,51,79,0.08)]">
                <div
                  className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
                  style={{ borderColor: `${platformMeta.accent} transparent ${platformMeta.accent} ${platformMeta.accent}` }}
                />
                <h2 className="text-2xl font-black text-[#081126] tracking-tight mb-2">Locating Profile...</h2>
                <p className="text-sm text-[#556480] mb-6 max-w-sm mx-auto font-medium">
                  We are securely verifying the public account details on {platformMeta.name}.
                </p>
                <button
                  type="button"
                  onClick={cancelPolling}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#647088] hover:text-[#081126] underline transition cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Cancel search</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 4: PROFILE CONFIRMATION (REUSES REAL PREVIEWS & ACCENTS)
             ========================================================================= */}
          {flowStep === 'PREVIEW' && verifiedProfile && (
            <div className="w-full max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CONFIRM TARGET ACCOUNT</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#081126] tracking-tight mb-2">
                  Confirm Profile
                </h1>
                <p className="text-sm sm:text-base text-[#556480] font-medium">
                  Verify your public social profile details below.
                </p>
              </div>

              {/* Real Profile Preview Component */}
              <div className="mb-6 shadow-[0_16px_40px_rgba(36,51,79,0.12)] rounded-[24px] overflow-hidden border border-[#e3e8ef]">
                {targetPlatform === 'instagram' && (
                  <InstagramPreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />
                )}
                {targetPlatform === 'tiktok' && (
                  <TikTokPreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />
                )}
                {targetPlatform === 'twitter' && (
                  <TwitterPreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />
                )}
                {targetPlatform === 'youtube' && (
                  <YouTubePreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={confirmProfile}
                  disabled={isProfileRestricted}
                  className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer ${
                    isProfileRestricted
                      ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                      : 'text-white hover:scale-[1.01] hover:shadow-lg'
                  }`}
                  style={{
                    background: isProfileRestricted ? undefined : platformMeta.gradient,
                  }}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>{isProfileRestricted ? 'Make account public to continue' : 'Use this profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowStep('LOOKUP')}
                  className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-neutral-50 border border-[#e3e8ef] text-[#556480] hover:text-[#081126] font-extrabold text-sm transition-all cursor-pointer shadow-xs"
                >
                  Search another profile
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 5 & 6: PACKAGE SELECTION & FLOW25 FINAL CHECKOUT
             ========================================================================= */}
          {flowStep === 'PACKAGE' && (
            <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Section */}
              <div className="text-center mb-10 md:mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-[#E1306C] bg-pink-50 border border-pink-200 shadow-sm mb-4">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>REPEAT PURCHASE BENEFIT: 25% OFF</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#081126] tracking-tight leading-[1.08] mb-3">
                  <span>Select Your Next Boost</span>
                </h1>
                <p className="text-base sm:text-lg text-[#556480] max-w-xl mx-auto font-medium">
                  Choose the right growth tier for <strong className="text-[#081126]">@{verifiedProfile?.username}</strong> and apply coupon code <strong className="text-[#E1306C] font-mono">{offerData.couponCode}</strong> at checkout.
                </p>
                {timeLeft && (
                  <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                    <Clock size={14} className="text-emerald-600" />
                    <span>Offer expires in {timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Target Profile Horizontal Strip & Branded FLOW25 Coupon Card */}
              <div className="bg-white/95 backdrop-blur-md border border-[#e3e8ef] p-5 sm:p-7 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(36,51,79,0.06)]">
                {/* Profile Strip */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative">
                    <img
                      src={verifiedProfile?.avatar_url || '/placeholder-avatar.png'}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover bg-neutral-100 border-2 border-[#e3e8ef]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-xs border border-[#e3e8ef] flex items-center justify-center p-0.5">
                      <Image src={platformMeta.icon} alt="" width={12} height={12} className="object-contain" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#647088]">
                        Confirmed {platformMeta.name} Profile
                      </span>
                      <button
                        type="button"
                        onClick={() => setFlowStep('PREVIEW')}
                        className="text-xs font-bold text-[#1376ff] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-xl font-black text-[#081126]">@{verifiedProfile?.username}</p>
                  </div>
                </div>

                {/* Branded Coupon Chip */}
                <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] p-2 sm:p-3 rounded-2xl w-full md:w-auto justify-between md:justify-start">
                  <div className="px-3">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#647088] block">
                      PROMO COUPON
                    </span>
                    <span className="text-lg font-black tracking-wider text-[#081126] font-mono">
                      {offerData.couponCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCouponOnly}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#081126] hover:bg-[#15233d] text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'COPIED!' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              {/* Package Grid Reusing Real CloutFlow Public OfferCard Component */}
              <div
                className={`mb-12 ${
                  eligiblePackages.length === 1
                    ? 'flex justify-center max-w-md mx-auto'
                    : eligiblePackages.length === 2
                    ? 'grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'
                }`}
              >
                {eligiblePackages.map((pkg) => (
                  <div key={pkg.id} className={eligiblePackages.length === 1 ? 'w-full' : ''}>
                    <OfferCard
                      offer={{
                        id: pkg.id,
                        name: pkg.name,
                        slug: pkg.slug,
                        description: null,
                        quantity: pkg.quantity,
                        bonusQuantity: pkg.bonusQuantity,
                        priceCents: pkg.priceCents,
                        oldPriceCents: null,
                        currency: pkg.currency,
                        badge: pkg.badge || null,
                        isPopular: Boolean(pkg.isPopular),
                        sortOrder: 0,
                        ctaText: `Choose ${pkg.name}`,
                      }}
                      serviceUnit={copy.unitLabel}
                      theme={salesTheme}
                      hasTarget={true}
                      onCheckout={async (offerId) => {
                        await executeCheckout(offerId);
                      }}
                      onRequireTarget={() => setFlowStep('LOOKUP')}
                    />
                  </div>
                ))}
              </div>

              {checkoutError && (
                <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 text-center max-w-md mx-auto shadow-xs">
                  {checkoutError}
                </div>
              )}
            </div>
          )}

          {/* Real CloutFlow Public Trust Bar & Security Note */}
          {publicTrustBar}
          {publicSecurityNote}
        </div>
      </div>
    </main>
  );
}
