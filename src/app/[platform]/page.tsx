"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Headphones,
  Lock,
  LockKeyhole,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeIcon from "@/assets/home-icons-vector/youtube.svg";
import ProfileLookupModal from "@/components/profile-lookup-modal";

type PlatformId = "instagram" | "tiktok" | "twitter" | "youtube";

type PlatformTheme = {
  name: string;
  shortName: string;
  accent: string;
  accent2: string;
  pale: string;
  gradient: string;
  btnGradient: string;
  badgeGradient: string;
  icon: StaticImageData;
  iconBg: string;
  iconBorder: string;
};

const THEMES: Record<PlatformId, PlatformTheme> = {
  instagram: {
    name: "Instagram",
    shortName: "Instagram",
    accent: "#E1306C",
    accent2: "#F56040",
    pale: "#FFF0F5",
    gradient: "linear-gradient(90deg, #833AB4 0%, #C13584 25%, #E1306C 50%, #F56040 75%, #FCAF45 100%)",
    btnGradient: "linear-gradient(90deg, #9b30c4 0%, #d82b7d 50%, #f7623b 100%)",
    badgeGradient: "linear-gradient(90deg, #833AB4 0%, #d82b7d 50%, #f7623b 100%)",
    icon: instagramIcon,
    iconBg: "linear-gradient(145deg, #ffffff 0%, #fcf3f8 100%)",
    iconBorder: "rgba(225, 48, 108, 0.15)",
  },
  tiktok: {
    name: "TikTok",
    shortName: "TikTok",
    accent: "#000000",
    accent2: "#FE2C55",
    pale: "#FFF0F3",
    gradient: "linear-gradient(90deg, #00f2fe 0%, #000000 50%, #fe2c55 100%)",
    btnGradient: "linear-gradient(90deg, #050505 0%, #1a1a1a 45%, #fe2c55 100%)",
    badgeGradient: "linear-gradient(90deg, #000000 0%, #fe2c55 100%)",
    icon: tiktokIcon,
    iconBg: "linear-gradient(145deg, #ffffff 0%, #f0fbfc 100%)",
    iconBorder: "rgba(37, 244, 238, 0.2)",
  },
  twitter: {
    name: "X / Twitter",
    shortName: "X / Twitter",
    accent: "#0F1419",
    accent2: "#536471",
    pale: "#f7f9fa",
    gradient: "linear-gradient(90deg, #0F1419 0%, #333d4b 50%, #0F1419 100%)",
    btnGradient: "linear-gradient(90deg, #0F1419 0%, #1f2833 60%, #0F1419 100%)",
    badgeGradient: "linear-gradient(90deg, #0F1419 0%, #3a4756 100%)",
    icon: twitterIcon,
    iconBg: "linear-gradient(145deg, #ffffff 0%, #f4f6f8 100%)",
    iconBorder: "rgba(15, 20, 25, 0.15)",
  },
  youtube: {
    name: "YouTube",
    shortName: "YouTube",
    accent: "#ff0000",
    accent2: "#cc0000",
    pale: "#fff0f0",
    gradient: "linear-gradient(90deg, #ff0000 0%, #e60000 50%, #cc0000 100%)",
    btnGradient: "linear-gradient(90deg, #ff1a1a 0%, #e60000 50%, #cc0000 100%)",
    badgeGradient: "linear-gradient(90deg, #ff1a1a 0%, #cc0000 100%)",
    icon: youtubeIcon,
    iconBg: "linear-gradient(145deg, #ffffff 0%, #fff2f2 100%)",
    iconBorder: "rgba(255, 0, 0, 0.15)",
  },
};

const NAV = [
  { id: "instagram" as const, label: "Instagram", icon: instagramIcon },
  { id: "tiktok" as const, label: "TikTok", icon: tiktokIcon },
  { id: "twitter" as const, label: "X / Twitter", icon: twitterIcon },
  { id: "youtube" as const, label: "YouTube", icon: youtubeIcon },
];

/* 2.5D Isometric SVG Icons Matching Master Reference */
function Followers3DIcon({ platform }: { platform: PlatformId }) {
  const isIg = platform === "instagram";
  const primaryGrad = isIg ? "url(#igGradIcon)" : "url(#platGradIcon)";

  return (
    <svg width="68" height="68" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="cf-25d-icon">
      <defs>
        <linearGradient id="igGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#F56040" />
        </linearGradient>
        <linearGradient id="platGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <filter id="shadowFollowers" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#E1306C" floodOpacity="0.28" />
        </filter>
        <linearGradient id="basePlate" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f4f8" />
        </linearGradient>
      </defs>
      
      {/* 2.5D Base Plate */}
      <ellipse cx="36" cy="58" rx="26" ry="8" fill="rgba(225, 48, 108, 0.12)" />
      
      {/* Main Avatar 2.5D Node */}
      <g filter="url(#shadowFollowers)">
        {/* Head */}
        <circle cx="36" cy="23" r="11" fill={primaryGrad} />
        <ellipse cx="33" cy="18" rx="4" ry="2" fill="rgba(255,255,255,0.4)" />
        
        {/* Body Base */}
        <path
          d="M20 48 C20 38 27 36 36 36 C45 36 52 38 52 48 C52 52 48 54 36 54 C24 54 20 52 20 48 Z"
          fill={primaryGrad}
        />
        <path
          d="M24 45 C27 39 33 38 36 38 C39 38 45 39 48 45"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Mini Companion Avatar / Plus Badge */}
      <circle cx="51" cy="27" r="7.5" fill="#ffffff" stroke="rgba(225, 48, 108, 0.2)" strokeWidth="1.5" />
      <path d="M51 23.5 V30.5 M47.5 27 H54.5" stroke={primaryGrad} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Likes3DIcon({ platform }: { platform: PlatformId }) {
  const isIg = platform === "instagram";
  const primaryGrad = isIg ? "url(#igHeartGrad)" : "url(#platHeartGrad)";

  return (
    <svg width="68" height="68" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="cf-25d-icon">
      <defs>
        <linearGradient id="igHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF416C" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#FF4B2B" />
        </linearGradient>
        <linearGradient id="platHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <filter id="shadowLikes" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#FF416C" floodOpacity="0.32" />
        </filter>
      </defs>

      <ellipse cx="36" cy="58" rx="24" ry="7" fill="rgba(255, 65, 108, 0.14)" />

      {/* 2.5D Heart Volume with Isometric Perspective */}
      <g filter="url(#shadowLikes)">
        {/* Heart 3D Back/Extrusion */}
        <path
          d="M36 53.5 C36 53.5 15 39 15 25.5 C15 17.5 21.5 12 28.5 12 C32.5 12 35.5 14.5 36 16 C36.5 14.5 39.5 12 43.5 12 C50.5 12 57 17.5 57 25.5 C57 39 36 53.5 36 53.5 Z"
          fill={primaryGrad}
        />
        {/* Glass Sheen Top Arc */}
        <path
          d="M20 22 C20 16.5 24 14 28 14 C31 14 33.5 16 35 18"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="48" cy="18" r="2" fill="rgba(255,255,255,0.7)" />
      </g>
    </svg>
  );
}

function Views3DIcon({ platform }: { platform: PlatformId }) {
  const isIg = platform === "instagram";
  const primaryGrad = isIg ? "url(#igEyeGrad)" : "url(#platEyeGrad)";

  return (
    <svg width="68" height="68" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="cf-25d-icon">
      <defs>
        <linearGradient id="igEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="50%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#5B51D8" />
        </linearGradient>
        <linearGradient id="platEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <filter id="shadowViews" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#833AB4" floodOpacity="0.26" />
        </filter>
      </defs>

      <ellipse cx="36" cy="58" rx="25" ry="7" fill="rgba(131, 58, 180, 0.12)" />

      <g filter="url(#shadowViews)">
        {/* Outer Eye 3D Contour */}
        <path
          d="M12 36 C18 22 54 22 60 36 C54 50 18 50 12 36 Z"
          fill="#ffffff"
          stroke={primaryGrad}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Iris */}
        <circle cx="36" cy="36" r="10" fill={primaryGrad} />
        {/* Pupil & Reflection */}
        <circle cx="36" cy="36" r="5" fill="#260438" />
        <circle cx="33" cy="33" r="2.5" fill="#ffffff" />
      </g>
    </svg>
  );
}

function Comments3DIcon({ platform }: { platform: PlatformId }) {
  const isIg = platform === "instagram";
  const primaryGrad = isIg ? "url(#igCommentGrad)" : "url(#platCommentGrad)";

  return (
    <svg width="68" height="68" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="cf-25d-icon">
      <defs>
        <linearGradient id="igCommentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#405DE6" />
          <stop offset="45%" stopColor="#833AB4" />
          <stop offset="100%" stopColor="#E1306C" />
        </linearGradient>
        <linearGradient id="platCommentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <filter id="shadowComments" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#405DE6" floodOpacity="0.25" />
        </filter>
      </defs>

      <ellipse cx="36" cy="58" rx="24" ry="7" fill="rgba(64, 93, 230, 0.12)" />

      <g filter="url(#shadowComments)">
        {/* Chat Bubble Isometric Bubble */}
        <path
          d="M15 32 C15 20.5 24.5 13 36 13 C47.5 13 57 20.5 57 32 C57 43.5 47.5 50 36 50 C31.5 50 27.5 48.8 24 47 L15 51 L17.5 42.5 C16 39.5 15 36 15 32 Z"
          fill={primaryGrad}
        />
        {/* 3 Dialog Dots */}
        <circle cx="28" cy="31.5" r="2.8" fill="#ffffff" />
        <circle cx="36" cy="31.5" r="2.8" fill="#ffffff" />
        <circle cx="44" cy="31.5" r="2.8" fill="#ffffff" />
      </g>
    </svg>
  );
}

const SERVICES = [
  {
    id: "followers",
    title: "Followers",
    description: "High quality real followers.",
    iconComponent: Followers3DIcon,
    bestSeller: true,
  },
  {
    id: "likes",
    title: "Likes",
    description: "Instant post likes from real users.",
    iconComponent: Likes3DIcon,
  },
  {
    id: "views",
    title: "Views",
    description: "Boost video views and reach.",
    iconComponent: Views3DIcon,
  },
  {
    id: "comments",
    title: "Comments",
    description: "Custom relevant comments.",
    iconComponent: Comments3DIcon,
  },
];

export default function PlatformPage() {
  const router = useRouter();
  const params = useParams<{ platform: string }>();
  const platform = (params?.platform && params.platform in THEMES
    ? params.platform
    : "instagram") as PlatformId;
  const theme = THEMES[platform];
  const [lookupService, setLookupService] = useState<string | null>(null);

  return (
    <main
      className={`cf-page cf-platform-${platform}`}
      style={
        {
          "--accent": theme.accent,
          "--accent-2": theme.accent2,
          "--pale": theme.pale,
          "--gradient": theme.gradient,
          "--btn-gradient": theme.btnGradient,
          "--badge-gradient": theme.badgeGradient,
          "--icon-bg": theme.iconBg,
          "--icon-border": theme.iconBorder,
        } as React.CSSProperties
      }
    >
      {/* Decorative background and ambiance elements */}
      <div className="cf-ambiance" aria-hidden="true">
        <div className="cf-orb cf-orb-top-left" />
        <div className="cf-orb cf-orb-top-right" />
        <div className="cf-orb cf-orb-bottom-center" />
        <div className="cf-bg-graphic cf-bg-graphic-1" />
        <div className="cf-bg-graphic cf-bg-graphic-2" />
        <div className="cf-bg-line-1" />
        <div className="cf-bg-line-2" />
        <div className="cf-floating-badge cf-float-1">
          <span className="cf-floating-badge-icon">👥</span>
          <span>+1.5K followers</span>
        </div>
        <div className="cf-floating-badge cf-float-2">
          <span className="cf-floating-badge-icon">❤️</span>
          <span>+850 likes</span>
        </div>
        <div className="cf-floating-badge cf-float-3">
          <span className="cf-floating-badge-icon">🔥</span>
          <span>Trending now</span>
        </div>
        <div className="cf-floating-badge cf-float-4">
          <span className="cf-floating-badge-icon">⚡</span>
          <span>Instant boost</span>
        </div>
      </div>

      <div className="cf-layout-container">
        {/* Header: Back Button, Brand Logo, Support / Menu */}
        <header className="cf-top-bar">
          <button
            className="cf-back-button"
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Link href="/" className="cf-brand-logo">
            <span className="cf-brand-text">
              Clout<span className="cf-brand-bold">Flow</span>
            </span>
            <div className="cf-brand-arrow-pill">
              <ArrowUpRight className="w-3 h-3 text-white" />
            </div>
          </Link>

          <div className="cf-header-right-action" onClick={() => router.push("/")}>
            <Headphones className="w-5 h-5" />
          </div>
        </header>

        {/* Platform Selector */}
        <nav className="cf-tabs-wrapper" aria-label="Social Platforms">
          <div className="cf-tabs-pill">
            {NAV.map((item) => {
              const isActive = item.id === platform;
              return (
                <Link
                  key={item.id}
                  href={`/${item.id}`}
                  className={`cf-tab-item ${isActive ? "active" : ""}`}
                >
                  <div className="cf-tab-icon-box">
                    <Image
                      src={item.icon}
                      alt=""
                      width={18}
                      height={18}
                      className="cf-tab-icon"
                      priority
                    />
                  </div>
                  <span className="cf-tab-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="cf-hero">
          <h1 className="cf-hero-title">
            Grow Your{" "}
            <span className="cf-hero-gradient-text">
              {theme.name}
            </span>
          </h1>
          <p className="cf-hero-subtitle">
            Choose a service below to boost your Instagram presence with real, high-quality results.
          </p>
        </section>

        {/* 4 Master Service Cards */}
        <section className="cf-cards-grid" aria-label={`${theme.name} services`}>
          {SERVICES.map(({ id, title, description, iconComponent: IconComp, bestSeller }) => {
            const ctaText =
              platform === "youtube" && id === "followers"
                ? "Get Subscribers"
                : `Get ${title}`;

            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => setLookupService(id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLookupService(id);
                  }
                }}
                className={`cf-card-wrap ${bestSeller ? "has-best-seller" : ""}`}
              >
                <div className="cf-card-bg-pattern" />
                <div className="cf-card-inner">
                  {/* Floating Best Seller Badge */}
                  {bestSeller && (
                    <div className="cf-best-seller-badge">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>BEST SELLER</span>
                    </div>
                  )}

                  {/* 2.5D Master Icon Platform Box */}
                  <div className="cf-icon-container">
                    <div className="cf-icon-glow" />
                    <IconComp platform={platform} />
                  </div>

                  {/* Service Title & Description */}
                  <h2 className="cf-card-title">{title}</h2>
                  <p className="cf-card-desc">{description}</p>

                  {/* Master CTA Button with full width */}
                  <div className="cf-card-cta">
                    <span className="cf-cta-label">{ctaText}</span>
                    <ArrowRight className="w-4 h-4 cf-cta-arrow" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Trust Bar (4 items with detailed subtitles) */}
        <section className="cf-trust-bar" aria-label="Security and Guarantee Features">
          <div className="cf-trust-item">
            <div className="cf-trust-icon-wrap">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="cf-trust-text-block">
              <span className="cf-trust-title">100% Safe &amp; Secure</span>
              <span className="cf-trust-desc">No risk to your account</span>
            </div>
          </div>

          <div className="cf-trust-item">
            <div className="cf-trust-icon-wrap">
              <LockKeyhole className="w-5 h-5 text-blue-500" />
            </div>
            <div className="cf-trust-text-block">
              <span className="cf-trust-title">No Password</span>
              <span className="cf-trust-desc">Only username needed</span>
            </div>
          </div>

          <div className="cf-trust-item">
            <div className="cf-trust-icon-wrap">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="cf-trust-text-block">
              <span className="cf-trust-title">Fast Delivery</span>
              <span className="cf-trust-desc">Starts within minutes</span>
            </div>
          </div>

          <div className="cf-trust-item">
            <div className="cf-trust-icon-wrap">
              <Headphones className="w-5 h-5 text-purple-500" />
            </div>
            <div className="cf-trust-text-block">
              <span className="cf-trust-title">24/7 Support</span>
              <span className="cf-trust-desc">Always here to help</span>
            </div>
          </div>
        </section>

        {/* Security Statement Footer */}
        <footer className="cf-security-footer">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span className="cf-security-text">
            Guaranteed safe &amp; secure delivery • 256-bit encryption
          </span>
        </footer>
      </div>

      {/* Preserved Modal Functionality */}
      <ProfileLookupModal
        platform={platform}
        service={lookupService || "followers"}
        open={Boolean(lookupService)}
        onClose={() => setLookupService(null)}
        onContinue={() => {
          const service = lookupService || "followers";
          setLookupService(null);
          router.push(`/${platform}/${service}`);
        }}
      />
      {/* 2.5D Isometric SVG Icons Matching Master Reference */}
      <style jsx global>{`
        /* ========================================================
           CLOUTFLOW V70 REDESIGN STYLES
           ======================================================== */
        .cf-page {
          min-height: 100vh;
          background-color: #fafbfe;
          background-image: 
            radial-gradient(at 0% 0%, rgba(225, 48, 108, 0.05) 0px, transparent 40%),
            radial-gradient(at 100% 0%, rgba(131, 58, 180, 0.06) 0px, transparent 40%),
            radial-gradient(at 100% 100%, rgba(245, 96, 64, 0.04) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(131, 58, 180, 0.04) 0px, transparent 50%);
          color: #0b132b;
          position: relative;
          overflow-x: hidden;
          padding: 0 16px 40px;
          font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .cf-layout-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        /* Ambient elements matching image */
        .cf-ambiance {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }
        
        .cf-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.8;
        }
        
        .cf-orb-top-left {
          width: 500px;
          height: 500px;
          top: -200px;
          left: -150px;
          background: rgba(131, 58, 180, 0.15);
        }
        
        .cf-orb-top-right {
          width: 450px;
          height: 450px;
          top: -150px;
          right: -100px;
          background: rgba(225, 48, 108, 0.12);
        }
        
        .cf-orb-bottom-center {
          width: 600px;
          height: 400px;
          bottom: -200px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(245, 96, 64, 0.1);
        }

        /* Abstract UI elements mimicking the background graphics */
        .cf-bg-graphic {
          position: absolute;
          z-index: 1;
          opacity: 0.8;
        }
        
        .cf-bg-graphic-1 {
          top: 180px;
          left: 4%;
          width: 280px;
          height: 180px;
          background-image: 
            radial-gradient(#d1d5db 1.5px, transparent 1.5px);
          background-size: 16px 16px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }
        
        .cf-bg-graphic-2 {
          top: 250px;
          right: 3%;
          width: 320px;
          height: 200px;
          background-image: 
            radial-gradient(#d1d5db 1.5px, transparent 1.5px);
          background-size: 16px 16px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }

        .cf-bg-line-1 {
          position: absolute;
          top: 300px;
          left: -10%;
          width: 120%;
          height: 400px;
          border: 1px dashed rgba(225, 48, 108, 0.15);
          border-radius: 50%;
          transform: rotate(-15deg);
        }

        .cf-bg-line-2 {
          position: absolute;
          top: 200px;
          left: -10%;
          width: 120%;
          height: 600px;
          border: 1px dashed rgba(131, 58, 180, 0.15);
          border-radius: 50%;
          transform: rotate(5deg);
        }

        /* Floating badges matching the image exactly */
        .cf-floating-badge {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 8px 16px;
          border-radius: 100px;
          box-shadow: 
            0 10px 25px -5px rgba(0, 0, 0, 0.05),
            0 8px 10px -6px rgba(0, 0, 0, 0.01),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          border: 1px solid rgba(226, 232, 240, 0.7);
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          animation: floatFloaty 7s ease-in-out infinite alternate;
        }
        
        .cf-floating-badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--pale);
          font-size: 11px;
        }

        .cf-float-1 {
          top: 130px;
          left: 12%;
          animation-delay: 0s;
        }
        
        .cf-float-2 {
          top: 220px;
          right: 15%;
          animation-delay: 1.5s;
        }
        
        .cf-float-3 {
          top: 450px;
          left: 5%;
          animation-delay: 3s;
        }
        
        .cf-float-4 {
          top: 500px;
          right: 5%;
          animation-delay: 4.5s;
        }

        @keyframes floatFloaty {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
          100% { transform: translateY(5px) rotate(-1deg); }
        }

        /* Header matching home page style */
        .cf-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 32px;
        }
        
        .cf-back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }
        
        .cf-back-button:hover {
          color: #0f172a;
          border-color: #cbd5e1;
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04);
        }
        
        .cf-back-button span {
          display: none;
        }

        .cf-brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          padding: 6px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 100px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          transition: transform 0.2s;
        }
        
        .cf-brand-logo:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .cf-brand-text {
          font-size: 17px;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: #0f172a;
        }
        
        .cf-brand-bold {
          font-weight: 800;
        }
        
        .cf-brand-arrow-pill {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .cf-header-right-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }
        
        .cf-header-right-action:hover {
          color: #0f172a;
          background: #f8fafc;
        }

        /* Platform Selector Tabs */
        .cf-tabs-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        
        .cf-tabs-pill {
          display: inline-flex;
          align-items: center;
          background: #ffffff;
          padding: 4px;
          border-radius: 100px;
          border: 1px solid #e2e8f0;
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.03),
            0 1px 3px rgba(0, 0, 0, 0.02);
          gap: 4px;
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        
        .cf-tabs-pill::-webkit-scrollbar {
          display: none;
        }
        
        .cf-tab-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px 8px 12px;
          border-radius: 100px;
          text-decoration: none;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .cf-tab-item:hover:not(.active) {
          color: #334155;
          background: #f8fafc;
        }
        
        .cf-tab-item.active {
          color: #0f172a;
          background: #f1f5f9;
        }
        
        .cf-tab-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .cf-tab-icon {
          width: 14px;
          height: 14px;
          object-fit: contain;
        }

        /* Hero */
        .cf-hero {
          text-align: center;
          margin-bottom: 56px;
          position: relative;
        }
        
        .cf-hero-title {
          font-size: clamp(36px, 5vw, 48px);
          font-weight: 850;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin: 0 0 16px;
          line-height: 1.1;
        }
        
        .cf-hero-gradient-text {
          background-image: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          padding-right: 2px;
        }
        
        .cf-hero-subtitle {
          font-size: clamp(16px, 2.5vw, 18px);
          color: #64748b;
          margin: 0 auto;
          font-weight: 500;
          max-width: 500px;
          line-height: 1.5;
        }

        /* Redesigned Service Cards exactly matching image */
        .cf-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 56px;
        }
        
        @media (max-width: 1024px) {
          .cf-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }
        
        @media (max-width: 640px) {
          .cf-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .cf-card-wrap {
          position: relative;
          background: #ffffff;
          border-radius: 28px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #e2e8f0;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.02),
            0 10px 30px -10px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .cf-card-wrap:hover {
          transform: translateY(-8px);
          border-color: rgba(225, 48, 108, 0.2);
          box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.02),
            0 20px 40px -12px rgba(225, 48, 108, 0.15);
        }
        
        .cf-card-wrap.has-best-seller {
          border: 2px solid rgba(225, 48, 108, 0.2);
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.02),
            0 15px 35px -10px rgba(225, 48, 108, 0.1);
        }
        
        .cf-card-wrap.has-best-seller:hover {
          border-color: rgba(225, 48, 108, 0.4);
          box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.02),
            0 25px 45px -12px rgba(225, 48, 108, 0.25);
        }

        .cf-card-inner {
          position: relative;
          padding: 32px 24px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: 100%;
          z-index: 2;
        }

        /* Abstract card background pattern */
        .cf-card-bg-pattern {
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          background: radial-gradient(circle at top right, var(--pale) 0%, transparent 70%);
          z-index: 1;
          opacity: 0.6;
          border-radius: 0 28px 0 0;
        }

        .cf-best-seller-badge {
          position: absolute;
          top: 16px;
          background: var(--badge-gradient);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 6px 14px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(225, 48, 108, 0.3);
          z-index: 5;
        }
        
        .cf-best-seller-badge svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }

        .cf-icon-container {
          position: relative;
          width: 110px;
          height: 110px;
          margin-top: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
        }
        
        .cf-card-wrap:hover .cf-icon-container {
          transform: scale(1.1) rotate(2deg) translateY(-5px);
        }
        
        .cf-25d-icon {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 15px 15px rgba(0,0,0,0.05));
        }
        
        .cf-icon-glow {
          position: absolute;
          width: 60%;
          height: 60%;
          border-radius: 50%;
          background: var(--accent);
          filter: blur(25px);
          opacity: 0.15;
          z-index: 1;
          top: 20%;
          left: 20%;
        }

        .cf-card-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }
        
        .cf-card-desc {
          font-size: 15px;
          color: #64748b;
          margin: 0 0 28px;
          line-height: 1.5;
          font-weight: 500;
          min-height: 45px;
        }

        /* Full width CTA Button */
        .cf-card-cta {
          width: 100%;
          margin-top: auto;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .cf-card-wrap:hover .cf-card-cta {
          background: var(--btn-gradient);
          border-color: transparent;
          box-shadow: 0 8px 20px -5px rgba(225, 48, 108, 0.4);
        }
        
        .cf-cta-label {
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          transition: color 0.3s ease;
        }
        
        .cf-card-wrap:hover .cf-cta-label {
          color: #ffffff;
        }
        
        .cf-cta-arrow {
          color: #64748b;
          transition: all 0.3s ease;
        }
        
        .cf-card-wrap:hover .cf-cta-arrow {
          color: #ffffff;
          transform: translateX(4px) scale(1.1);
        }

        /* Trust Bar */
        .cf-trust-bar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
          box-shadow: 
            0 4px 15px rgba(0, 0, 0, 0.02),
            0 1px 3px rgba(0, 0, 0, 0.01);
        }
        
        @media (max-width: 860px) {
          .cf-trust-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 500px) {
          .cf-trust-bar {
            grid-template-columns: 1fr;
          }
        }

        .cf-trust-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 10px;
        }
        
        .cf-trust-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        
        .cf-trust-item:hover .cf-trust-icon-wrap {
          transform: scale(1.05);
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        
        .cf-trust-text-block {
          display: flex;
          flex-direction: column;
        }
        
        .cf-trust-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }
        
        .cf-trust-desc {
          font-size: 12.5px;
          font-weight: 500;
          color: #64748b;
        }

        /* Security Footer */
        .cf-security-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .cf-security-text {
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b;
        }
      `}</style>
    </main>
  );
}
