"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Star, Users, Zap, Heart } from "lucide-react";
import instagramOrganic from "@/assets/social-platforms/instagram.png";
import tiktokOrganic from "@/assets/social-platforms/tiktok.png";
import twitterOrganic from "@/assets/social-platforms/twitter.png";
import facebookOrganic from "@/assets/social-platforms/facebook.png";

const platforms = [
  { key: "instagram", name: "Instagram", href: "/instagram", cta: "Grow Instagram", image: instagramOrganic },
  { key: "tiktok", name: "TikTok", href: "/tiktok", cta: "Grow TikTok", image: tiktokOrganic },
  { key: "twitter", name: "Twitter (X)", href: "/twitter", cta: "Grow on X", image: twitterOrganic },
  { key: "facebook", name: "Facebook", href: "/facebook", cta: "Grow Facebook", image: facebookOrganic },
] as const;

const metrics = [
  { value: "52,749+", label: "Satisfied customers", icon: Users },
  { value: "24h", label: "Avg. delivery", icon: Zap },
  { value: "4.9★", label: "Avg. rating", icon: Star },
] as const;

export default function Home() {
  return (
    <main className="cf-ref-home">
      <section className="cf-ref-hero">
        <div className="cf-ref-hero-decor cf-ref-heart" aria-hidden="true">
          <Heart size={52} fill="currentColor" strokeWidth={0} />
        </div>
        <div className="cf-ref-dots cf-ref-dots-left" aria-hidden="true" />
        <div className="cf-ref-dots cf-ref-dots-right" aria-hidden="true" />
        <div className="cf-ref-ring cf-ref-ring-left" aria-hidden="true" />
        <div className="cf-ref-ring cf-ref-ring-right" aria-hidden="true" />
        <div className="cf-ref-triangle" aria-hidden="true" />
        <div className="cf-ref-bars" aria-hidden="true">
          <span /><span /><span /><span />
          <b>↗</b>
        </div>

        <div className="cf-ref-shell cf-ref-hero-inner">
          <div className="cf-ref-logo">CLOUTFLOW</div>
          <div className="cf-ref-eyebrow"><Zap size={16} /><span>Instant growth, real engagement</span></div>
          <h1 className="cf-ref-title">
            <span className="cf-ref-title-main">Grow your audience.</span>
            <span className="cf-ref-title-gradient">Get noticed faster.</span>
          </h1>
          <p className="cf-ref-subtitle">Followers, likes and views for the platforms that matter to you.</p>
        </div>
        <div className="cf-ref-wave" aria-hidden="true" />
      </section>

      <section className="cf-ref-body">
        <div className="cf-ref-shell">
          <div className="cf-ref-section-title">
            <h2>Where do you want to grow?</h2>
            <p>Choose your platform to explore your options.</p>
          </div>

          <div className="cf-ref-grid">
            {platforms.map((platform) => (
              <Link key={platform.key} href={platform.href} className="cf-ref-platform-card">
                <div className="cf-ref-platform-icon">
                  <Image src={platform.image} alt={`${platform.name} icon`} fill sizes="100px" className="object-contain" priority />
                </div>
                <h3>{platform.name}</h3>
                <span>{platform.cta}<ArrowRight size={17} /></span>
              </Link>
            ))}
          </div>

          <div className="cf-ref-metrics">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div className="cf-ref-metric" key={metric.label}>
                  <Icon className="cf-ref-metric-icon" />
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  {index < metrics.length - 1 && <i aria-hidden="true" />}
                </div>
              );
            })}
          </div>

          <div className="cf-ref-trust">
            <span><Users size={18} /> Real followers</span>
            <b>•</b>
            <span><ShieldCheck size={18} /> Safe &amp; guaranteed</span>
            <b>•</b>
            <span><Zap size={18} /> Instant start</span>
          </div>
        </div>

        <div className="cf-ref-bottom-clouds" aria-hidden="true" />
        <div className="cf-ref-bottom-orbit" aria-hidden="true" />
      </section>
    </main>
  );
}
