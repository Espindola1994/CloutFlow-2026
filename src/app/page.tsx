"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Loader2 } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import GrowthPackageBuilder from "@/components/growth-package-builder";
import { Platform, Service } from "@/config/service-sales.config";
import { PLATFORM_SERVICES, CommercialPlatform, CommercialService } from "@/services/commercial-offer.resolver";
import { PublicOfferItem } from "@/components/sales/OfferCard";
import { PlanSelector } from "@/components/funnel/plan-selector";
import { markCheckoutReturn, processCheckoutReturn } from "@/lib/checkout-return";
import {
  PROGRAMMATIC_SCROLL_START_EVENT,
  PROGRAMMATIC_SCROLL_END_EVENT,
} from "@/components/DesktopSmoothScroll";
import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";
import { trackAnalyticsEvent } from "@/lib/analytics/tracker";

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
  const [analysisResetToken, setAnalysisResetToken] = useState(0);
  const offersRequestId = useRef(0);
  const plansSectionRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollToPlans = useRef(false);
  const autoScrollDoneForRun = useRef(false);
  const scrollFrameIdRef = useRef<number | null>(null);
  const pollFrameIdRef = useRef<number | null>(null);

  const resetAfterCheckout = useCallback(() => {
    useFunnelStore.getState().resetAfterCheckoutReturn();
    offersRequestId.current += 1;
    shouldAutoScrollToPlans.current = false;
    autoScrollDoneForRun.current = false;
    setPlatformState(initialPlatform);
    setSelectedService(initialService);
    setOffers([]);
    setLoadingOffers(false);
    setCheckoutError(null);
    setAnalysisResetToken((token) => token + 1);
    if (typeof window !== "undefined") {
      try {
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "manual";
        }
      } catch {}
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_END_EVENT));
    }
  }, [initialPlatform, initialService]);

  useEffect(() => {
    const state = useFunnelStore.getState();
    state.setPlatform(initialPlatform);
    state.setService(initialService);
    trackAnalyticsEvent("page_view", { platform: initialPlatform, service: initialService });
  }, [initialPlatform, initialService]);

  useEffect(() => {
    const handleReturn = () => {
      processCheckoutReturn({
        resetFunnel: resetAfterCheckout,
        replaceHome: () => window.history.replaceState(null, "", "/"),
      });
    };
    window.addEventListener("pageshow", handleReturn);
    window.addEventListener("popstate", handleReturn);
    handleReturn();
    return () => {
      window.removeEventListener("pageshow", handleReturn);
      window.removeEventListener("popstate", handleReturn);
    };
  }, [resetAfterCheckout]);

  const fetchOffers = useCallback(async () => {
    const requestId = ++offersRequestId.current;
    try {
      setLoadingOffers(true);
      const res = await fetch(`/api/offers?platform=${encodeURIComponent(platform)}&service=${encodeURIComponent(service)}`);
      const json = await res.json();
      if (requestId === offersRequestId.current) {
        setOffers(res.ok && json.success && Array.isArray(json.data?.items) ? json.data.items : []);
      }
    } catch {
      if (requestId === offersRequestId.current) setOffers([]);
    } finally {
      if (requestId === offersRequestId.current) setLoadingOffers(false);
    }
  }, [platform, service]);

  const funnelReadiness = useMemo(() => {
    return useFunnelStore.getState().getReadiness();
  }, [platform, service, targetType, targetValue, targetUrl, socialUsername, profileUrl, email, verificationStatus, verifiedTargetData]);

  useEffect(() => {
    if (!funnelReadiness.canShowPlans) {
      offersRequestId.current += 1;
      setOffers([]);
      setLoadingOffers(false);
      shouldAutoScrollToPlans.current = false;
      autoScrollDoneForRun.current = false;
      mobilePricingScrollConsumed.current = false;
      return;
    }
    void fetchOffers();
  }, [fetchOffers, funnelReadiness.canShowPlans]);

  const mobilePricingScrollConsumed = useRef(false);

  const executeMobilePricingAutoScroll = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth > 900) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 60;

    const attemptScrollToPricing = () => {
      attempts += 1;
      const element = plansSectionRef.current || document.querySelector<HTMLElement>(".cf-plans-pricing");
      if (!element || element.getBoundingClientRect().height === 0) {
        if (attempts < maxAttempts) {
          window.requestAnimationFrame(attemptScrollToPricing);
        }
        return;
      }

      const rect = element.getBoundingClientRect();
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const elementTop = rect.top + currentScrollY;

      const headerElement = document.querySelector<HTMLElement>(".cf-plans-header");
      const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 62;

      // Position right at the beginning of Choose Your Growth Plan with comfortable breathing room
      const offsetPadding = 14;
      const targetY = Math.max(0, elementTop - headerHeight - offsetPadding);
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
      const safeTargetY = Math.min(Math.round(targetY), maxScroll);

      const prefersReducedMotion = typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      window.scrollTo({
        top: safeTargetY,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(attemptScrollToPricing);
    });
  }, []);

  const executeDesktopAutoScroll = useCallback(() => {
    // Strict desktop check: innerWidth >= 901px. Mobile/tablet <= 900px must remain untouched.
    if (typeof window === "undefined" || window.innerWidth < 901) {
      shouldAutoScrollToPlans.current = false;
      return;
    }

    // Cancel any active animation frame
    if (scrollFrameIdRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameIdRef.current);
      scrollFrameIdRef.current = null;
    }
    if (pollFrameIdRef.current !== null) {
      window.cancelAnimationFrame(pollFrameIdRef.current);
      pollFrameIdRef.current = null;
    }

    let attempts = 0;
    const maxAttempts = 120; // Try for up to ~2 seconds (120 frames at 60fps)

    const attemptScroll = () => {
      attempts += 1;
      const element = plansSectionRef.current || document.querySelector<HTMLElement>(".cf-plans-pricing");
      
      // If element is not yet in DOM or has 0 height (not laid out), wait for next frame
      if (!element || element.getBoundingClientRect().height === 0) {
        if (attempts < maxAttempts) {
          scrollFrameIdRef.current = window.requestAnimationFrame(attemptScroll);
        }
        return;
      }

      // Element exists and has dimensions! Mark intention consumed for this run
      shouldAutoScrollToPlans.current = false;
      autoScrollDoneForRun.current = true;

      const rect = element.getBoundingClientRect();
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const sectionTop = rect.top + currentScrollY;
      const sectionHeight = rect.height;

      // Header height on desktop is ~62px-72px
      const headerElement = document.querySelector<HTMLElement>(".cf-plans-header");
      const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 68;

      const viewportHeight = window.innerHeight;
      const usableViewportHeight = Math.max(0, viewportHeight - headerHeight);

      // Desired top offset gives comfortable breathing room below the header
      const breathingRoom = 24;
      const topAnchorOffset = headerHeight + breathingRoom;

      let targetY: number;

      if (sectionHeight <= usableViewportHeight - (breathingRoom * 2)) {
        // Section fits completely: center it visually in the usable viewport area
        const remainingSpace = usableViewportHeight - sectionHeight;
        targetY = sectionTop - (headerHeight + Math.round(remainingSpace / 2));
      } else {
        // Section taller than usable viewport: anchor top of section with proper breathing room below header
        // Priority 1: title fully visible
        // Priority 2: subtitle fully visible
        // Priority 3: first row of cards and maximum possible of the rest
        // NEVER cut title or subtitle off the top of the viewport
        targetY = sectionTop - topAnchorOffset;
      }

      // Ensure targetY never goes negative or past document bounds
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
      const safeTargetY = Math.min(Math.max(0, Math.round(targetY)), maxScroll);

      // Notify DesktopSmoothScroll to pause interception during programmatic auto-scroll
      window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_START_EVENT));

      const prefersReducedMotion = typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        window.scrollTo({
          top: safeTargetY,
          behavior: "auto",
        });
        window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_END_EVENT));
        return;
      }

      window.scrollTo({
        top: safeTargetY,
        behavior: "smooth",
      });

      // Poll until smooth scroll finishes (within tolerance) or fallback timeout, then dispatch end event
      let checkCount = 0;

      const checkScrollFinished = () => {
        checkCount += 1;
        const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
        const reached = Math.abs(currentY - safeTargetY) <= 2;

        if (reached || checkCount > 100) {
          // Target reached or safety timeout elapsed: re-synchronize DesktopSmoothScroll and resume
          window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_END_EVENT));
          pollFrameIdRef.current = null;
          return;
        }

        pollFrameIdRef.current = window.requestAnimationFrame(checkScrollFinished);
      };

      // Allow browser smooth scroll to begin moving before checking tolerance
      window.setTimeout(() => {
        pollFrameIdRef.current = window.requestAnimationFrame(checkScrollFinished);
      }, 50);
    };

    // Use double requestAnimationFrame to ensure browser commit and layout are complete
    scrollFrameIdRef.current = window.requestAnimationFrame(() => {
      scrollFrameIdRef.current = window.requestAnimationFrame(attemptScroll);
    });
  }, []);

  // DESKTOP ONLY (>= 901px): Smooth auto-scroll to the plans section once confirmed
  useEffect(() => {
    if (!funnelReadiness.canShowPlans) return;
    if (!shouldAutoScrollToPlans.current) return;
    if (autoScrollDoneForRun.current) return;

    executeDesktopAutoScroll();

    return () => {
      if (scrollFrameIdRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameIdRef.current);
        scrollFrameIdRef.current = null;
      }
      if (pollFrameIdRef.current !== null) {
        window.cancelAnimationFrame(pollFrameIdRef.current);
        pollFrameIdRef.current = null;
      }
    };
  }, [funnelReadiness.canShowPlans, executeDesktopAutoScroll]);

  const isFollowers = service === "followers";
  const username = (socialUsername || targetValue || "your profile").replace(/^@+/, "");

  const changeProduct = (next: Service) => {
    const validServices = PLATFORM_SERVICES[platform] || ['followers', 'likes', 'views'];
    const safeService = validServices.includes(next as CommercialService) ? next : (validServices[0] as Service);
    if (safeService === service) return;
    setSelectedService(safeService);
    setService(safeService);
    window.history.replaceState(null, "", `/${platform === "twitter" ? "x" : platform}/${safeService}`);
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
      window.history.replaceState(null, "", `/${next === "twitter" ? "x" : next}/${fallback}`);
    } else {
      window.history.replaceState(null, "", `/${next === "twitter" ? "x" : next}/${service}`);
    }
    setCheckoutError(null);
  };

  const handleCheckout = async (offerId: string) => {
    setCheckoutError(null);
    const readiness = useFunnelStore.getState().getReadiness();

    if (!readiness.canCheckout) {
      setCheckoutError("Analyze your profile first to continue.");
      document.querySelector("#growth-package-builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
      (document.querySelector(".cf-pb-input input") as HTMLInputElement)?.focus();
      return;
    }

    try {
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('cf_asid_v1') : null;
      const visitorId = typeof window !== 'undefined' ? localStorage.getItem('cf_aid_v1') : null;

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
          sessionId: sessionId || undefined,
          visitorId: visitorId || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.checkoutUrl) {
        trackAnalyticsEvent("checkout_started_linked", {
          platform,
          service,
          planId: offerId,
          metadata: {
            checkoutContextId: json.data?.contextId,
          },
        });
        markCheckoutReturn();
        window.history.replaceState(null, "", "/");
        window.location.href = json.data.checkoutUrl;
      } else {
        setCheckoutError(json.error?.message || "We could not complete checkout. Please try again.");
      }
    } catch {
      setCheckoutError("We could not complete checkout. Please try again.");
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
        <div className="cf-plans-header-tagline" aria-label="Post. Engage. Grow.">
          <Flame className="cf-plans-header-flame" aria-hidden="true" />
          <b className="cf-tagline-text-desktop">Post. Engage. Grow Faster.</b>
          <b className="cf-tagline-text-mobile">Post. Engage. Grow.</b>
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
          resetToken={analysisResetToken}
          onPlatformChange={changePlatform}
          onGoalChange={(goal) => changeProduct(goal)}
          onStartAnalysis={() => {
            // New analysis initiated: reset auto-scroll locks for this fresh run
            autoScrollDoneForRun.current = false;
            shouldAutoScrollToPlans.current = false;
            mobilePricingScrollConsumed.current = false;
          }}
          onContinue={() => {
            void fetchOffers();
            if (typeof window !== "undefined" && window.innerWidth >= 901) {
              shouldAutoScrollToPlans.current = true;
              autoScrollDoneForRun.current = false;
              // If plans section is already mounted and ready in the DOM, execute scroll directly
              executeDesktopAutoScroll();
            } else {
              // TRIGGER C (Mobile <= 900px): Confirmation clicked -> scrollToPricing()
              if (!mobilePricingScrollConsumed.current) {
                mobilePricingScrollConsumed.current = true;
                executeMobilePricingAutoScroll();
              }
            }
          }}
        />
        {loadingOffers && funnelReadiness.canShowPlans && (
          <div className="cf-plans-loading cf-plans-loading-inline">
            <Loader2 />
            <span>Loading current live packages...</span>
          </div>
        )}
        <PlanSelector
          sectionRef={plansSectionRef}
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
