"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import ProfileLookupModal from "@/components/profile-lookup-modal";
import {
  PLATFORM_THEMES,
  SERVICE_COPY_MAP,
  Platform,
  Service,
} from "@/config/service-sales.config";
import { ServiceHero } from "@/components/sales/ServiceHero";
import { TrustStrip } from "@/components/sales/TrustStrip";
import { OfferGrid } from "@/components/sales/OfferGrid";
import { PublicOfferItem } from "@/components/sales/OfferCard";
import { GrowthProjection } from "@/components/sales/GrowthProjection";
import { BenefitsSection } from "@/components/sales/BenefitsSection";
import { HowItWorks } from "@/components/sales/HowItWorks";
import { PlanGuide } from "@/components/sales/PlanGuide";
import { ConfidenceSection } from "@/components/sales/ConfidenceSection";
import { ServiceFAQ } from "@/components/sales/ServiceFAQ";
import { FinalCTA } from "@/components/sales/FinalCTA";

export default function ServiceSalesLandingPage() {
  const router = useRouter();
  const params = useParams() as { platform?: string; service?: string };

  const rawPlatform = (params.platform || "instagram").toLowerCase();
  const rawService = (params.service || "followers").toLowerCase();

  const platformIsValid = ["instagram", "tiktok", "twitter", "youtube"].includes(rawPlatform);
  const serviceIsValid = ["followers", "likes", "views", "comments"].includes(rawService);

  const platform = (platformIsValid ? rawPlatform : "instagram") as Platform;
  const service = (serviceIsValid ? rawService : "followers") as Service;

  const theme = PLATFORM_THEMES[platform] || PLATFORM_THEMES.instagram;
  const copy = SERVICE_COPY_MAP[service]?.[platform] || SERVICE_COPY_MAP.followers.instagram;

  // Funnel Store Target & Configuration State
  const {
    targetType,
    targetValue,
    targetUrl,
    socialUsername,
    profileUrl,
    verifiedTargetData,
    setPlatform,
    setService,
  } = useFunnelStore();

  const [offers, setOffers] = useState<PublicOfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [hoveredOfferId, setHoveredOfferId] = useState<string | null>(null);

  // Sync route params to funnel store
  useEffect(() => {
    if (platformIsValid && serviceIsValid) {
      setPlatform(platform);
      setService(service);
    }
  }, [platformIsValid, serviceIsValid, platform, service, setPlatform, setService]);

  // Fetch real offers from Supabase
  const fetchOffers = useCallback(async () => {
    try {
      setLoadingOffers(true);
      const res = await fetch(`/api/offers?platform=${encodeURIComponent(platform)}&service=${encodeURIComponent(service)}`);
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data?.items)) {
        setOffers(json.data.items);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [platform, service]);

  useEffect(() => {
    if (platformIsValid && serviceIsValid) {
      fetchOffers();
    }
  }, [platformIsValid, serviceIsValid, fetchOffers]);

  const isFollowers = service === "followers";
  const hasTarget = Boolean(
    (isFollowers && (socialUsername || targetValue)) ||
    (!isFollowers && (targetUrl || socialUsername || targetValue))
  );

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleModalContinue = () => {
    setModalOpen(false);
  };

  const handleScrollToPlans = () => {
    const el = document.getElementById("plans");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCheckout = async (offerId: string) => {
    setCheckoutError(null);
    if (!hasTarget) {
      handleOpenModal();
      return;
    }

    try {
      const resolvedTargetType = targetType || (isFollowers ? (platform === "youtube" ? "channel" : "profile") : "post");
      const normalizedUsername = socialUsername ? socialUsername.replace(/^@+/, '').trim() : null;

      const payload = {
        offerId,
        targetType: resolvedTargetType,
        targetValue: targetValue || normalizedUsername,
        targetUrl: targetUrl || null,
        socialUsername: normalizedUsername,
        profileUrl: profileUrl || null,
      };

      const res = await fetch("/api/checkout/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success && json.data?.checkoutUrl) {
        // Secure redirect to PerfectPay with CFCTX token attached in src
        window.location.href = json.data.checkoutUrl;
      } else {
        setCheckoutError(json.error?.message || "Unable to proceed to checkout. Please verify your target.");
      }
    } catch {
      setCheckoutError("Failed to initiate checkout. Please check your network and try again.");
    }
  };

  if (!platformIsValid || !serviceIsValid) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white selection:bg-pink-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Dynamic Ambient Platform Glow in Background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] pointer-events-none opacity-25 blur-[140px] rounded-full z-0"
        style={{ background: theme.ambientGlow }}
        aria-hidden="true"
      />

      {/* Top Header / Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between relative z-20 border-b border-neutral-800/60">
        <button
          type="button"
          onClick={() => router.push(`/${platform}`)}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {theme.name} Services</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-lg sm:text-xl font-black tracking-tight text-white cursor-pointer"
        >
          <span>Clout</span>
          <span style={{ color: theme.primary }}>Flow</span>
          <sup className="text-[10px] ml-0.5 text-blue-400 font-bold">↗</sup>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Verified Growth Network</span>
        </div>
      </header>

      {/* Checkout Error Toast */}
      {checkoutError && (
        <div className="w-full max-w-xl mx-auto px-4 pt-4 relative z-20">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center justify-between shadow-lg">
            <span>{checkoutError}</span>
            <button
              type="button"
              onClick={() => setCheckoutError(null)}
              className="text-neutral-400 hover:text-white font-bold underline ml-3"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. Hero Section (70-80vh impact) */}
      <div className="relative z-10">
        <ServiceHero
          platform={platform}
          service={service}
          theme={theme}
          copy={copy}
          targetType={targetType}
          targetValue={targetValue}
          targetUrl={targetUrl}
          socialUsername={socialUsername}
          profileUrl={profileUrl}
          verifiedTargetData={verifiedTargetData}
          onSelectTarget={handleOpenModal}
          onScrollToPlans={handleScrollToPlans}
        />
      </div>

      {/* 2. Trust Strip */}
      <div className="relative z-10">
        <TrustStrip />
      </div>

      {/* 3. Offer Selection Grid (Dynamic 6 cards from Supabase) */}
      <div className="relative z-10">
        {loadingOffers ? (
          <div className="w-full py-24 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            <span className="text-xs font-semibold">Loading current live packages...</span>
          </div>
        ) : (
          <OfferGrid
            offers={offers}
            serviceUnit={copy.unitLabel}
            theme={theme}
            hasTarget={hasTarget}
            targetHandle={socialUsername || targetValue}
            onCheckout={handleCheckout}
            onRequireTarget={handleOpenModal}
            onSelectOfferHover={(offerId) => setHoveredOfferId(offerId)}
          />
        )}
      </div>

      {/* 4. Growth Projection (Visual representation) */}
      {offers.length > 0 && (
        <div className="relative z-10">
          <GrowthProjection
            platform={platform}
            service={service}
            serviceUnit={copy.unitLabel}
            theme={theme}
            headline={copy.projectionHeadline}
            description={copy.projectionDescription}
            socialUsername={socialUsername}
            targetValue={targetValue}
            verifiedTargetData={verifiedTargetData}
            offers={offers}
            selectedOfferId={hoveredOfferId}
          />
        </div>
      )}

      {/* 5. Benefits Section (Why CloutFlow) */}
      <div className="relative z-10">
        <BenefitsSection copy={copy} theme={theme} />
      </div>

      {/* 6. How It Works */}
      <div className="relative z-10">
        <HowItWorks copy={copy} theme={theme} hasTarget={hasTarget} />
      </div>

      {/* 7. Plan Guide */}
      <div className="relative z-10">
        <PlanGuide copy={copy} />
      </div>

      {/* 8. Confidence Section (Built Around Your Target) */}
      <div className="relative z-10">
        <ConfidenceSection
          platformName={theme.name}
          serviceName={copy.unitLabel}
          theme={theme}
          socialUsername={socialUsername}
          targetValue={targetValue}
          verifiedTargetData={verifiedTargetData}
          onScrollToPlans={handleScrollToPlans}
        />
      </div>

      {/* 9. FAQ Accordion */}
      <div className="relative z-10">
        <ServiceFAQ copy={copy} />
      </div>

      {/* 10. Final CTA */}
      <div className="relative z-10">
        <FinalCTA
          platformName={theme.name}
          theme={theme}
          socialUsername={socialUsername}
          targetValue={targetValue}
          onScrollToPlans={handleScrollToPlans}
        />
      </div>

      {/* Profile / Target Lookup Modal */}
      <ProfileLookupModal
        platform={platform}
        service={service}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onContinue={handleModalContinue}
      />
    </main>
  );
}
