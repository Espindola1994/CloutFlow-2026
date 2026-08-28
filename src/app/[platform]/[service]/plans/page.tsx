"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Headphones, ShieldCheck, UserRound } from "lucide-react";

import { useFunnelStore } from "@/stores/funnel.store";
import { PlanSelector } from "@/components/funnel/plan-selector";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";

type PlatformId = "instagram" | "tiktok" | "twitter" | "youtube";

const PLATFORM_META: Record<PlatformId, { label: string; icon: any; accent: string; accent2: string }> = {
  instagram: { label: "Instagram", icon: instagramIcon, accent: "#E1306C", accent2: "#FCAF45" },
  youtube: { label: "YouTube", icon: youtubeIcon, accent: "#FF0000", accent2: "#FF5A5F" },
  tiktok: { label: "TikTok", icon: tiktokIcon, accent: "#25F4EE", accent2: "#FE2C55" },
  twitter: { label: "X (Twitter)", icon: twitterIcon, accent: "#111111", accent2: "#5F6B7A" },
};

export default function PlansPage() {
  const router = useRouter();
  const params = useParams() as { platform: string; service: string };
  const { username, profileData } = useFunnelStore();
  const [plans, setPlans] = useState<Record<string, any>[]>([]);

  const platform = (params.platform in PLATFORM_META ? params.platform : "instagram") as PlatformId;
  const activeMeta = PLATFORM_META[platform];

  useEffect(() => {
    if (!username) {
      if (params.platform && params.service) router.push(`/${params.platform}/${params.service}`);
      else router.push("/");
      return;
    }

    setPlans([
      { id: "1", name: "Starter", quantity: 500, regularPriceCents: 1499, salePriceCents: 999, currency: "USD", popular: false, deliveryEstimate: "Standard delivery" },
      { id: "2", name: "Growth", quantity: 1500, regularPriceCents: 2999, salePriceCents: 2499, currency: "USD", popular: false, deliveryEstimate: "Priority delivery" },
      { id: "3", name: "Pro", quantity: 5000, regularPriceCents: 5999, salePriceCents: 4999, currency: "USD", popular: true, deliveryEstimate: "Ultra fast delivery" },
      { id: "4", name: "Elite", quantity: 10000, regularPriceCents: 11999, salePriceCents: 9999, currency: "USD", popular: false, deliveryEstimate: "Fastest delivery" },
    ]);
  }, [username, params.platform, params.service, router]);

  const currentCount = useMemo(() => {
    if (!profileData) return null;
    const candidates = [profileData.follower_count, profileData.followers, profileData.subscriber_count, profileData.subscribers];
    return candidates.find((value) => typeof value === "number" || typeof value === "string") ?? null;
  }, [profileData]);

  if (!username) return null;

  return (
    <main
      className="cf-plans-v1"
      style={{ "--plans-accent": activeMeta.accent, "--plans-accent-2": activeMeta.accent2 } as React.CSSProperties}
    >
      <div className="cf-v80-background cf-plans-v1-bg" aria-hidden="true">
        <div className="cf-v80-blob cf-v80-blob-top-right" />
        <div className="cf-v80-blob cf-v80-blob-bottom-left" />
        <div className="cf-v80-dot-field cf-v80-dot-field-left" />
        <div className="cf-v80-dot-field cf-v80-dot-field-right" />
      </div>

      <div className="cf-plans-floaters" aria-hidden="true">
        <span className="cf-plans-floater cf-plans-floater-ig"><Image src={instagramIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-x"><Image src={twitterIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-tt"><Image src={tiktokIcon} alt="" /></span>
        <span className="cf-plans-floater cf-plans-floater-yt"><Image src={youtubeIcon} alt="" /></span>
      </div>

      <header className="cf-plans-header">
        <Link href="/" className="cf-plans-logo" aria-label="CloutFlow home">
          <span>Clout</span><b>Flow</b><ArrowUpRight />
        </Link>
        <nav className="cf-plans-nav" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link href={`/${platform}`}>Grow</Link>
          <span className="is-active">Plans</span>
          <a href="#reviews">Testimonials</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="cf-plans-header-actions">
          <span className="cf-plans-support"><i />24/7 Support</span>
          <span className="cf-plans-login"><UserRound /> Login</span>
        </div>
      </header>

      <section className="cf-plans-shell">
        <button className="cf-plans-back" type="button" onClick={() => router.push(`/${params.platform}/${params.service}`)}>
          <ArrowLeft /> Change profile
        </button>

        <div className="cf-plans-trusted-pill">
          <span>Built for creators and growing brands</span>
          <span className="cf-plans-mini-avatars"><i>CF</i><i>+ </i><i>✓</i></span>
        </div>

        <div className="cf-plans-hero">
          <h1>
            <span>Choose the Perfect Plan</span>
            <b>to Accelerate Your Growth</b>
          </h1>
          <p>
            Flexible packages for <strong>@{username}</strong>{currentCount ? ` · currently ${String(currentCount)}` : ""}. Choose the pace that fits your next move.
          </p>
        </div>

        <div className="cf-plans-benefit-row" aria-label="Service benefits">
          <div><span className="violet"><ShieldCheck /></span><b>Secure checkout</b><small>Protected payment flow</small></div>
          <div><span className="green"><ShieldCheck /></span><b>No password required</b><small>We only use public profile data</small></div>
          <div><span className="pink"><Headphones /></span><b>Support when needed</b><small>Help throughout your order</small></div>
          <div><span className="blue"><ShieldCheck /></span><b>Clear delivery status</b><small>Track progress from your account</small></div>
        </div>

        <div className="cf-plans-platform-tabs" aria-label="Supported social networks">
          {(Object.keys(PLATFORM_META) as PlatformId[]).map((key) => {
            const meta = PLATFORM_META[key];
            return (
              <Link key={key} href={`/${key}`} className={key === platform ? "is-active" : ""}>
                <Image src={meta.icon} alt="" width={32} height={32} />
                <span>{meta.label}</span>
              </Link>
            );
          })}
        </div>

        <PlanSelector plans={plans} username={username} platform={platform} service={params.service} hasTarget={true} />
      </section>
    </main>
  );
}
