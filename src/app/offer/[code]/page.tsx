'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Check, ArrowRight, ShieldCheck, Zap, AlertCircle, Clock, Sparkles } from 'lucide-react';

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
  packages: SanitizedPackage[];
}

export default function OfferLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Target info for social growth
  const [targetUsername, setTargetUsername] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Interaction feedback
  const [copied, setCopied] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Countdown timer calculation
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
        if (json.data.packages && json.data.packages.length > 0) {
          // Default select the first popular package or the first package
          const defaultPkg = json.data.packages.find((p: SanitizedPackage) => p.isPopular) || json.data.packages[0];
          setSelectedPackageId(defaultPkg.id);
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

  // Live countdown timer
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
    } catch {
      // Safe fallback - keep text visible
    }
  };

  const handleCopyAndContinue = async () => {
    if (!offerData || isExpiredLocally) return;

    // Copy coupon to clipboard first
    try {
      await navigator.clipboard.writeText(offerData.couponCode);
      setCopied(true);
    } catch {
      // Non-blocking clipboard fallback
    }

    // Determine target package
    const selectedPkg = offerData.packages.find(p => p.id === selectedPackageId) || offerData.packages[0];
    if (!selectedPkg) {
      setCheckoutError('Please select a package to continue.');
      return;
    }

    const platform = selectedPkg.platform.toLowerCase();
    const service = selectedPkg.service.toLowerCase();
    const isFollowers = service === 'followers';

    // Target validation
    const cleanUsername = targetUsername.replace(/^@+/, '').trim();
    if (isFollowers && !cleanUsername) {
      setCheckoutError('Please enter your social username.');
      return;
    }

    if (!isFollowers && !targetUrl.trim() && !cleanUsername) {
      setCheckoutError('Please enter your profile username or post URL.');
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutError(null);

    try {
      const targetType = isFollowers
        ? (platform === 'youtube' ? 'channel' : 'profile')
        : (targetUrl.trim() ? (platform === 'youtube' ? 'video' : 'post') : 'profile');

      const payload = {
        offerId: selectedPkg.id,
        targetType,
        targetValue: cleanUsername || targetUrl.trim(),
        targetUrl: targetUrl.trim() || null,
        socialUsername: cleanUsername || null,
        profileUrl: null,
        email: email.trim().toLowerCase() || null,
        offerCode: offerData.code,
      };

      const res = await fetch('/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success && json.data?.checkoutUrl) {
        // Redirect directly to the existing PerfectPay checkout URL with CFCTX token in src
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
      <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 font-medium">Validating promotional offer...</p>
        </div>
      </main>
    );
  }

  if (errorMsg || isExpiredLocally || !offerData) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-sans px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center flex flex-col items-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Offer Unavailable</h1>
          <p className="text-sm text-neutral-400 mb-6">
            This offer is no longer available or has already reached its expiration date.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition cursor-pointer"
          >
            Explore CloutFlow Services
          </button>
        </div>
      </main>
    );
  }

  const selectedPkg = offerData.packages.find(p => p.id === selectedPackageId) || offerData.packages[0];

  return (
    <main className="min-h-screen bg-[#070b14] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-20 blur-[130px] rounded-full z-0 bg-indigo-600"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative z-20 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-white">
            Clout<span className="text-indigo-400">Flow</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Exclusive Reward
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Returning Client</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>25% OFF Repeat Purchase Voucher</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Your 25% Off is Ready
          </h1>
          <p className="text-sm sm:text-base text-neutral-400">
            Save 25% on your next eligible order with your native PerfectPay coupon code below.
          </p>
        </div>

        {/* Coupon Card */}
        <div className="max-w-xl mx-auto bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 mb-8 backdrop-blur-md shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 mb-4">
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-1">
                YOUR PERFECTPAY COUPON
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-widest text-indigo-400 font-mono">
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

          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Expires: {offerData.formattedExpiresAt || 'Limited time'}</span>
            </div>
            {timeLeft && (
              <span className="font-mono font-semibold text-amber-400">
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Package Selection & Target Details */}
        <div className="max-w-xl mx-auto bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>1. Select Package & Enter Details</span>
          </h2>

          {/* Package Grid / List */}
          {offerData.packages.length > 0 && (
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-neutral-400 block mb-1.5">
                Eligible Growth Packages:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {offerData.packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  const priceUSD = (pkg.priceCents / 100).toFixed(2);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{pkg.name}</span>
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
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">${priceUSD}</span>
                        <span className="text-[10px] text-indigo-400 block font-semibold">-25% with coupon</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">
                Target Username or Post URL <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                placeholder={selectedPkg?.service === 'followers' ? 'e.g. @yourprofile' : 'e.g. https://... or @username'}
                value={targetUsername || targetUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('http')) {
                    setTargetUrl(val);
                    setTargetUsername('');
                  } else {
                    setTargetUsername(val);
                    setTargetUrl('');
                  }
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">
                Contact Email <span className="text-neutral-500 font-normal">(for tracking & receipt)</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {checkoutError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {checkoutError}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <div className="max-w-xl mx-auto text-center space-y-3">
          <button
            type="button"
            onClick={handleCopyAndContinue}
            disabled={checkoutSubmitting}
            className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            <span>{checkoutSubmitting ? 'Preparing Checkout...' : `Copy ${offerData.couponCode} & Continue`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Paste <strong className="text-white font-mono">{offerData.couponCode}</strong> in the coupon field at checkout to apply your 25% discount.
          </p>
        </div>
      </div>
    </main>
  );
}
