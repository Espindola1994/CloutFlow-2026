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
  CheckCircle2,
  LockKeyhole,
  Headphones,
  RotateCcw,
  Tag,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import instagramIcon from '@/assets/home-icons-vector/instagram.svg';
import tiktokIcon from '@/assets/home-icons-vector/tiktok.svg';
import twitterIcon from '@/assets/home-icons-vector/twitter.svg';
import youtubeIcon from '@/assets/home-icons-vector/youtube.svg';

import { InstagramPreview, TikTokPreview, TwitterPreview, YouTubePreview } from '@/components/social-preview';

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

type FlowStep = 'PREFILL' | 'LOOKUP' | 'LOADING' | 'PREVIEW' | 'PACKAGE' | 'REVIEW';

type PlatformKey = 'instagram' | 'tiktok' | 'twitter' | 'youtube';

interface PlatformMetaConfig {
  key: PlatformKey;
  name: string;
  label: string;
  icon: any;
  accent: string;
  accentSubtle: string;
  tagColor: string;
}

const PLATFORM_CONFIGS: Record<PlatformKey, PlatformMetaConfig> = {
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    label: 'Instagram',
    icon: instagramIcon,
    accent: '#E1306C',
    accentSubtle: '#FDF2F7',
    tagColor: '#C13584',
  },
  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    label: 'TikTok',
    icon: tiktokIcon,
    accent: '#FE2C55',
    accentSubtle: '#F0FDFA',
    tagColor: '#00F2FE',
  },
  twitter: {
    key: 'twitter',
    name: 'X / Twitter',
    label: 'X / Twitter',
    icon: twitterIcon,
    accent: '#0F1419',
    accentSubtle: '#F8FAFC',
    tagColor: '#334155',
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    label: 'YouTube',
    icon: youtubeIcon,
    accent: '#FF0000',
    accentSubtle: '#FEF2F2',
    tagColor: '#DC2626',
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

  const platformMeta = PLATFORM_CONFIGS[targetPlatform] || PLATFORM_CONFIGS.instagram;

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

  const stepsList = [
    { num: 1, label: 'Profile' },
    { num: 2, label: 'Confirm' },
    { num: 3, label: 'Package' },
    { num: 4, label: 'Checkout' },
  ];

  // 2D Compact Header
  const renderHeader = () => (
    <div className="w-full bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 text-[#0F172A] font-extrabold text-[18px] tracking-tight hover:opacity-90 transition">
          <span>Clout</span>
          <span className="text-[#1376FF]">Flow</span>
          <ArrowUpRight className="w-4 h-4 text-[#1376FF] -mt-2 -ml-0.5 stroke-[2.5]" />
        </Link>

        {/* Right Info Pill */}
        <div className="flex items-center gap-3">
          {timeLeft && !isExpiredLocally && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
              <Clock className="w-3.5 h-3.5 text-[#1376FF]" />
              <span>Expires: <strong className="text-[#0F172A] font-mono">{timeLeft}</strong></span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[12px] font-bold text-[#1D4ED8]">
            <Tag className="w-3.5 h-3.5" />
            <span>Repeat Purchase · 25% Off</span>
          </div>
        </div>
      </div>

      {/* Discrete 2D Stepper */}
      <div className="border-t border-[#F1F5F9] bg-[#FAFAFA]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between sm:justify-center sm:gap-8 text-[12px]">
          {stepsList.map((st, idx) => {
            const isCompleted = currentStepNum > st.num;
            const isCurrent = currentStepNum === st.num;

            return (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                      isCompleted
                        ? 'bg-[#10B981] text-white'
                        : isCurrent
                        ? 'text-white'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? platformMeta.accent : isCompleted ? '#10B981' : undefined,
                    }}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                  </div>
                  <span
                    className={`font-semibold ${
                      isCurrent
                        ? 'text-[#0F172A]'
                        : isCompleted
                        ? 'text-[#475569]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    <span className="hidden sm:inline">0{st.num} </span>
                    {st.label}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className="w-6 sm:w-12 h-[1px] bg-[#E2E8F0]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 2D Compact Trust Footer
  const renderTrustBar = () => (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-[#E2E8F0]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px] text-[#64748B]">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="font-semibold text-[#334155]">100% Safe & Secure</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <LockKeyhole className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="font-semibold text-[#334155]">No Password Required</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <Zap className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="font-semibold text-[#334155]">Fast Order Delivery</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <Headphones className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="font-semibold text-[#334155]">24/7 Order Support</span>
        </div>
      </div>
    </div>
  );

  // LOADING STATE
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[480px] bg-white border border-[#E2E8F0] rounded-xl p-8 text-center shadow-xs">
            <div className="w-8 h-8 border-2 border-[#1376FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <h2 className="text-[18px] font-bold text-[#0F172A]">Validating Offer</h2>
            <p className="text-[13px] text-[#64748B] mt-1">Retrieving your verified 25% repeat purchase discount...</p>
          </div>
        </div>
        {renderTrustBar()}
      </main>
    );
  }

  // EXPIRED OR INVALID STATE
  if (errorMsg || isExpiredLocally || !offerData) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[520px] bg-white border border-[#E2E8F0] rounded-xl p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center text-[#DC2626] mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-[24px] font-bold text-[#0F172A] tracking-tight">Offer Unavailable</h1>
            <p className="text-[14px] text-[#64748B] mt-2 mb-6">
              This repeat-purchase offer is no longer active or has already reached its expiration date.
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-[13px] transition cursor-pointer"
            >
              <span>Explore CloutFlow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {renderTrustBar()}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
      {renderHeader()}

      <div className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 py-8">
        {/* =========================================================================
            SCREEN 1: WELCOME BACK (COMPACT 2D COMPOSITION)
           ========================================================================= */}
        {flowStep === 'PREFILL' && offerData.previousTarget && (
          <div className="w-full max-w-[760px] mx-auto">
            {/* Header section */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E1306C] bg-[#FFF0F5] px-2.5 py-0.5 rounded-md border border-[#FCE7F3]">
                  25% OFF Repeat Purchase
                </span>
                {timeLeft && (
                  <span className="text-[12px] font-medium text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                    Expires in <strong className="text-[#0F172A] font-mono">{timeLeft}</strong>
                  </span>
                )}
              </div>
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#0F172A] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-[14px] text-[#64748B] mt-1 font-medium">
                Ready for another boost?
              </p>
              <p className="text-[13px] text-[#64748B] font-medium mt-0.5">
                Boost the same profile again?
              </p>
            </div>

            {/* Horizontal 2D Profile Panel */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#F1F5F9]">
                {/* Left Profile Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center p-0.5 shadow-xs">
                      <Image src={platformMeta.icon} alt="" width={12} height={12} className="object-contain" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
                        {offerData.previousTarget.platform} Profile
                      </span>
                      <span className="text-[10px] bg-[#F1F5F9] text-[#475569] font-semibold px-1.5 py-0.5 rounded">
                        Last Used
                      </span>
                    </div>
                    <p className="text-[18px] sm:text-[20px] font-bold text-[#0F172A]">
                      @{offerData.previousTarget.username}
                    </p>
                  </div>
                </div>

                {/* Confirm Profile Action */}
                <button
                  type="button"
                  onClick={() => handleStartLookup(offerData.previousTarget!.username, offerData.previousTarget!.platform)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-bold text-[13px] transition cursor-pointer hover:opacity-95 shadow-xs shrink-0"
                  style={{ backgroundColor: platformMeta.accent }}
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Find / Confirm Profile</span>
                </button>
              </div>

              {/* Bottom secondary action */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-[12px] text-[#64748B]">Want to boost a different account?</span>
                <button
                  type="button"
                  onClick={() => setFlowStep('LOOKUP')}
                  className="text-[12px] font-bold text-[#0F172A] hover:text-[#1376FF] transition cursor-pointer underline"
                >
                  Use another profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: SOCIAL LOOKUP (COMPACT 2D PANEL)
           ========================================================================= */}
        {flowStep === 'LOOKUP' && (
          <div className="w-full max-w-[660px] mx-auto">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E1306C] bg-[#FFF0F5] px-2.5 py-0.5 rounded-md border border-[#FCE7F3]">
                Step 01
              </span>
              <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[#0F172A] tracking-tight mt-1">
                Social Lookup
              </h1>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                Choose your platform and enter your username or public link.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs">
              {/* Segmented Platform Selector */}
              <div className="mb-5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block mb-2">
                  Social Network
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['instagram', 'tiktok', 'twitter', 'youtube'] as const).map((p) => {
                    const isSelected = targetPlatform === p;
                    const pConfig = PLATFORM_CONFIGS[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTargetPlatform(p)}
                        className={`py-2 px-3 rounded-lg text-[12px] font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                          isSelected
                            ? 'bg-white text-[#0F172A] border-2 shadow-xs'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#0F172A]'
                        }`}
                        style={{
                          borderColor: isSelected ? pConfig.accent : undefined,
                        }}
                      >
                        <Image src={pConfig.icon} alt="" width={16} height={16} className="object-contain" />
                        <span className="capitalize">{p === 'twitter' ? 'X / Twitter' : p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Username Input Field */}
              <div className="mb-5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block mb-2">
                  Profile username or URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="@username or profile link"
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartLookup(lookupInput, targetPlatform)}
                    className="w-full bg-[#FAFAFA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#1376FF] focus:ring-1 focus:ring-[#1376FF] transition font-medium"
                  />
                </div>
                {lookupError && (
                  <p className="mt-2 text-[12px] text-[#DC2626] flex items-center gap-1.5 font-semibold">
                    <AlertCircle size={14} /> {lookupError}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStartLookup(lookupInput, targetPlatform)}
                  className="w-full sm:w-auto flex-1 py-2.5 px-5 rounded-lg text-white font-bold text-[13px] flex items-center justify-center gap-2 transition cursor-pointer hover:opacity-95 shadow-xs"
                  style={{ backgroundColor: platformMeta.accent }}
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Locate Profile</span>
                </button>
                {offerData.previousTarget && (
                  <button
                    type="button"
                    onClick={() => setFlowStep('PREFILL')}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] font-bold text-[13px] hover:bg-white hover:text-[#0F172A] transition cursor-pointer"
                  >
                    Back to previous
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: COMPACT 2D LOADING
           ========================================================================= */}
        {flowStep === 'LOADING' && (
          <div className="w-full max-w-[560px] mx-auto py-8">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-7 text-center shadow-xs">
              <div
                className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: `${platformMeta.accent} transparent ${platformMeta.accent} ${platformMeta.accent}` }}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded">
                {platformMeta.name}
              </span>
              <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight mt-2 mb-1">
                Locating Profile...
              </h2>
              <p className="text-[13px] text-[#64748B] mb-5 max-w-sm mx-auto">
                Checking public account information. Please wait a moment...
              </p>
              <button
                type="button"
                onClick={cancelPolling}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Cancel search</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 4: CONFIRM PROFILE (REAL PREVIEWS INSIDE WIZARD)
           ========================================================================= */}
        {flowStep === 'PREVIEW' && verifiedProfile && (
          <div className="w-full max-w-[620px] mx-auto">
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] bg-[#ECFDF5] px-2.5 py-0.5 rounded-md border border-[#A7F3D0]">
                Step 02 · Confirm Profile
              </span>
              <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#0F172A] tracking-tight mt-1">
                Confirm Profile
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Ensure this is the correct public account you want to boost.
              </p>
            </div>

            {/* Real Social Preview Component Container */}
            <div className="mb-5 rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs">
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

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={confirmProfile}
                disabled={isProfileRestricted}
                className={`w-full sm:w-auto flex-1 py-2.5 px-5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                  isProfileRestricted
                    ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                    : 'text-white hover:opacity-95'
                }`}
                style={{
                  backgroundColor: isProfileRestricted ? undefined : platformMeta.accent,
                }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isProfileRestricted ? 'Make account public to continue' : 'Use this profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFlowStep('LOOKUP')}
                className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] font-bold text-[13px] transition cursor-pointer"
              >
                Search another profile
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 5: PACKAGE SELECTION (2D COMPACT CARDS & BAR)
           ========================================================================= */}
        {flowStep === 'PACKAGE' && (
          <div className="w-full max-w-[1080px] mx-auto">
            {/* Top Bar: Step + Compact Profile + Coupon */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Profile Info */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={verifiedProfile?.avatar_url || '/placeholder-avatar.png'}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover bg-[#F1F5F9] border border-[#E2E8F0]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center p-0.5">
                      <Image src={platformMeta.icon} alt="" width={10} height={10} className="object-contain" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        {platformMeta.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFlowStep('PREVIEW')}
                        className="text-[11px] font-semibold text-[#1376FF] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-[15px] font-bold text-[#0F172A]">@{verifiedProfile?.username}</p>
                  </div>
                </div>

                {/* Right Compact Coupon Banner */}
                <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                      25% OFF
                    </span>
                    <span className="font-mono text-[14px] font-extrabold text-[#0F172A] tracking-wide">
                      {offerData.couponCode}
                    </span>
                    {timeLeft && (
                      <span className="text-[11px] text-[#64748B] hidden sm:inline">
                        · expires in <strong className="font-mono text-[#0F172A]">{timeLeft}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCouponOnly}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-bold transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1376FF] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
                Step 03 · Available Packages
              </span>
              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight mt-1">
                Select Your Next Boost
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Choose your package tier. The 25% discount coupon ({offerData.couponCode}) will be ready for checkout.
              </p>
            </div>

            {/* 2D Package Grid (3 per row or 2 per row) */}
            <div
              className={`grid gap-4 mb-6 ${
                eligiblePackages.length === 1
                  ? 'grid-cols-1 max-w-[420px] mx-auto'
                  : eligiblePackages.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-[760px] mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {eligiblePackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const price = (pkg.priceCents / 100).toFixed(2);
                const isPopular = Boolean(pkg.isPopular || pkg.badge);

                return (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-xl border transition-all flex flex-col justify-between p-5 relative ${
                      isSelected
                        ? 'border-2 shadow-sm'
                        : isPopular
                        ? 'border-[#CBD5E1] shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                    style={{
                      borderColor: isSelected ? platformMeta.accent : undefined,
                    }}
                  >
                    {/* Badge */}
                    {isPopular && (
                      <div className="absolute -top-2.5 right-4">
                        <span
                          className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-white"
                          style={{ backgroundColor: platformMeta.accent }}
                        >
                          {pkg.badge || 'POPULAR'}
                        </span>
                      </div>
                    )}

                    <div>
                      {/* Title & Service */}
                      <div className="mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                          {pkg.name}
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">
                            {pkg.quantity.toLocaleString()}
                          </span>
                          <span className="text-[13px] font-semibold text-[#64748B] uppercase">
                            {pkg.service}
                          </span>
                        </div>
                        {pkg.bonusQuantity > 0 && (
                          <span className="inline-block text-[11px] font-bold text-[#10B981] mt-0.5">
                            +{pkg.bonusQuantity.toLocaleString()} Extra Bonus
                          </span>
                        )}
                      </div>

                      {/* Price 2D */}
                      <div className="py-2.5 px-3 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] mb-4 flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">
                            ${price}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-medium">USD</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                          25% OFF COUPON
                        </span>
                      </div>

                      {/* Benefits list */}
                      <ul className="space-y-2 text-[12px] text-[#475569] mb-5">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                          <span>No password required</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                          <span>Fast delivery & high retention</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 stroke-[3]" />
                          <span>24/7 dedicated support</span>
                        </li>
                      </ul>
                    </div>

                    {/* Select / Review CTA */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setFlowStep('REVIEW');
                      }}
                      className={`w-full py-2.5 px-4 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'text-white'
                          : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
                      }`}
                      style={{
                        backgroundColor: isSelected ? platformMeta.accent : undefined,
                      }}
                    >
                      <span>Select Package</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 6: FINAL REVIEW (2D COMPACT ORDER SUMMARY)
           ========================================================================= */}
        {flowStep === 'REVIEW' && selectedPkg && (
          <div className="w-full max-w-[620px] mx-auto">
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1376FF] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
                Step 04 · Review & Checkout
              </span>
              <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#0F172A] tracking-tight mt-1">
                Review your order
              </h1>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Confirm your target profile and package details before continuing to secure checkout.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 mb-5 shadow-xs space-y-4">
              {/* Profile Row */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Target Account
                  </span>
                  <p className="text-[15px] font-bold text-[#0F172A] mt-0.5">
                    @{verifiedProfile?.username}
                  </p>
                  <span className="text-[11px] text-[#64748B] capitalize">
                    {platformMeta.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlowStep('PREVIEW')}
                  className="text-[12px] font-semibold text-[#1376FF] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Package Row */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Selected Package
                  </span>
                  <p className="text-[15px] font-bold text-[#0F172A] mt-0.5">
                    {selectedPkg.name}
                  </p>
                  <span className="text-[12px] font-semibold text-[#0F172A]">
                    ${(selectedPkg.priceCents / 100).toFixed(2)} USD
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlowStep('PACKAGE')}
                  className="text-[12px] font-semibold text-[#1376FF] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Discount Row */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Repeat Purchase Discount
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[14px] font-extrabold text-[#0F172A]">
                      {offerData.couponCode}
                    </span>
                    <span className="text-[11px] font-bold text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                      25% OFF
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCouponOnly}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[11px] font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>

              {/* Checkout CTA */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => executeCheckout(selectedPkg.id)}
                  disabled={checkoutSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg text-white font-extrabold text-[14px] flex items-center justify-center gap-2 transition cursor-pointer hover:opacity-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: platformMeta.accent }}
                >
                  {checkoutSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Secure Checkout</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#64748B] text-center mt-2.5">
                  You will enter <strong className="font-mono text-[#0F172A]">{offerData.couponCode}</strong> in the coupon field at checkout for 25% discount.
                </p>
              </div>

              {checkoutError && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-[12px] font-bold text-[#DC2626] text-center">
                  {checkoutError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {renderTrustBar()}
    </main>
  );
}
