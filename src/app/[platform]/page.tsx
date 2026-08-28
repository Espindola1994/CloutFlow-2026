"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Headphones,
  Heart,
  Lock,
  LockKeyhole,
  MessageCircleMore,
  Play,
  ShieldCheck,
  Star,
  UserRoundPlus,
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
  icon: any;
};

const THEMES: Record<PlatformId, PlatformTheme> = {
  instagram: {
    name: "Instagram",
    shortName: "Instagram",
    accent: "#E1306C",
    accent2: "#F56040",
    pale: "#FFF0F5",
    gradient: "linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)",
    icon: instagramIcon,
  },
  tiktok: {
    name: "TikTok",
    shortName: "TikTok",
    accent: "#000000",
    accent2: "#FE2C55",
    pale: "#FFF0F3",
    gradient: "linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)",
    icon: tiktokIcon,
  },
  twitter: {
    name: "X / Twitter",
    shortName: "X / Twitter",
    accent: "#0F1419",
    accent2: "#536471",
    pale: "#f7f9fa",
    gradient: "linear-gradient(135deg, #0F1419 0%, #272C30 100%)",
    icon: twitterIcon,
  },
  youtube: {
    name: "YouTube",
    shortName: "YouTube",
    accent: "#ff0000",
    accent2: "#cc0000",
    pale: "#fff0f0",
    gradient: "linear-gradient(90deg,#ff0000 0%,#cc0000 100%)",
    icon: youtubeIcon,
  },
};

const NAV = [
  { id: "instagram" as const, label: "Instagram", icon: instagramIcon },
  { id: "tiktok" as const, label: "TikTok", icon: tiktokIcon },
  { id: "twitter" as const, label: "X / Twitter", icon: twitterIcon },
  { id: "youtube" as const, label: "YouTube", icon: youtubeIcon },
];


const SERVICES = [
  {
    id: "followers",
    title: "Followers",
    description: "High quality real followers.",
    Icon: UserRoundPlus,
    bestSeller: true,
  },
  {
    id: "likes",
    title: "Likes",
    description: "Instant post likes from real users.",
    Icon: Heart,
  },
  {
    id: "views",
    title: "Views",
    description: "Boost video views and reach.",
    Icon: Play,
  },
  {
    id: "comments",
    title: "Comments",
    description: "Custom relevant comments.",
    Icon: MessageCircleMore,
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
      className={`cf-service-page cf-platform-${platform}`}
      style={
        {
          "--accent": theme.accent,
          "--accent-2": theme.accent2,
          "--pale": theme.pale,
          "--gradient": theme.gradient,
        } as React.CSSProperties
      }
    >
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

      <header className="cf-service-header">
        <button className="cf-service-back cf-back-link" type="button" onClick={() => router.push("/")}>
          <ArrowLeft className="cf-back-link-icon" />
          <span>Back to Home</span>
        </button>

        <div className="cf-v80-brand-line cf-service-brand-line" aria-label="Grow. Engage. Get Noticed.">
          <span className="cf-v80-brand-star" aria-hidden="true">✦</span>
          <span>Grow. Engage. Get Noticed.</span>
        </div>
      </header>

      <nav className="cf-service-tabs" aria-label="Choose social platform">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={`/${item.id}`}
            className={`cf-service-tab cf-tab-${item.id} ${item.id === platform ? "active" : ""}`}
          >
            <Image src={item.icon} alt="" width={34} height={34} priority />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <section className="cf-service-shell">
        

        <section className="cf-service-hero">
          <h1>
            <span className="cf-service-hero-prefix">Grow Your</span>{" "}
            <span className="cf-service-hero-platform" style={{ backgroundImage: theme.gradient }}>{theme.name}</span>
          </h1>
          <p>Choose a service and start growing today.</p>
        </section>

        <section className="cf-service-grid" aria-label={`${theme.name} services`}>
          {SERVICES.map(({ id, title, description, bestSeller }) => {
            const serviceCtaLabel =
              platform === "youtube" && id === "followers"
                ? "Get Subscribers"
                : `Get ${title}`;

            return (
              <button key={id} type="button" onClick={() => setLookupService(id)} className="cf-service-card-link cf-service-card-button">
                <article className="cf-service-card">
                  {bestSeller && (
                    <div className="cf-service-best">
                      <Star fill="currentColor" />
                      <span>Best Seller</span>
                    </div>
                  )}

                  <div className={`cf-service-icon cf-service-icon-25d cf-service-icon-${id} cf-service-icon-raster`}>
                    <Image
                      src={`/icons/service-25d/${platform}/${id}.png`}
                      alt=""
                      width={256}
                      height={256}
                      unoptimized
                      className="cf-service-icon-raster-img"
                      priority
                    />
                  </div>

                  <h2>{title}</h2>
                  <p>{description}</p>

                  <div className={`cf-service-cta cf-service-cta-${platform}`}>
                    <span className="cf-service-cta-text">{serviceCtaLabel}</span>
                    <span className="cf-service-cta-circle-wrap">
                      <span className="cf-service-cta-circle">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </span>
                  </div>
                </article>
              </button>
            );
          })}
        </section>

        <section className="cf-v80-trustbar cf-service-home-trustbar" aria-label="Service benefits">
          <div><span className="cf-v80-benefit-icon cf-v80-benefit-purple"><ShieldCheck /></span><span>100% Safe &amp; Secure</span></div>
          <div><span className="cf-v80-benefit-icon cf-v80-benefit-blue"><LockKeyhole /></span><span>No Password Required</span></div>
          <div><span className="cf-v80-benefit-icon cf-v80-benefit-green"><Zap /></span><span>Fast Delivery</span></div>
          <div><span className="cf-v80-benefit-icon cf-v80-benefit-orange"><Headphones /></span><span>24/7 Support</span></div>
        </section>

      </section>

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

      <style jsx global>{`
        .cf-service-page{
          min-height:100vh;
          background:
            radial-gradient(ellipse 72% 44% at 50% 22%,rgba(222,232,255,.55) 0%,rgba(242,246,255,.40) 34%,rgba(255,255,255,0) 72%),
            linear-gradient(180deg,#fbfcff 0%,#fff 54%,#fcfbff 100%);
          color:#081126;
          position:relative;
          overflow:hidden;
          padding:0 24px 28px;
          font-family:var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          isolation:isolate;
        }
        .cf-service-page *{box-sizing:border-box}
        .cf-service-card-button{
          appearance:none;
          -webkit-appearance:none;
          border:0;
          background:transparent;
          padding:0;
          margin:0;
          width:100%;
          font:inherit;
          color:inherit;
          text-align:inherit;
          cursor:pointer;
        }

        .cf-service-header{
          width:min(100%,1200px);
          height:92px;
          margin:0 auto;
          display:grid;
          grid-template-columns:1fr auto 1fr;
          align-items:center;
          position:relative;
          z-index:4;
        }
        .cf-service-back{
          justify-self:start;
          display:inline-flex;
          align-items:center;
          gap:9px;
          border:0;
          background:transparent;
          color:#0b1326;
          font-size:16px;
          font-weight:700;
          padding:10px 6px;
          cursor:pointer;
        }
        .cf-service-back svg{width:20px;height:20px}
        .cf-service-brand-line{
          grid-column:3;
          justify-self:end;
        }
        .cf-service-logo{
          justify-self:center;
          display:inline-flex;
          align-items:center;
          text-decoration:none;
          color:#081126;
          font-size:34px;
          font-weight:900;
          letter-spacing:-1.5px;
        }
        .cf-service-logo b{color:#1376ff}
        .cf-service-logo svg{width:17px;height:17px;color:#1376ff;margin-left:-2px;margin-top:-15px;stroke-width:2.7}
        .cf-service-brandmark{
          justify-self:end;
          color:#1376ff;
          font-size:25px;
        }

        .cf-service-tabs{
          width:min(100%,960px);
          min-height:92px;
          margin:0 auto;
          padding:8px 10px;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          align-items:center;
          border:1px solid #e3e8ef;
          border-radius:28px;
          background:#fffffff2;
          box-shadow:0 14px 32px rgba(36,51,79,.12);
          position:relative;
          z-index:4;
        }
        .cf-service-tab{
          min-width:0;
          min-height:72px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:16px;
          text-decoration:none;
          color:#35415a;
          font-size:17px;
          font-weight:700;
          border-radius:13px;
          transition:.2s ease;
        }
        .cf-service-tab img{width:38px!important;height:38px!important;object-fit:contain}
        .cf-service-tab.active{
          color:var(--accent);
          background:var(--pale);
          box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 36%,transparent);
        }

        /* TikTok Active Platform Tab */
        .cf-service-tab.cf-tab-tiktok.active{
          color:#000000!important;
          border:1.5px solid transparent!important;
          background:
            linear-gradient(#fff,#fff) padding-box,
            linear-gradient(
              135deg,
              rgba(37, 244, 238, 0.72) 0%,
              rgba(254, 44, 85, 0.72) 100%
            ) border-box!important;
          box-shadow:-2px 3px 10px rgba(37,244,238,0.07), 2px 3px 10px rgba(254,44,85,0.07)!important;
        }

        .cf-service-tab.cf-tab-tiktok:hover:not(.active){
          color:#000000;
          background:rgba(255,240,243,.6);
          box-shadow:-1px 2px 8px rgba(37,244,238,0.05), 1px 2px 8px rgba(254,44,85,0.05);
        }

        /* YouTube Active Platform Tab: Red accent border, soft background and clean depth */
        .cf-service-tab.cf-tab-youtube{
          transition:background-color .18s ease, border-color .18s ease, box-shadow .18s ease, color .18s ease!important;
        }

        .cf-service-tab.cf-tab-youtube.active{
          color:#FF0000!important;
          border:1.5px solid rgba(255, 0, 0, 0.58)!important;
          background:rgba(255, 0, 0, 0.035)!important;
          box-shadow:0 3px 10px rgba(255, 0, 0, 0.045)!important;
        }

        .cf-service-tab.cf-tab-youtube.active:hover{
          background:rgba(255, 0, 0, 0.05)!important;
          border-color:rgba(255, 0, 0, 0.72)!important;
          box-shadow:0 4px 12px rgba(255, 0, 0, 0.065)!important;
        }

        .cf-service-tab.cf-tab-youtube:hover:not(.active){
          color:#FF0000!important;
          background:rgba(255, 0, 0, 0.018)!important;
          border-color:rgba(255, 0, 0, 0.24)!important;
          box-shadow:0 2px 6px rgba(255, 0, 0, 0.03)!important;
        }

        /* X / Twitter Active Platform Tab: Monochrome premium border, soft background and subtle depth */
        .cf-service-tab.cf-tab-twitter{
          transition:background-color .18s ease, border-color .18s ease, box-shadow .18s ease, color .18s ease!important;
        }

        .cf-service-tab.cf-tab-twitter.active{
          color:#0F1419!important;
          border:1.5px solid rgba(15, 20, 25, 0.70)!important;
          background:rgba(15, 20, 25, 0.035)!important;
          box-shadow:0 3px 10px rgba(15, 20, 25, 0.055)!important;
        }

        .cf-service-tab.cf-tab-twitter.active:hover{
          background:rgba(15, 20, 25, 0.055)!important;
          border-color:rgba(15, 20, 25, 0.82)!important;
          box-shadow:0 4px 12px rgba(15, 20, 25, 0.075)!important;
        }

        .cf-service-tab.cf-tab-twitter:hover:not(.active){
          color:#0F1419!important;
          background:rgba(15, 20, 25, 0.025)!important;
          border-color:rgba(15, 20, 25, 0.30)!important;
          box-shadow:0 2px 6px rgba(15, 20, 25, 0.03)!important;
        }

        /* Instagram Active Platform Tab: High fidelity gradient border & soft background */
        .cf-service-tab.cf-tab-instagram.active{
          color:#E1306C!important;
          border:1.5px solid transparent!important;
          background:
            linear-gradient(#fff,#fff) padding-box,
            linear-gradient(
              135deg,
              #833AB4 0%,
              #C13584 28%,
              #E1306C 52%,
              #F56040 76%,
              #FCAF45 100%
            ) border-box!important;
          box-shadow:0 4px 14px rgba(225,48,108,.10)!important;
        }

        .cf-service-tab.cf-tab-instagram:hover:not(.active){
          color:#E1306C;
          background:rgba(255,240,245,.6);
          box-shadow:0 2px 8px rgba(225,48,108,.06);
        }

        .cf-service-shell{
          width:min(100%,1200px);
          margin:0 auto;
          padding:92px 0 10px;
          position:relative;
          z-index:3;
        }
        .cf-service-trusted{
          width:max-content;
          max-width:100%;
          margin:0 auto 26px;
          padding:9px 16px;
          border-radius:999px;
          display:flex;
          align-items:center;
          gap:8px;
          color:#0b67e8;
          background:linear-gradient(90deg,#eff6ff,#f5f1ff);
          font-size:13px;
          font-weight:700;
        }
        .cf-service-trusted svg{width:16px;height:16px;fill:#1376ff;color:#1376ff}

        .cf-service-hero{text-align:center}
        .cf-service-hero h1{
          margin:0;
          font-size:78px;
          line-height:1;
          letter-spacing:-4.6px;
          font-weight:900;
          color:#091127;
        }
        .cf-service-hero h1 span{
          background-clip:text;
          -webkit-background-clip:text;
          color:transparent;
        }
        .cf-service-hero p{
          margin:24px auto 0;
          color:#637088;
          font-size:24px;
          line-height:1.35;
        }

        .cf-service-grid{
          margin:60px auto 0;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:28px;
        }
        .cf-service-card-link{text-decoration:none;color:inherit;min-width:0}
        .cf-service-card{
          min-height:420px;
          position:relative;
          padding:54px 28px 28px;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          border:1.5px solid color-mix(in srgb,var(--accent) 34%,#e7e9ee);
          border-radius:24px;
          background:
            linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.99));
          box-shadow:
            0 13px 30px color-mix(in srgb,var(--accent) 8%,transparent),
            inset 0 1px 0 rgba(255,255,255,.8);
          transition:transform .2s ease,box-shadow .2s ease;
        }
        .cf-service-card:hover{
          transform:translateY(-3px);
          box-shadow:
            0 18px 34px color-mix(in srgb,var(--accent) 12%,transparent),
            inset 0 1px 0 rgba(255,255,255,.9);
        }

        /* Instagram Card: Reusing the exact Home Instagram card border, background and shadow system */
        .cf-platform-instagram .cf-service-card{
          border:1.5px solid transparent!important;
          background:
            linear-gradient(#fff,#fff) padding-box,
            linear-gradient(
              135deg,
              #833AB4 0%,
              #C13584 28%,
              #E1306C 52%,
              #F56040 76%,
              #FCAF45 100%
            ) border-box!important;
          box-shadow:0 8px 20px rgba(225,48,108,.08)!important;
        }
        .cf-platform-instagram .cf-service-card:hover{
          transform:translateY(-3px);
          box-shadow:0 12px 28px rgba(225,48,108,.14)!important;
        }

        /* TikTok Card: Elegant dual-accent border & subtle black shadow */
        .cf-platform-tiktok .cf-service-card{
          border:1.5px solid transparent!important;
          background:
            linear-gradient(#fff,#fff) padding-box,
            linear-gradient(
              135deg,
              rgba(37, 244, 238, 0.72) 0%,
              rgba(254, 44, 85, 0.72) 100%
            ) border-box!important;
          box-shadow:-2px 3px 10px rgba(37,244,238,0.07), 2px 3px 10px rgba(254,44,85,0.07)!important;
        }
        .cf-platform-tiktok .cf-service-card:hover{
          transform:translateY(-3px);
          box-shadow:-3px 5px 14px rgba(37,244,238,0.10), 3px 5px 14px rgba(254,44,85,0.10)!important;
        }

        /* X / Twitter Card: Monochrome premium graphite border & subtle shadow */
        .cf-platform-twitter .cf-service-card{
          border:1.5px solid rgba(15, 20, 25, 0.55)!important;
          background:#ffffff!important;
          box-shadow:0 4px 12px rgba(15, 20, 25, 0.06)!important;
          transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease!important;
        }
        .cf-platform-twitter .cf-service-card:hover{
          border-color:rgba(15, 20, 25, 0.82)!important;
          transform:translateY(-3px);
          box-shadow:0 6px 16px rgba(15, 20, 25, 0.10)!important;
        }

        /* YouTube Card: Clean red accent border & soft depth */
        .cf-platform-youtube .cf-service-card{
          border:1.5px solid rgba(255, 0, 0, 0.52)!important;
          background:#ffffff!important;
          box-shadow:0 4px 12px rgba(255, 0, 0, 0.045)!important;
          transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease!important;
        }
        .cf-platform-youtube .cf-service-card:hover{
          border-color:rgba(255, 0, 0, 0.76)!important;
          transform:translateY(-3px);
          box-shadow:0 6px 16px rgba(255, 0, 0, 0.055)!important;
        }

        .cf-service-best{
          position:absolute;
          left:46px;
          top:-20px;
          min-height:48px;
          padding:0 20px;
          display:flex;
          align-items:center;
          gap:7px;
          color:#fff;
          background:var(--gradient);
          border-radius:10px 10px 3px 3px;
          box-shadow:0 8px 18px color-mix(in srgb,var(--accent) 18%,transparent);
          font-size:14px;
          font-weight:900;
          letter-spacing:.2px;
        }
        .cf-platform-instagram .cf-service-best{
          background:linear-gradient(
            90deg,
            #833AB4 0%,
            #C13584 26%,
            #E1306C 50%,
            #F56040 74%,
            #FCAF45 100%
          )!important;
          box-shadow:0 5px 12px rgba(225,48,108,.13)!important;
        }
        .cf-platform-tiktok .cf-service-best{
          background:#000000!important;
          color:#ffffff!important;
          box-shadow:-2px 3px 8px rgba(37,244,238,0.12), 2px 3px 8px rgba(254,44,85,0.12)!important;
        }
        .cf-platform-twitter .cf-service-best{
          background:#0F1419!important;
          color:#ffffff!important;
          box-shadow:0 4px 12px rgba(15,20,25,0.14)!important;
        }
        .cf-platform-youtube .cf-service-best{
          background:#FF0000!important;
          color:#ffffff!important;
          box-shadow:0 4px 12px rgba(255,0,0,0.14)!important;
        }
        .cf-service-best svg{width:17px;height:17px}
        .cf-service-icon{
          width:92px;
          height:92px;
          display:grid;
          place-items:center;
          clip-path:none;
          border-radius:22px;
          background:var(--pale);
          color:var(--accent);
          border:1px solid color-mix(in srgb,var(--accent) 10%,transparent);
          box-shadow:0 5px 14px color-mix(in srgb,var(--accent) 6%,transparent);
        }
        .cf-service-icon svg{
          width:50px;
          height:50px;
          fill:none;
          stroke:currentColor;
          stroke-width:2.25;
          stroke-linecap:round;
          stroke-linejoin:round;
          overflow:visible;
        }
        .cf-service-card h2{
          margin:30px 0 0;
          color:#081126;
          font-size:28px;
          line-height:1.1;
          font-weight:900;
        }
        .cf-service-card p{
          margin:18px auto 0;
          min-height:58px;
          max-width:220px;
          color:#66738c;
          font-size:16px;
          line-height:1.55;
        }
        .cf-service-cta{
          width: 100%;
          min-height: 62px;
          margin-top: auto;
          border: 0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 16px;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-sizing: border-box;
          text-decoration: none;
          white-space: nowrap;
          flex-wrap: nowrap;
          transition: transform 200ms ease, box-shadow 200ms ease, filter 200ms ease, background 200ms ease;
        }

        .cf-service-cta-text{
          color: #ffffff;
          font-size: 15px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.2px;
          white-space: nowrap;
          word-break: keep-all;
          overflow-wrap: normal;
          flex: 0 1 auto;
          min-width: 0;
        }

        .cf-service-cta-circle-wrap{
          flex: 0 0 auto;
        }

        .cf-service-cta-circle{
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 200ms ease;
        }

        .cf-service-cta-circle svg{
          width: 19px;
          height: 19px;
          color: #ffffff;
          transition: transform 200ms ease;
        }

        /* V74 — Instagram Grow card: clone the Step 1 circular arrow treatment only */
        .cf-service-cta-instagram .cf-service-cta-circle-wrap{
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          padding:0!important;
        }
        .cf-service-cta-instagram .cf-service-cta-circle{
          width:34px!important;
          height:34px!important;
          min-width:34px!important;
          min-height:34px!important;
          border-radius:9999px!important;
          background:rgba(255,255,255,.14)!important;
          border:1px solid rgba(255,255,255,.06)!important;
          box-shadow:0 5px 12px rgba(118,28,103,.10), inset 0 1px 0 rgba(255,255,255,.10)!important;
          padding:0!important;
          overflow:hidden!important;
        }
        .cf-service-cta-instagram .cf-service-cta-circle svg{
          width:18px!important;
          height:18px!important;
          stroke-width:2.35!important;
          color:#fff!important;
          filter:none!important;
        }

        /* Platform specific styles */
        .cf-service-cta-instagram{
          background: linear-gradient(90deg, #7734A4 0%, #B83279 26%, #D82D66 50%, #EA593C 74%, #F2A63F 100%) !important;
          box-shadow: var(--instagram-shadow, 0 4px 10px rgba(225, 48, 108, 0.10));
        }
        .cf-service-cta-instagram .cf-service-cta-circle{
          background: rgba(255, 255, 255, 0.16);
        }
        .cf-service-card-button:hover .cf-service-cta-instagram{
          background: linear-gradient(90deg, #7734A4 0%, #B83279 26%, #D82D66 50%, #EA593C 74%, #F2A63F 100%) !important;
          transform: translateY(-1px) !important;
          filter: none !important;
          box-shadow: var(--instagram-shadow-hover, 0 5px 12px rgba(225, 48, 108, 0.14)) !important;
        }

        /* V75 — Instagram Grow CTA: exact Step 1 visual treatment. Step 1 itself is untouched. */
        .cf-service-cta-instagram{
          background:linear-gradient(100deg,#8735f7,#d62fc2 45%,#ff8a3d) !important;
          border:1px solid color-mix(in srgb,#E1306C 70%,#fff) !important;
          box-shadow:0 10px 14px color-mix(in srgb,#E1306C 24%,rgba(20,28,60,.18)), inset 0 1px 0 rgba(255,255,255,.28) !important;
          filter:none !important;
          transition:transform .18s ease,box-shadow .18s ease !important;
        }
        .cf-service-card-button:hover .cf-service-cta-instagram{
          background:linear-gradient(100deg,#8735f7,#d62fc2 45%,#ff8a3d) !important;
          transform:translateY(-2px) !important;
          box-shadow:0 13px 20px color-mix(in srgb,#E1306C 31%,rgba(20,28,60,.18)) !important;
          filter:none !important;
        }
        .cf-service-card-button:active .cf-service-cta-instagram{
          transform:translateY(0) !important;
        }
        .cf-service-cta-instagram .cf-service-cta-circle{
          width:34px!important;
          height:34px!important;
          min-width:34px!important;
          min-height:34px!important;
          border-radius:50%!important;
          background:rgba(255,255,255,.10)!important;
          border:0!important;
          box-shadow:0 6px 14px rgba(15,23,42,.14)!important;
          overflow:visible!important;
        }
        .cf-service-cta-instagram .cf-service-cta-circle svg{
          width:18px!important;
          height:18px!important;
          color:#fff!important;
          stroke-width:2.35!important;
          filter:none!important;
        }

        .cf-service-cta-tiktok{
          background: linear-gradient(
            110deg,
            #080808 0%,
            #0a0d0e 30%,
            #155054 66%,
            #9b2948 100%
          );
          box-shadow: none;
          filter: none;
          transition: transform 180ms ease;
        }
        .cf-service-cta-tiktok .cf-service-cta-circle{
          background: rgba(255, 255, 255, 0.12);
        }
        .cf-service-card-button:hover .cf-service-cta-tiktok{
          background: linear-gradient(
            110deg,
            #080808 0%,
            #0a0d0e 30%,
            #155054 66%,
            #9b2948 100%
          );
          filter: none;
          transform: translateY(-1px);
          box-shadow: none;
        }
        .cf-service-card-button:active .cf-service-cta-tiktok{
          filter: none;
          transform: translateY(1px);
        }

        .cf-service-cta-twitter{
          background: linear-gradient(
            110deg,
            #050505 0%,
            #101010 28%,
            #242424 58%,
            #151515 78%,
            #050505 100%
          );
          box-shadow: none;
          filter: none;
          transition: transform 180ms ease;
        }
        .cf-service-cta-twitter .cf-service-cta-circle{
          background: rgba(255, 255, 255, 0.12);
        }
        .cf-service-card-button:hover .cf-service-cta-twitter{
          background: linear-gradient(
            110deg,
            #050505 0%,
            #101010 28%,
            #242424 58%,
            #151515 78%,
            #050505 100%
          );
          filter: none;
          transform: translateY(-1px);
          box-shadow: none;
        }

        .cf-service-cta-youtube{
          background: linear-gradient(
            110deg,
            #C9000B 0%,
            #E6000C 28%,
            #FF0000 55%,
            #F21822 76%,
            #D5000C 100%
          );
          box-shadow: none;
          filter: none;
          transition: transform 180ms ease;
        }
        .cf-service-cta-youtube .cf-service-cta-circle{
          background: rgba(255, 255, 255, 0.14);
        }
        .cf-service-card-button:hover .cf-service-cta-youtube{
          background: linear-gradient(
            110deg,
            #C9000B 0%,
            #E6000C 28%,
            #FF0000 55%,
            #F21822 76%,
            #D5000C 100%
          );
          filter: none;
          transform: translateY(-1px);
          box-shadow: none;
        }

        /* V79 — Match the Instagram Step 1 arrow treatment across TikTok, X and YouTube.
           Only the CTA arrow/effect treatment is changed; platform colors stay platform-specific. */
        .cf-service-cta-tiktok,
        .cf-service-cta-twitter,
        .cf-service-cta-youtube{
          border:1px solid rgba(255,255,255,.18) !important;
          filter:none !important;
          transition:transform .18s ease,box-shadow .18s ease !important;
        }
        .cf-service-cta-tiktok{
          box-shadow:0 10px 14px rgba(0,242,234,.20), inset 0 1px 0 rgba(255,255,255,.24) !important;
        }
        .cf-service-card-button:hover .cf-service-cta-tiktok{
          transform:translateY(-2px) !important;
          box-shadow:0 13px 20px rgba(0,242,234,.28), 0 0 12px rgba(255,0,80,.10) !important;
        }
        .cf-service-cta-twitter{
          box-shadow:0 10px 14px rgba(29,78,216,.14), inset 0 1px 0 rgba(255,255,255,.20) !important;
        }
        .cf-service-card-button:hover .cf-service-cta-twitter{
          transform:translateY(-2px) !important;
          box-shadow:0 13px 20px rgba(29,78,216,.20) !important;
        }
        .cf-service-cta-youtube{
          box-shadow:0 10px 14px rgba(255,0,0,.20), inset 0 1px 0 rgba(255,255,255,.24) !important;
        }
        .cf-service-card-button:hover .cf-service-cta-youtube{
          transform:translateY(-2px) !important;
          box-shadow:0 13px 20px rgba(255,0,0,.28) !important;
        }
        .cf-service-card-button:active .cf-service-cta-tiktok,
        .cf-service-card-button:active .cf-service-cta-twitter,
        .cf-service-card-button:active .cf-service-cta-youtube{
          transform:translateY(0) !important;
        }
        .cf-service-cta-tiktok .cf-service-cta-circle-wrap,
        .cf-service-cta-twitter .cf-service-cta-circle-wrap,
        .cf-service-cta-youtube .cf-service-cta-circle-wrap{
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          background:transparent !important;
          border:0 !important;
          box-shadow:none !important;
          padding:0 !important;
        }
        .cf-service-cta-tiktok .cf-service-cta-circle,
        .cf-service-cta-twitter .cf-service-cta-circle,
        .cf-service-cta-youtube .cf-service-cta-circle{
          width:34px !important;
          height:34px !important;
          min-width:34px !important;
          min-height:34px !important;
          border-radius:50% !important;
          background:rgba(255,255,255,.10) !important;
          border:0 !important;
          box-shadow:0 6px 14px rgba(15,23,42,.14), inset 0 1px 0 rgba(255,255,255,.08) !important;
          overflow:visible !important;
        }
        .cf-service-cta-tiktok .cf-service-cta-circle{
          box-shadow:0 6px 14px rgba(0,242,234,.18), inset 0 1px 0 rgba(255,255,255,.10) !important;
        }
        .cf-service-cta-twitter .cf-service-cta-circle{
          box-shadow:0 6px 14px rgba(59,130,246,.14), inset 0 1px 0 rgba(255,255,255,.10) !important;
        }
        .cf-service-cta-youtube .cf-service-cta-circle{
          box-shadow:0 6px 14px rgba(255,0,0,.18), inset 0 1px 0 rgba(255,255,255,.10) !important;
        }
        .cf-service-cta-tiktok .cf-service-cta-circle svg,
        .cf-service-cta-twitter .cf-service-cta-circle svg,
        .cf-service-cta-youtube .cf-service-cta-circle svg{
          width:18px !important;
          height:18px !important;
          color:#fff !important;
          stroke-width:2.35 !important;
          filter:none !important;
        }

        .cf-service-card-button:hover .cf-service-cta .cf-service-cta-circle-wrap svg{
          transform: translateX(2px);
        }
        .cf-service-card-button:active .cf-service-cta{
          transform: scale(0.985);
        }

        .cf-service-benefits{
          width:min(100%,1080px);
          min-height:104px;
          margin:38px auto 0;
          padding:14px 22px;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          align-items:center;
          border:1px solid #e5e9ef;
          border-radius:22px;
          background:#fff;
          box-shadow:0 10px 30px rgba(35,50,85,.06);
        }
        .cf-service-benefits>div{
          min-height:68px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:14px;
          padding:0 19px;
        }
        .cf-service-benefits>div+div{border-left:1px solid #e1e6ee}
        .cf-benefit-icon{
          width:54px;
          height:54px;
          border-radius:50%;
          display:grid;
          place-items:center;
          flex:0 0 auto;
        }
        .cf-benefit-icon svg{width:29px;height:29px}
        .cf-benefit-icon.blue{color:#1476ff;background:#eaf4ff}
        .cf-benefit-icon.mint{color:#12c69b;background:#e7fbf5}
        .cf-benefit-icon.purple{color:#9732ef;background:#f5eaff}
        .cf-benefit-icon.pink{color:#fa3b82;background:#fff0f5}
        .cf-service-benefits strong{
          display:block;
          color:#111827;
          font-size:15px;
          line-height:1.25;
        }
        .cf-service-benefits small{
          display:block;
          margin-top:7px;
          color:#6a768e;
          font-size:12px;
          line-height:1.25;
        }
        .cf-service-security{
          margin:26px auto 0;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          color:#69768d;
          font-size:14px;
        }
        .cf-service-security svg{width:20px;height:20px}

        .cf-service-bg{
          position:absolute;
          pointer-events:none;
          z-index:1;
          opacity:.22;
        }
        .cf-service-bg-top{right:-8px;top:138px;width:360px;height:430px}
        .cf-bg-chip{
          position:absolute;
          top:0;
          left:54px;
          padding:7px 14px;
          border:2px solid #8f6cf3;
          color:#7b54eb;
          border-radius:999px;
          font-size:13px;
          font-weight:900;
        }
        .cf-bg-heart{
          position:absolute;
          left:177px;
          top:46px;
          width:48px;height:48px;
          display:grid;place-items:center;
          border:2px solid #ff5795;
          border-radius:50%;
          color:#ff5795;
          font-size:20px;
        }
        .cf-bg-arrow{
          position:absolute;
          right:22px;
          top:76px;
          width:150px;
          height:130px;
          border-right:4px solid #3a77ff;
          border-top:4px solid #3a77ff;
          border-radius:0 80px 0 0;
          transform:skewY(-28deg) rotate(-6deg);
        }
        .cf-bg-arrow:after{
          content:"";
          position:absolute;
          top:-10px;right:-7px;
          width:18px;height:18px;
          border-top:4px solid #3a77ff;
          border-right:4px solid #3a77ff;
          transform:rotate(39deg);
        }
        .cf-bg-bars{
          position:absolute;
          right:14px;
          top:205px;
          display:flex;
          align-items:flex-end;
          gap:7px;
        }
        .cf-bg-bars i{width:15px;background:#3a77ff;border-radius:4px 4px 0 0}
        .cf-bg-bars i:nth-child(1){height:29px}
        .cf-bg-bars i:nth-child(2){height:43px}
        .cf-bg-bars i:nth-child(3){height:62px}
        .cf-bg-bars i:nth-child(4){height:82px}
        .cf-bg-circle{position:absolute;border:2px solid #6d8dff;border-radius:50%}
        .cf-bg-circle.c1{width:21px;height:21px;left:20px;top:58px}
        .cf-bg-circle.c2{width:12px;height:12px;left:122px;top:236px}
        .cf-bg-dots{
          position:absolute;
          right:18px;
          bottom:15px;
          width:84px;height:64px;
          background-image:radial-gradient(#5d88ff 1.8px,transparent 1.8px);
          background-size:12px 12px;
        }

        .cf-service-bg-bottom{left:-6px;bottom:20px;width:330px;height:430px}
        .cf-bg-social{position:absolute;font-weight:900;color:#6865ff}
        .cf-bg-social.ig{left:20px;top:36px;font-size:38px;color:#ff4d9b}
        .cf-bg-social.yt{
          left:38px;top:148px;width:40px;height:40px;
          display:grid;place-items:center;
          border:2px solid #ff0000;border-radius:50%;
          font-size:24px;color:#ff0000;padding-left:2px;
        }
        .cf-bg-social.x{left:112px;top:190px;font-size:31px;color:#fd55ae}
        .cf-bg-path{
          position:absolute;
          left:-25px;top:40px;
          width:190px;height:220px;
          border:2px dashed #557cff;
          border-right-color:transparent;
          border-radius:55% 40%;
          transform:rotate(-16deg);
        }
        .cf-bg-chip.lower{top:auto;left:124px;bottom:16px;color:#1376ff;border-color:#1376ff}
        .cf-bg-dots.lower-dots{right:auto;left:35px;bottom:0}


        /* V75 — Desktop: cards + benefits reduced by 15% */
        @media (min-width: 761px){
          .cf-service-grid{
            width:85%;
            gap:20px;
            margin-top:46px;
          }
          .cf-service-card{
            min-height:284px;
            padding:36px 20px 20px;
            border-radius:19px;
          }
          .cf-platform-instagram .cf-service-card{
            box-shadow:0 16px 23px #e1306c14!important;
          }


          /* V23 — explicit hero prefix rendering: prevents generic span gradient rules from hiding "Grow Your" */
          .cf-service-hero h1 > .cf-service-hero-prefix{
            display:inline-block!important;
            position:relative!important;
            color:#06132e!important;
            -webkit-text-fill-color:#06132e!important;
            background:none!important;
            background-image:none!important;
            background-clip:border-box!important;
            -webkit-background-clip:border-box!important;
            text-shadow:
              0 2px 0 rgba(255,255,255,.98),
              0 4px 0 rgba(22,36,82,.10),
              0 7px 9px rgba(13,29,73,.26),
              0 0 1px #071126!important;
            filter:none!important;
            opacity:1!important;
            visibility:visible!important;
            transform:none!important;
            padding-left:10px!important;
            margin-left:-10px!important;
            overflow:visible!important;
          }
          .cf-service-hero h1 > .cf-service-hero-platform{
            display:inline-block!important;
            color:transparent!important;
            -webkit-text-fill-color:transparent!important;
            background-clip:text!important;
            -webkit-background-clip:text!important;
            text-shadow:none!important;
            filter:drop-shadow(0 2px 0 rgba(255,255,255,.98)) drop-shadow(0 5px 9px rgba(51,110,255,.22))!important;
          }

          .cf-service-best{
            left:36px;
            top:-15px;
            min-height:32px;
            padding:0 13px;
            font-size:10px;
          }
          .cf-service-best svg{width:12px;height:12px}
          .cf-service-card h2{
            margin-top:20px;
            font-size:19px;
          }
          .cf-service-card p{
            margin-top:13px;
            min-height:38px;
            max-width:153px;
            font-size:12px;
            line-height:1.5;
          }

          .cf-service-benefits{
            width:85%;
            min-height:92px;
            margin-top:41px;
            padding:15px 19px;
            border-radius:19px;
          }
          .cf-service-benefits>div{
            min-height:54px;
            gap:12px;
            padding:0 16px;
          }
          .cf-benefit-icon{
            width:41px;
            height:41px;
          }
          .cf-benefit-icon svg{width:21px;height:21px}
          .cf-service-benefits strong{font-size:11px}
          .cf-service-benefits small{
            margin-top:6px;
            font-size:10px;
          }
        }

        @media (max-width: 760px){
          .cf-service-page{
            padding:0 12px 24px;
            overflow:hidden;
          }
          .cf-service-header{
            height:82px;
            grid-template-columns:auto 1fr auto;
          }
          .cf-service-back{
            font-size:11px;
            gap:7px;
            padding:6px 2px;
          }
          .cf-service-back svg{width:18px;height:18px}
          .cf-service-logo{
            font-size:25px;
            letter-spacing:-1.2px;
          }
          .cf-service-logo svg{width:15px;height:15px;margin-top:-13px}
          .cf-service-brandmark{font-size:20px}

          .cf-service-tabs{
            min-height:52px;
            width:100%;
            padding:5px;
            border-radius:13px;
            overflow:hidden;
          }
          .cf-service-tab{
            min-height:40px;
            gap:5px;
            font-size:10px;
            border-radius:13px;
          }
          .cf-service-tab img{width:22px!important;height:22px!important}
          .cf-service-tab span{white-space:nowrap}

          .cf-service-shell{
            padding:54px 0 6px;
          }
          .cf-service-trusted{
            margin-bottom:30px;
            padding:8px 12px;
            font-size:9.5px;
          }
          .cf-service-trusted svg{width:14px;height:14px}

          .cf-service-hero h1{
            font-size:clamp(34px,10.6vw,45px);
            letter-spacing:-2px;
            white-space:nowrap;
          }
          .cf-service-hero p{
            margin-top:14px;
            font-size:14px;
          }

          .cf-service-grid{
            margin-top:45px;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:16px 12px;
          }
          .cf-service-card{
            min-height:300px;
            padding:38px 12px 16px;
            border-radius:18px;
          }
          .cf-service-best{
            left:14px;
            top:-15px;
            min-height:32px;
            padding:0 10px;
            font-size:9px;
          }
          .cf-service-best svg{width:12px;height:12px}
          .cf-service-card h2{
            margin-top:22px;
            font-size:18px;
          }
          .cf-service-card p{
            margin-top:13px;
            max-width:125px;
            min-height:52px;
            font-size:11px;
            line-height:1.45;
          }
          .cf-service-cta{
            min-height:42px;
            padding:0 11px 0 14px;
            font-size:10px;
          }
          .cf-service-cta svg{width:15px;height:15px}

          .cf-service-benefits{
            min-height:150px;
            margin-top:30px;
            padding:12px 4px;
            grid-template-columns:repeat(4,minmax(0,1fr));
            border-radius:18px;
          }
          .cf-service-benefits>div{
            min-height:118px;
            padding:6px 5px;
            flex-direction:column;
            text-align:center;
            gap:8px;
          }
          .cf-benefit-icon{
            width:40px;height:40px;
          }
          .cf-benefit-icon svg{width:21px;height:21px}
          .cf-service-benefits strong{
            font-size:8.5px;
            line-height:1.25;
          }
          .cf-service-benefits small{
            margin-top:7px;
            font-size:8px;
            line-height:1.45;
          }
          .cf-service-security{
            margin-top:20px;
            font-size:10px;
          }
          .cf-service-security svg{width:16px;height:16px}

          .cf-service-bg{opacity:.045}
          .cf-service-bg-top{
            right:-110px;
            top:122px;
            transform:scale(.68);
            transform-origin:top right;
          }
          .cf-service-bg-bottom{
            left:-78px;
            bottom:-10px;
            transform:scale(.65);
            transform-origin:bottom left;
          }
        }

        @media (max-width: 390px){
          .cf-service-tab{font-size:9px}
          .cf-service-tab img{width:20px!important;height:20px!important}
          .cf-service-hero h1{font-size:33px}
          .cf-service-grid{gap:14px 10px}
          .cf-service-card{min-height:290px}
        }

        /* V76 — Mobile alignment matching approved reference */
        @media (max-width: 760px){
          .cf-service-page{
            padding:0 16px 24px !important;
          }

          .cf-service-header{
            width:100% !important;
            height:76px !important;
            grid-template-columns:1fr auto 1fr !important;
            gap:8px !important;
          }
          .cf-service-back{
            justify-self:start !important;
            font-size:10px !important;
            gap:5px !important;
            white-space:nowrap !important;
          }
          .cf-service-back svg{
            width:16px !important;
            height:16px !important;
          }
          .cf-service-logo{
            justify-self:center !important;
            font-size:22px !important;
            white-space:nowrap !important;
          }
          .cf-service-logo svg{
            width:13px !important;
            height:13px !important;
            margin-top:-11px !important;
          }
          .cf-service-brandmark{
            justify-self:end !important;
            font-size:17px !important;
          }

          .cf-service-tabs{
            width:100% !important;
            min-height:50px !important;
            padding:5px !important;
            grid-template-columns:repeat(4,minmax(0,1fr)) !important;
          }
          .cf-service-tab{
            min-width:0 !important;
            min-height:39px !important;
            padding:0 4px !important;
            gap:4px !important;
            font-size:8.5px !important;
          }
          .cf-service-tab img{
            width:19px !important;
            height:19px !important;
            flex:0 0 auto !important;
          }
          .cf-service-tab span{
            overflow:hidden !important;
            text-overflow:ellipsis !important;
          }

          .cf-service-shell{
            width:100% !important;
            padding:50px 0 6px !important;
          }
          .cf-service-trusted{
            margin:0 auto 30px !important;
            font-size:9px !important;
            padding:8px 11px !important;
            white-space:nowrap !important;
          }

          .cf-service-hero{
            width:100% !important;
            overflow:visible !important;
          }
          .cf-service-hero h1{
            font-size:clamp(28px,8.6vw,36px) !important;
            line-height:1.08 !important;
            letter-spacing:-1.6px !important;
            white-space:normal !important;
            text-align:center !important;
            overflow-wrap:normal !important;
          }
          .cf-service-hero h1 span{
            white-space:nowrap !important;
          }
          .cf-service-hero p{
            margin-top:13px !important;
            font-size:12px !important;
            white-space:normal !important;
          }

          .cf-service-grid{
            width:100% !important;
            margin-top:42px !important;
            grid-template-columns:repeat(2,minmax(0,1fr)) !important;
            gap:14px 12px !important;
          }
          .cf-service-card-link{
            width:100% !important;
            min-width:0 !important;
          }
          .cf-service-card{
            width:100% !important;
            min-width:0 !important;
            min-height:282px !important;
            padding:34px 10px 14px !important;
            border-radius:17px !important;
          }
          .cf-service-best{
            left:12px !important;
            top:-15px !important;
            min-height:31px !important;
            padding:0 9px !important;
            font-size:8.5px !important;
          }
          .cf-service-card h2{
            margin-top:20px !important;
            font-size:17px !important;
          }
          .cf-service-card p{
            max-width:125px !important;
            min-height:50px !important;
            margin-top:12px !important;
            font-size:10px !important;
            line-height:1.45 !important;
          }
          .cf-service-cta{
            width:100% !important;
            min-height:40px !important;
            padding:0 10px 0 12px !important;
            font-size:9.5px !important;
          }
          .cf-service-cta svg{
            width:14px !important;
            height:14px !important;
          }

          .cf-service-benefits{
            width:100% !important;
            min-height:136px !important;
            margin-top:26px !important;
            padding:10px 3px !important;
            grid-template-columns:repeat(4,minmax(0,1fr)) !important;
            border-radius:17px !important;
          }
          .cf-service-benefits>div{
            min-width:0 !important;
            min-height:108px !important;
            padding:5px 3px !important;
            gap:7px !important;
          }
          .cf-benefit-icon{
            width:36px !important;
            height:36px !important;
          }
          .cf-benefit-icon svg{
            width:19px !important;
            height:19px !important;
          }
          .cf-service-benefits strong{
            font-size:7.5px !important;
          }
          .cf-service-benefits small{
            font-size:7px !important;
            line-height:1.4 !important;
          }
          .cf-service-security{
            margin-top:18px !important;
            padding-bottom:2px !important;
            font-size:9px !important;
          }

          .cf-service-bg{
            opacity:.04 !important;
          }
          .cf-service-bg-top{
            right:-115px !important;
            top:120px !important;
            transform:scale(.65) !important;
          }
          .cf-service-bg-bottom{
            left:-82px !important;
            bottom:-15px !important;
            transform:scale(.60) !important;
          }
        }

        @media (max-width: 390px){
          .cf-service-page{
            padding-left:12px !important;
            padding-right:12px !important;
          }
          .cf-service-logo{
            font-size:20px !important;
          }
          .cf-service-back{
            font-size:9px !important;
          }
          .cf-service-tab{
            font-size:7.5px !important;
          }
          .cf-service-tab img{
            width:17px !important;
            height:17px !important;
          }
          .cf-service-hero h1{
            font-size:28px !important;
          }
          .cf-service-grid{
            gap:12px 10px !important;
          }
          .cf-service-card{
            min-height:270px !important;
            padding-left:8px !important;
            padding-right:8px !important;
          }
        }


        /* V110 — exact compact Home-style trust bar on Grow Your Service */
        .cf-service-benefits{
          width:min(100%,1000px)!important;
          min-height:64px!important;
          margin:34px auto 0!important;
          padding:10px 20px!important;
          grid-template-columns:repeat(4,1fr)!important;
          border:1px solid #e2e8f0!important;
          border-radius:14px!important;
          background:#fff!important;
          box-shadow:0 8px 24px rgba(15,23,42,.04)!important;
        }
        .cf-service-benefits>div{
          min-height:42px!important;
          justify-content:center!important;
          gap:10px!important;
          padding:0 18px!important;
        }
        .cf-service-benefits>div+div{
          border-left:1px solid #dfe5ed!important;
        }
        .cf-benefit-icon{
          width:18px!important;
          height:18px!important;
          border-radius:0!important;
          background:transparent!important;
          color:#0f172a!important;
        }
        .cf-benefit-icon svg{
          width:17px!important;
          height:17px!important;
          stroke-width:2!important;
        }
        .cf-service-benefits strong{
          color:#020617!important;
          font-size:11px!important;
          line-height:1.2!important;
          font-weight:700!important;
          white-space:nowrap!important;
        }
        .cf-service-benefits small{display:none!important;}


        /* V111 — compact professional desktop trust bar */
        @media(min-width:761px){
          .cf-service-benefits{
            width:min(100%,860px)!important;
            min-height:54px!important;
            margin:28px auto 0!important;
            padding:7px 14px!important;
            border-radius:12px!important;
          }

          .cf-service-benefits>div{
            min-height:38px!important;
            gap:8px!important;
            padding:0 14px!important;
          }

          .cf-benefit-icon{
            width:16px!important;
            height:16px!important;
          }

          .cf-benefit-icon svg{
            width:15px!important;
            height:15px!important;
          }

          .cf-service-benefits strong{
            font-size:10px!important;
            line-height:1.15!important;
          }
        }


        /* V112 — Grow Your Service icons standardized to Home */
        .cf-service-benefits .cf-benefit-icon{
          width:17px!important;
          height:17px!important;
          min-width:17px!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          color:#0f172a!important;
          box-shadow:none!important;
        }
        .cf-service-benefits .cf-benefit-icon svg{
          width:17px!important;
          height:17px!important;
          stroke:currentColor!important;
          stroke-width:2!important;
          fill:none!important;
        }
        @media(min-width:761px){
          .cf-service-benefits .cf-benefit-icon,
          .cf-service-benefits .cf-benefit-icon svg{
            width:16px!important;
            height:16px!important;
            min-width:16px!important;
          }
        }

      
/* V114 — remove residual trusted badge icon and its reserved space */
.cf-trusted-badge:empty,
.cf-trust-badge:empty,
.cf-hero-trust:empty,
.cf-service-trust:empty{
  display:none!important;
  width:0!important;
  height:0!important;
  min-width:0!important;
  min-height:0!important;
  margin:0!important;
  padding:0!important;
}



        /* V115 — Grow Your Service trust bar = exact Home standard */
        .cf-service-benefits{
          width:min(100%,760px)!important;
          min-height:64px!important;
          margin:30px auto 0!important;
          padding:12px 16px!important;
          display:grid!important;
          grid-template-columns:repeat(4,1fr)!important;
          align-items:center!important;
          border:1px solid #eef1f5!important;
          border-radius:13px!important;
          background:#fff!important;
          box-shadow:0 9px 26px rgba(35,50,85,.06)!important;
        }
        .cf-service-benefits>div{
          min-height:36px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:9px!important;
          color:#111827!important;
          font-size:11px!important;
          font-weight:700!important;
          padding:0 10px!important;
        }
        .cf-service-benefits>div+div{
          border-left:1px solid #e0e5ec!important;
        }
        .cf-service-benefits .cf-benefit-icon{
          width:17px!important;
          height:17px!important;
          min-width:17px!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          padding:0!important;
          margin:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          color:#111827!important;
          box-shadow:none!important;
        }
        .cf-service-benefits .cf-benefit-icon svg{
          width:17px!important;
          height:17px!important;
          min-width:17px!important;
          flex:0 0 auto!important;
          stroke:currentColor!important;
          stroke-width:2!important;
          fill:none!important;
        }
        .cf-service-benefits strong{
          color:#111827!important;
          font-size:11px!important;
          line-height:1!important;
          font-weight:700!important;
          white-space:nowrap!important;
        }
        .cf-service-benefits small{
          display:none!important;
        }



        /* V116 — exact Home trust bar reused on Grow Your Service */
        .cf-service-home-trustbar{
          margin-left:auto!important;
          margin-right:auto!important;
        }
        @media (min-width:1100px){
          .cf-service-home-trustbar{
            margin-top:55px!important;
          }
        }

        /* V119 — Grow Your Service cards static like Home */
        .cf-service-card,
        .cf-service-card:hover,
        .cf-service-card:focus,
        .cf-service-card:focus-within,
        .cf-service-card:active{
          transform:none!important;
          translate:none!important;
          scale:1!important;
          animation:none!important;
          transition:none!important;
        }

        .cf-service-card:hover,
        .cf-service-card:focus,
        .cf-service-card:focus-within{
          box-shadow:var(--cf-service-card-shadow, 0 8px 24px rgba(15,23,42,.045))!important;
        }

        /* Keep inner artwork/icons static as well */
        .cf-service-card:hover .cf-service-icon,
        .cf-service-card:hover svg,
        .cf-service-card:hover img{
          transform:none!important;
          scale:1!important;
          animation:none!important;
        }



        /* Unified Service Icon: 56px soft squircle, 15px radius, 1px subtle themed border */
        .cf-service-icon{
          width:56px!important;
          height:56px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          border-radius:15px!important;
          background:rgba(15,23,42,.025)!important;
          color:var(--accent)!important;
          border:1px solid rgba(15,23,42,.08)!important;
          box-shadow:0 3px 8px rgba(15,23,42,.035)!important;
          transition:transform 180ms ease, border-color 180ms ease, background-color 180ms ease!important;
        }

        .cf-service-icon svg{
          width:26px!important;
          height:26px!important;
          stroke-width:2!important;
          stroke-linecap:round!important;
          stroke-linejoin:round!important;
        }

        /* Instagram: Ultra-soft background + themed accent border */
        .cf-platform-instagram .cf-service-icon{
          color:#E1306C!important;
          background:rgba(225,48,108,.035)!important;
          border:1px solid rgba(225,48,108,.16)!important;
          box-shadow:0 3px 8px rgba(15,23,42,.035)!important;
        }
        .cf-service-card-button:hover .cf-platform-instagram .cf-service-icon,
        .cf-platform-instagram .cf-service-card:hover .cf-service-icon{
          border-color:rgba(225,48,108,.28)!important;
          background:rgba(225,48,108,.055)!important;
        }

        /* TikTok: Dark icon + micro dual-accent effect */
        .cf-platform-tiktok .cf-service-icon{
          color:#0F0F0F!important;
          background:rgba(0,0,0,.025)!important;
          border:1px solid rgba(0,0,0,.08)!important;
          box-shadow:-1px 1px 3px rgba(37,244,238,.12), 1px 1px 3px rgba(254,44,85,.12)!important;
        }
        .cf-service-card-button:hover .cf-platform-tiktok .cf-service-icon,
        .cf-platform-tiktok .cf-service-card:hover .cf-service-icon{
          border-color:rgba(0,0,0,.15)!important;
          background:rgba(0,0,0,.045)!important;
          box-shadow:-1px 2px 5px rgba(37,244,238,.18), 1px 2px 5px rgba(254,44,85,.18)!important;
        }

        /* X / Twitter: Monochrome premium graphite */
        .cf-platform-twitter .cf-service-icon{
          color:#0F1419!important;
          background:rgba(15,20,25,.025)!important;
          border:1px solid rgba(15,20,25,.16)!important;
          box-shadow:0 2px 5px rgba(15,20,25,.05)!important;
        }
        .cf-service-card-button:hover .cf-platform-twitter .cf-service-icon,
        .cf-platform-twitter .cf-service-card:hover .cf-service-icon{
          border-color:rgba(15,20,25,.28)!important;
          background:rgba(15,20,25,.045)!important;
        }

        /* YouTube: Clean pure red icon + subtle border */
        .cf-platform-youtube .cf-service-icon{
          color:#FF0000!important;
          background:rgba(255,0,0,.025)!important;
          border:1px solid rgba(255,0,0,.16)!important;
          box-shadow:0 2px 5px rgba(255,0,0,.04)!important;
        }
        .cf-service-card-button:hover .cf-platform-youtube .cf-service-icon,
        .cf-platform-youtube .cf-service-card:hover .cf-service-icon{
          border-color:rgba(255,0,0,.28)!important;
          background:rgba(255,0,0,.045)!important;
        }

        /* Universal card hover subtle lift for icon */
        .cf-service-card:hover .cf-service-icon{
          transform:translateY(-1px)!important;
        }


        /* V120 — Grow Your Service reference-clone visual system */
        .cf-service-page{
          min-height:100dvh!important;
          overflow-x:hidden!important;
          background:
            radial-gradient(circle at 51% 39%,rgba(210,220,255,.34) 0,rgba(241,244,255,.18) 27%,transparent 55%),
            radial-gradient(circle at 0% 46%,color-mix(in srgb,var(--accent) 8%,transparent) 0,transparent 26%),
            radial-gradient(circle at 100% 87%,color-mix(in srgb,var(--accent-2) 10%,transparent) 0,transparent 28%),
            #fbfcff!important;
          color:#07132f!important;
        }

        .cf-service-page:before{
          content:"";
          position:fixed;
          inset:0;
          pointer-events:none;
          z-index:0;
          background:
            radial-gradient(ellipse at 50% 42%,rgba(255,255,255,.86) 0,rgba(255,255,255,.50) 36%,transparent 68%),
            linear-gradient(115deg,rgba(240,235,255,.22),transparent 34%,rgba(255,241,246,.18) 74%,transparent);
        }

        .cf-service-header,
        .cf-service-tabs,
        .cf-service-shell{position:relative;z-index:2}

        @media (min-width:1100px){
          .cf-service-header{
            width:min(1240px,calc(100% - 72px))!important;
            height:92px!important;
            margin:0 auto!important;
            padding:0!important;
            display:grid!important;
            grid-template-columns:1fr auto 1fr!important;
            align-items:center!important;
            border-bottom:1px solid rgba(111,126,160,.16)!important;
          }
          .cf-service-back{
            justify-self:start!important;
            height:50px!important;
            padding:0 20px!important;
            gap:10px!important;
            border-radius:17px!important;
            border:1px solid rgba(140,151,179,.12)!important;
            background:rgba(255,255,255,.82)!important;
            color:#101a33!important;
            font-size:17px!important;
            font-weight:800!important;
            box-shadow:0 10px 22px rgba(32,45,83,.10),inset 0 1px 0 rgba(255,255,255,.95)!important;
          }
          .cf-service-back svg{width:25px!important;height:25px!important;stroke-width:2.5!important}
          .cf-service-logo{
            justify-self:center!important;
            font-size:41px!important;
            letter-spacing:-2px!important;
            color:#08132e!important;
            font-weight:850!important;
          }
          .cf-service-logo b{color:#1976ff!important}
          .cf-service-logo svg{width:20px!important;height:20px!important;stroke-width:3!important;margin-left:2px!important}
          .cf-service-brandmark{
            justify-self:end!important;
            font-size:31px!important;
            line-height:1!important;
            color:#1478ff!important;
            filter:drop-shadow(0 3px 7px rgba(20,120,255,.16))!important;
          }

          .cf-service-tabs{
            width:min(970px,calc(100% - 100px))!important;
            height:98px!important;
            margin:18px auto 0!important;
            padding:8px 14px!important;
            display:grid!important;
            grid-template-columns:repeat(4,1fr)!important;
            align-items:center!important;
            gap:8px!important;
            border:1px solid rgba(143,156,187,.20)!important;
            border-radius:34px!important;
            background:rgba(255,255,255,.86)!important;
            box-shadow:0 18px 38px rgba(34,48,91,.10),inset 0 1px 0 #fff!important;
            backdrop-filter:blur(12px)!important;
          }
          .cf-service-tab{
            min-height:78px!important;
            padding:0 19px!important;
            gap:14px!important;
            justify-content:center!important;
            border-radius:28px!important;
            border:1px solid transparent!important;
            color:#18233f!important;
            font-size:18px!important;
            font-weight:800!important;
          }
          .cf-service-tab img{width:42px!important;height:42px!important;object-fit:contain!important}
          .cf-service-tab.active{
            color:var(--accent)!important;
            background:rgba(255,255,255,.94)!important;
            border:2px solid transparent!important;
            background-image:linear-gradient(#fff,#fff),var(--gradient)!important;
            background-origin:border-box!important;
            background-clip:padding-box,border-box!important;
            box-shadow:0 8px 20px color-mix(in srgb,var(--accent) 10%,transparent)!important;
          }

          .cf-service-shell{
            width:min(1160px,calc(100% - 80px))!important;
            margin:0 auto!important;
            padding:74px 0 54px!important;
          }
          .cf-service-hero{margin:0 auto!important;text-align:center!important}
          .cf-service-hero h1{
            margin:0!important;
            font-size:72px!important;
            line-height:.98!important;
            letter-spacing:-4.8px!important;
            font-weight:900!important;
            color:#06132e!important;
            text-shadow:0 7px 10px rgba(11,21,47,.15)!important;
          }
          .cf-service-hero h1 span{
            display:inline-block!important;
            color:transparent!important;
            background-clip:text!important;
            -webkit-background-clip:text!important;
            text-shadow:none!important;
          }
          .cf-service-hero p{
            margin:28px auto 0!important;
            color:#60708d!important;
            font-size:24px!important;
            line-height:1.35!important;
            font-weight:500!important;
          }

          .cf-service-grid{
            margin-top:62px!important;
            display:grid!important;
            grid-template-columns:repeat(4,minmax(0,1fr))!important;
            gap:28px!important;
          }
          .cf-service-card-link{display:block!important;height:100%!important}
          .cf-service-card{
            position:relative!important;
            min-height:420px!important;
            height:420px!important;
            padding:54px 28px 24px!important;
            border-radius:30px!important;
            background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.90))!important;
            border:1.5px solid color-mix(in srgb,var(--accent) 62%,#dfe4f3)!important;
            box-shadow:0 20px 33px rgba(26,37,76,.11),0 8px 18px color-mix(in srgb,var(--accent) 8%,transparent),inset 0 0 0 1px rgba(255,255,255,.95)!important;
            overflow:visible!important;
          }
          .cf-service-best{
            position:absolute!important;
            top:-20px!important;
            left:18px!important;
            z-index:6!important;
            height:50px!important;
            padding:0 20px 0 16px!important;
            gap:9px!important;
            border-radius:15px 15px 15px 4px!important;
            color:white!important;
            background:var(--gradient)!important;
            font-size:15px!important;
            font-weight:900!important;
            letter-spacing:.1px!important;
            box-shadow:0 10px 18px color-mix(in srgb,var(--accent) 28%,transparent),inset 0 1px 0 rgba(255,255,255,.42)!important;
          }
          .cf-service-best svg{width:21px!important;height:21px!important}

          .cf-service-icon{
            width:88px!important;
            height:88px!important;
            margin:0 auto 28px!important;
            border-radius:22px!important;
            color:var(--accent)!important;
            background:linear-gradient(145deg,rgba(255,255,255,.97),color-mix(in srgb,var(--pale) 62%,#fff))!important;
            border:1px solid color-mix(in srgb,var(--accent) 18%,transparent)!important;
            box-shadow:0 13px 20px color-mix(in srgb,var(--accent) 13%,rgba(14,25,55,.08)),inset 0 1px 0 #fff,inset 0 -3px 7px rgba(110,124,160,.05)!important;
          }
          .cf-service-icon svg{
            width:44px!important;
            height:44px!important;
            stroke-width:2.15!important;
            filter:drop-shadow(0 4px 4px color-mix(in srgb,var(--accent) 20%,transparent))!important;
          }
          .cf-platform-tiktok .cf-service-icon,
          .cf-platform-twitter .cf-service-icon{color:var(--accent)!important}

          .cf-service-card h2{
            margin:0!important;
            font-size:30px!important;
            line-height:1.08!important;
            letter-spacing:-1px!important;
            font-weight:900!important;
            color:#07132e!important;
          }
          .cf-service-card p{
            max-width:220px!important;
            min-height:58px!important;
            margin:18px auto 20px!important;
            color:#596987!important;
            font-size:16px!important;
            line-height:1.5!important;
            font-weight:500!important;
          }
          .cf-service-cta{
            position:absolute!important;
            left:26px!important;
            right:26px!important;
            bottom:24px!important;
            min-height:70px!important;
            padding:0 17px 0 26px!important;
            border-radius:18px!important;
            color:#fff!important;
            font-size:17px!important;
            font-weight:850!important;
            background:var(--gradient)!important;
            box-shadow:0 12px 20px color-mix(in srgb,var(--accent) 22%,rgba(20,28,55,.10)),inset 0 1px 0 rgba(255,255,255,.35)!important;
          }
          .cf-service-cta-twitter{background:linear-gradient(90deg,#15161c,#2a1d15)!important}
          .cf-service-cta-circle-wrap{margin-left:auto!important}
          .cf-service-cta-circle{
            width:40px!important;height:40px!important;border-radius:50%!important;
            border:1.5px solid rgba(255,255,255,.62)!important;
            background:rgba(255,255,255,.12)!important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.30)!important;
          }
          .cf-service-cta-circle svg{width:20px!important;height:20px!important;stroke-width:2.6!important}

          .cf-service-benefits{
            width:min(1040px,100%)!important;
            min-height:104px!important;
            margin:42px auto 0!important;
            padding:11px 18px!important;
            display:grid!important;
            grid-template-columns:repeat(4,1fr)!important;
            align-items:center!important;
            border-radius:26px!important;
            border:1px solid rgba(137,151,184,.18)!important;
            background:rgba(255,255,255,.88)!important;
            box-shadow:0 18px 32px rgba(29,43,84,.11),inset 0 1px 0 #fff!important;
            backdrop-filter:blur(12px)!important;
          }
          .cf-service-benefits>div{
            min-height:70px!important;
            padding:0 20px!important;
            display:flex!important;
            align-items:center!important;
            justify-content:flex-start!important;
            gap:15px!important;
          }
          .cf-service-benefits>div+div{border-left:1px solid rgba(180,190,214,.58)!important}
          .cf-service-benefits strong{font-size:15px!important;color:#0b1835!important;font-weight:800!important;white-space:nowrap!important}
          .cf-benefit-icon{
            width:52px!important;height:52px!important;min-width:52px!important;
            border-radius:15px!important;
            color:var(--accent)!important;
            background:linear-gradient(145deg,color-mix(in srgb,var(--pale) 84%,#fff),#fff)!important;
            border:1px solid color-mix(in srgb,var(--accent) 12%,transparent)!important;
            box-shadow:0 8px 16px color-mix(in srgb,var(--accent) 13%,rgba(21,30,58,.06)),inset 0 1px 0 #fff!important;
          }
          .cf-benefit-icon svg{width:29px!important;height:29px!important;stroke-width:2.3!important;filter:drop-shadow(0 3px 3px color-mix(in srgb,var(--accent) 16%,transparent))!important}
          .cf-service-security{
            margin:30px auto 0!important;
            gap:14px!important;
            color:#60708c!important;
            font-size:16px!important;
            font-weight:500!important;
          }
          .cf-service-security svg{width:21px!important;height:21px!important;color:var(--accent)!important}

          .cf-service-bg{display:block!important;opacity:1!important;pointer-events:none!important;z-index:1!important}
          .cf-service-bg-top{right:0!important;top:145px!important;width:330px!important;height:470px!important}
          .cf-service-bg-bottom{left:0!important;bottom:25px!important;width:300px!important;height:430px!important}
          .cf-bg-chip,.cf-bg-heart,.cf-bg-arrow,.cf-bg-bars,.cf-bg-social,.cf-bg-path{display:none!important}
          .cf-service-bg-top .cf-bg-dots,
          .cf-service-bg-bottom .cf-bg-dots{
            display:block!important;
            position:absolute!important;
            width:160px!important;height:260px!important;
            opacity:.36!important;
            background-image:radial-gradient(circle,color-mix(in srgb,var(--accent-2) 65%,#ff9c39) 2.2px,transparent 2.6px)!important;
            background-size:18px 18px!important;
            mask-image:radial-gradient(ellipse at center,#000 18%,transparent 72%)!important;
          }
          .cf-service-bg-top .cf-bg-dots{right:-24px!important;top:75px!important}
          .cf-service-bg-bottom .cf-bg-dots{left:-38px!important;bottom:85px!important;background-image:radial-gradient(circle,color-mix(in srgb,var(--accent) 70%,#cc52ff) 2.2px,transparent 2.6px)!important}
          .cf-bg-circle{
            display:block!important;
            position:absolute!important;
            border-radius:50%!important;
            background:linear-gradient(145deg,#ff9b77,color-mix(in srgb,var(--accent) 60%,#c031d7) 62%,#7a56ff)!important;
            box-shadow:inset -8px -10px 14px rgba(83,22,112,.20),inset 7px 7px 10px rgba(255,255,255,.45),0 16px 28px color-mix(in srgb,var(--accent) 20%,transparent)!important;
            opacity:.72!important;
          }
          .cf-service-bg-top .c1{width:70px!important;height:70px!important;right:40px!important;top:255px!important}
          .cf-service-bg-top .c2{width:18px!important;height:18px!important;right:12px!important;top:140px!important;opacity:.45!important}
          .cf-service-bg-bottom .c1,.cf-service-bg-bottom .c2{display:none!important}
        }


        /* V3 — standardize Grow Your Service cards to the approved Home card system */
        @media (min-width:1100px){
          .cf-service-grid{
            width:1110px!important;
            max-width:1110px!important;
            margin:48px auto 0!important;
            gap:20px!important;
            grid-template-columns:repeat(4,minmax(0,1fr))!important;
          }

          .cf-service-card-link{
            height:376px!important;
            min-height:376px!important;
          }

          .cf-service-card{
            height:376px!important;
            min-height:376px!important;
            padding:45px 24px 23px!important;
            border-radius:27px!important;
            background:linear-gradient(180deg,rgba(255,255,255,.985),rgba(255,255,255,.925))!important;
            border-width:1.55px!important;
            box-shadow:0 16px 23px rgba(25,34,70,.13),0 0 20px color-mix(in srgb,var(--accent) 12%,transparent),inset 0 0 0 1px rgba(255,255,255,.96)!important;
          }

          .cf-service-best{
            top:-2px!important;
            left:-1px!important;
            z-index:6!important;
            height:38px!important;
            padding:0 15px 0 11px!important;
            gap:6px!important;
            border-radius:20px 20px 20px 0!important;
            border-top:1px solid #ffffff6b!important;
            border-left:1px solid #ffffff59!important;
            font-size:14px!important;
            line-height:1!important;
            box-shadow:0 5px 10px color-mix(in srgb,var(--accent) 18%,transparent),inset 0 1px 0 rgba(255,255,255,.45)!important;
          }
          .cf-service-best svg{width:14px!important;height:14px!important;flex:0 0 14px!important}

          .cf-service-icon{
            width:78px!important;
            height:78px!important;
            margin:0 auto 16px!important;
            border-radius:19px!important;
            background:linear-gradient(145deg,rgba(255,255,255,.98),color-mix(in srgb,var(--pale) 72%,#fff))!important;
            border:1px solid color-mix(in srgb,var(--accent) 15%,transparent)!important;
            box-shadow:0 8px 12px rgba(31,41,77,.10),inset 0 2px 2px rgba(255,255,255,.98),inset 0 -5px 8px rgba(53,63,91,.04)!important;
          }
          .cf-service-icon svg{
            width:39px!important;
            height:39px!important;
            stroke-width:2.2!important;
            filter:drop-shadow(0 2px 2px color-mix(in srgb,var(--accent) 13%,transparent))!important;
          }

          .cf-service-card h2{
            margin:0!important;
            font-size:25px!important;
            line-height:1.06!important;
            letter-spacing:-.7px!important;
            font-weight:800!important;
            color:#07132e!important;
            text-shadow:0 2px 4px rgba(22,35,78,.11)!important;
          }

          .cf-service-card p{
            color:#596987!important;
            max-width:210px!important;
            min-height:52px!important;
            margin:18px auto 20px!important;
            font-size:16px!important;
            font-weight:500!important;
            line-height:1.55!important;
          }

          .cf-service-cta{
            width:auto!important;
            min-height:60px!important;
            border-radius:13px!important;
            justify-content:center!important;
            gap:12px!important;
            padding:1px 16px!important;
            font-size:15.5px!important;
            font-weight:800!important;
            bottom:22px!important;
            left:20px!important;
            right:20px!important;
            box-shadow:0 9px 13px color-mix(in srgb,var(--accent) 25%,#141c3c2e),inset 0 1px 0 #ffffff6b,inset 0 -2px 3px #0000000f!important;
          }
          .cf-service-cta-text{
            font-size:15px!important;
            line-height:1!important;
            font-weight:800!important;
          }
          .cf-service-cta-circle-wrap{
            margin-left:0!important;
            display:inline-flex!important;
            align-items:center!important;
            justify-content:center!important;
          }
          .cf-service-cta-circle{
            width:18px!important;
            height:18px!important;
            border:0!important;
            border-radius:0!important;
            background:transparent!important;
            box-shadow:0 7px 14px rgba(0,0,0,.12),0 0 0 1px rgba(37,244,238,.10)!important;
          }
          .cf-service-cta-circle svg{width:18px!important;height:18px!important;stroke-width:2.2!important}

          .cf-service-hero{
            overflow:visible!important;
          }
          .cf-service-hero h1{
            display:inline-block!important;
            width:max-content!important;
            max-width:none!important;
            font-size:80px!important;
            line-height:.95!important;
            letter-spacing:-4.45px!important;
            font-weight:900!important;
            padding:8px 18px 12px 18px!important;
            margin:-8px auto -12px!important;
            overflow:visible!important;
            clip-path:none!important;
            -webkit-clip-path:none!important;
            text-shadow:
              0 2px 0 rgba(255,255,255,.98),
              0 4px 0 rgba(22,36,82,.10),
              0 7px 9px rgba(13,29,73,.26),
              0 0 1px #071126!important;
          }
          .cf-service-hero h1::before,
          .cf-service-hero h1::after{
            content:""!important;
            display:inline-block!important;
            width:10px!important;
            flex:0 0 10px!important;
          }
          .cf-service-hero h1 span{
            text-shadow:none!important;
            filter:drop-shadow(0 2px 0 rgba(255,255,255,.98)) drop-shadow(0 5px 9px rgba(51,110,255,.22));
          }

          /* V21 — hard fix: keep first glyph paint fully inside a real inner box */
          .cf-service-hero h1{
            display:block!important;
            width:100%!important;
            max-width:100%!important;
            padding:0 28px!important;
            margin:0 auto!important;
            overflow:visible!important;
            clip-path:none!important;
            -webkit-clip-path:none!important;
          }
          .cf-service-hero h1::before,
          .cf-service-hero h1::after{
            content:none!important;
            display:none!important;
          }
          .cf-service-hero-titleText{
            display:inline-block!important;
            position:relative!important;
            padding:10px 14px 14px 18px!important;
            margin:-10px -14px -14px -18px!important;
            overflow:visible!important;
            white-space:nowrap!important;
            color:#06132e!important;
            -webkit-text-fill-color:#06132e!important;
            background:none!important;
            background-image:none!important;
            background-clip:border-box!important;
            -webkit-background-clip:border-box!important;
            text-shadow:
              0 2px 0 rgba(255,255,255,.98),
              0 4px 0 rgba(22,36,82,.10),
              0 7px 9px rgba(13,29,73,.26),
              0 0 1px #071126!important;
            filter:none!important;
          }
          .cf-service-hero-titleText > .cf-service-hero-platform{
            display:inline!important;
            color:transparent!important;
            -webkit-text-fill-color:transparent!important;
            background-clip:text!important;
            -webkit-background-clip:text!important;
            text-shadow:none!important;
            filter:drop-shadow(0 2px 0 rgba(255,255,255,.98)) drop-shadow(0 5px 9px rgba(51,110,255,.22))!important;
          }

          .cf-service-best{
            z-index:5!important;
            height:38px!important;
            box-shadow:0 5px 10px color-mix(in srgb,var(--accent) 18%,transparent),inset 0 1px 0 #ffffff73!important;
            border-top:1px solid #ffffff6b!important;
            border-left:1px solid #ffffff59!important;
            border-radius:20px 20px 20px 0!important;
            gap:6px!important;
            padding:0 10px 0 8px!important;
            font-size:14px!important;
            font-weight:800!important;
            text-transform:capitalize!important;
            line-height:1!important;
            top:-2px!important;
            left:-1px!important;
          }

          /* V15 — Instagram service card mirrors the approved Home Instagram visual system */
          .cf-platform-instagram .cf-service-card{
            border:1.55px solid color-mix(in srgb,#E1306C 72%,#d9e1ef)!important;
            background:linear-gradient(180deg,rgba(255,255,255,.985),rgba(255,255,255,.925))!important;
            box-shadow:0 16px 23px rgba(25,34,70,.13),0 0 20px rgba(225,48,108,.12),inset 0 0 0 1px rgba(255,255,255,.96)!important;
          }
          .cf-platform-instagram .cf-service-best{
            background:linear-gradient(100deg,#8532f7 0%,#e43fc0 48%,#ff8b48 100%)!important;
            box-shadow:0 5px 10px rgba(170,45,211,.18),inset 0 1px 0 rgba(255,255,255,.45)!important;
          }
          .cf-platform-instagram .cf-service-cta-instagram{
            background:linear-gradient(100deg,#8735f7 0%,#d62fc2 45%,#ff8a3d 100%)!important;
            border:1px solid color-mix(in srgb,#E1306C 70%,#fff)!important;
            box-shadow:0 9px 13px color-mix(in srgb,#E1306C 25%,#141c3c2e),inset 0 1px 0 #ffffff6b,inset 0 -2px 3px #0000000f!important;
          }
          .cf-platform-instagram .cf-service-card-button:hover .cf-service-cta-instagram{
            background:linear-gradient(100deg,#8735f7 0%,#d62fc2 45%,#ff8a3d 100%)!important;
            transform:translateY(-2px)!important;
            filter:none!important;
            box-shadow:0 13px 20px color-mix(in srgb,#E1306C 31%,#141c3c2e)!important;
          }
        }

        @media (max-width:1099px){
          .cf-service-page{padding-bottom:24px!important}
          .cf-service-header{
            width:calc(100% - 28px)!important;height:66px!important;margin:0 auto!important;padding:0 4px!important;
            display:grid!important;grid-template-columns:1fr auto 1fr!important;align-items:center!important;
            border-bottom:1px solid rgba(120,135,165,.13)!important;
          }
          .cf-service-back{height:42px!important;padding:0 11px!important;border-radius:13px!important;background:rgba(255,255,255,.83)!important;box-shadow:0 7px 16px rgba(24,38,73,.08)!important;font-size:12px!important;font-weight:800!important}
          .cf-service-back svg{width:18px!important;height:18px!important}
          .cf-service-logo{font-size:26px!important;letter-spacing:-1.3px!important}
          .cf-service-logo svg{width:14px!important;height:14px!important}
          .cf-service-brandmark{font-size:22px!important;color:#1677ff!important}
          .cf-service-tabs{
            width:calc(100% - 24px)!important;min-height:66px!important;margin:12px auto 0!important;padding:6px!important;
            display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;
            border-radius:22px!important;background:rgba(255,255,255,.88)!important;border:1px solid rgba(141,153,184,.18)!important;
            box-shadow:0 10px 24px rgba(30,44,86,.08)!important;
          }
          .cf-service-tab{min-height:54px!important;padding:0 5px!important;gap:5px!important;border-radius:17px!important;font-size:10px!important;font-weight:800!important;justify-content:center!important}
          .cf-service-tab img{width:24px!important;height:24px!important}
          .cf-service-tab.active{background:#fff!important;border:1.5px solid var(--accent)!important;color:var(--accent)!important;box-shadow:0 5px 12px color-mix(in srgb,var(--accent) 10%,transparent)!important}
          .cf-service-shell{width:calc(100% - 24px)!important;margin:0 auto!important;padding:44px 0 24px!important}
          .cf-service-hero h1{font-size:clamp(36px,10vw,52px)!important;line-height:1!important;letter-spacing:-2.8px!important;text-shadow:0 4px 7px rgba(11,21,47,.12)!important}
          .cf-service-hero p{margin-top:16px!important;font-size:15px!important}
          .cf-service-grid{margin-top:34px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
          .cf-service-card{height:300px!important;min-height:300px!important;padding:36px 13px 13px!important;border-radius:20px!important;background:rgba(255,255,255,.93)!important;box-shadow:0 12px 22px rgba(25,37,75,.08)!important}
          .cf-service-best{top:-12px!important;left:8px!important;height:32px!important;padding:0 10px!important;border-radius:10px 10px 10px 3px!important;font-size:9px!important;gap:5px!important}
          .cf-service-best svg{width:13px!important;height:13px!important}
          .cf-service-icon{width:64px!important;height:64px!important;margin:0 auto 14px!important;border-radius:17px!important}
          .cf-service-icon svg{width:31px!important;height:31px!important}
          .cf-service-card h2{font-size:20px!important;letter-spacing:-.5px!important}
          .cf-service-card p{max-width:150px!important;min-height:48px!important;margin:10px auto 12px!important;font-size:11px!important;line-height:1.42!important}
          .cf-service-cta{left:12px!important;right:12px!important;bottom:12px!important;min-height:48px!important;padding:0 9px 0 13px!important;border-radius:12px!important;font-size:10px!important}
          .cf-service-cta-circle{width:29px!important;height:29px!important}
          .cf-service-cta-circle svg{width:15px!important;height:15px!important}
          .cf-service-benefits{margin:20px auto 0!important;padding:6px!important;grid-template-columns:repeat(2,1fr)!important;border-radius:18px!important;min-height:0!important;background:rgba(255,255,255,.90)!important}
          .cf-service-benefits>div{min-height:54px!important;padding:5px 7px!important;gap:8px!important}
          .cf-service-benefits>div+div{border-left:1px solid rgba(180,190,214,.50)!important}
          .cf-service-benefits>div:nth-child(3){border-left:0!important;border-top:1px solid rgba(180,190,214,.50)!important}
          .cf-service-benefits>div:nth-child(4){border-top:1px solid rgba(180,190,214,.50)!important}
          .cf-service-benefits strong{font-size:9.5px!important;white-space:nowrap!important}
          .cf-benefit-icon{width:34px!important;height:34px!important;min-width:34px!important;border-radius:10px!important;color:var(--accent)!important;background:linear-gradient(145deg,var(--pale),#fff)!important;box-shadow:0 5px 10px color-mix(in srgb,var(--accent) 11%,transparent)!important}
          .cf-benefit-icon svg{width:19px!important;height:19px!important}
          .cf-service-security{margin-top:17px!important;font-size:10px!important;gap:7px!important}
          .cf-service-security svg{width:14px!important;height:14px!important}
          .cf-service-bg{opacity:.45!important}
          .cf-bg-chip,.cf-bg-heart,.cf-bg-arrow,.cf-bg-bars,.cf-bg-social,.cf-bg-path{display:none!important}
        }

        @media (max-width:390px){
          .cf-service-header{width:calc(100% - 18px)!important;height:60px!important}
          .cf-service-back span{display:none!important}
          .cf-service-back{width:40px!important;padding:0!important;justify-content:center!important}
          .cf-service-logo{font-size:23px!important}
          .cf-service-tabs{width:calc(100% - 16px)!important;padding:5px!important}
          .cf-service-tab{font-size:8.8px!important;padding:0 3px!important}
          .cf-service-tab img{width:21px!important;height:21px!important}
          .cf-service-shell{width:calc(100% - 16px)!important;padding-top:35px!important}
          .cf-service-hero h1{font-size:34px!important;letter-spacing:-2.2px!important}
          .cf-service-hero p{font-size:13px!important}
          .cf-service-grid{gap:10px!important;margin-top:28px!important}
          .cf-service-card{height:282px!important;min-height:282px!important;padding:33px 9px 10px!important}
          .cf-service-icon{width:58px!important;height:58px!important}
          .cf-service-icon svg{width:28px!important;height:28px!important}
          .cf-service-card h2{font-size:18px!important}
          .cf-service-card p{font-size:10px!important;max-width:130px!important;min-height:45px!important}
          .cf-service-cta{font-size:9px!important;left:9px!important;right:9px!important;bottom:10px!important}
          .cf-service-benefits strong{font-size:8.6px!important}
        }

        /* V25 — final hero text fix: plain text prefix, only platform span uses gradient */
        .cf-service-hero{
          overflow:visible!important;
        }
        .cf-service-hero h1{
          color:#06132e!important;
          -webkit-text-fill-color:#06132e!important;
          overflow:visible!important;
          clip-path:none!important;
          -webkit-clip-path:none!important;
          padding-left:24px!important;
          padding-right:24px!important;
          box-sizing:border-box!important;
          text-shadow:
            0 2px 0 rgba(255,255,255,.98),
            0 4px 0 rgba(22,36,82,.10),
            0 7px 9px rgba(13,29,73,.26),
            0 0 1px #071126!important;
        }
        .cf-service-hero h1 > .cf-service-hero-platform{
          color:transparent!important;
          -webkit-text-fill-color:transparent!important;
          background-clip:text!important;
          -webkit-background-clip:text!important;
          text-shadow:none!important;
          filter:drop-shadow(0 2px 0 rgba(255,255,255,.98)) drop-shadow(0 5px 9px rgba(51,110,255,.22))!important;
        }

        /* V26 — exact approved hero result: fully visible prefix + 2.5D type */
        .cf-service-hero h1{
          display:flex!important;
          align-items:baseline!important;
          justify-content:center!important;
          flex-wrap:nowrap!important;
          gap:.16em!important;
          width:100%!important;
          max-width:none!important;
          padding:14px 34px 16px!important;
          overflow:visible!important;
          white-space:nowrap!important;
        }
        .cf-service-hero h1 > .cf-service-hero-prefix{
          display:inline-block!important;
          flex:0 0 auto!important;
          color:#06132e!important;
          -webkit-text-fill-color:#06132e!important;
          background:none!important;
          background-image:none!important;
          background-clip:border-box!important;
          -webkit-background-clip:border-box!important;
          overflow:visible!important;
          clip-path:none!important;
          -webkit-clip-path:none!important;
          text-shadow:0 2px 0 #fff,0 5px 0 rgba(24,39,84,.10),0 9px 12px rgba(12,29,72,.25)!important;
        }
        .cf-service-hero h1 > .cf-service-hero-platform{
          display:inline-block!important;
          flex:0 0 auto!important;
          overflow:visible!important;
          clip-path:none!important;
          -webkit-clip-path:none!important;
        }
        @media (max-width:700px){
          .cf-service-hero h1{flex-wrap:wrap!important;gap:0 .14em!important;white-space:normal!important;padding-left:10px!important;padding-right:10px!important}
        }

        /* V27 — final hero paint-box fix */
        @media (min-width:1100px){
          .cf-service-hero h1{display:block!important;width:100%!important;max-width:none!important;padding:0 24px!important;margin:0 auto!important;overflow:visible!important;font-size:76px!important;line-height:1!important;letter-spacing:-4px!important}
          .cf-service-hero-titleText{display:inline-flex!important;align-items:baseline!important;justify-content:center!important;width:max-content!important;max-width:none!important;white-space:nowrap!important;padding:14px 22px 18px 26px!important;margin:-14px -22px -18px -26px!important;overflow:visible!important;transform:none!important;clip-path:none!important;-webkit-clip-path:none!important}
          .cf-service-hero-titleText>.cf-service-hero-prefix{display:inline-block!important;position:relative!important;overflow:visible!important;color:#06132e!important;-webkit-text-fill-color:#06132e!important;background:none!important;padding-left:2px!important;text-shadow:0 2px 0 #fff,0 5px 0 rgba(24,39,84,.10),0 9px 12px rgba(12,29,72,.25)!important}
          .cf-service-hero-titleText>.cf-service-hero-platform{display:inline-block!important;overflow:visible!important}
        }
        @media (max-width:1099px){.cf-service-hero h1{overflow:visible!important;padding-inline:14px!important}.cf-service-hero-titleText{display:inline!important;overflow:visible!important}.cf-service-hero-titleText>.cf-service-hero-prefix{color:#06132e!important;-webkit-text-fill-color:#06132e!important;background:none!important}}

        /* V28 — Grow Your Service desktop compact 1000px system */
        @media (min-width:1100px){
          .cf-service-header{width:min(1000px,calc(100% - 56px))!important;height:76px!important}
          .cf-service-back{height:42px!important;padding:0 16px!important;border-radius:14px!important;font-size:14px!important}
          .cf-service-back svg{width:21px!important;height:21px!important}
          .cf-service-logo{font-size:34px!important;letter-spacing:-1.7px!important}
          .cf-service-logo svg{width:17px!important;height:17px!important}
          .cf-service-brandmark{font-size:26px!important}

          .cf-service-tabs{width:min(860px,calc(100% - 80px))!important;height:78px!important;margin-top:14px!important;padding:6px 12px!important;border-radius:28px!important}
          .cf-service-tab{min-height:62px!important;padding:0 14px!important;gap:11px!important;border-radius:23px!important;font-size:15px!important}
          .cf-service-tab img{width:34px!important;height:34px!important}

          .cf-service-shell{width:min(1000px,calc(100% - 64px))!important;padding:52px 0 38px!important}
          .cf-service-hero h1{font-size:64px!important;line-height:.96!important;letter-spacing:-3.6px!important}
          .cf-service-hero-titleText{padding:12px 20px 15px 23px!important;margin:-12px -20px -15px -23px!important}
          .cf-service-hero p{margin-top:18px!important;font-size:18px!important}

          .cf-service-grid{width:1000px!important;max-width:1000px!important;margin:40px auto 0!important;gap:16px!important}
          .cf-service-card-link{height:338px!important;min-height:338px!important}
          .cf-service-card{height:338px!important;min-height:338px!important;padding:40px 20px 20px!important;border-radius:24px!important}
          .cf-service-best{height:34px!important;padding:0 9px 0 7px!important;font-size:12px!important;gap:5px!important;border-radius:18px 18px 18px 0!important}
          .cf-service-best svg{width:13px!important;height:13px!important;flex-basis:13px!important}
          .cf-service-icon{width:70px!important;height:70px!important;margin-bottom:14px!important;border-radius:17px!important}
          .cf-service-icon svg{width:35px!important;height:35px!important}
          .cf-service-card h2{font-size:23px!important;letter-spacing:-.6px!important}
          .cf-service-card p{max-width:190px!important;min-height:48px!important;margin:14px auto 16px!important;font-size:14px!important;line-height:1.48!important}
          .cf-service-cta{left:18px!important;right:18px!important;bottom:20px!important;min-height:54px!important;border-radius:12px!important;padding:1px 14px!important;gap:10px!important;font-size:14px!important}
          .cf-service-cta-text{font-size:13.5px!important}
          .cf-service-cta-circle,.cf-service-cta-circle svg{width:16px!important;height:16px!important}

          .cf-service-benefits{width:920px!important;min-height:82px!important;margin-top:32px!important;padding:9px 14px!important;border-radius:22px!important}
          .cf-service-benefit{gap:11px!important;padding:0 12px!important;font-size:13px!important}
          .cf-benefit-icon{width:46px!important;height:46px!important;min-width:46px!important;border-radius:13px!important}
          .cf-benefit-icon svg{width:25px!important;height:25px!important}
          .cf-service-security{margin-top:22px!important;font-size:14px!important}
        }


        /* V29 — approved lightweight floating platform selector */
        @media (min-width:1100px){
          .cf-service-tabs{
            width:min(920px,calc(100% - 80px))!important;
            height:auto!important;
            min-height:68px!important;
            margin:18px auto 0!important;
            padding:0!important;
            display:grid!important;
            grid-template-columns:repeat(4,1fr)!important;
            gap:14px!important;
            align-items:stretch!important;
            border:0!important;
            border-radius:0!important;
            background:transparent!important;
            box-shadow:none!important;
            backdrop-filter:none!important;
          }
          .cf-service-tab{
            position:relative!important;
            min-height:64px!important;
            padding:0 18px!important;
            display:flex!important;
            align-items:center!important;
            justify-content:center!important;
            gap:11px!important;
            border:1px solid rgba(202,210,227,.58)!important;
            border-radius:18px!important;
            background:rgba(255,255,255,.91)!important;
            color:#10182d!important;
            box-shadow:0 8px 18px rgba(31,42,71,.075),inset 0 1px 0 #fff!important;
            font-size:15px!important;
            font-weight:800!important;
            transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease!important;
            overflow:visible!important;
          }
          .cf-service-tab img{
            width:31px!important;
            height:31px!important;
            object-fit:contain!important;
            filter:drop-shadow(0 4px 6px rgba(22,30,56,.12))!important;
          }
          .cf-service-tab:hover{
            transform:translateY(-2px)!important;
            background:#fff!important;
            box-shadow:0 11px 23px rgba(31,42,71,.10),inset 0 1px 0 #fff!important;
          }
          .cf-service-tab.active{
            transform:none!important;
          }
          .cf-service-tab.cf-tab-instagram.active{
            color:#fff!important;
            border:1px solid rgba(255,255,255,.80)!important;
            background:linear-gradient(100deg,#8735f7 0%,#d62fc2 43%,#f33d68 67%,#ff8a3d 100%)!important;
            background-image:linear-gradient(100deg,#8735f7 0%,#d62fc2 43%,#f33d68 67%,#ff8a3d 100%)!important;
            box-shadow:0 10px 22px rgba(214,47,194,.20),0 3px 10px rgba(255,138,61,.14),inset 0 1px 0 rgba(255,255,255,.48)!important;
          }
          .cf-service-tab.cf-tab-instagram.active:hover{
            color:#fff!important;
            transform:translateY(-2px)!important;
            border-color:rgba(255,255,255,.90)!important;
            background:linear-gradient(100deg,#8735f7 0%,#d62fc2 43%,#f33d68 67%,#ff8a3d 100%)!important;
            background-image:linear-gradient(100deg,#8735f7 0%,#d62fc2 43%,#f33d68 67%,#ff8a3d 100%)!important;
            box-shadow:0 13px 25px rgba(214,47,194,.24),0 4px 12px rgba(255,138,61,.16),inset 0 1px 0 rgba(255,255,255,.55)!important;
          }
          .cf-service-tab.cf-tab-instagram.active img{
            width:34px!important;
            height:34px!important;
            padding:4px!important;
            border-radius:11px!important;
            background:rgba(255,255,255,.96)!important;
            box-shadow:0 5px 12px rgba(70,22,94,.16),inset 0 1px 0 #fff!important;
            filter:none!important;
          }
          .cf-service-tab.cf-tab-instagram.active::before{
            content:""!important;
            position:absolute!important;
            left:50%!important;
            bottom:7px!important;
            width:58px!important;
            height:3px!important;
            border-radius:999px!important;
            transform:translateX(-50%)!important;
            background:rgba(255,255,255,.78)!important;
            box-shadow:0 1px 4px rgba(255,255,255,.25)!important;
          }
          .cf-service-tab.cf-tab-instagram.active::after{
            content:"✓"!important;
            position:absolute!important;
            top:-10px!important;
            right:-8px!important;
            width:27px!important;
            height:27px!important;
            display:grid!important;
            place-items:center!important;
            border:3px solid #fff!important;
            border-radius:999px!important;
            background:#fff!important;
            color:#ff725f!important;
            box-shadow:0 5px 12px rgba(29,36,64,.13)!important;
            font-size:14px!important;
            font-weight:900!important;
            line-height:1!important;
          }
          /* V48 — selected platform visual replicated from Instagram, themed per network */
          .cf-service-tab.cf-tab-tiktok.active{
            color:#fff!important;
            border:1px solid rgba(255,255,255,.82)!important;
            background:linear-gradient(100deg,#050505 0%,#111318 42%,#25f4ee 72%,#fe2c55 100%)!important;
            background-image:linear-gradient(100deg,#050505 0%,#111318 42%,#25f4ee 72%,#fe2c55 100%)!important;
            box-shadow:0 10px 22px rgba(37,244,238,.14),0 4px 12px rgba(254,44,85,.13),inset 0 1px 0 rgba(255,255,255,.36)!important;
          }
          .cf-service-tab.cf-tab-twitter.active{
            color:#fff!important;
            border:1px solid rgba(255,255,255,.78)!important;
            background:linear-gradient(100deg,#050607 0%,#111419 54%,#2a3038 100%)!important;
            background-image:linear-gradient(100deg,#050607 0%,#111419 54%,#2a3038 100%)!important;
            box-shadow:0 10px 22px rgba(15,20,25,.20),0 3px 10px rgba(55,64,76,.12),inset 0 1px 0 rgba(255,255,255,.24)!important;
          }
          .cf-service-tab.cf-tab-youtube.active{
            color:#fff!important;
            border:1px solid rgba(255,255,255,.82)!important;
            background:linear-gradient(100deg,#d80000 0%,#ff0000 55%,#ff4242 100%)!important;
            background-image:linear-gradient(100deg,#d80000 0%,#ff0000 55%,#ff4242 100%)!important;
            box-shadow:0 10px 22px rgba(255,0,0,.17),0 3px 10px rgba(255,66,66,.11),inset 0 1px 0 rgba(255,255,255,.38)!important;
          }
          .cf-service-tab.cf-tab-tiktok.active:hover,
          .cf-service-tab.cf-tab-twitter.active:hover,
          .cf-service-tab.cf-tab-youtube.active:hover{
            color:#fff!important;
            transform:translateY(-2px)!important;
            border-color:rgba(255,255,255,.92)!important;
          }
          .cf-service-tab.cf-tab-tiktok.active img,
          .cf-service-tab.cf-tab-twitter.active img,
          .cf-service-tab.cf-tab-youtube.active img{
            width:34px!important;
            height:34px!important;
            padding:4px!important;
            border-radius:11px!important;
            background:rgba(255,255,255,.96)!important;
            box-shadow:0 5px 12px rgba(20,25,40,.16),inset 0 1px 0 #fff!important;
            filter:none!important;
          }
          .cf-service-tab.cf-tab-tiktok.active::before,
          .cf-service-tab.cf-tab-twitter.active::before,
          .cf-service-tab.cf-tab-youtube.active::before{
            content:""!important;
            position:absolute!important;
            left:50%!important;
            bottom:7px!important;
            width:58px!important;
            height:3px!important;
            border-radius:999px!important;
            transform:translateX(-50%)!important;
            background:rgba(255,255,255,.78)!important;
            box-shadow:0 1px 4px rgba(255,255,255,.25)!important;
          }
          .cf-service-tab.cf-tab-tiktok.active::after,
          .cf-service-tab.cf-tab-twitter.active::after,
          .cf-service-tab.cf-tab-youtube.active::after{
            content:"✓"!important;
            position:absolute!important;
            top:-10px!important;
            right:-8px!important;
            width:27px!important;
            height:27px!important;
            display:grid!important;
            place-items:center!important;
            border:3px solid #fff!important;
            border-radius:999px!important;
            background:#fff!important;
            box-shadow:0 5px 12px rgba(29,36,64,.13)!important;
            font-size:14px!important;
            font-weight:900!important;
            line-height:1!important;
          }
          .cf-service-tab.cf-tab-tiktok.active::after{color:#fe2c55!important;}
          .cf-service-tab.cf-tab-twitter.active::after{color:#0f1419!important;}
          .cf-service-tab.cf-tab-youtube.active::after{color:#ff0000!important;}
        }

        /* V49 — floating depth for platform selection bars only */
        .cf-service-tab{
          box-shadow:0 10px 22px rgba(15,23,42,.11),0 3px 8px rgba(15,23,42,.065),inset 0 1px 0 rgba(255,255,255,.78)!important;
        }
        .cf-service-tab:hover{
          transform:translateY(-2px)!important;
          box-shadow:0 14px 28px rgba(15,23,42,.145),0 5px 12px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,.84)!important;
        }
        .cf-service-tab.cf-tab-instagram.active{
          box-shadow:0 15px 30px rgba(214,47,194,.23),0 5px 13px rgba(255,138,61,.16),inset 0 1px 0 rgba(255,255,255,.55)!important;
        }
        .cf-service-tab.cf-tab-tiktok.active{
          box-shadow:0 15px 30px rgba(37,244,238,.16),0 5px 13px rgba(254,44,85,.16),inset 0 1px 0 rgba(255,255,255,.40)!important;
        }
        .cf-service-tab.cf-tab-twitter.active{
          box-shadow:0 15px 30px rgba(15,20,25,.23),0 5px 13px rgba(55,64,76,.14),inset 0 1px 0 rgba(255,255,255,.28)!important;
        }
        .cf-service-tab.cf-tab-youtube.active{
          box-shadow:0 15px 30px rgba(255,0,0,.20),0 5px 13px rgba(255,66,66,.13),inset 0 1px 0 rgba(255,255,255,.42)!important;
        }

        /* V50 — keep X / Twitter and YouTube selected colors solid on hover */
        .cf-service-tab.cf-tab-twitter.active:hover{
          color:#fff!important;
          background:linear-gradient(100deg,#050607 0%,#111419 54%,#2a3038 100%)!important;
          background-image:linear-gradient(100deg,#050607 0%,#111419 54%,#2a3038 100%)!important;
          border-color:rgba(255,255,255,.92)!important;
          box-shadow:0 15px 30px rgba(15,20,25,.23),0 5px 13px rgba(55,64,76,.14),inset 0 1px 0 rgba(255,255,255,.28)!important;
          transform:translateY(-2px)!important;
        }
        .cf-service-tab.cf-tab-youtube.active:hover{
          color:#fff!important;
          background:linear-gradient(100deg,#d80000 0%,#ff0000 55%,#ff4242 100%)!important;
          background-image:linear-gradient(100deg,#d80000 0%,#ff0000 55%,#ff4242 100%)!important;
          border-color:rgba(255,255,255,.92)!important;
          box-shadow:0 15px 30px rgba(255,0,0,.20),0 5px 13px rgba(255,66,66,.13),inset 0 1px 0 rgba(255,255,255,.42)!important;
          transform:translateY(-2px)!important;
        }

        /* V51 — neutral hover for inactive X / Twitter and YouTube tabs */
        .cf-service-tab.cf-tab-twitter:hover:not(.active),
        .cf-service-tab.cf-tab-youtube:hover:not(.active){
          color:#35415a!important;
          background:#fff!important;
          background-image:none!important;
          border-color:transparent!important;
          opacity:1!important;
          filter:none!important;
          box-shadow:0 14px 28px rgba(15,23,42,.145),0 5px 12px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,.84)!important;
          transform:translateY(-2px)!important;
        }

        /* V31 — Grow Your Service cards: proportional 15% reduction only */
        @media (min-width:1100px){
          .cf-service-grid{
            transform:scale(.85)!important;
            transform-origin:top center!important;
            margin-bottom:-51px!important;
          }
        }

        /* V30 — selector refinement: lighter desktop + dedicated 2x2 mobile */
        @media (min-width:1100px){
          .cf-service-tabs{
            width:min(780px,calc(100% - 80px))!important;
            min-height:58px!important;
            gap:12px!important;
          }
          .cf-service-tab{
            min-height:58px!important;
            padding:0 14px!important;
            gap:9px!important;
            border-radius:16px!important;
            font-size:14px!important;
            box-shadow:0 6px 14px rgba(31,42,71,.06),inset 0 1px 0 #fff!important;
          }
          .cf-service-tab img{width:27px!important;height:27px!important;}
          .cf-service-tab.cf-tab-instagram.active{
            box-shadow:0 7px 16px rgba(214,47,194,.14),0 2px 7px rgba(255,138,61,.09),inset 0 1px 0 rgba(255,255,255,.45)!important;
          }
          .cf-service-tab.cf-tab-instagram.active:hover{
            box-shadow:0 10px 19px rgba(214,47,194,.17),0 3px 9px rgba(255,138,61,.11),inset 0 1px 0 rgba(255,255,255,.5)!important;
          }
          .cf-service-tab.cf-tab-instagram.active img{width:30px!important;height:30px!important;}
          .cf-service-tab.cf-tab-instagram.active::before{width:48px!important;bottom:6px!important;}
          .cf-service-tab.cf-tab-instagram.active::after{width:24px!important;height:24px!important;top:-8px!important;right:-6px!important;font-size:12px!important;}
        }

        @media (max-width:1099px){
          .cf-service-tabs{
            width:min(100% - 28px,560px)!important;
            height:auto!important;
            min-height:0!important;
            margin:14px auto 0!important;
            padding:0!important;
            display:grid!important;
            grid-template-columns:repeat(2,minmax(0,1fr))!important;
            gap:10px!important;
            border:0!important;
            border-radius:0!important;
            background:transparent!important;
            box-shadow:none!important;
            overflow:visible!important;
          }
          .cf-service-tab{
            position:relative!important;
            width:100%!important;
            min-width:0!important;
            min-height:54px!important;
            padding:0 12px!important;
            display:flex!important;
            align-items:center!important;
            justify-content:center!important;
            gap:8px!important;
            border:1px solid rgba(202,210,227,.62)!important;
            border-radius:15px!important;
            background:rgba(255,255,255,.94)!important;
            color:#10182d!important;
            box-shadow:0 5px 12px rgba(31,42,71,.06),inset 0 1px 0 #fff!important;
            font-size:14px!important;
            font-weight:800!important;
            overflow:visible!important;
          }
          .cf-service-tab img{width:25px!important;height:25px!important;object-fit:contain!important;}
          .cf-service-tab.cf-tab-instagram.active{
            color:#fff!important;
            border-color:rgba(255,255,255,.82)!important;
            background:linear-gradient(100deg,#8735f7 0%,#d62fc2 43%,#f33d68 67%,#ff8a3d 100%)!important;
            background-image:linear-gradient(100deg,#8735f7 0%,#d62fc2 43%,#f33d68 67%,#ff8a3d 100%)!important;
            box-shadow:0 7px 15px rgba(214,47,194,.14),0 2px 7px rgba(255,138,61,.09),inset 0 1px 0 rgba(255,255,255,.45)!important;
          }
          .cf-service-tab.cf-tab-instagram.active img{
            width:27px!important;height:27px!important;padding:3px!important;border-radius:9px!important;background:rgba(255,255,255,.96)!important;filter:none!important;
          }
          .cf-service-tab.cf-tab-instagram.active::after{
            content:"✓"!important;position:absolute!important;top:-7px!important;right:-5px!important;width:21px!important;height:21px!important;display:grid!important;place-items:center!important;border:2px solid #fff!important;border-radius:999px!important;background:#fff!important;color:#ff725f!important;box-shadow:0 4px 9px rgba(29,36,64,.11)!important;font-size:11px!important;font-weight:900!important;line-height:1!important;
          }
          .cf-service-tab.cf-tab-tiktok.active{
            color:#fff!important;border-color:rgba(255,255,255,.82)!important;
            background:linear-gradient(100deg,#050505 0%,#111318 42%,#25f4ee 72%,#fe2c55 100%)!important;
            background-image:linear-gradient(100deg,#050505 0%,#111318 42%,#25f4ee 72%,#fe2c55 100%)!important;
          }
          .cf-service-tab.cf-tab-twitter.active{
            color:#fff!important;border-color:rgba(255,255,255,.80)!important;
            background:linear-gradient(100deg,#050607 0%,#111419 54%,#2a3038 100%)!important;
            background-image:linear-gradient(100deg,#050607 0%,#111419 54%,#2a3038 100%)!important;
          }
          .cf-service-tab.cf-tab-youtube.active{
            color:#fff!important;border-color:rgba(255,255,255,.82)!important;
            background:linear-gradient(100deg,#d80000 0%,#ff0000 55%,#ff4242 100%)!important;
            background-image:linear-gradient(100deg,#d80000 0%,#ff0000 55%,#ff4242 100%)!important;
          }
          .cf-service-tab.cf-tab-tiktok.active img,
          .cf-service-tab.cf-tab-twitter.active img,
          .cf-service-tab.cf-tab-youtube.active img{
            width:27px!important;height:27px!important;padding:3px!important;border-radius:9px!important;background:rgba(255,255,255,.96)!important;filter:none!important;
          }
          .cf-service-tab.cf-tab-tiktok.active::after,
          .cf-service-tab.cf-tab-twitter.active::after,
          .cf-service-tab.cf-tab-youtube.active::after{
            content:"✓"!important;position:absolute!important;top:-7px!important;right:-5px!important;width:21px!important;height:21px!important;display:grid!important;place-items:center!important;border:2px solid #fff!important;border-radius:999px!important;background:#fff!important;box-shadow:0 4px 9px rgba(29,36,64,.11)!important;font-size:11px!important;font-weight:900!important;line-height:1!important;
          }
          .cf-service-tab.cf-tab-tiktok.active::after{color:#fe2c55!important;}
          .cf-service-tab.cf-tab-twitter.active::after{color:#0f1419!important;}
          .cf-service-tab.cf-tab-youtube.active::after{color:#ff0000!important;}
        }


        /* V33 — Back to Home: minimal, light and responsive */
        @media (min-width:1100px){
          .cf-service-back{
            height:34px!important;
            padding:0 6px!important;
            gap:7px!important;
            border:0!important;
            border-radius:0!important;
            background:transparent!important;
            box-shadow:none!important;
            color:#111a31!important;
            font-size:13.5px!important;
            font-weight:750!important;
            opacity:.78!important;
            transition:opacity .18s ease,transform .18s ease,color .18s ease!important;
          }
          .cf-service-back svg{
            width:18px!important;
            height:18px!important;
            stroke-width:2.2!important;
          }
          .cf-service-back:hover{
            opacity:1!important;
            transform:translateX(-2px)!important;
            color:#071329!important;
            background:transparent!important;
            box-shadow:none!important;
          }
        }

        @media (max-width:1099px){
          .cf-service-back{
            height:36px!important;
            min-width:0!important;
            padding:0 4px!important;
            gap:6px!important;
            border:0!important;
            border-radius:0!important;
            background:transparent!important;
            box-shadow:none!important;
            color:#111a31!important;
            font-size:12px!important;
            font-weight:750!important;
            opacity:.82!important;
          }
          .cf-service-back svg{
            width:18px!important;
            height:18px!important;
            stroke-width:2.2!important;
          }
        }


        /* V34 — Option 04: layered 2.5D service icons */
        .cf-service-icon.cf-service-icon-25d{
          position:relative!important;
          width:76px!important;
          height:70px!important;
          margin:0 auto 14px!important;
          overflow:visible!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          filter:none!important;
          isolation:isolate!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer{
          position:absolute!important;
          left:50%!important;
          top:50%!important;
          width:58px!important;
          height:58px!important;
          border-radius:16px!important;
          background:var(--gradient)!important;
          border:1px solid rgba(255,255,255,.48)!important;
          pointer-events:none!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-back{
          transform:translate(-38%,-43%) rotate(1deg)!important;
          opacity:.72!important;
          filter:saturate(.94)!important;
          box-shadow:0 8px 15px color-mix(in srgb,var(--accent) 13%,transparent)!important;
          z-index:1!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-mid{
          transform:translate(-44%,-47%) rotate(.5deg)!important;
          opacity:.88!important;
          box-shadow:0 7px 13px color-mix(in srgb,var(--accent) 16%,transparent)!important;
          z-index:2!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-front{
          transform:translate(-50%,-52%)!important;
          display:grid!important;
          place-items:center!important;
          box-shadow:0 9px 16px color-mix(in srgb,var(--accent) 22%,rgba(18,25,45,.10)),inset 0 1px 0 rgba(255,255,255,.62),inset 0 -2px 3px rgba(58,16,69,.10)!important;
          z-index:3!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-front::after{
          content:"";
          position:absolute;
          inset:2px 4px auto 4px;
          height:40%;
          border-radius:13px 13px 10px 10px;
          background:linear-gradient(180deg,rgba(255,255,255,.25),rgba(255,255,255,0));
          pointer-events:none;
        }
        .cf-service-icon-25d svg{
          position:relative!important;
          z-index:2!important;
          width:31px!important;
          height:31px!important;
          color:#fff!important;
          stroke:#fff!important;
          stroke-width:2.5!important;
          filter:drop-shadow(0 2px 2px rgba(54,18,64,.18))!important;
        }
        .cf-service-icon-followers .cf-service-icon-layer-front::before{
          content:"+";
          position:absolute;
          right:-7px;
          bottom:-6px;
          z-index:4;
          width:23px;
          height:23px;
          display:grid;
          place-items:center;
          border:2px solid #fff;
          border-radius:999px;
          background:var(--gradient);
          color:#fff;
          box-shadow:0 4px 8px color-mix(in srgb,var(--accent) 24%,transparent);
          font-size:18px;
          font-weight:900;
          line-height:1;
        }
        .cf-service-icon-views .cf-service-icon-layer,
        .cf-service-icon-comments .cf-service-icon-layer{border-radius:18px!important;}

        @media (max-width:1099px){
          .cf-service-icon.cf-service-icon-25d{width:66px!important;height:61px!important;}
          .cf-service-icon-25d .cf-service-icon-layer{width:51px!important;height:51px!important;border-radius:14px!important;}
          .cf-service-icon-25d svg{width:27px!important;height:27px!important;}
          .cf-service-icon-followers .cf-service-icon-layer-front::before{width:20px;height:20px;right:-6px;bottom:-5px;font-size:15px;}
        }

        /* V35 — premium 2.5D icon quality refinement (Grow Your Service only) */
        .cf-service-icon.cf-service-icon-25d{
          width:92px!important;
          height:84px!important;
          margin:0 auto 16px!important;
          perspective:520px!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer{
          width:66px!important;
          height:66px!important;
          border-radius:19px!important;
          background:var(--gradient)!important;
          border:1px solid rgba(255,255,255,.76)!important;
          backface-visibility:hidden!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-back{
          transform:translate(-34%,-39%) rotate(4deg) translateZ(-12px)!important;
          opacity:.58!important;
          filter:saturate(1.12) brightness(.96)!important;
          box-shadow:0 10px 18px color-mix(in srgb,var(--accent) 18%,transparent)!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-mid{
          transform:translate(-42%,-46%) rotate(2deg) translateZ(-5px)!important;
          opacity:.82!important;
          filter:saturate(1.08)!important;
          box-shadow:0 8px 15px color-mix(in srgb,var(--accent) 20%,transparent),inset 0 1px 0 rgba(255,255,255,.50)!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-front{
          transform:translate(-50%,-54%) translateZ(0)!important;
          border-color:rgba(255,255,255,.88)!important;
          box-shadow:
            0 12px 20px color-mix(in srgb,var(--accent) 27%,rgba(17,23,43,.12)),
            0 3px 5px rgba(12,20,43,.13),
            inset 0 2px 0 rgba(255,255,255,.70),
            inset 0 -4px 8px rgba(63,12,77,.16)!important;
        }
        .cf-service-icon-25d .cf-service-icon-layer-front::after{
          inset:3px 6px auto 6px!important;
          height:38%!important;
          border-radius:16px 16px 11px 11px!important;
          background:linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,.08) 58%,transparent)!important;
          filter:blur(.15px)!important;
        }
        .cf-service-icon-25d svg{
          width:36px!important;
          height:36px!important;
          stroke-width:2.35!important;
          filter:drop-shadow(0 2px 1px rgba(39,12,57,.24)) drop-shadow(0 0 1px rgba(255,255,255,.45))!important;
        }
        .cf-service-icon-followers .cf-service-icon-layer-front::before{
          right:-8px!important;
          bottom:-7px!important;
          width:26px!important;
          height:26px!important;
          border:2px solid rgba(255,255,255,.96)!important;
          box-shadow:0 5px 10px color-mix(in srgb,var(--accent) 28%,transparent),inset 0 1px 0 rgba(255,255,255,.62)!important;
          font-size:19px!important;
        }
        .cf-service-icon-likes .cf-service-icon-layer-front{border-radius:21px!important;}
        .cf-service-icon-views .cf-service-icon-layer,
        .cf-service-icon-comments .cf-service-icon-layer{border-radius:20px!important;}
        .cf-service-card:hover .cf-service-icon-25d .cf-service-icon-layer-front{
          transform:translate(-50%,-57%) translateZ(0)!important;
        }
        .cf-service-card:hover .cf-service-icon-25d .cf-service-icon-layer-mid{
          transform:translate(-41%,-47%) rotate(2.5deg) translateZ(-5px)!important;
        }
        .cf-service-card:hover .cf-service-icon-25d .cf-service-icon-layer-back{
          transform:translate(-32%,-40%) rotate(5deg) translateZ(-12px)!important;
        }
        @media (max-width:1099px){
          .cf-service-icon.cf-service-icon-25d{width:78px!important;height:72px!important;margin-bottom:13px!important;}
          .cf-service-icon-25d .cf-service-icon-layer{width:57px!important;height:57px!important;border-radius:17px!important;}
          .cf-service-icon-25d svg{width:31px!important;height:31px!important;}
          .cf-service-icon-followers .cf-service-icon-layer-front::before{width:22px!important;height:22px!important;right:-7px!important;bottom:-6px!important;font-size:16px!important;}
        }

        @media (max-width:390px){
          .cf-service-back{
            width:34px!important;
            height:34px!important;
            padding:0!important;
            justify-content:flex-start!important;
          }
          .cf-service-back span{display:none!important;}
        }


        /* V37 — crisp vector 2.5D service icons (SVG) */
        .cf-service-icon.cf-service-icon-raster{
          width:104px!important;
          height:104px!important;
          margin:0 auto 14px!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          overflow:visible!important;
          transform:none!important;
        }
        .cf-service-icon-raster .cf-service-icon-raster-img{
          display:block!important;
          width:104px!important;
          height:104px!important;
          max-width:none!important;
          object-fit:contain!important;
          filter:none!important;
          image-rendering:auto!important;
          transform:translateZ(0);
        }
        .cf-service-card:hover .cf-service-icon.cf-service-icon-raster{
          transform:translateY(-2px)!important;
        }
        @media (max-width:1099px){
          .cf-service-icon.cf-service-icon-raster{width:94px!important;height:94px!important;margin-bottom:12px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:94px!important;height:94px!important;}
        }
        @media (max-width:520px){
          .cf-service-icon.cf-service-icon-raster{width:82px!important;height:82px!important;margin-bottom:10px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:82px!important;height:82px!important;}
        }

        /* V39 — refined 2.5D service icons: clean, smaller glyphs, no hover artifact */
        .cf-service-icon.cf-service-icon-raster{
          width:88px!important;
          height:88px!important;
          margin:0 auto 14px!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          overflow:visible!important;
          transform:none!important;
          transition:none!important;
        }
        .cf-service-icon-raster .cf-service-icon-raster-img{
          display:block!important;
          width:88px!important;
          height:88px!important;
          max-width:none!important;
          object-fit:contain!important;
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          filter:none!important;
          transform:none!important;
          transition:none!important;
        }
        .cf-service-card:hover .cf-service-icon.cf-service-icon-raster,
        .cf-service-card:focus .cf-service-icon.cf-service-icon-raster,
        .cf-service-card:focus-within .cf-service-icon.cf-service-icon-raster,
        .cf-service-card-button:hover .cf-service-icon.cf-service-icon-raster{
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          filter:none!important;
          transform:none!important;
        }
        .cf-service-card:hover .cf-service-icon-raster-img,
        .cf-service-card:focus .cf-service-icon-raster-img,
        .cf-service-card:focus-within .cf-service-icon-raster-img,
        .cf-service-card-button:hover .cf-service-icon-raster-img{
          background:transparent!important;
          box-shadow:none!important;
          filter:none!important;
          transform:none!important;
          scale:1!important;
        }
        @media (max-width:1099px){
          .cf-service-icon.cf-service-icon-raster{width:80px!important;height:80px!important;margin-bottom:12px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:80px!important;height:80px!important;}
        }
        @media (max-width:520px){
          .cf-service-icon.cf-service-icon-raster{width:72px!important;height:72px!important;margin-bottom:10px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:72px!important;height:72px!important;}
        }


        /* V40 — final approved 2.5D raster assets, high-resolution and transparent */
        .cf-service-icon.cf-service-icon-raster{
          width:117px!important;
          height:117px!important;
          margin:0 auto 14px!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          overflow:visible!important;
          transform:none!important;
          transition:none!important;
        }
        .cf-service-icon-raster .cf-service-icon-raster-img{
          display:block!important;
          width:117px!important;
          height:117px!important;
          max-width:none!important;
          object-fit:contain!important;
          background:transparent!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          filter:none!important;
          transform:none!important;
          transition:none!important;
          image-rendering:auto!important;
        }
        .cf-service-card:hover .cf-service-icon.cf-service-icon-raster,
        .cf-service-card:focus .cf-service-icon.cf-service-icon-raster,
        .cf-service-card:focus-within .cf-service-icon.cf-service-icon-raster,
        .cf-service-card-button:hover .cf-service-icon.cf-service-icon-raster,
        .cf-service-card:hover .cf-service-icon-raster-img,
        .cf-service-card:focus .cf-service-icon-raster-img,
        .cf-service-card:focus-within .cf-service-icon-raster-img,
        .cf-service-card-button:hover .cf-service-icon-raster-img{
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          filter:none!important;
          transform:none!important;
          scale:1!important;
          opacity:1!important;
        }
        @media (max-width:1099px){
          .cf-service-icon.cf-service-icon-raster{width:105px!important;height:105px!important;margin-bottom:12px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:105px!important;height:105px!important;}
        }
        @media (max-width:520px){
          .cf-service-icon.cf-service-icon-raster{width:94px!important;height:94px!important;margin-bottom:10px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:94px!important;height:94px!important;}
        }

        /* V42 — compact icon footprint: keep visual size, remove empty layout box */
        .cf-service-icon.cf-service-icon-raster{
          position:relative!important;
          width:86px!important;
          height:74px!important;
          display:block!important;
          margin:0 auto 8px!important;
          overflow:visible!important;
        }
        .cf-service-icon-raster .cf-service-icon-raster-img{
          position:absolute!important;
          left:50%!important;
          top:50%!important;
          width:120px!important;
          height:120px!important;
          max-width:none!important;
          transform:translate(-50%,-50%)!important;
          object-fit:contain!important;
          pointer-events:none!important;
        }
        .cf-service-card:hover .cf-service-icon-raster .cf-service-icon-raster-img,
        .cf-service-card:focus .cf-service-icon-raster .cf-service-icon-raster-img,
        .cf-service-card:focus-within .cf-service-icon-raster .cf-service-icon-raster-img{
          transform:translate(-50%,-50%)!important;
        }
        @media (max-width:1099px){
          .cf-service-icon.cf-service-icon-raster{width:78px!important;height:68px!important;margin-bottom:7px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:108px!important;height:108px!important;}
        }
        @media (max-width:520px){
          .cf-service-icon.cf-service-icon-raster{width:70px!important;height:62px!important;margin-bottom:6px!important;}
          .cf-service-icon-raster .cf-service-icon-raster-img{width:96px!important;height:96px!important;}
        }


        /* V64 — +10% visual service icon artwork only; layout footprint unchanged */
        .cf-service-icon-raster .cf-service-icon-raster-img{
          width:132px!important;
          height:132px!important;
        }
        @media (max-width:1099px){
          .cf-service-icon-raster .cf-service-icon-raster-img{width:119px!important;height:119px!important;}
        }
        @media (max-width:520px){
          .cf-service-icon-raster .cf-service-icon-raster-img{width:106px!important;height:106px!important;}
        }

        /* V67 — TikTok / X-Twitter / YouTube artwork +5% only; layout footprint and colors unchanged */
        .cf-platform-tiktok .cf-service-icon-raster .cf-service-icon-raster-img,
        .cf-platform-twitter .cf-service-icon-raster .cf-service-icon-raster-img,
        .cf-platform-youtube .cf-service-icon-raster .cf-service-icon-raster-img{
          width:139px!important;
          height:139px!important;
        }
        @media (max-width:1099px){
          .cf-platform-tiktok .cf-service-icon-raster .cf-service-icon-raster-img,
          .cf-platform-twitter .cf-service-icon-raster .cf-service-icon-raster-img,
          .cf-platform-youtube .cf-service-icon-raster .cf-service-icon-raster-img{
            width:125px!important;
            height:125px!important;
          }
        }
        @media (max-width:520px){
          .cf-platform-tiktok .cf-service-icon-raster .cf-service-icon-raster-img,
          .cf-platform-twitter .cf-service-icon-raster .cf-service-icon-raster-img,
          .cf-platform-youtube .cf-service-icon-raster .cf-service-icon-raster-img{
            width:111px!important;
            height:111px!important;
          }
        }

        /* V68 — Instagram service-card artwork +5% only; no color/layout changes */
        .cf-platform-instagram .cf-service-icon-raster .cf-service-icon-raster-img{
          width:139px!important;
          height:139px!important;
        }
        @media (max-width:1099px){
          .cf-platform-instagram .cf-service-icon-raster .cf-service-icon-raster-img{
            width:125px!important;
            height:125px!important;
          }
        }
        @media (max-width:520px){
          .cf-platform-instagram .cf-service-icon-raster .cf-service-icon-raster-img{
            width:111px!important;
            height:111px!important;
          }
        }

        /* V63 — exact requested desktop header + service icon dimensions */
        @media (width >= 1100px) {
          .cf-service-header {
            width: min(1000px, calc(100% - 56px)) !important;
            height: 88px !important;
          }

          .cf-service-icon.cf-service-icon-raster {
            width: 92px !important;
            height: 92px !important;
            margin: 0 auto 10px !important;
          }
        }

        /* V52 — Grow Your Service TikTok CTA mirrors Home TikTok CTA exactly */
        .cf-platform-tiktok .cf-service-cta-tiktok{
          background:linear-gradient(
            110deg,
            #080808 0%,
            #0a0d0e 30%,
            #155054 66%,
            #9b2948 100%
          )!important;
          border:1px solid transparent!important;
          color:#fff!important;
          box-shadow:none!important;
          filter:none!important;
          transition:transform 180ms ease!important;
        }
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-text,
        .cf-platform-tiktok .cf-service-cta-tiktok svg{
          color:#fff!important;
          stroke:#fff!important;
        }
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle{
          background:rgba(255,255,255,.12)!important;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok{
            background:linear-gradient(100deg,#11151d 0%,#131923 56%,#ec2469 100%)!important;
            border-color:rgba(37,244,238,.70)!important;
            color:#fff!important;
            filter:none!important;
            transform:translateY(-1px)!important;
            box-shadow:0 7px 14px rgba(0,0,0,.12),0 0 0 1px rgba(37,244,238,.10)!important;
          }
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok svg{
            color:#fff!important;
            stroke:#fff!important;
          }
        }
        .cf-platform-tiktok .cf-service-card-button:active .cf-service-cta-tiktok{
          background:linear-gradient(
            110deg,
            #080808 0%,
            #0a0d0e 30%,
            #155054 66%,
            #9b2948 100%
          )!important;
          filter:none!important;
          transform:translateY(1px)!important;
          box-shadow:none!important;
        }


        /* V53 — TikTok Grow CTA: exact Home CTA visual treatment */
        .cf-platform-tiktok .cf-service-cta-tiktok{
          position:absolute!important;
          overflow:hidden!important;
          background:linear-gradient(100deg,#11151d 0%,#131923 56%,#ec2469 100%)!important;
          border:1px solid rgba(37,244,238,.62)!important;
          color:#fff!important;
          box-shadow:0 0 0 1px rgba(37,244,238,.10)!important;
          filter:none!important;
          transition:transform 180ms ease,box-shadow 180ms ease!important;
        }
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle{
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
        }
        .cf-platform-tiktok .cf-service-cta-tiktok svg{
          color:#fff!important;
          stroke:#fff!important;
          transition:transform 180ms ease!important;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok{
            background:linear-gradient(100deg,#11151d 0%,#131923 56%,#ec2469 100%)!important;
            border-color:rgba(37,244,238,.70)!important;
            color:#fff!important;
            filter:none!important;
            transform:translateY(-1px)!important;
            box-shadow:0 7px 14px rgba(0,0,0,.12),0 0 0 1px rgba(37,244,238,.10)!important;
          }
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok svg{
            transform:translate(3px,-1px)!important;
          }
        }
        .cf-platform-tiktok .cf-service-card-button:active .cf-service-cta-tiktok{
          transform:scale(.98)!important;
          filter:none!important;
          box-shadow:none!important;
          transition-duration:80ms!important;
        }

        /* V61 — YouTube Grow CTA: mirror Home YouTube button colors and depth */
        .cf-platform-youtube .cf-service-cta-youtube{
          background:linear-gradient(100deg,#f00017,#ff3039)!important;
          border:1px solid color-mix(in srgb,#ff3848 70%,#fff)!important;
          color:#fff!important;
          box-shadow:
            0 10px 14px color-mix(in srgb,#ff3848 24%,rgba(20,28,60,.18)),
            inset 0 1px 0 rgba(255,255,255,.28)!important;
          filter:none!important;
          transition:transform .18s ease,box-shadow .18s ease!important;
        }
        .cf-platform-youtube .cf-service-cta-youtube .cf-service-cta-text,
        .cf-platform-youtube .cf-service-cta-youtube svg{
          color:#fff!important;
          stroke:#fff!important;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-platform-youtube .cf-service-card-button:hover .cf-service-cta-youtube{
            background:linear-gradient(100deg,#f00017,#ff3039)!important;
            border-color:color-mix(in srgb,#ff3848 70%,#fff)!important;
            color:#fff!important;
            filter:none!important;
            transform:translateY(-2px)!important;
            box-shadow:0 13px 20px color-mix(in srgb,#ff3848 31%,rgba(20,28,60,.18))!important;
          }
        }
        .cf-platform-youtube .cf-service-card-button:active .cf-service-cta-youtube{
          transform:scale(.985)!important;
          filter:none!important;
        }

        /* V62 — center active marker bar for TikTok, X/Twitter and YouTube exactly like Instagram */
        @media (min-width:1100px){
          .cf-service-tab.cf-tab-tiktok.active::before,
          .cf-service-tab.cf-tab-twitter.active::before,
          .cf-service-tab.cf-tab-youtube.active::before{
            left:50%!important;
            right:auto!important;
            bottom:6px!important;
            width:48px!important;
            height:3px!important;
            transform:translateX(-50%)!important;
            margin:0!important;
          }
        }

        /* V57 — TikTok Grow CTA: stronger cyan shadow to match Home depth */
        .cf-platform-tiktok .cf-service-cta-tiktok{
          box-shadow:
            0 7px 16px rgba(37,244,238,.24),
            0 3px 8px rgba(37,244,238,.15),
            0 0 0 1px rgba(37,244,238,.28)!important;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok{
            box-shadow:
              0 9px 20px rgba(37,244,238,.28),
              0 4px 10px rgba(37,244,238,.18),
              0 0 0 1px rgba(37,244,238,.34)!important;
          }
        }

        /* V80 — TikTok Grow only: restore the same circular Step 1 arrow treatment used by the other cards. */
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle-wrap{
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          padding:0!important;
        }
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle{
          width:34px!important;
          height:34px!important;
          min-width:34px!important;
          min-height:34px!important;
          border-radius:9999px!important;
          background:rgba(255,255,255,.12)!important;
          border:1px solid rgba(255,255,255,.07)!important;
          box-shadow:0 6px 14px rgba(0,242,234,.18), inset 0 1px 0 rgba(255,255,255,.10)!important;
          padding:0!important;
          overflow:hidden!important;
        }
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle svg{
          width:18px!important;
          height:18px!important;
          color:#fff!important;
          stroke:#fff!important;
          stroke-width:2.35!important;
          filter:none!important;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok .cf-service-cta-circle{
            background:rgba(255,255,255,.15)!important;
            box-shadow:0 7px 16px rgba(0,242,234,.24), inset 0 1px 0 rgba(255,255,255,.12)!important;
          }
        }

        /* V81 — TikTok Grow arrow: keep icon completely static, matching the other platform arrows. */
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle-wrap svg,
        .cf-platform-tiktok .cf-service-cta-tiktok .cf-service-cta-circle svg{
          transform:none!important;
          transition:none!important;
          animation:none!important;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok .cf-service-cta-circle-wrap svg,
          .cf-platform-tiktok .cf-service-card-button:hover .cf-service-cta-tiktok .cf-service-cta-circle svg{
            transform:none!important;
          }
        }

`}

</style>
    </main>
  );
}
