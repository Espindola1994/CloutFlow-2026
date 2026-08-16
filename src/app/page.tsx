"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Headphones,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Star,
  CircleCheckBig,
  UserRoundCheck,
  Zap,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";

type PlatformItem = {
  key: "instagram" | "tiktok" | "twitter" | "youtube";
  href: string;
  name: string;
  icon: any;
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
    accent: "#000000",
    soft: "#fff0f3",
  },
  {
    key: "twitter",
    href: "/twitter",
    name: "Twitter / X",
    icon: twitterIcon,
    description: "Grow your followers and increase engagement.",
    accent: "#0F1419",
    soft: "#f7f9fa",
  },
  {
    key: "youtube",
    href: "/youtube",
    name: "YouTube",
    icon: youtubeIcon,
    description: "Get real subscribers and boost your channel.",
    accent: "#ff0000",
    soft: "#fff0f0",
  },
];

export default function Home() {
  return (
    <main className="cf-v68-home">
      <div className="cf-v68-deco cf-v68-deco-top" aria-hidden="true">
        <span className="cf-v68-chip">👥 +1K</span>
        <span className="cf-v68-heart">♥</span>
        <span className="cf-v68-growth-line" />
        <span className="cf-v68-growth-bars"><i /><i /><i /><i /></span>
        <span className="cf-v68-dotgrid" />
      </div>

      <div className="cf-v68-deco cf-v68-deco-bottom" aria-hidden="true">
        <span className="cf-v68-outline ig">◎</span>
        <span className="cf-v68-outline tk">♪</span>
        <span className="cf-v68-outline yt">▶</span>
        <span className="cf-v68-outline x">X</span>
        <span className="cf-v68-dashpath" />
        <span className="cf-v68-chip cf-v68-chip-bottom">👥 +2.5K</span>
        <span className="cf-v68-dotgrid cf-v68-dotgrid-bottom" />
      </div>

      <div className="cf-v68-page">
        <header className="cf-v68-navbar">
          <Link href="/" className="cf-v68-logo" aria-label="CloutFlow home">
            <span>Clout</span><b>Flow</b><ArrowUpRight />
          </Link>

          <div className="cf-v68-nav-actions">
            <div className="cf-v70-brand-message" aria-label="CloutFlow brand message">
              <span className="cf-v70-brand-star">✦</span>
              <span>Grow. Engage. Get Noticed.</span>
            </div>
          </div>

          <div className="cf-v71-mobile-mark" aria-hidden="true">✦</div>
        </header>

        <section className="cf-v68-main">
          

          <div className="cf-v68-hero">
            <h1>
              <span>Grow your audience.</span>
              <span>Get noticed <b>faster.</b></span>
            </h1>
            <p>Followers, likes and views for the platforms that matter to you.</p>
          </div>

          <section className="cf-v68-top-stats" aria-label="CloutFlow results">
            <div>
              <span className="cf-v68-stat-icon blue"><UserRoundCheck /></span>
              <p><small>Happy Customers</small><strong>98,754+</strong></p>
            </div>
            <div>
              <span className="cf-v68-stat-icon green"><CircleCheckBig /></span>
              <p><small>Orders Completed</small><strong>1,245,678+</strong></p>
            </div>
            <div>
              <span className="cf-v68-stat-icon purple"><Star fill="currentColor" /></span>
              <p><small>Great Reviews</small><strong>4.9/5</strong></p>
            </div>
          </section>

          <section id="platforms" className="cf-v68-platform-grid" aria-label="Choose a platform">
            {platforms.map((platform) => (
              <article
                className={`cf-v68-card cf-v68-card-${platform.key}`}
                key={platform.key}
                style={{ "--accent": platform.accent, "--soft": platform.soft } as React.CSSProperties}
              >
                {platform.popular && <span className="cf-v68-popular">Popular</span>}

                <Link href={platform.href} className="cf-v68-card-icon" aria-label={`${platform.name} services`}>
                  <Image
                    src={platform.icon}
                    alt={`${platform.name} icon`}
                    width={96}
                    height={96}
                    priority
                  />
                </Link>

                <h2>{platform.name}</h2>
                <p>{platform.description}</p>

                <Link href={platform.href} className="cf-v68-card-primary">
                  Start Growing <ArrowUpRight />
                </Link>
              </article>
            ))}
          </section>

          <section id="how-it-works" className="cf-v68-trustbar" aria-label="Service benefits">
            <div><ShieldCheck /><span>100% Safe &amp; Secure</span></div>
            <div><LockKeyhole /><span>No Password Required</span></div>
            <div><Zap /><span>Fast Delivery</span></div>
            <div id="support"><Headphones /><span>24/7 Support</span></div>
          </section>

          <div className="cf-v68-security-note">
            <LockKeyhole />
            <span>Your information is 100% secure and protected.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
