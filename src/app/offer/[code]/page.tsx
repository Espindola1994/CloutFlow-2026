
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/purity, react-hooks/set-state-in-effect, @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Check, ArrowRight, ShieldCheck, Zap, AlertCircle, Clock, Sparkles, Search, User, X, ChevronRight, ArrowLeft } from 'lucide-react';
import { InstagramPreview, TikTokPreview, TwitterPreview, YouTubePreview } from '@/components/social-preview';
import { CloutFlowShell } from '@/components/cloutflow/shell';

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
      <CloutFlowShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 font-medium">Validating promotional offer...</p>
        </div>
      </CloutFlowShell>
    );
  }

  if (errorMsg || isExpiredLocally || !offerData) {
    return (
      <CloutFlowShell>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="w-full max-w-md p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center flex flex-col items-center shadow-xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Offer Unavailable</h1>
            <p className="text-sm text-neutral-400 mb-6">
              This offer is no longer available or has already reached its expiration date.
            </p>
            <button type="button" onClick={() => router.push('/')} className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition">
              Explore CloutFlow Services
            </button>
          </div>
        </div>
      </CloutFlowShell>
    );
  }

  // Filter packages based on confirmed profile platform (if at PACKAGE step)
  const eligiblePackages = flowStep === 'PACKAGE' 
    ? offerData.packages.filter(p => p.platform.toLowerCase() === targetPlatform.toLowerCase())
    : [];

  return (
    <CloutFlowShell showMotto={false}>
      <div className="w-full max-w-lg mx-auto px-4 py-8 relative z-10">
        
        {/* Step 1: Prefill Prompt */}
        {flowStep === 'PREFILL' && offerData.previousTarget && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>25% OFF Repeat Purchase Voucher</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h1>
              <p className="text-neutral-400 text-sm">Boost the same profile again?</p>
              {timeLeft && (
                <p className="text-xs text-amber-400/90 font-medium mt-2 flex items-center justify-center gap-1">
                  <Clock size={12} /> Offer expires in {timeLeft}
                </p>
              )}
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800/80 mb-6">
                <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-500">
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">{offerData.previousTarget.platform}</p>
                  <p className="text-lg font-bold text-white truncate">@{offerData.previousTarget.username}</p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleStartLookup(offerData.previousTarget!.username, offerData.previousTarget!.platform)}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <Search className="w-4 h-4" />
                  <span>Find / Confirm Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlowStep('LOOKUP')}
                  className="w-full py-3.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition"
                >
                  Use another profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Lookup Input */}
        {flowStep === 'LOOKUP' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>25% OFF Repeat Purchase Voucher</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">Social Lookup</h1>
              <p className="text-neutral-400 text-sm">Which profile do you want to boost?</p>
              {timeLeft && (
                <p className="text-xs text-amber-400/90 font-medium mt-2 flex items-center justify-center gap-1">
                  <Clock size={12} /> Offer expires in {timeLeft}
                </p>
              )}
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="mb-5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {['instagram', 'tiktok', 'twitter', 'youtube'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setTargetPlatform(p)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold capitalize transition border ${targetPlatform === p ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'}`}
                    >
                      {p === 'twitter' ? 'X / Twitter' : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">Target Profile</label>
                <input
                  type="text"
                  placeholder="@username or profile link"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartLookup(lookupInput, targetPlatform)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition"
                />
                {lookupError && <p className="mt-2 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {lookupError}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleStartLookup(lookupInput, targetPlatform)}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Search Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Loading */}
        {flowStep === 'LOADING' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Locating Profile...</h2>
            <p className="text-sm text-neutral-400 mb-8 max-w-[250px] mx-auto">We are securely verifying the target account details.</p>
            <button onClick={cancelPolling} className="text-xs text-neutral-500 hover:text-white transition cursor-pointer">Cancel</button>
          </div>
        )}

        {/* Step 4: Preview */}
        {flowStep === 'PREVIEW' && verifiedProfile && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-[440px] mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-white mb-1">Confirm Profile</h1>
              <p className="text-neutral-400 text-sm">Is this the correct account?</p>
            </div>
            
            <div className="mb-6 shadow-2xl">
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
                className={`w-full py-4 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${isProfileRestricted ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200 shadow-white/10'}`}
              >
                <Check className="w-5 h-5" />
                <span>{isProfileRestricted ? `Make account public to continue` : `Use this profile`}</span>
              </button>
              <button
                type="button"
                onClick={() => setFlowStep('LOOKUP')}
                className="w-full py-3.5 px-4 rounded-xl bg-transparent border border-neutral-800 hover:bg-neutral-900 text-neutral-300 font-bold text-sm transition cursor-pointer"
              >
                Search another profile
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Package Selection & Coupon */}
        {flowStep === 'PACKAGE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>25% OFF Repeat Purchase Voucher</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                Your 25% Off is Ready
              </h1>
              {timeLeft && (
                <p className="text-xs text-amber-400/90 font-medium flex items-center justify-center gap-1">
                  <Clock size={12} /> Offer expires in {timeLeft}
                </p>
              )}
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl shadow-xl backdrop-blur-md mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 mb-6">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-1">
                    YOUR COUPON
                  </span>
                  <span className="text-2xl font-black tracking-widest text-indigo-400 font-mono">
                    {offerData.couponCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCouponOnly}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition border border-neutral-700 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-950/50 rounded-lg border border-neutral-800 mb-6">
                <img src={verifiedProfile?.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover bg-neutral-800" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400 font-semibold mb-0.5 capitalize">{targetPlatform} Target</p>
                  <p className="text-sm font-bold text-white truncate">@{verifiedProfile?.username}</p>
                </div>
                <button onClick={() => setFlowStep('PREVIEW')} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 cursor-pointer">Edit</button>
              </div>

              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-3">
                Choose Your Next Boost
              </label>
              
              {eligiblePackages.length === 0 ? (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-center text-sm text-neutral-400">
                  No eligible packages found for this platform.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  {eligiblePackages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    const priceUSD = (pkg.priceCents / 100).toFixed(2);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold">{pkg.name}</span>
                            {pkg.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400 capitalize">
                            {pkg.platform} • {pkg.service}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-sm font-bold text-white">${priceUSD}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">-25% with coupon</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {checkoutError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {checkoutError}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCopyAndContinue}
                disabled={checkoutSubmitting || eligiblePackages.length === 0}
                className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                <span>{checkoutSubmitting ? 'Preparing Checkout...' : `Copy ${offerData.couponCode} & Continue`}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-center text-neutral-400">
                Paste <strong className="text-white font-mono">{offerData.couponCode}</strong> in the coupon field at checkout to apply your 25% discount.
              </p>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[10px] text-neutral-500 font-medium">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure Checkout</span>
              <span className="flex items-center gap-1"><Zap size={12} /> Instant Delivery</span>
              <span className="flex items-center gap-1"><Check size={12} /> 25% Off Applied</span>
            </div>
          </div>
        )}

      </div>
    </CloutFlowShell>
  );
}
