"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import GrowthPackageBuilder from "@/components/growth-package-builder";
import { Platform, Service } from "@/config/service-sales.config";
import { PLATFORM_SERVICES, CommercialPlatform, CommercialService } from "@/services/commercial-offer.resolver";
import { PublicOfferItem } from "@/components/sales/OfferCard";
import { PlanSelector } from "@/components/funnel/plan-selector";
import { buildCanonicalProfileUrl } from "@/lib/social/normalize";
import { validateSafeUrl } from "@/lib/social/security";
import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";

type PlatformId = "instagram" | "tiktok" | "twitter" | "youtube";
const PLATFORM_META: Record<PlatformId, { label: string; icon: any; accent: string; accent2: string }> = {
  instagram: { label: "Instagram", icon: instagramIcon, accent: "#E1306C", accent2: "#FCAF45" },
  youtube: { label: "YouTube", icon: youtubeIcon, accent: "#FF0000", accent2: "#FF5A5F" },
  tiktok: { label: "TikTok", icon: tiktokIcon, accent: "#FE2C55", accent2: "#25F4EE" },
  twitter: { label: "X (Twitter)", icon: twitterIcon, accent: "#111111", accent2: "#5F6B7A" },
};

export default function HomePage({
  initialPlatform = "instagram",
  initialService = "followers",
}: {
  initialPlatform?: PlatformId;
  initialService?: Service;
} = {}) {
  const [platform, setPlatformState] = useState<PlatformId>(initialPlatform);
  const [service, setSelectedService] = useState<Service>(initialService);
  const meta = PLATFORM_META[platform] || PLATFORM_META.instagram;

  const { targetType, targetValue, targetUrl, socialUsername, profileUrl, email, verificationStatus, verifiedTargetData, setPlatform, setService } = useFunnelStore();
  const [offers, setOffers] = useState<PublicOfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoadingOffers(true);
      const res = await fetch(`/api/offers?platform=${encodeURIComponent(platform)}&service=${encodeURIComponent(service)}`);
      const json = await res.json();
      setOffers(res.ok && json.success && Array.isArray(json.data?.items) ? json.data.items : []);
    } catch {
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [platform, service]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const funnelReadiness = useMemo(() => {
    return useFunnelStore.getState().getReadiness();
  }, [platform, service, targetType, targetValue, targetUrl, socialUsername, profileUrl, email, verificationStatus, verifiedTargetData]);

  const isFollowers = service === "followers";
  const username = (socialUsername || targetValue || "your profile").replace(/^@+/, "");

  const changeProduct = (next: Service) => {
    const validServices = PLATFORM_SERVICES[platform] || ['followers', 'likes', 'views'];
    const safeService = validServices.includes(next as CommercialService) ? next : (validServices[0] as Service);
    if (safeService === service) return;
    setSelectedService(safeService);
    setService(safeService);
    setCheckoutError(null);
  };

  const changePlatform = (next: PlatformId) => {
    if (next === platform) return;
    setPlatformState(next);
    setPlatform(next);
    const validServices = PLATFORM_SERVICES[next] || ['followers', 'likes', 'views'];
    if (!validServices.includes(service as CommercialService)) {
      const fallback = validServices[0] as Service;
      setSelectedService(fallback);
      setService(fallback);
    }
    setCheckoutError(null);
  };

  const handleCheckout = async (offerId: string) => {
    setCheckoutError(null);
    const readiness = useFunnelStore.getState().getReadiness();

    if (!readiness.canCheckout) {
      setCheckoutError(readiness.reason || "Please complete verification and email before checkout.");
      document.querySelector(".cf-pb-input input")?.scrollIntoView({ behavior: "smooth", block: "center" });
      (document.querySelector(".cf-pb-input input") as HTMLInputElement)?.focus();
      return;
    }

    try {
      const res = await fetch("/api/checkout/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          targetType: readiness.resolvedTargetType,
          targetValue: readiness.resolvedTargetValue,
          targetUrl: readiness.resolvedTargetUrl,
          socialUsername: readiness.normalizedUsername,
          profileUrl: readiness.canonicalProfileUrl,
          email: readiness.normalizedEmail,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setCheckoutError(json.error?.message || "Não foi possível finalizar a compra. Tente novamente.");
      }
    } catch {
      setCheckoutError("Não foi possível finalizar a compra. Tente novamente.");
    }
  };

  return (
    <main className="cf-plans-v1" style={{ "--plans-accent": meta.accent, "--plans-accent-2": meta.accent2 } as any}>
      <div className="cf-v80-background cf-plans-v1-bg" aria-hidden="true">
        <div className="cf-v80-blob cf-v80-blob-top-right" />
        <div className="cf-v80-blob cf-v80-blob-bottom-left" />
        <div className="cf-v80-dot-field cf-v80-dot-field-left" />
        <div className="cf-v80-dot-field cf-v80-dot-field-right" />
      </div>
      <div className="cf-plans-floaters" aria-hidden="true">
        <span className="cf-plans-floater cf-plans-floater-ig"><Image src={instagramIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-ig-soft"><Image src={instagramIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-x"><Image src={twitterIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-tt"><Image src={tiktokIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-x-soft"><Image src={twitterIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-yt"><Image src={youtubeIcon} alt="" /></span>
        <span className="cf-plans-bg-orbit cf-plans-bg-orbit-left" />
        <span className="cf-plans-bg-orbit cf-plans-bg-orbit-right" />
      </div>
      <header className="cf-plans-header cf-plans-header-clean">
        <Link href="/" className="cf-plans-logo cf-plans-logo-image" aria-label="CloutFlow home">
          <Image src="/cloutflow-header-logo.png" alt="CloutFlow" width={160} height={53} priority />
        </Link>
        <div className="cf-plans-header-tagline" aria-label="Grow. Engage. Get Noticed.">
          <span aria-hidden="true">✦</span>
          <b>Grow. Engage. Get Noticed.</b>
        </div>
      </header>
      <section className="cf-plans-shell">
        <div className="cf-plans-hero">
          <h1>
            <span>Choose the Perfect Plan</span>
            <b>to Accelerate Your Growth</b>
          </h1>
          <p>Real people. Real results. Growth made simple.</p>
        </div>
        {checkoutError && (
          <div className="cf-plans-error">
            {checkoutError}
            <button onClick={() => setCheckoutError(null)}>Dismiss</button>
          </div>
        )}
        <GrowthPackageBuilder
          initialPlatform={platform}
          initialGoal={service === "followers" || service === "likes" || service === "views" ? service : "followers"}
          onPlatformChange={changePlatform}
          onGoalChange={(goal) => changeProduct(goal)}
          onContinue={() => {
            void fetchOffers();
            window.setTimeout(() => {
              document.querySelector(".cf-plans-pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 180);
          }}
        />
        {loadingOffers && funnelReadiness.canShowPlans && (
          <div className="cf-plans-loading cf-plans-loading-inline">
            <Loader2 />
            <span>Loading current live packages...</span>
          </div>
        )}
        <PlanSelector
          plans={offers}
          username={username}
          platform={platform}
          service={service}
          hasTarget={funnelReadiness.canShowPlans}
          onSelectPlan={handleCheckout}
        />
      </section>
    </main>
  );
}
