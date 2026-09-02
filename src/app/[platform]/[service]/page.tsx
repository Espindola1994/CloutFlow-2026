"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, CheckCircle2, CreditCard, Headphones, Loader2, Package, Pencil, Search, Share2, ShieldCheck, Target } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import GrowthPackageBuilder from "@/components/growth-package-builder";
import { PLATFORM_THEMES, SERVICE_COPY_MAP, Platform, Service } from "@/config/service-sales.config";
import { PublicOfferItem } from "@/components/sales/OfferCard";
import { PlanSelector } from "@/components/funnel/plan-selector";
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

function GoalGlyph({ type }: { type: "followers" | "likes" | "views" }) {
  if (type === "followers") return (
    <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="10" r="5" fill="currentColor"/><path d="M3.5 26c.8-6.1 4-9.2 8.5-9.2s7.7 3.1 8.5 9.2H3.5Z" fill="currentColor"/><circle cx="21.5" cy="11" r="4" fill="currentColor" opacity=".72"/><path d="M19.2 18.2c5.1-.7 8.2 2.1 8.8 7.8h-5.4c-.3-3.2-1.4-5.8-3.4-7.8Z" fill="currentColor" opacity=".72"/></svg>
  );
  if (type === "likes") return (
    <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27.2 4.7 16.5C-1.2 10.9 2.7 3.8 9.1 4.5c3 .3 5.1 2.2 6.9 4.4 1.8-2.2 3.9-4.1 6.9-4.4 6.4-.7 10.3 6.4 4.4 12L16 27.2Z" fill="currentColor"/></svg>
  );
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.3 16S7.1 7.5 16 7.5 29.7 16 29.7 16 24.9 24.5 16 24.5 2.3 16 2.3 16Z" fill="currentColor"/><circle cx="16" cy="16" r="5.2" fill="white"/><circle cx="16" cy="16" r="2.8" fill="currentColor"/></svg>
  );
}

export default function ServiceSalesLandingPage() {
  const router = useRouter();
  const params = useParams() as { platform?: string; service?: string };
  const rawPlatform = (params.platform || "instagram").toLowerCase();
  const rawService = (params.service || "followers").toLowerCase();
  const platformIsValid = ["instagram", "tiktok", "twitter", "youtube"].includes(rawPlatform);
  const serviceIsValid = ["followers", "likes", "views", "comments"].includes(rawService);
  const platform = (platformIsValid ? rawPlatform : "instagram") as Platform;
  const routeService = (serviceIsValid ? rawService : "followers") as Service;
  const [service, setSelectedService] = useState<Service>(routeService);
  const theme = PLATFORM_THEMES[platform] || PLATFORM_THEMES.instagram;
  const copy = SERVICE_COPY_MAP[service]?.[platform] || SERVICE_COPY_MAP.followers.instagram;
  const meta = PLATFORM_META[platform as PlatformId] || PLATFORM_META.instagram;

  const { targetType, targetValue, targetUrl, socialUsername, profileUrl, email, verifiedTargetData, setPlatform, setService } = useFunnelStore();
  const [offers, setOffers] = useState<PublicOfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [plansConfirmed, setPlansConfirmed] = useState(false);




  useEffect(() => {
    if (platformIsValid && serviceIsValid) {
      setPlatform(platform);
      setSelectedService(routeService);
      setService(routeService);
    }
  }, [platformIsValid, serviceIsValid, platform, routeService, setPlatform, setService]);

  const fetchOffers = useCallback(async () => {
    try {
      setLoadingOffers(true);
      const res = await fetch(`/api/offers?platform=${encodeURIComponent(platform)}&service=${encodeURIComponent(service)}`);
      const json = await res.json();
      setOffers(res.ok && json.success && Array.isArray(json.data?.items) ? json.data.items : []);
    } catch { setOffers([]); } finally { setLoadingOffers(false); }
  }, [platform, service]);
  useEffect(() => { if (platformIsValid && serviceIsValid) fetchOffers(); }, [platformIsValid, serviceIsValid, fetchOffers]);

  const isFollowers = service === "followers";
  const username = (socialUsername || targetValue || "your profile").replace(/^@+/, "");
  const currentCount = useMemo(() => {
    const d: any = verifiedTargetData;
    if (!d) return null;
    return d.follower_count ?? d.followers ?? d.subscriber_count ?? d.subscribers ?? null;
  }, [verifiedTargetData]);

  const isContentTarget = targetType === "post" || targetType === "video";
  const targetCompatibleWithService = service === "followers"
    ? Boolean((targetType === "profile" || targetType === "channel") && socialUsername)
    : Boolean(isContentTarget && targetUrl);
  const hasTarget = targetCompatibleWithService;

  const changeProduct = (next: Service) => {
    if (next === service) return;
    setSelectedService(next);
    setService(next);
    setCheckoutError(null);
    setPlansConfirmed(false);
    window.history.replaceState(null, "", `/${platform}/${next}`);
  };

  const changePlatform = (next: PlatformId) => {
    if (next === platform) return;
    setCheckoutError(null);
    setPlansConfirmed(false);
    setPlatform(next);
    router.push(`/${next}/${service}`);
  };

  const handleCheckout = async (offerId: string) => {
    setCheckoutError(null);
    if (!hasTarget) { document.querySelector(".cf-premium-builder")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    try {
      const resolvedTargetType = targetType || (isFollowers ? (platform === "youtube" ? "channel" : "profile") : "post");
      const normalizedUsername = socialUsername ? socialUsername.replace(/^@+/, "").trim() : null;
      const res = await fetch("/api/checkout/context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, targetType: resolvedTargetType, targetValue: targetValue || normalizedUsername, targetUrl: targetUrl || null, socialUsername: normalizedUsername, profileUrl: profileUrl || null, email: email ? email.trim().toLowerCase() : null }) });
      const json = await res.json();
      if (res.ok && json.success && json.data?.checkoutUrl) window.location.href = json.data.checkoutUrl;
      else setCheckoutError(json.error?.message || "Não foi possível finalizar a compra. Tente novamente.");
    } catch { setCheckoutError("Não foi possível finalizar a compra. Tente novamente."); }
  };

  if (!platformIsValid || !serviceIsValid) return null;

  return (
    <main className="cf-plans-v1" style={{ "--plans-accent": meta.accent, "--plans-accent-2": meta.accent2 } as any}>
      <div className="cf-v80-background cf-plans-v1-bg" aria-hidden="true"><div className="cf-v80-blob cf-v80-blob-top-right"/><div className="cf-v80-blob cf-v80-blob-bottom-left"/><div className="cf-v80-dot-field cf-v80-dot-field-left"/><div className="cf-v80-dot-field cf-v80-dot-field-right"/></div>
      <div className="cf-plans-floaters" aria-hidden="true">
        <span className="cf-plans-floater cf-plans-floater-ig"><Image src={instagramIcon} alt=""/></span>
        <span className="cf-plans-floater cf-plans-floater-ig-soft"><Image src={instagramIcon} alt=""/></span>
        <span className="cf-plans-floater cf-plans-floater-x"><Image src={twitterIcon} alt=""/></span>
        <span className="cf-plans-floater cf-plans-floater-tt"><Image src={tiktokIcon} alt=""/></span>
        <span className="cf-plans-floater cf-plans-floater-x-soft"><Image src={twitterIcon} alt=""/></span>
        <span className="cf-plans-floater cf-plans-floater-yt"><Image src={youtubeIcon} alt=""/></span>
        <span className="cf-plans-bg-orbit cf-plans-bg-orbit-left"/>
        <span className="cf-plans-bg-orbit cf-plans-bg-orbit-right"/>
      </div>
      <header className="cf-plans-header cf-plans-header-clean"><Link href="/" className="cf-plans-logo cf-plans-logo-image" aria-label="CloutFlow home"><Image src="/cloutflow-header-logo.png" alt="CloutFlow" width={160} height={53} priority /></Link><div className="cf-plans-header-tagline" aria-label="Grow. Engage. Get Noticed."><span aria-hidden="true">✦</span><b>Grow. Engage. Get Noticed.</b></div></header>
      <section className="cf-plans-shell">
        <button className="cf-plans-back" type="button" onClick={() => router.push(`/${platform}`)}><ArrowLeft/> Back to {theme.name} Services</button>
        <div className="cf-plans-hero"><h1><span>Choose the Perfect Plan</span><b>to Accelerate Your Growth</b></h1><p>Real people. Real results. Growth made simple.</p></div>
        {checkoutError && <div className="cf-plans-error">{checkoutError}<button onClick={() => setCheckoutError(null)}>Dismiss</button></div>}
        <GrowthPackageBuilder
          initialPlatform={platform as PlatformId}
          initialGoal={(service === "followers" || service === "likes" || service === "views" ? service : "followers")}
          onPlatformChange={changePlatform}
          onGoalChange={(goal) => changeProduct(goal)}
          onContinue={() => {
            setPlansConfirmed(true);
            void fetchOffers();
            window.setTimeout(() => {
              document.querySelector(".cf-plans-pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 180);
          }}
        />
        {loadingOffers && <div className="cf-plans-loading cf-plans-loading-inline"><Loader2/><span>Loading current live packages...</span></div>}
        <PlanSelector plans={offers} username={username} platform={platform} service={service} hasTarget={plansConfirmed} onSelectPlan={handleCheckout}/>
      </section>

    


</main>
  );
}
