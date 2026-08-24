
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/purity, react-hooks/set-state-in-effect, @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Check, ArrowRight, ShieldCheck, Zap, AlertCircle, Clock, Sparkles, Search, User, ChevronRight, LockKeyhole, Headphones } from 'lucide-react';
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
  const [targetPlatform, setTargetPlatform] = useState<string>('instagram');
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
          setTargetPlatform(json.data.previousTarget.platform);
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
      const res = await fetch("/api/search/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputStr.trim(), selectedPlatform: platform }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data && data.resolvedType === "profile") {
        checkRestrictionAndSetProfile(data.data, platform);
        return;
      }

      if (res.ok && data.success && data.status === "pending" && data.requestId) {
        let currentRequestId = data.requestId;
        const startTime = Date.now();
        const maxPollDuration = 45000;

        while (pollingRef.current.active && Date.now() - startTime < maxPollDuration) {
          await new Promise((r) => setTimeout(r, 2500));
          if (!pollingRef.current.active) break;

          const statusRes = await fetch(`/api/search/status?requestId=${encodeURIComponent(currentRequestId)}`);
          const statusJson = await statusRes.json().catch(() => null);

          if (!statusJson) continue;
          if (statusJson.status === "pending" && statusJson.requestId) {
            currentRequestId = statusJson.requestId;
          }
          if (statusJson.status === "complete" && statusJson.data) {
            checkRestrictionAndSetProfile(statusJson.data, platform);
            return;
          }
          if (statusJson.status === "failed") {
            setLookupError(statusJson.message || "We couldn't find this profile. Check the @ or link and try again.");
            setFlowStep('LOOKUP');
            return;
          }
        }
        if (pollingRef.current.active) {
          setLookupError("The search is taking longer than expected. Please try again.");
          setFlowStep('LOOKUP');
        }
        return;
      }

      setLookupError(data.message || "We couldn't find this profile. Check the @ or link and try again.");
      setFlowStep('LOOKUP');
    } catch {
      setLookupError("The search is taking longer than expected. Please try again.");
      setFlowStep('LOOKUP');
    }
  };

  const checkRestrictionAndSetProfile = (profile: any, platform: string) => {
    let restricted = false;
    if (profile.platform === "instagram" && profile.is_private) restricted = true;
    if (profile.platform === "tiktok" && (profile.is_private || profile.private_account || profile.privateAccount)) restricted = true;
    if (profile.platform === "twitter" && (profile.is_protected || profile.protected)) restricted = true;
    if (profile.platform === "youtube" && (profile.is_private || profile.is_hidden)) restricted = true;
    
    setIsProfileRestricted(restricted);
    setVerifiedProfile(profile);
    setTargetPlatform(platform);
    setFlowStep('PREVIEW');
  };

  const cancelPolling = () => {
    pollingRef.current.active = false;
    setFlowStep('LOOKUP');
  };

  const confirmProfile = () => {
    if (isProfileRestricted || !offerData) return;
    const eligible = offerData.packages.filter(p => p.platform.toLowerCase() === targetPlatform.toLowerCase());
    const match = eligible.find(p => p.id === selectedPackageId) || eligible.find(p => p.isPopular) || eligible[0];
    if (match) {
      setSelectedPackageId(match.id);
    }
    setFlowStep('PACKAGE');
  };

  const handleCopyAndContinue = async () => {
    if (!offerData || isExpiredLocally || !verifiedProfile) return;
    try {
      await navigator.clipboard.writeText(offerData.couponCode);
      setCopied(true);
    } catch {}

    const eligiblePackages = offerData.packages.filter(p => p.platform.toLowerCase() === targetPlatform.toLowerCase());
    const selectedPkg = eligiblePackages.find(p => p.id === selectedPackageId) || eligiblePackages[0];
    if (!selectedPkg) {
      setCheckoutError('Please select a package to continue.');
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutError(null);

    // Revalidate offer client-side just in case
    try {
      const revRes = await fetch(`/api/offers/${encodeURIComponent(code)}`);
      if (!revRes.ok) {
        setCheckoutError("This offer is no longer available.");
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
        offerId: selectedPkg.id,
        targetType,
        targetValue: normalizedUsername,
        targetUrl: verifiedProfile.profile_url || null,
        socialUsername: normalizedUsername,
        profileUrl: verifiedProfile.profile_url || null,
        email: null, // Rely on server to associate customerEmail securely
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Validating promotional offer...</p>
      </main>
    );
  }

  if (errorMsg || isExpiredLocally || !offerData) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#0c101a]/90 border border-neutral-800 text-center flex flex-col items-center shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Offer Unavailable</h1>
          <p className="text-sm text-neutral-400 mb-8 font-medium">
            This offer is no longer available or has already reached its expiration date.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-4 px-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-neutral-200 transition cursor-pointer shadow-lg shadow-white/10"
          >
            Explore CloutFlow Services
          </button>
        </div>
      </main>
    );
  }

  // Filter packages based on confirmed profile platform (if at PACKAGE step)
  const eligiblePackages = flowStep === 'PACKAGE' 
    ? offerData.packages.filter(p => p.platform.toLowerCase() === targetPlatform.toLowerCase())
    : [];

  const platformKey = (targetPlatform || 'instagram').toLowerCase() as Platform;
  const platformIsValid = ["instagram", "tiktok", "twitter", "youtube"].includes(platformKey);
  const safePlatform = platformIsValid ? platformKey : 'instagram';
  const theme = PLATFORM_THEMES[safePlatform];
  
  // Extract correct unitLabel based on the first package service, or default to Followers
  const serviceKey = (eligiblePackages[0]?.service.toLowerCase() || 'followers') as 'followers' | 'likes' | 'views' | 'comments';
  const serviceIsValid = ["followers", "likes", "views", "comments"].includes(serviceKey);
  const safeService = serviceIsValid ? serviceKey : 'followers';
  const copy = SERVICE_COPY_MAP[safeService]?.[safePlatform] || SERVICE_COPY_MAP.followers.instagram;

  return (
    <main className="min-h-screen bg-[#070b14] text-white selection:bg-pink-500 selection:text-white relative overflow-x-hidden font-sans pb-24">
      {/* Dynamic Ambient Platform Glow in Background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] pointer-events-none opacity-25 blur-[140px] rounded-full z-0 transition-colors duration-1000"
        style={{ background: theme.ambientGlow }}
        aria-hidden="true"
      />

      {/* Top Header / Navigation (Matching Public Site) */}
      <header className="w-full max-w-6xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between relative z-20 border-b border-neutral-800/60 mb-8 md:mb-12">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-lg sm:text-xl font-black tracking-tight text-white cursor-pointer"
        >
          <span>Clout</span>
          <span style={{ color: theme.primary }} className="transition-colors duration-500">Flow</span>
          <sup className="text-[10px] ml-0.5 text-blue-400 font-bold">↗</sup>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Repeat Purchase</span>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
        
        {/* Step 1: Prefill Prompt */}
        {flowStep === 'PREFILL' && offerData.previousTarget && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto mt-12 md:mt-24">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>25% OFF REPEAT PURCHASE</span>
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-[1.1]">
                Welcome Back
              </h1>
              <p className="text-lg sm:text-xl text-neutral-400 font-medium">Boost the same profile again?</p>
              {timeLeft && (
                <p className="text-sm text-emerald-400/90 font-bold mt-4 flex items-center justify-center gap-1">
                  <Clock size={16} /> Offer expires in {timeLeft}
                </p>
              )}
            </div>
            <div className="bg-[#0c101a]/90 border border-neutral-800/80 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-md">
              <div className="flex flex-col items-center justify-center gap-4 mb-8">
                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-500 shadow-inner">
                  <User size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest mb-1">{offerData.previousTarget.platform}</p>
                  <p className="text-2xl font-black text-white truncate">@{offerData.previousTarget.username}</p>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleStartLookup(offerData.previousTarget!.username, offerData.previousTarget!.platform)}
                  className="w-full py-4 px-4 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-lg hover:scale-[1.02]"
                  style={{ background: theme.gradient }}
                >
                  <Search className="w-5 h-5" />
                  <span>Find / Confirm Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlowStep('LOOKUP')}
                  className="w-full py-4 px-4 rounded-xl bg-[#1a2233] hover:bg-neutral-800 text-white font-extrabold text-sm sm:text-base transition cursor-pointer"
                >
                  Use another profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Lookup Input */}
        {flowStep === 'LOOKUP' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto mt-8 md:mt-16">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>25% OFF REPEAT PURCHASE</span>
              </span>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-[1.1]">
                Social Lookup
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 font-medium">Which social profile would you like to boost?</p>
              {timeLeft && (
                <p className="text-sm text-emerald-400/90 font-bold mt-4 flex items-center justify-center gap-1">
                  <Clock size={16} /> Offer expires in {timeLeft}
                </p>
              )}
            </div>
            <div className="bg-[#0c101a]/90 border border-neutral-800/80 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-md">
              <div className="mb-6">
                <label className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest block mb-3">Platform</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['instagram', 'tiktok', 'twitter', 'youtube'] as const).map((p) => {
                    const isSelected = targetPlatform === p;
                    const pTheme = PLATFORM_THEMES[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTargetPlatform(p)}
                        className={`py-3 px-3 rounded-xl text-xs font-black capitalize transition-all border cursor-pointer ${
                          isSelected 
                            ? 'text-white shadow-lg' 
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                        }`}
                        style={{
                          background: isSelected ? pTheme.gradient : undefined,
                          borderColor: isSelected ? pTheme.primary : undefined,
                        }}
                      >
                        {p === 'twitter' ? 'X / Twitter' : p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mb-6">
                <label className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest block mb-3">Target Profile</label>
                <input
                  type="text"
                  placeholder="@username or profile link"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartLookup(lookupInput, targetPlatform)}
                  className="w-full bg-[#070b14] border border-neutral-800 rounded-xl px-4 py-4 text-base text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition shadow-inner font-medium"
                />
                {lookupError && <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5 font-bold"><AlertCircle size={14} /> {lookupError}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleStartLookup(lookupInput, targetPlatform)}
                className="w-full py-4 px-4 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-lg hover:scale-[1.02]"
                style={{ background: theme.gradient }}
              >
                <span>Locate Profile</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Loading */}
        {flowStep === 'LOADING' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-24 max-w-lg mx-auto">
            <div
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              style={{ borderColor: `${theme.primary} transparent ${theme.primary} ${theme.primary}` }}
            />
            <h2 className="text-2xl font-black text-white mb-2">Locating Profile...</h2>
            <p className="text-sm text-neutral-400 mb-8 max-w-[280px] mx-auto font-medium">We are securely verifying the target account details on {theme.name}.</p>
            <button onClick={cancelPolling} className="text-xs font-bold text-neutral-500 hover:text-white transition cursor-pointer">Cancel search</button>
          </div>
        )}

        {/* Step 4: Preview */}
        {flowStep === 'PREVIEW' && verifiedProfile && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-[480px] mx-auto mt-8 md:mt-16">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CONFIRM TARGET ACCOUNT</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 leading-[1.1]">
                Confirm Profile
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 font-medium">Verify your public social profile details below.</p>
            </div>
            
            <div className="mb-6 shadow-2xl rounded-3xl overflow-hidden border border-neutral-800">
              {targetPlatform === 'instagram' && <InstagramPreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />}
              {targetPlatform === 'tiktok' && <TikTokPreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />}
              {targetPlatform === 'twitter' && <TwitterPreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />}
              {targetPlatform === 'youtube' && <YouTubePreview profile={verifiedProfile} onClose={() => setFlowStep('LOOKUP')} />}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={confirmProfile}
                disabled={isProfileRestricted}
                className={`w-full py-4 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                  isProfileRestricted ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200 shadow-white/10 hover:scale-[1.02]'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{isProfileRestricted ? `Make account public to continue` : `Use this profile`}</span>
              </button>
              <button
                type="button"
                onClick={() => setFlowStep('LOOKUP')}
                className="w-full py-4 px-4 rounded-xl bg-transparent border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white font-extrabold text-sm transition cursor-pointer"
              >
                Search another profile
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Package Selection & Coupon */}
        {flowStep === 'PACKAGE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            
            {/* Header Section */}
            <div className="text-center mb-10 md:mb-14">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>REPEAT PURCHASE BENEFIT: 25% OFF</span>
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-[1.1]">
                Select Your Next Boost
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto font-medium">
                Choose the right growth tier for <span className="text-white font-bold">@{verifiedProfile?.username}</span> and apply coupon code <span className="text-white font-mono font-bold">{offerData.couponCode}</span> at checkout.
              </p>
              {timeLeft && (
                <p className="text-sm text-emerald-400 font-bold mt-4 flex items-center justify-center gap-1.5">
                  <Clock size={16} /> Offer expires in {timeLeft}
                </p>
              )}
            </div>

            {/* Target Account Summary Banner & Coupon Pill */}
            <div className="bg-[#0c101a]/90 border border-neutral-800/80 p-4 sm:p-6 rounded-3xl mb-10 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-4">
                <img
                  src={verifiedProfile?.avatar_url || '/placeholder-avatar.png'}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover bg-neutral-900 border-2 border-neutral-800"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
                      {targetPlatform} Target
                    </span>
                    <button
                      onClick={() => setFlowStep('PREVIEW')}
                      className="text-xs font-bold text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-white">@{verifiedProfile?.username}</p>
                </div>
              </div>

              {/* Coupon Action Box */}
              <div className="flex items-center gap-3 bg-[#070b14] border border-neutral-800 p-2 sm:p-3 rounded-2xl">
                <div className="px-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-neutral-400 block">
                    COUPON CODE
                  </span>
                  <span className="text-lg font-black tracking-wider text-white font-mono">
                    {offerData.couponCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCouponOnly}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-extrabold transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
              </div>
            </div>

            {/* Public Package Grid Reusing CloutFlow Public OfferCard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
              {eligiblePackages.map((pkg) => (
                <OfferCard
                  key={pkg.id}
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
                  theme={theme}
                  hasTarget={true}
                  onCheckout={async (offerId) => {
                    setSelectedPackageId(offerId);
                    // trigger checkout
                    setCheckoutSubmitting(true);
                    setCheckoutError(null);

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
                  }}
                  onRequireTarget={() => setFlowStep('LOOKUP')}
                />
              ))}
            </div>

            {checkoutError && (
              <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 text-center max-w-md mx-auto">
                {checkoutError}
              </div>
            )}

            {/* Native CloutFlow Trust Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-neutral-800/80 text-neutral-400 text-xs font-bold text-center">
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0c101a]/50 border border-neutral-800/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Safe & Secure</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0c101a]/50 border border-neutral-800/60">
                <LockKeyhole className="w-4 h-4 text-emerald-400" />
                <span>No Password Required</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0c101a]/50 border border-neutral-800/60">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0c101a]/50 border border-neutral-800/60">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>24/7 Support</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
