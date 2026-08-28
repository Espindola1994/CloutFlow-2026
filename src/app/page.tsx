"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Headphones,
  LockKeyhole,
  ShieldCheck,
  Star,
  UserRound,
  Zap,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";

import type { StaticImageData } from "next/image";

type PlatformItem = {
  key: "instagram" | "tiktok" | "twitter" | "youtube";
  href: string;
  name: string;
  icon: StaticImageData | string;
  description: string;
  accent: string;
  soft: string;
  popular?: boolean;
};

const platforms: PlatformItem[] = [
  {
    key: "instagram",
    href: "/instagram",
    name: "Instagram",
    icon: instagramIcon,
    description: "Real followers, likes and views for your growth.",
    accent: "#E1306C",
    soft: "#FFF0F5",
    popular: true,
  },
  {
    key: "tiktok",
    href: "/tiktok",
    name: "TikTok",
    icon: tiktokIcon,
    description: "Boost followers, likes and video views.",
    accent: "#00d6d9",
    soft: "#effdff",
  },
  {
    key: "twitter",
    href: "/twitter",
    name: "Twitter / X",
    icon: twitterIcon,
    description: "Grow your followers and increase engagement.",
    accent: "#1c2944",
    soft: "#f4f7fb",
  },
  {
    key: "youtube",
    href: "/youtube",
    name: "YouTube",
    icon: youtubeIcon,
    description: "Get real subscribers and boost your channel.",
    accent: "#ff3848",
    soft: "#fff3f4",
  },
];

// V83: precision-matched glossy 1200px Home composition
export default function Home() {
  return (
    <main className="cf-v80-home font-sans">
      <div className="cf-v80-background" aria-hidden="true">
        <div className="cf-v80-blob cf-v80-blob-top-right" />
        <div className="cf-v80-blob cf-v80-blob-bottom-left" />
        <div className="cf-v80-dot-field cf-v80-dot-field-left" />
        <div className="cf-v80-dot-field cf-v80-dot-field-right" />
        <span className="cf-v80-orb cf-v80-orb-a" />
        <span className="cf-v80-orb cf-v80-orb-b" />
        <span className="cf-v80-orb cf-v80-orb-c" />
        <span className="cf-v80-orb cf-v80-orb-d" />
      </div>

      <div className="cf-v80-shell">
        <header className="cf-v80-header">
          <Link href="/" className="cf-v80-logo" aria-label="CloutFlow home">
            <span>Clout</span><b>Flow</b><ArrowUpRight />
          </Link>
          <div className="cf-v80-brand-line">
            <span className="cf-v80-brand-star">✦</span>
            <span>Grow. Engage. Get Noticed.</span>
          </div>
        </header>

        <section className="cf-v80-content">
          <div className="cf-v80-hero">
            <h1>
              <span>Grow your audience.</span>
              <span>Get noticed <b>faster.</b></span>
            </h1>
            <p>Followers, likes and views for the platforms that matter to you.</p>
          </div>

          <section className="cf-v80-stats" aria-label="CloutFlow highlights">
            <div className="cf-v80-stat">
              <span className="cf-v80-stat-icon cf-v80-stat-icon-blue"><UserRound /></span>
              <div><small>Happy Customers</small><strong>98,754+</strong></div>
            </div>
            <div className="cf-v80-stat">
              <span className="cf-v80-stat-icon cf-v80-stat-icon-green"><BadgeCheck /></span>
              <div><small>Orders Completed</small><strong>1,245,678+</strong></div>
            </div>
            <div className="cf-v80-stat">
              <span className="cf-v80-stat-icon cf-v80-stat-icon-gold"><Star /></span>
              <div><small>Great Reviews</small><strong>4.9/5</strong></div>
            </div>
          </section>

          <section id="platforms" className="cf-v80-platform-grid" aria-label="Choose a platform">
            {platforms.map((platform) => (
              <article
                className={`cf-v80-card cf-v80-card-${platform.key}`}
                key={platform.key}
                style={{ "--accent": platform.accent, "--soft": platform.soft } as React.CSSProperties}
              >
                {platform.popular && <span className="cf-v80-popular"><Star />Popular</span>}
                <Link href={platform.href} className="cf-v80-card-icon" aria-label={`${platform.name} services`}>
                  <span className="cf-v80-icon-halo" />
                  <Image src={platform.icon} alt={`${platform.name} icon`} width={112} height={112} priority />
                </Link>
                <h2>{platform.name}</h2>
                <p>{platform.description}</p>
                <Link href={platform.href} className="cf-v80-card-primary group">
                  <span>Start Growing</span>
                  <span className="cf-v80-card-primary-arrow">
                    <ArrowRight />
                  </span>
                </Link>
              </article>
            ))}
          </section>

          <section className="cf-v80-trustbar" aria-label="Service benefits">
            <div><span className="cf-v80-benefit-icon cf-v80-benefit-purple"><ShieldCheck /></span><span>100% Safe &amp; Secure</span></div>
            <div><span className="cf-v80-benefit-icon cf-v80-benefit-blue"><LockKeyhole /></span><span>No Password Required</span></div>
            <div><span className="cf-v80-benefit-icon cf-v80-benefit-green"><Zap /></span><span>Fast Delivery</span></div>
            <div><span className="cf-v80-benefit-icon cf-v80-benefit-orange"><Headphones /></span><span>24/7 Support</span></div>
          </section>

        </section>
      </div>
    </main>
  );
}
