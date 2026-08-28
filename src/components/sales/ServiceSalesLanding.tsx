"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, CheckCircle2, Headphones, Loader2, Package, Share2, ShieldCheck, Target } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import ProfileLookupModal from "@/components/profile-lookup-modal";
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

export interface ServiceSalesLandingProps {
  defaultPlatform?: Platform;
  defaultService?: Service;
}

export default function ServiceSalesLanding({
  defaultPlatform = "instagram",
  defaultService = "followers",
}: ServiceSalesLandingProps = {}) {
  const router = useRouter();
  const params = useParams() as { platform?: string; service?: string } | null;
  const rawPlatform = (params?.platform || defaultPlatform || "instagram").toLowerCase();
  const rawService = (params?.service || defaultService || "followers").toLowerCase();
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
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
    window.history.replaceState(null, "", `/${platform}/${next}`);
  };

  const changePlatform = (next: PlatformId) => {
    if (next === platform) return;
    setCheckoutError(null);
    setPlatform(next);
    router.push(`/${next}/${service}`);
  };

  const handleCheckout = async (offerId: string) => {
    setCheckoutError(null);
    if (!hasTarget) { setModalOpen(true); return; }
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
    <main className="cf-plans-v1" style={{ "--plans-accent": meta.accent, "--plans-accent-2": meta.accent2 } as React.CSSProperties}>
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
        <div className="cf-plans-hero"><h1><span>Choose the Perfect Plan</span><b>to Accelerate Your Growth</b></h1><p>{hasTarget ? <>Real people. Real results. No bots, no fake accounts.<br/>Just powerful growth that builds your brand.</> : <>Real people. Real results. No bots, no fake accounts.<br/>Just powerful growth that builds your brand.</>}</p></div>
        {checkoutError && <div className="cf-plans-error">{checkoutError}<button onClick={() => setCheckoutError(null)}>Dismiss</button></div>}
        <div className="cf-plans-benefit-row"><div><span className="violet"><ShieldCheck/></span><b>100% Real & Active</b><small>Real people, real engagement</small></div><div><span className="green"><ShieldCheck/></span><b>Instant & Safe Delivery</b><small>No password required</small></div><div><span className="pink"><Headphones/></span><b>24/7 Dedicated Support</b><small>We're here, anytime</small></div><div><span className="blue"><ShieldCheck/></span><b>Money-Back Guarantee</b><small>100% risk-free</small></div></div>
        <section className={`cf-universal-purchase ${hasTarget ? "has-target" : ""}`} aria-label="Configure your growth order" style={{ "--selector-accent": meta.accent, "--selector-accent-2": meta.accent2 } as React.CSSProperties}>
          <div className="cf-universal-intro">
            <div><small>START HERE</small><h2>Configure your growth</h2><p>Choose your network, goal, and destination.</p></div>
            <div className="cf-universal-how cf-universal-how-icons" aria-label="How it works">
              <b className="is-current"><span><Share2/></span><em>Network</em></b><i aria-hidden="true"/>
              <b><span><Target/></span><em>Goal</em></b><i aria-hidden="true"/>
              <b><span><BadgeCheck/></span><em>Confirm</em></b><i aria-hidden="true"/>
              <b><span><Package/></span><em>Package</em></b>
            </div>
          </div>
          <div className="cf-universal-section-label"><span>1</span><div><b>Choose your network</b><small>Where do you want to grow?</small></div></div>
          <div className="cf-universal-platforms" role="tablist" aria-label="Choose social network">
            {(Object.entries(PLATFORM_META) as [PlatformId, (typeof PLATFORM_META)[PlatformId]][]).map(([id, item]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={platform === id}
                className={platform === id ? "is-active" : ""}
                onClick={() => changePlatform(id)}
                style={{ "--platform-accent": item.accent, "--platform-accent-2": item.accent2 } as React.CSSProperties}
              >
                <span><Image src={item.icon} alt="" width={28} height={28}/></span>
                <b>{item.label}</b>
              </button>
            ))}
          </div>

          <div className="cf-universal-section-label cf-universal-goal-label"><span>2</span><div><b>What do you want to increase?</b><small>Choose one option and we’ll show the right packages.</small></div></div>

          <div className="cf-universal-products">
            <button type="button" className={service === "followers" ? "is-active" : ""} onClick={() => changeProduct("followers")}><span><GoalGlyph type="followers"/></span><b>Followers</b><small>Grow your audience</small></button>
            <button type="button" className={service === "likes" ? "is-active" : ""} onClick={() => changeProduct("likes")}><span><GoalGlyph type="likes"/></span><b>Likes</b><small>Increase engagement</small></button>
            <button type="button" className={service === "views" ? "is-active" : ""} onClick={() => changeProduct("views")}><span><GoalGlyph type="views"/></span><b>Views</b><small>Get more content visibility</small></button>
          </div>

          <div className={`cf-universal-target-compact ${hasTarget ? "is-verified" : "is-empty"}`}>
            <span className="cf-universal-target-icon">{hasTarget ? <CheckCircle2/> : <Image src={meta.icon} alt="" width={24} height={24}/>}</span>
            <div>
              <small>{hasTarget ? "Destination confirmed" : "3 · Confirm your destination"}</small>
              <b>{hasTarget ? `${socialUsername ? `@${socialUsername.replace(/^@+/, "")} · ` : ""}${meta.label} · ${service === "followers" ? "Followers" : service === "likes" ? "Likes" : "Views"}` : (service === "followers" ? "Enter your @ or paste your profile/channel link" : service === "likes" ? "Paste the exact post or video link that will receive likes" : "Paste the exact post or video link that will receive views")}</b>
            </div>
            <button type="button" onClick={() => setModalOpen(true)}>{hasTarget ? "Change" : "Confirm destination"}</button>
          </div>
        </section>
        {loadingOffers && <div className="cf-plans-loading cf-plans-loading-inline"><Loader2/><span>Loading current live packages...</span></div>}
        <PlanSelector plans={offers} username={username} platform={platform} service={service} hasTarget={hasTarget} onSelectPlan={handleCheckout}/>
      </section>
      <ProfileLookupModal
        platform={platform}
        service={service}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onContinue={() => {
          setModalOpen(false);
          void fetchOffers();

          // Step 3 -> plans: the verified target is persisted by the modal before
          // onContinue fires. Wait for React to mount the pricing section, then
          // take the customer directly to the beginning of all 8 plan cards.
          const scrollToPlans = (attempt = 0) => {
            window.requestAnimationFrame(() => {
              const pricing = document.querySelector(".cf-plans-pricing");
              if (pricing) {
                // Desktop: keep the pricing heading fully visible above the 4x2 grid,
                // matching the completed composition instead of pinning/clipping it
                // against the top edge of the viewport. Mobile keeps its existing flow.
                if (window.matchMedia("(min-width: 901px)").matches) {
                  const pricingTop = pricing.getBoundingClientRect().top + window.scrollY;
                  const desktopTopBreathingRoom = 34;
                  window.scrollTo({
                    top: Math.max(0, pricingTop - desktopTopBreathingRoom),
                    behavior: "smooth",
                  });
                } else {
                  pricing.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                return;
              }
              if (attempt < 8) window.setTimeout(() => scrollToPlans(attempt + 1), 60);
            });
          };
          scrollToPlans();
        }}
      />
    </main>
  );
}
