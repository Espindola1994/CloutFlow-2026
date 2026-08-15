"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  Headphones,
  Heart,
  Lock,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Star,
  UsersRound,
  Zap,
} from "lucide-react";

import instagramIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterIcon from "@/assets/home-icons-vector/twitter.svg";
import facebookIcon from "@/assets/home-icons-vector/facebook.svg";
import ProfileLookupModal from "@/components/profile-lookup-modal";

type PlatformId = "instagram" | "tiktok" | "twitter" | "facebook";

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
    accent: "#ff3b79",
    accent2: "#ff7a3d",
    pale: "#fff1f6",
    gradient: "linear-gradient(90deg,#ff7a3d 0%,#ff526d 40%,#d633a6 100%)",
    icon: instagramIcon,
  },
  tiktok: {
    name: "TikTok",
    shortName: "TikTok",
    accent: "#B5122B",
    accent2: "#C91836",
    pale: "#FFF0F3",
    gradient: "linear-gradient(90deg,#3e8f95 0%,#8f6473 24%,#b94b69 50%,#d63a60 74%,#b93459 100%)",
    icon: tiktokIcon,
  },
  twitter: {
    name: "X / Twitter",
    shortName: "X / Twitter",
    accent: "#202938",
    accent2: "#65738a",
    pale: "#f4f6f8",
    gradient: "linear-gradient(90deg,#111827 0%,#4b5563 100%)",
    icon: twitterIcon,
  },
  facebook: {
    name: "Facebook",
    shortName: "Facebook",
    accent: "#1675ff",
    accent2: "#0ca9ff",
    pale: "#eef6ff",
    gradient: "linear-gradient(90deg,#2387ff 0%,#1267ed 100%)",
    icon: facebookIcon,
  },
};

const NAV = [
  { id: "instagram" as const, label: "Instagram", icon: instagramIcon },
  { id: "tiktok" as const, label: "TikTok", icon: tiktokIcon },
  { id: "twitter" as const, label: "X / Twitter", icon: twitterIcon },
  { id: "facebook" as const, label: "Facebook", icon: facebookIcon },
];


function UserUpIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="14" r="6.5"/><path d="M7.5 35.5c0-7 4.7-11.5 10.5-11.5 4 0 7.2 2 9 5"/><path d="M29 35l9-9m0 0v7m0-7h-7"/></svg>;
}
function HeartUpIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M23 35.5 10.5 23.8C4.8 18.5 8.1 9 16 9c3.3 0 6.2 1.8 7.8 4.5C25.4 10.8 28.3 9 31.6 9 39.3 9 42 18.2 37 23.2"/><path d="M29 36l9-9m0 0v7m0-7h-7"/></svg>;
}
function EyeChartUpIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 21.5S11.5 12 22 12s17 9.5 17 9.5S32.5 31 22 31 5 21.5 5 21.5Z"/><circle cx="22" cy="21.5" r="4.5"/><path d="m28 38 5-5 3 2 7-8"/><path d="M37 27h6v6"/></svg>;
}
function MessageSquarePlusIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 9h27a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H19l-9 6v-6H7a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Z"/><circle cx="13" cy="21.5" r="1"/><circle cx="20.5" cy="21.5" r="1"/><circle cx="28" cy="21.5" r="1"/><path d="M39 35v10M34 40h10"/></svg>;
}

const SERVICES = [
  {
    id: "followers",
    title: "Followers",
    description: "High quality real followers.",
    Icon: UserUpIcon,
    bestSeller: true,
  },
  {
    id: "likes",
    title: "Likes",
    description: "Instant post likes from real users.",
    Icon: HeartUpIcon,
  },
  {
    id: "views",
    title: "Views",
    description: "Boost video views and reach.",
    Icon: EyeChartUpIcon,
  },
  {
    id: "comments",
    title: "Comments",
    description: "Custom relevant comments.",
    Icon: MessageSquarePlusIcon,
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
      <div className="cf-service-bg cf-service-bg-top" aria-hidden="true">
        <span className="cf-bg-chip">👥 +1K</span>
        <span className="cf-bg-heart">♥</span>
        <span className="cf-bg-arrow" />
        <span className="cf-bg-bars"><i /><i /><i /><i /></span>
        <span className="cf-bg-circle c1" />
        <span className="cf-bg-circle c2" />
        <span className="cf-bg-dots" />
      </div>

      <div className="cf-service-bg cf-service-bg-bottom" aria-hidden="true">
        <span className="cf-bg-social ig">◎</span>
        <span className="cf-bg-social fb">f</span>
        <span className="cf-bg-social x">X</span>
        <span className="cf-bg-path" />
        <span className="cf-bg-chip lower">👥 +2.5K</span>
        <span className="cf-bg-dots lower-dots" />
      </div>

      <header className="cf-service-header">
        <button className="cf-service-back" type="button" onClick={() => router.push("/")}>
          <ArrowLeft />
          <span>Back to Home</span>
        </button>

        <Link href="/" className="cf-service-logo">
          <span>Clout</span><b>Flow</b><ArrowUpRight />
        </Link>

        <span className="cf-service-brandmark" aria-hidden="true">✦</span>
      </header>

      <nav className="cf-service-tabs" aria-label="Choose social platform">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={`/${item.id}`}
            className={`cf-service-tab ${item.id === platform ? "active" : ""}`}
          >
            <Image src={item.icon} alt="" width={34} height={34} priority />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <section className="cf-service-shell">
        

        <section className="cf-service-hero">
          <h1>
            Grow Your{" "}
            <span style={{ backgroundImage: theme.gradient }}>{theme.name}</span>
          </h1>
          <p>Choose a service and start growing today.</p>
        </section>

        <section className="cf-service-grid" aria-label={`${theme.name} services`}>
          {SERVICES.map(({ id, title, description, Icon, bestSeller }) => (
            <button key={id} type="button" onClick={() => setLookupService(id)} className="cf-service-card-link cf-service-card-button">
              <article className="cf-service-card">
                {bestSeller && (
                  <div className="cf-service-best">
                    <Star fill="currentColor" />
                    <span>BEST SELLER</span>
                  </div>
                )}

                <div className="cf-service-icon">
                  <Icon />
                </div>

                <h2>{title}</h2>
                <p>{description}</p>

                <div className="cf-service-cta">
                  <span>Start Growing</span>
                  <ArrowUpRight />
                </div>
              </article>
            </button>
          ))}
        </section>

        <section className="cf-service-benefits" aria-label="CloutFlow benefits">
          <div>
            <span className="cf-benefit-icon"><ShieldCheck /></span>
            <div><strong>100% Safe &amp; Secure</strong></div>
          </div>
          <div>
            <span className="cf-benefit-icon"><LockKeyhole /></span>
            <div><strong>No Password Required</strong></div>
          </div>
          <div>
            <span className="cf-benefit-icon"><Zap /></span>
            <div><strong>Fast Delivery</strong></div>
          </div>
          <div>
            <span className="cf-benefit-icon"><Headphones /></span>
            <div><strong>24/7 Support</strong></div>
          </div>
        </section>

        <div className="cf-service-security">
          <Lock />
          <span>Your information is 100% secure and protected.</span>
        </div>
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
            radial-gradient(circle at 9% 31%, rgba(120,170,255,.055), transparent 15%),
            radial-gradient(circle at 90% 33%, color-mix(in srgb,var(--accent) 6%,transparent), transparent 17%),
            #fff;
          color:#081126;
          position:relative;
          overflow:hidden;
          padding:0 24px 28px;
          font-family:Arial,Helvetica,sans-serif;
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
          width:min(100%,1000px);
          height:86px;
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
          font-size:14px;
          font-weight:700;
          padding:8px 4px;
          cursor:pointer;
        }
        .cf-service-back svg{width:20px;height:20px}
        .cf-service-logo{
          justify-self:center;
          display:inline-flex;
          align-items:center;
          text-decoration:none;
          color:#081126;
          font-size:29px;
          font-weight:900;
          letter-spacing:-1.5px;
        }
        .cf-service-logo b{color:#1376ff}
        .cf-service-logo svg{width:17px;height:17px;color:#1376ff;margin-left:-2px;margin-top:-15px;stroke-width:2.7}
        .cf-service-brandmark{
          justify-self:end;
          color:#1376ff;
          font-size:22px;
        }

        .cf-service-tabs{
          width:min(100%,720px);
          min-height:56px;
          margin:0 auto;
          padding:6px 8px;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          align-items:center;
          border:1px solid #e3e8ef;
          border-radius:999px;
          background:rgba(255,255,255,.94);
          box-shadow:0 8px 25px rgba(36,51,79,.10);
          position:relative;
          z-index:4;
        }
        .cf-service-tab{
          min-width:0;
          min-height:43px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          text-decoration:none;
          color:#35415a;
          font-size:14px;
          font-weight:700;
          border-radius:999px;
          transition:.2s ease;
        }
        .cf-service-tab img{width:27px!important;height:27px!important;object-fit:contain}
        .cf-service-tab.active{
          color:var(--accent);
          background:var(--pale);
          box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 36%,transparent);
        }

        .cf-service-shell{
          width:min(100%,1000px);
          margin:0 auto;
          padding:72px 0 8px;
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
          font-size:56px;
          line-height:1;
          letter-spacing:-3.2px;
          font-weight:900;
          color:#091127;
        }
        .cf-service-hero h1 span{
          background-clip:text;
          -webkit-background-clip:text;
          color:transparent;
        }
        .cf-service-hero p{
          margin:18px auto 0;
          color:#637088;
          font-size:18px;
          line-height:1.35;
        }

        .cf-service-grid{
          margin:54px auto 0;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:24px;
        }
        .cf-service-card-link{text-decoration:none;color:inherit;min-width:0}
        .cf-service-card{
          min-height:334px;
          position:relative;
          padding:42px 24px 23px;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          border:1.5px solid color-mix(in srgb,var(--accent) 34%,#e7e9ee);
          border-radius:22px;
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
        .cf-service-best{
          position:absolute;
          left:42px;
          top:-18px;
          min-height:38px;
          padding:0 15px;
          display:flex;
          align-items:center;
          gap:7px;
          color:#fff;
          background:var(--gradient);
          border-radius:7px 7px 2px 2px;
          box-shadow:0 8px 18px color-mix(in srgb,var(--accent) 18%,transparent);
          font-size:12px;
          font-weight:900;
          letter-spacing:.2px;
        }
        .cf-service-best svg{width:14px;height:14px}
        .cf-service-icon{
          width:72px;
          height:72px;
          display:grid;
          place-items:center;
          clip-path:none;
          border-radius:18px;
          background:var(--pale);
          color:var(--accent);
          border:1px solid color-mix(in srgb,var(--accent) 10%,transparent);
          box-shadow:0 5px 14px color-mix(in srgb,var(--accent) 6%,transparent);
        }
        .cf-service-icon svg{
          width:39px;
          height:39px;
          fill:none;
          stroke:currentColor;
          stroke-width:2.25;
          stroke-linecap:round;
          stroke-linejoin:round;
          overflow:visible;
        }
        .cf-service-card h2{
          margin:24px 0 0;
          color:#081126;
          font-size:22px;
          line-height:1.1;
          font-weight:900;
        }
        .cf-service-card p{
          margin:15px auto 0;
          min-height:45px;
          max-width:180px;
          color:#66738c;
          font-size:14px;
          line-height:1.55;
        }
        .cf-service-cta{
          width:100%;
          min-height:48px;
          margin-top:auto;
          border:1.5px solid var(--accent);
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 19px 0 24px;
          color:var(--accent);
          background:#fff;
          font-size:13px;
          font-weight:900;
        }
        .cf-service-cta svg{width:18px;height:18px}

        .cf-service-benefits{
          width:min(100%,1000px);
          min-height:108px;
          margin:48px auto 0;
          padding:18px 22px;
          display:grid;
          grid-template-columns:repeat(4,1fr);
          align-items:center;
          border:1px solid #e5e9ef;
          border-radius:22px;
          background:#fff;
          box-shadow:0 10px 30px rgba(35,50,85,.06);
        }
        .cf-service-benefits>div{
          min-height:64px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:14px;
          padding:0 19px;
        }
        .cf-service-benefits>div+div{border-left:1px solid #e1e6ee}
        .cf-benefit-icon{
          width:48px;
          height:48px;
          border-radius:50%;
          display:grid;
          place-items:center;
          flex:0 0 auto;
        }
        .cf-benefit-icon svg{width:25px;height:25px}
        .cf-benefit-icon.blue{color:#1476ff;background:#eaf4ff}
        .cf-benefit-icon.mint{color:#12c69b;background:#e7fbf5}
        .cf-benefit-icon.purple{color:#9732ef;background:#f5eaff}
        .cf-benefit-icon.pink{color:#fa3b82;background:#fff0f5}
        .cf-service-benefits strong{
          display:block;
          color:#111827;
          font-size:13px;
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
          margin:28px auto 0;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          color:#69768d;
          font-size:12px;
        }
        .cf-service-security svg{width:17px;height:17px}

        .cf-service-bg{
          position:absolute;
          pointer-events:none;
          z-index:1;
          opacity:.085;
        }
        .cf-service-bg-top{right:-5px;top:132px;width:310px;height:350px}
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

        .cf-service-bg-bottom{left:-4px;bottom:25px;width:250px;height:340px}
        .cf-bg-social{position:absolute;font-weight:900;color:#6865ff}
        .cf-bg-social.ig{left:20px;top:36px;font-size:38px;color:#ff4d9b}
        .cf-bg-social.fb{
          left:38px;top:148px;width:40px;height:40px;
          display:grid;place-items:center;
          border:2px solid #2d7aff;border-radius:50%;
          font-size:33px;color:#2d7aff;
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
          .cf-service-best{
            left:36px;
            top:-15px;
            min-height:32px;
            padding:0 13px;
            font-size:10px;
          }
          .cf-service-best svg{width:12px;height:12px}
          .cf-service-icon{
            width:61px;
            height:61px;
          }
          .cf-service-icon svg{width:29px;height:29px}
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
          .cf-service-cta{
            min-height:41px;
            padding:0 16px 0 20px;
            font-size:11px;
          }
          .cf-service-cta svg{width:15px;height:15px}

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
            border-radius:999px;
            overflow:hidden;
          }
          .cf-service-tab{
            min-height:40px;
            gap:5px;
            font-size:10px;
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
          .cf-service-icon{
            width:60px;height:60px;
          }
          .cf-service-icon svg{width:28px;height:28px}
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
          .cf-service-icon{
            width:57px !important;
            height:57px !important;
          }
          .cf-service-icon svg{
            width:27px !important;
            height:27px !important;
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



        /* V120 — Professional CTA microinteraction: Grow Your Service */
        .cf-service-cta{
          position:relative!important;
          overflow:hidden!important;
          transition:transform 180ms ease,box-shadow 180ms ease,filter 180ms ease!important;
        }
        .cf-service-cta svg{
          transition:transform 180ms ease!important;
        }
        .cf-service-cta::after{
          content:"";
          position:absolute;
          top:-40%;
          left:-35%;
          width:22%;
          height:180%;
          background:rgba(255,255,255,.24);
          transform:rotate(18deg);
          opacity:0;
          pointer-events:none;
          transition:left 420ms ease,opacity 180ms ease;
        }
        @media (hover:hover) and (pointer:fine){
          .cf-service-cta:hover{
            transform:translateY(-2px)!important;
            box-shadow:0 8px 18px rgba(15,23,42,.14)!important;
            filter:brightness(1.03);
          }
          .cf-service-cta:hover svg{
            transform:translate(3px,-1px)!important;
          }
          .cf-service-cta:hover::after{
            left:115%;
            opacity:1;
          }
        }
        .cf-service-cta:active{
          transform:scale(.98)!important;
          transition-duration:80ms!important;
        }
        @media(max-width:760px){
          .cf-service-cta{
            transition:transform 90ms ease!important;
          }
          .cf-service-cta:active{
            transform:scale(.975)!important;
          }
        }
        @media(prefers-reduced-motion:reduce){
          .cf-service-cta,
          .cf-service-cta svg,
          .cf-service-cta::after{
            transition:none!important;
          }
        }




        /* V142 — definitive flat Growth Pro icons, no gradients */
        .cf-service-icon{
          width:64px!important;
          height:64px!important;
          display:grid!important;
          place-items:center!important;
          clip-path:none!important;
          border-radius:16px!important;
          background:var(--pale)!important;
          color:var(--accent)!important;
          border:1px solid color-mix(in srgb,var(--accent) 12%,transparent)!important;
          box-shadow:0 5px 14px color-mix(in srgb,var(--accent) 7%,transparent)!important;
          filter:none!important;
        }

        .cf-service-icon svg{
          width:35.7px!important;
          height:35.7px!important;
          fill:none!important;
          stroke:currentColor!important;
          stroke-width:2.25!important;
          stroke-linecap:round!important;
          stroke-linejoin:round!important;
          overflow:visible!important;
          filter:none!important;
        }

        /* Instagram */
        .cf-platform-instagram .cf-service-icon{
          color:#E1306C!important;
          background:#FFF0F5!important;
          border-color:rgba(225,48,108,.13)!important;
        }

        /* TikTok — darker red requested, not green/cyan */
        .cf-platform-tiktok{
          --accent:#B5122B!important;
          --accent-2:#C91836!important;
          --pale:#FFF0F3!important;
        }
        .cf-platform-tiktok .cf-service-icon{
          color:#B5122B!important;
          background:#FFF0F3!important;
          border-color:rgba(181,18,43,.13)!important;
          box-shadow:0 5px 14px rgba(181,18,43,.06)!important;
          filter:none!important;
        }

        /* X / Twitter */
        .cf-platform-twitter .cf-service-icon{
          color:#111111!important;
          background:#F5F6F7!important;
          border-color:rgba(17,17,17,.10)!important;
        }

        /* Facebook */
        .cf-platform-facebook .cf-service-icon{
          color:#1877F2!important;
          background:#EEF5FF!important;
          border-color:rgba(24,119,242,.12)!important;
        }




        /* V159 — all internal service symbols stay static */
        .cf-service-icon svg,
        .cf-service-card:hover .cf-service-icon svg,
        .cf-service-card:focus .cf-service-icon svg,
        .cf-service-card:active .cf-service-icon svg{
          animation:none!important;
          transition:none!important;
          transform:none!important;
        }

`}</style>
    </main>
  );
}
