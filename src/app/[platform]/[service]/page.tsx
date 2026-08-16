"use client";

import Image from "next/image";
import instagramHomeIcon from "@/assets/home-icons-vector/instagram.svg";
import tiktokHomeIcon from "@/assets/home-icons-vector/tiktok.svg";
import twitterHomeIcon from "@/assets/home-icons-vector/twitter.svg";
import youtubeHomeIcon from "@/assets/home-icons-vector/youtube.svg";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFunnelStore } from "@/stores/funnel.store";
import { ProfileInput } from "@/components/funnel/profile-input";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Heart,
  Lock,
  MessageCircle,
  Search,
  ShieldCheck,
  Target,
  UserRound,
  Zap,
  CalendarDays,
  Share2,
  Menu
} from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

type Platform = "instagram" | "tiktok" | "twitter" | "youtube";

const THEMES: Record<Platform, {
  label: string;
  badge: string;
  primary: string;
  soft: string;
  gradient: string;
}> = {
  instagram: {
    label: "Instagram",
    badge: "Instagram Growth",
    primary: "#E1306C",
    soft: "#FFF0F5",
    gradient: "linear-gradient(90deg, #833AB4 0%, #C13584 26%, #E1306C 50%, #F56040 74%, #FCAF45 100%)",
  },
  tiktok: {
    label: "TikTok",
    badge: "TikTok Growth",
    primary: "#000000",
    soft: "#effdff",
    gradient: "linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)",
  },
  twitter: {
    label: "X / Twitter",
    badge: "X Growth",
    primary: "#0F1419",
    soft: "#f7f9fa",
    gradient: "linear-gradient(135deg, #0F1419 0%, #272C30 100%)",
  },
  youtube: {
    label: "YouTube",
    badge: "YouTube Growth",
    primary: "#ff0000",
    soft: "#fff0f0",
    gradient: "linear-gradient(90deg,#ff0000 0%,#cc0000 100%)",
  },
};

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === "instagram") return <FaInstagram />;
  if (platform === "tiktok") return <FaTiktok />;
  if (platform === "twitter") return <FaXTwitter />;
  return <FaYoutube />;
}

function InstagramPreview() {
  return (
    <div className="cf82-preview cf82-preview-instagram">
      <div className="cf82-preview-top">
        <ArrowLeft />
        <div className="cf82-ig-wordmark">Instagram</div>
        <div className="cf82-top-actions"><FaInstagram /><Heart /></div>
      </div>
      <div className="cf82-ig-body">
        <div className="cf82-platform-logo-slot"><Image src={instagramHomeIcon} alt="Instagram" width={84} height={84} priority /></div>
        <div className="cf82-ig-main">
          <div className="cf82-name-row">yourbrand <span className="cf82-verified-badge" aria-label="Verified">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path
                className="cf82-verified-shape"
                d="M20 1.8l4.15 3.02 5.1-.48 2.08 4.69 4.68 2.08-.47 5.1 3.01 4.15-3.01 4.15.47 5.1-4.68 2.08-2.08 4.69-5.1-.48L20 38.2l-4.15-3.02-5.1.48-2.08-4.69-4.68-2.08.47-5.1L1.45 20.36l3.01-4.15-.47-5.1 4.68-2.08 2.08-4.69 5.1.48L20 1.8Z"
              />
              <path
                className="cf82-verified-check"
                d="M16.9 26.35 10.8 20.3l2.55-2.55 3.55 3.55 9.75-9.75 2.55 2.55-12.3 12.25Z"
              />
            </svg>
          </span></div>
          <div className="cf82-stats-row">
            <div><strong>48</strong><small>posts</small></div>
            <div><strong>13.3K</strong><small>followers</small></div>
            <div><strong>243</strong><small>following</small></div>
          </div>
        </div>
        <div className="cf82-more">•••</div>
      </div>
    </div>
  );
}

function TikTokPreview() {
  return (
    <div className="cf82-preview cf82-preview-tiktok">
      <div className="cf82-tiktok-header">
        <div className="cf82-tiktok-wordmark">
          <span className="cf82-tiktok-mini-logo" aria-hidden="true">
            <FaTiktok className="cyan" />
            <FaTiktok className="red" />
            <FaTiktok className="front" />
          </span>
          <span>TikTok</span>
        </div>

        <div className="cf82-tiktok-actions">
          <CalendarDays />
          <Share2 />
          <Menu />
        </div>
      </div>

      <div className="cf82-tiktok-body">
        <div className="cf82-platform-logo-slot"><Image src={tiktokHomeIcon} alt="TikTok" width={84} height={84} priority /></div>

        <div className="cf82-tiktok-main">
          <div className="cf82-tiktok-username">
            <strong>@yourbrand</strong>
            <span className="cf82-tiktok-verified" aria-label="Verified">
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <path d="M20 1.8l4.15 3.02 5.1-.48 2.08 4.69 4.68 2.08-.47 5.1 3.01 4.15-3.01 4.15.47 5.1-4.68 2.08-2.08 4.69-5.1-.48L20 38.2l-4.15-3.02-5.1.48-2.08-4.69-4.68-2.08.47-5.1L1.45 20.36l3.01-4.15-.47-5.1 4.68-2.08 2.08-4.69 5.1.48L20 1.8Z"/>
                <path className="check" d="M16.9 26.35 10.8 20.3l2.55-2.55 3.55 3.55 9.75-9.75 2.55 2.55-12.3 12.25Z"/>
              </svg>
            </span>
          </div>

          <div className="cf82-display">Your Brand</div>

          <div className="cf82-tiktok-buttons">
            <button className="follow">Follow</button>
            <button className="neutral arrow">▾</button>
            <button className="neutral instagram"><FaInstagram /></button>
          </div>
        </div>
      </div>

      <div className="cf82-stats-row tiktok">
        <div><strong>142</strong><small>Following</small></div>
        <div><strong>256.8K</strong><small>Followers</small></div>
        <div><strong>1.2M</strong><small>Likes</small></div>
      </div>
    </div>
  );
}

function TwitterPreview() {
  return (
    <div className="cf82-preview cf82-preview-twitter">
      <div className="cf82-x-watermark" aria-hidden="true">
        <FaXTwitter />
      </div>

      <div className="cf82-x-top">
        <ArrowLeft />
        <FaXTwitter className="cf82-x-logo" />
        <div className="cf82-x-top-actions">
          <Search />
          <span>•••</span>
        </div>
      </div>

      <div className="cf82-x-profile">
        <div className="cf82-platform-logo-slot"><Image src={twitterHomeIcon} alt="X / Twitter" width={84} height={84} priority /></div>
        <button>Follow</button>
      </div>

      <div className="cf82-x-name">
        <div className="cf82-x-username">
          <strong>yourbrand</strong>
          <span className="cf82-x-verified" aria-label="Verified">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path d="M20 1.8l4.15 3.02 5.1-.48 2.08 4.69 4.68 2.08-.47 5.1 3.01 4.15-3.01 4.15.47 5.1-4.68 2.08-2.08 4.69-5.1-.48L20 38.2l-4.15-3.02-5.1.48-2.08-4.69-4.68-2.08.47-5.1L1.45 20.36l3.01-4.15-.47-5.1 4.68-2.08 2.08-4.69 5.1.48L20 1.8Z"/>
              <path className="check" d="M16.9 26.35 10.8 20.3l2.55-2.55 3.55 3.55 9.75-9.75 2.55 2.55-12.3 12.25Z"/>
            </svg>
          </span>
        </div>
        
      </div>

      <div className="cf82-stats-row x">
        <div><strong>48</strong><small>Posts</small></div>
        <div><strong>13.3K</strong><small>Followers</small></div>
        <div><strong>243</strong><small>Following</small></div>
      </div>
    </div>
  );
}

function YouTubePreview() {
  return (
    <div className="cf82-preview cf82-preview-youtube">
      <div className="cf82-preview-top">
        <ArrowLeft />
        <div className="cf82-yt-wordmark font-bold text-red-600">YouTube</div>
        <div className="cf82-top-actions"><FaYoutube className="text-red-600" /><Bell /></div>
      </div>
      <div className="cf82-yt-body">
        <div className="cf82-platform-logo-slot"><Image src={youtubeHomeIcon} alt="YouTube" width={84} height={84} priority /></div>
        <div className="cf82-yt-main">
          <div className="cf82-name-row">Your Channel <span className="cf82-verified-badge" aria-label="Verified">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path
                className="cf82-verified-shape"
                d="M20 1.8l4.15 3.02 5.1-.48 2.08 4.69 4.68 2.08-.47 5.1 3.01 4.15-3.01 4.15.47 5.1-4.68 2.08-2.08 4.69-5.1-.48L20 38.2l-4.15-3.02-5.1.48-2.08-4.69-4.68-2.08.47-5.1L1.45 20.36l3.01-4.15-.47-5.1 4.68-2.08 2.08-4.69 5.1.48L20 1.8Z"
              />
              <path className="check" d="M16.9 26.35 10.8 20.3l2.55-2.55 3.55 3.55 9.75-9.75 2.55 2.55-12.3 12.25Z"/>
            </svg>
          </span>
          </div>
          <div className="cf82-sub-row">@yourchannel <span>·</span> 100K subscribers</div>
        </div>
      </div>

      <div className="cf82-stats-row">
        <div><strong>100K</strong><small>Subscribers</small></div>
        <div><strong>2.4M</strong><small>Views</small></div>
        <div><strong>48</strong><small>Videos</small></div>
      </div>
    </div>
  );
}

function NetworkPreview({ platform }: { platform: Platform }) {
  if (platform === "instagram") return <InstagramPreview />;
  if (platform === "tiktok") return <TikTokPreview />;
  if (platform === "twitter") return <TwitterPreview />;
  return <YouTubePreview />;
}

export default function PlatformServicePage() {
  const router = useRouter();
  const params = useParams() as { platform: string; service: string };
  const { setPlatform, setService, followerType, setFollowerType } = useFunnelStore();

  const platformIsValid = ["instagram", "tiktok", "twitter", "youtube"].includes(params.platform);
  const serviceIsValid = ["followers", "likes", "views", "comments"].includes(params.service);
  const platform = (platformIsValid ? params.platform : "instagram") as Platform;

  const theme = THEMES[platform];
  const isFollowers = params.service === "followers";

  useEffect(() => {
    if (!platformIsValid) {
      router.replace("/");
      return;
    }
    if (!serviceIsValid) {
      router.replace(`/${platform}`);
      return;
    }
    setPlatform(platform);
    setService(params.service);
  }, [platformIsValid, serviceIsValid, platform, params.service, router, setPlatform, setService]);

  if (!platformIsValid || !serviceIsValid) return null;

  if (!isFollowers || followerType) {
    return (
      <main className="cf82-profile-flow">
        <header className="cf82-header">
          <button onClick={() => {
            if (followerType) setFollowerType(null);
            else router.push(`/${platform}`);
          }}>
            <ArrowLeft />
            {followerType ? "Back to Follower Types" : "Back to Services"}
          </button>

          <button className="cf82-logo" onClick={() => router.push("/")}>
            <span>Clout</span><b>Flow</b><sup>↗</sup>
          </button>

          <span className="cf82-motto"><i>✦</i> Grow. Engage. Get Noticed.</span>
        </header>

        <section className="cf82-profile-shell">
          {!isFollowers && (
            <div className="cf82-badge" style={{ "--soft": theme.soft, "--p": theme.primary } as React.CSSProperties}>
              <PlatformIcon platform={platform} /> {theme.badge}
            </div>
          )}
          <h1>{theme.label} {params.service.replace("-", " ")}</h1>
          <p>Enter your profile details below to see the available packages and continue.</p>
          <ProfileInput />
        </section>
        <style jsx global>{profileCss}</style>
      </main>
    );
  }

  return (
    <main
      className="cf82-page"
      style={{
        "--p": theme.primary,
        "--soft": theme.soft,
        "--grad": theme.gradient,
      } as React.CSSProperties}
    >
      <div className="cf82-deco cf82-deco-top" aria-hidden="true">
        <span className="cf82-chip">👥 +1K</span>
        <span className="cf82-heart">♥</span>
        <span className="cf82-growth-line" />
        <span className="cf82-growth-bars"><i/><i/><i/><i/></span>
      </div>
      <div className="cf82-deco cf82-deco-bottom" aria-hidden="true">
        <span className="cf82-social ig">◎</span>
        <span className="cf82-social fb">f</span>
        <span className="cf82-social x">X</span>
        <span className="cf82-dashed" />
        <span className="cf82-chip lower">👥 +2.5K</span>
      </div>

      <header className="cf82-header cf82-header-followers">
        <button onClick={() => router.push(`/${platform}`)}>
          <ArrowLeft /> Back to Services
        </button>
        <span className="cf82-motto"><i>✦</i> Grow. Engage. Get Noticed.</span>
      </header>

      <section className="cf82-shell">
        <section className="cf82-hero">
          <h1>{theme.label} <b>Followers</b></h1>
          <p>Choose the follower plan that best matches your goal.</p>
        </section>

        <section className="cf82-preview-stage">
          <NetworkPreview platform={platform} />

          <div className="cf82-offer">
            <div className="cf82-offer-title">
              <strong>+100,000 Followers</strong>
              <span>- ON YOUR PROFILE</span>
            </div>
            <div className="cf82-offer-row">
              <span>Followers growing in real time</span>
              <strong>13,344 ↑</strong>
            </div>
            <div className="cf82-offer-track"><i /></div>
          </div>
        </section>

        <section className="cf82-plans">
          <article className="cf82-plan">
            <div className="cf82-plan-head">
              <span className="cf82-plan-icon"><UserRound /></span>
              <div>
                <h2>Real Followers</h2>
                <p>Quick credibility boost</p>
              </div>
            </div>

            <ul>
              <li><CheckCircle2 /><span>Delivery in up to 24h</span></li>
              <li><CheckCircle2 /><span>100% Real Profiles</span></li>
              <li><CheckCircle2 /><span>No password required</span></li>
              <li><CheckCircle2 /><span>24/7 Support</span></li>
            </ul>

            <button className="cf82-start" onClick={() => setFollowerType("real")}>
              Start growing <ArrowRight />
            </button>
          </article>

          <article className="cf82-plan">
            <div className="cf82-plan-head">
              <span className="cf82-plan-icon target"><Target /></span>
              <div>
                <h2>Niche-Targeted</h2>
                <p>Qualified audience that buys</p>
              </div>
            </div>

            <ul>
              <li><CheckCircle2 /><span>3x More Engagement</span></li>
              <li><CheckCircle2 /><span>Targeted by Interest/Location</span></li>
              <li><CheckCircle2 /><span>Audience That Buys</span></li>
              <li><CheckCircle2 /><span>Explore Page Reach</span></li>
            </ul>

            <button className="cf82-target" onClick={() => setFollowerType("niche")}>
              Find my audience <ArrowRight />
            </button>
          </article>
        </section>

      </section>

      <style jsx global>{followersCss}</style>
    </main>
  );
}

const followersCss = `
.cf82-page{
  min-height:100vh;
  background:
    radial-gradient(circle at 9% 30%,rgba(87,140,255,.038),transparent 19%),
    radial-gradient(circle at 91% 28%,rgba(255,91,150,.032),transparent 18%),
    #fff;
  color:#081126;
  position:relative;
  overflow-x:hidden;
  padding:0 22px 34px;
  font-family:Arial,Helvetica,sans-serif;
  isolation:isolate;
}
.cf82-page *{box-sizing:border-box}

.cf82-header{
  width:min(calc(100% - 20px),1000px);
  height:72px;
  margin:0 auto;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  border-bottom:1px solid #eef1f5;
  position:relative;
  z-index:5;
}

.cf82-header-followers{
  grid-template-columns:1fr 1fr;
}
.cf82-header-followers .cf82-motto{
  justify-self:end;

  font-size: 13px;}

.cf82-header>button:first-child{
  justify-self:start;
  border:0;
  background:transparent;
  color:#101827;
  display:flex;
  align-items:center;
  gap:9px;
  font-size:14px;
  font-weight:700;
  cursor:pointer;
}
.cf82-header>button:first-child svg{width:20px;height:20px}
.cf82-logo{
  justify-self:center;
  border:0;
  background:transparent;
  color:#091126;
  font-size:26px;
  font-weight:900;
  letter-spacing:-1.3px;
  cursor:pointer;
}
.cf82-logo b{color:#1476ff}
.cf82-logo sup{color:#1476ff;font-size:14px;margin-left:-2px}
.cf82-motto{justify-self:end;color:#536176;font-size:10px;font-weight:600}
.cf82-motto i{color:#1476ff;font-style:normal;margin-right:6px}

.cf82-shell{width:min(100%,1000px);margin:0 auto;padding:22px 0 0;position:relative;z-index:3}
.cf82-badge{
  width:max-content;
  max-width:100%;
  margin:0 auto 14px;
  padding:7px 13px;
  border-radius:999px;
  background:var(--soft);
  color:var(--p);
  display:flex;
  align-items:center;
  gap:7px;
  font-size:10px;
  font-weight:800;
}
.cf82-badge svg{width:14px;height:14px}
.cf82-hero{text-align:center}
.cf82-hero h1{
  margin:0;
  font-size:42px;
  line-height:1;
  letter-spacing:-2.2px;
  font-weight:900;
}
.cf82-hero h1 b{
  background:var(--grad);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}
.cf82-hero p{
  margin:9px auto 0;
  color:#66738b;
  font-size:16px;
}

/* network preview */
.cf82-preview-stage{width:620px;max-width:100%;margin:24px auto 0;position:relative;padding-bottom:92px}
.cf82-preview{
  width:350px;
  max-width:96%;
  min-height:196px;
  margin:0 auto;
  border:1px solid #e4e8ef;
  border-radius:12px;
  background:#fff;
  box-shadow:0 14px 32px rgba(35,50,85,.09);
  overflow:hidden;
}
.cf82-preview-top{
  height:48px;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  padding:0 17px;
}
.cf82-preview-top>svg{width:18px;height:18px}
.cf82-top-actions{justify-self:end;display:flex;align-items:center;gap:12px}
.cf82-top-actions svg{width:17px;height:17px}
.cf82-top-actions .plus{font-size:24px}
.cf82-top-actions .hamb{font-size:20px}

.cf82-ig-wordmark{font-family:cursive;font-size:21px;font-weight:700}
.cf82-ig-body{display:grid;grid-template-columns:96px 1fr auto;gap:9px;align-items:center;padding:14px 17px 22px}
.cf82-ig-avatar{width:82px;height:82px;border-radius:50%;padding:3px;background:conic-gradient(#833AB4,#C13584,#E1306C,#F56040,#FCAF45,#833AB4)}
.cf82-ig-avatar>div{width:100%;height:100%;border:4px solid #fff;border-radius:50%;background:linear-gradient(#f2f3f5,#d8dbe0);display:grid;place-items:center;color:#fff}
.cf82-ig-avatar svg{width:36px;height:36px}
.cf82-ig-main{min-width:0}
.cf82-name-row{font-size:14px;font-weight:800}.cf82-name-row span{color:#1787ff;font-size:10px}
.cf82-more{align-self:start;color:#111;font-size:11px;letter-spacing:1px}
.cf82-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.cf82-stats-row div{text-align:center}.cf82-stats-row strong{display:block;font-size:13px}.cf82-stats-row small{display:block;margin-top:2px;color:#555;font-size:12px}


.cf82-preview-tiktok{
  width:350px;
  max-width:92%;
  min-height:196px;
  border-radius:12px;
  background:#fff;
  border:1px solid #e5e9ef;
  box-shadow:0 9px 24px rgba(35,50,85,.075);
  overflow:hidden;
}
.cf82-tiktok-header{
  height:43px;
  padding:0 14px;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  position:relative;
}
.cf82-tiktok-wordmark{
  position:absolute;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  align-items:center;
  gap:3px;
  color:#050505;
  font-size:19px;
  line-height:1;
  font-weight:900;
  letter-spacing:-.55px;
  white-space:nowrap;
}
.cf82-tiktok-mini-logo{
  position:relative;
  width:17px;
  height:19px;
  display:inline-block;
}
.cf82-tiktok-mini-logo svg{
  position:absolute;
  left:0;
  top:0;
  width:17px;
  height:19px;
}
.cf82-tiktok-mini-logo .cyan{color:#25f4ee;transform:translate(-1px,1px)}
.cf82-tiktok-mini-logo .red{color:#fe2c55;transform:translate(1px,-.5px)}
.cf82-tiktok-mini-logo .front{color:#050505}
.cf82-tiktok-actions{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap:12px;
  color:#111827;
}
.cf82-tiktok-actions svg{
  width:17px;
  height:17px;
  stroke-width:1.8;
}
.cf82-tiktok-body{
  display:grid;
  grid-template-columns:80px 1fr;
  gap:10px;
  align-items:center;
  padding:0 14px;
}
.cf82-tiktok-avatar{
  width:72px;
  height:72px;
  border-radius:50%;
  background:#050505;
  display:grid;
  place-items:center;
  box-shadow:0 0 0 1.5px #25f4ee;
}
.cf82-tiktok-avatar-logo{
  position:relative;
  width:45px;
  height:49px;
  display:block;
}
.cf82-tiktok-avatar-logo svg{
  position:absolute;
  left:0;
  top:0;
  width:45px;
  height:49px;
}
.cf82-tiktok-avatar-logo .cyan{color:#25f4ee;transform:translate(-2.2px,1.5px)}
.cf82-tiktok-avatar-logo .red{color:#fe2c55;transform:translate(2.2px,-1px)}
.cf82-tiktok-avatar-logo .front{color:#fff}
.cf82-tiktok-main{
  min-width:0;
  padding-top:0;
}
.cf82-tiktok-username{
  display:flex;
  align-items:center;
  gap:4px;
  color:#070707;
}
.cf82-tiktok-username strong{
  font-size:14px;
  line-height:1;
  font-weight:800;
}
.cf82-tiktok-verified{
  width:11px;
  height:11px;
  flex:0 0 11px;
  display:inline-flex;
}
.cf82-tiktok-verified svg{
  width:11px;
  height:11px;
  display:block;
  fill:#20a8ff;
}
.cf82-tiktok-verified .check{fill:#fff}
.cf82-display{
  font-size:11px;
  color:#3f4653;
  margin-top:4px;
}
.cf82-tiktok-buttons{
  display:flex;
  align-items:center;
  gap:6px;
  margin-top:8px;
}
.cf82-tiktok-buttons button{
  height:27px;
  border:0;
  border-radius:3px;
  font-size:12px;
  font-weight:800;
}
.cf82-tiktok-buttons .follow{
  width:122px;
  padding:0;
  background:#ff174f;
  color:#fff;
}
.cf82-tiktok-buttons .neutral{
  width:32px;
  padding:0;
  background:#f0f1f3;
  color:#111;
  display:grid;
  place-items:center;
}
.cf82-tiktok-buttons .instagram svg{
  width:13px;
  height:13px;
}
.cf82-tiktok-buttons .arrow{
  font-size:14px;
}
.cf82-stats-row.tiktok{
  margin:0;
  padding:10px 26px 12px;
}
.cf82-stats-row.tiktok strong{
  font-size:13px;
  line-height:1;
}
.cf82-stats-row.tiktok small{
  margin-top:3px;
  color:#777;
  font-size:12px;
}



.cf82-preview-twitter{
  width: 350px;
  max-width: 92%;
  min-height: 196px;
  border-radius: 12px;
  background:
    linear-gradient(150deg, transparent 0 20%, rgba(255,255,255,.025) 20.5% 31%, transparent 31.5% 100%),
    linear-gradient(30deg, transparent 0 36%, rgba(255,255,255,.018) 36.5% 48%, transparent 48.5% 100%),
    radial-gradient(ellipse at 56% 34%, rgba(255,255,255,.018), transparent 43%),
    #030303;
  color:#fff;
  border:1px solid #111;
  box-shadow:0 9px 24px rgba(0,0,0,.16);
  overflow:hidden;
  position:relative;
}
.cf82-x-watermark{
  position:absolute;
  left:83px;
  top:-28px;
  width:164px;
  height:164px;
  color:#fff;
  opacity:.065;
  transform:rotate(-5deg);
  filter:drop-shadow(0 0 18px rgba(255,255,255,.018));
  pointer-events:none;
}
.cf82-x-watermark svg{width:100%;height:100%}
.cf82-x-top{
  height:36px;
  padding:0 13px;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  position:relative;
  z-index:2;
}
.cf82-x-top>svg{
  width:17px;
  height:17px;
  stroke-width:1.8;
}
.cf82-x-logo{
  justify-self:center;
  width:22px!important;
  height:22px!important;
}
.cf82-x-top-actions{
  justify-self:end;
  display:flex;
  align-items:center;
  gap:11px;
}
.cf82-x-top-actions svg{
  width:17px;
  height:17px;
  stroke-width:1.8;
}
.cf82-x-top-actions span{
  font-size:12px;
  letter-spacing:1px;
}
.cf82-x-profile{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:3px 13px 0;
  position:relative;
  z-index:2;
}
.cf82-x-avatar{
  width:74px;
  height:74px;
  border:2px solid #555;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:#0a0a0a;
}
.cf82-x-avatar svg{
  width:31px;
  height:31px;
}
.cf82-x-profile button{
  width:72px;
  height:28px;
  border:0;
  border-radius:999px;
  background:#fff;
  color:#111;
  font-size:12px;
  font-weight:800;
}
.cf82-x-name{
  display:flex;
  flex-direction:column;
  padding:4px 13px 0;
  position:relative;
  z-index:2;
}
.cf82-x-username{
  display:flex;
  align-items:center;
  gap:4px;
}
.cf82-x-username strong{
  font-size:14px;
  line-height:1;
}
.cf82-x-verified{
  width:12.1px;
  height:12.1px;
  min-width:12.1px;
  min-height:12.1px;
  flex:0 0 12.1px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.cf82-x-verified svg{
  width:12.1px;
  height:12.1px;
  min-width:12.1px;
  min-height:12.1px;
  display:block;
  fill:#1d9bf0;
}
.cf82-x-verified .check{fill:#fff}
.cf82-x-name small{
  color:#9ba0a8;
  font-size:8px;
  margin-top:2px;
}
.cf82-stats-row.x{
  margin:0;
  padding:8px 20px 10px;
  position:relative;
  z-index:2;
}
.cf82-stats-row.x strong{
  font-size:13px;
  line-height:1;
}
.cf82-stats-row.x small{
  color:#c5c8ce;
  font-size:12px;
  margin-top:3px;
}


.cf82-facebook-wordmark{justify-self:start;color:#1877f2;font-size:23px;font-weight:900;letter-spacing:-1px}
.cf82-facebook-body{display:grid;grid-template-columns:82px 1fr auto;gap:10px;align-items:center;padding:8px 17px 2px}.cf82-facebook-avatar{width:74px;height:74px;border-radius:50%;background:#1877f2;color:#fff;display:grid;place-items:center}.cf82-facebook-avatar svg{width:74px;height:74px}.cf82-facebook-main{min-width:0}.cf82-facebook-sub{font-size:9px;color:#5d6779;margin-top:4px}.cf82-face-dots{font-size:8px;color:#6b7280;letter-spacing:2px;margin-top:8px}
.cf82-facebook-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:14px 17px 17px}.cf82-facebook-buttons button{height:32px;border:0;border-radius:4px;background:#1877f2;color:#fff;font-size:10px;font-weight:800}.cf82-facebook-buttons .neutral{background:#e7e9ed;color:#111;display:flex;align-items:center;justify-content:center;gap:5px}.cf82-facebook-buttons .neutral svg{width:13px;height:13px}

.cf82-offer{
  position:absolute;
  left:50%;
  bottom:3px;
  transform:translateX(-50%);
  width:450px;
  max-width:94%;
  min-height:96px;
  padding:14px 17px;
  border:1px solid #e4e8ef;
  border-radius:14px;
  background:rgba(255,255,255,.99);
  box-shadow:0 14px 30px rgba(35,50,85,.10);
}
.cf82-offer-title{display:flex;align-items:baseline;gap:6px;font-size:17px;line-height:1.1}
.cf82-offer-title strong{font-size:20px}
.cf82-offer-row{margin-top:13px;display:flex;justify-content:space-between;gap:10px;color:#1e293b;font-size:10px}.cf82-offer-row strong{white-space:nowrap}
.cf82-offer-track{height:6px;margin-top:8px;border-radius:999px;background:#e9edf2;overflow:hidden}.cf82-offer-track i{display:block;width:84%;height:100%;border-radius:999px;background:var(--grad)}

/* plans */
.cf82-plans{width:760px;max-width:100%;margin:24px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:18px}
.cf82-plan{min-height:300px;padding:23px 20px 18px;border:1px solid #e5e9ef;border-radius:17px;background:#fff;box-shadow:0 12px 28px rgba(35,50,85,.07);display:flex;flex-direction:column}
.cf82-plan-head{display:flex;align-items:center;gap:11px}.cf82-plan-icon{width:42px;height:42px;border-radius:50%;background:var(--soft);color:var(--p);display:grid;place-items:center}.cf82-plan-icon svg{width:21px;height:21px}.cf82-plan-head h2{margin:0;font-size:18px}.cf82-plan-head p{margin:4px 0 0;color:#7a8496;font-size:10px}
.cf82-plan ul{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:17px}.cf82-plan li{display:flex;align-items:flex-start;gap:10px;font-size:12px;line-height:1.35}.cf82-plan li svg{width:17px;height:17px;flex:0 0 auto;margin-top:0;color:#111}
.cf82-start,.cf82-target{width:100%;height:43px;margin-top:auto;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:800;cursor:pointer}.cf82-start{border:1px solid var(--p);background:var(--grad);color:#fff}.cf82-target{border:1px solid var(--p);background:#fff;color:var(--p)}.cf82-start svg,.cf82-target svg{width:14px;height:14px}

/* decorative elements from Home - deliberately faint */
.cf82-deco{position:absolute;z-index:1;pointer-events:none;opacity:.045}
.cf82-deco-top{right:-20px;top:125px;width:270px;height:300px}.cf82-chip{position:absolute;left:55px;top:4px;padding:6px 12px;border:2px solid #8f6cf3;color:#7554e8;border-radius:999px;font-size:10px;font-weight:800}.cf82-heart{position:absolute;left:168px;top:65px;width:40px;height:40px;border:2px solid #ff5897;color:#ff5897;border-radius:50%;display:grid;place-items:center}.cf82-growth-line{position:absolute;right:17px;top:57px;width:130px;height:125px;border-right:3px solid #3a77ff;border-top:3px solid #3a77ff;border-radius:0 90px 0 0;transform:skewY(-28deg) rotate(-6deg)}.cf82-growth-bars{position:absolute;right:8px;top:195px;display:flex;align-items:flex-end;gap:5px}.cf82-growth-bars i{width:12px;background:#3a77ff;border-radius:3px 3px 0 0}.cf82-growth-bars i:nth-child(1){height:22px}.cf82-growth-bars i:nth-child(2){height:34px}.cf82-growth-bars i:nth-child(3){height:49px}.cf82-growth-bars i:nth-child(4){height:66px}
.cf82-deco-bottom{left:-10px;bottom:15px;width:210px;height:260px}.cf82-social{position:absolute;font-weight:900}.cf82-social.ig{left:20px;top:28px;font-size:30px;color:#ff4d9b}.cf82-social.fb{left:38px;top:108px;width:33px;height:33px;border:2px solid #2d7aff;border-radius:50%;display:grid;place-items:center;font-size:25px;color:#2d7aff}.cf82-social.x{left:98px;top:154px;font-size:25px;color:#fd55ae}.cf82-dashed{position:absolute;left:-30px;top:35px;width:165px;height:185px;border:2px dashed #557cff;border-right-color:transparent;border-radius:55% 40%;transform:rotate(-16deg)}.cf82-chip.lower{top:auto;left:104px;bottom:2px;color:#1376ff;border-color:#1376ff}


/* Instagram profile icon + Instagram-style verified badge */
.cf82-preview-instagram .cf82-ig-avatar-inner{
  width:100%;
  height:100%;
  border:3px solid #fff;
  border-radius:50%;
  background:#fff;
  display:grid;
  place-items:center;
}
.cf82-preview-instagram .cf82-name-row{
  display:flex;
  align-items:center;
  gap:4px;
}

.cf82-instagram-profile-logo{
  width:52px;
  height:52px;
  display:grid;
  place-items:center;
}
.cf82-instagram-profile-logo svg{
  width:52px;
  height:52px;
  display:block;
}
.cf82-verified-badge{
  width:15px;
  height:15px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex:0 0 15px;
  margin-left:2px;
  vertical-align:-2px;
}
.cf82-verified-badge svg{
  width:15px;
  height:15px;
  display:block;
  overflow:visible;
}
.cf82-verified-shape{
  fill:#0095f6;
}
.cf82-verified-check{
  fill:#fff;
}


/* Facebook Followers preview — reference-matched */
.cf82-preview-facebook{
  width:350px;
  max-width:92%;
  min-height:174px;
  border-radius:12px;
  background:#fff;
  border:1px solid #e4e8ef;
  box-shadow:0 8px 24px rgba(35,50,85,.075);
  overflow:hidden;
  color:#0b0b0b;
}
.cf82-facebook-top{
  height:43px;
  padding:0 14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.cf82-facebook-wordmark{
  color:#0866ff;
  font-family:Arial,Helvetica,sans-serif;
  font-size:20px;
  font-weight:800;
  letter-spacing:-1.05px;
  line-height:1;
}
.cf82-facebook-actions{
  display:flex;
  align-items:center;
  gap:12px;
  color:#101820;
}
.cf82-facebook-actions .plus{
  font-family:Arial,sans-serif;
  font-size:24px;
  font-weight:300;
  line-height:1;
  transform:translateY(-1px);
}
.cf82-facebook-actions>svg{
  width:17px;
  height:17px;
  stroke-width:2;
}
.cf82-messenger-icon{
  width:18px;
  height:18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  color:#050505;
}
.cf82-messenger-icon svg{
  width:18px;
  height:18px;
  fill:currentColor;
}
.cf82-facebook-body{
  display:grid;
  grid-template-columns:72px 1fr 24px;
  gap:9px;
  align-items:start;
  padding:0 14px;
}
.cf82-facebook-avatar{
  width:68px;
  height:68px;
  border-radius:50%;
  background:#1877f2;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  overflow:hidden;
}
.cf82-facebook-avatar span{
  color:#fff;
  font-family:Arial,Helvetica,sans-serif;
  font-size:64px;
  line-height:.82;
  font-weight:800;
  transform:translateY(4px);
}
.cf82-facebook-main{
  padding-top:7px;
  min-width:0;
}
.cf82-facebook-name{
  display:flex;
  align-items:center;
  gap:4px;
  white-space:nowrap;
}
.cf82-facebook-name strong{
  font-size:11px;
  font-weight:800;
  line-height:1;
}
.cf82-facebook-verified{
  width:11px;
  height:11px;
  flex:0 0 11px;
  display:inline-flex;
}
.cf82-facebook-verified svg{
  width:11px;
  height:11px;
  fill:#0866ff;
}
.cf82-facebook-verified .check{fill:#fff}
.cf82-facebook-sub{
  margin-top:6px;
  color:#4f5661;
  font-size:8px;
  line-height:1;
  white-space:nowrap;
}
.cf82-facebook-sub span{padding:0 2px}
.cf82-facebook-followers{
  display:flex;
  align-items:center;
  margin-top:8px;
  padding-left:1px;
}
.cf82-facebook-followers .a{
  width:18px;
  height:18px;
  border-radius:50%;
  border:1.5px solid #fff;
  margin-left:-4px;
  display:grid;
  place-items:center;
  overflow:hidden;
  font:700 6px/1 Arial,sans-serif;
  color:#fff;
  box-shadow:0 0 0 .35px rgba(0,0,0,.12);
}
.cf82-facebook-followers .a:first-child{margin-left:0}
.cf82-facebook-followers .a1{background:linear-gradient(145deg,#e7b68c 0 45%,#1d8f67 46% 100%)}
.cf82-facebook-followers .a2{background:linear-gradient(145deg,#d79b74 0 48%,#263d69 49% 100%)}
.cf82-facebook-followers .a3{background:linear-gradient(145deg,#e6b18b 0 48%,#137b84 49% 100%)}
.cf82-facebook-followers .a4{background:linear-gradient(145deg,#c98f70 0 48%,#425f96 49% 100%)}
.cf82-facebook-followers .a5{background:linear-gradient(145deg,#e4b092 0 48%,#342b2b 49% 100%)}
.cf82-facebook-followers .more{
  background:#eceef1;
  color:#777;
  font-size:7px;
  letter-spacing:.3px;
}
.cf82-facebook-more{
  justify-self:end;
  padding-top:5px;
  color:#111;
  font-size:11px;
  font-weight:800;
  letter-spacing:.6px;
}
.cf82-facebook-buttons{
  display:grid;
  grid-template-columns:1fr 1.12fr;
  gap:8px;
  padding:9px 14px 13px;
}
.cf82-facebook-buttons button{
  height:28px;
  border:0;
  border-radius:4px;
  font-size:9px;
  font-weight:700;
}
.cf82-facebook-buttons .follow{
  background:#0866ff;
  color:#fff;
}
.cf82-facebook-buttons .neutral{
  background:#e6e8ec;
  color:#111;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
}
.cf82-messenger-icon.small,
.cf82-messenger-icon.small svg{
  width:12px;
  height:12px;
}


/* Facebook Followers V94 — proportion/spacing refinement */
.cf82-preview-facebook{
  width:350px;
  max-width:92%;
  min-height:184px;
  border-radius:12px;
  background:#fff;
  border:1px solid #e3e7ed;
  box-shadow:0 7px 20px rgba(35,50,85,.07);
}
.cf82-facebook-top{
  height:42px;
  padding:0 13px;
}
.cf82-facebook-wordmark{
  font-size:19px;
  letter-spacing:-.9px;
}
.cf82-facebook-actions{
  gap:12px;
}
.cf82-facebook-actions .plus{
  font-size:22px;
}
.cf82-facebook-actions>svg,
.cf82-facebook-actions .cf82-messenger-icon{
  width:16px;
  height:16px;
}
.cf82-facebook-actions .cf82-messenger-icon svg{
  width:16px;
  height:16px;
}
.cf82-facebook-body{
  grid-template-columns:66px 1fr 21px;
  gap:10px;
  min-height:82px;
  padding:0 13px;
}
.cf82-facebook-avatar{
  width:64px;
  height:64px;
  align-self:start;
}
.cf82-facebook-avatar span{
  font-size:60px;
  transform:translateY(4px);
}
.cf82-facebook-main{
  padding-top:5px;
}
.cf82-facebook-name strong{
  font-size:10.5px;
}
.cf82-facebook-verified,
.cf82-facebook-verified svg{
  width:10px;
  height:10px;
  flex-basis:10px;
}
.cf82-facebook-sub{
  margin-top:5px;
  font-size:7.5px;
  color:#59606b;
}
.cf82-facebook-followers{
  margin-top:7px;
  height:20px;
}
.cf82-facebook-followers .a{
  width:19px;
  height:19px;
  margin-left:-4px;
  border:1.5px solid #fff;
  font-size:0;
  position:relative;
}
.cf82-facebook-followers .a::before{
  content:"";
  position:absolute;
  width:7px;
  height:7px;
  border-radius:50%;
  left:6px;
  top:3px;
  background:#d79a73;
}
.cf82-facebook-followers .a::after{
  content:"";
  position:absolute;
  width:13px;
  height:8px;
  border-radius:8px 8px 4px 4px;
  left:3px;
  bottom:1px;
  background:rgba(255,255,255,.7);
}
.cf82-facebook-followers .a1{background:#288a68}
.cf82-facebook-followers .a2{background:#344f78}
.cf82-facebook-followers .a3{background:#178a91}
.cf82-facebook-followers .a4{background:#49699a}
.cf82-facebook-followers .a5{background:#463837}
.cf82-facebook-followers .more{
  background:#eceef1;
  color:#73777e;
  font-size:7px;
  letter-spacing:.3px;
}
.cf82-facebook-followers .more::before,
.cf82-facebook-followers .more::after{display:none}
.cf82-facebook-more{
  padding-top:3px;
  font-size:10px;
}
.cf82-facebook-buttons{
  grid-template-columns:1fr 1.08fr;
  gap:8px;
  padding:7px 13px 13px;
}
.cf82-facebook-buttons button{
  height:28px;
  font-size:8.5px;
}


/* Facebook Followers V95 — AI profile photos + clean Facebook avatar */
.cf82-facebook-avatar{
  background:transparent!important;
  overflow:visible!important;
}
.cf82-facebook-avatar svg{
  width:64px;
  height:64px;
  display:block;
}
.cf82-facebook-followers .a{
  padding:0!important;
  background:#fff;
}
.cf82-facebook-followers .a::before,
.cf82-facebook-followers .a::after{
  display:none!important;
  content:none!important;
}
.cf82-facebook-followers .a img{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
  border-radius:50%;
}
.cf82-facebook-followers .more{
  display:grid;
  place-items:center;
  background:#eceef1!important;
  color:#73777e!important;
  font-size:7px!important;
}


/* Facebook Followers V97 — larger text, visible AI mini profiles, improved proportions */
.cf82-preview-facebook{
  width:350px;
  max-width:92%;
  min-height:196px;
  border-radius:12px;
}
.cf82-facebook-top{
  height:44px;
  padding:0 14px;
}
.cf82-facebook-wordmark{
  font-size:21px;
  letter-spacing:-1px;
}
.cf82-facebook-actions{
  gap:13px;
}
.cf82-facebook-actions .plus{
  font-size:24px;
}
.cf82-facebook-actions>svg,
.cf82-facebook-actions .cf82-messenger-icon,
.cf82-facebook-actions .cf82-messenger-icon svg{
  width:17px;
  height:17px;
}
.cf82-facebook-body{
  grid-template-columns:72px 1fr 22px;
  gap:11px;
  min-height:92px;
  padding:0 14px;
}
.cf82-facebook-avatar{
  width:70px;
  height:70px;
}
.cf82-facebook-avatar svg{
  width:70px;
  height:70px;
}
.cf82-facebook-main{
  padding-top:7px;
}
.cf82-facebook-name{
  gap:5px;
}
.cf82-facebook-name strong{
  font-size:12px;
}
.cf82-facebook-verified,
.cf82-facebook-verified svg{
  width:11px;
  height:11px;
  flex-basis:11px;
}
.cf82-facebook-sub{
  margin-top:6px;
  font-size:8.5px;
  color:#4f5661;
}
.cf82-facebook-followers{
  margin-top:10px;
  height:24px;
}
.cf82-facebook-followers .a{
  width:24px;
  height:24px;
  margin-left:-5px;
  border:1.5px solid #fff;
}
.cf82-facebook-followers .a:first-child{margin-left:0}
.cf82-facebook-followers .a img{
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center 38%;
}
.cf82-facebook-followers .more{
  width:24px;
  height:24px;
  font-size:8px!important;
}
.cf82-facebook-more{
  padding-top:4px;
  font-size:11px;
}
.cf82-facebook-buttons{
  grid-template-columns:1fr 1.06fr;
  gap:9px;
  padding:8px 14px 13px;
}
.cf82-facebook-buttons button{
  height:34px;
  font-size:10px;
}
.cf82-facebook-buttons .neutral{
  gap:6px;
}
.cf82-messenger-icon.small,
.cf82-messenger-icon.small svg{
  width:13px;
  height:13px;
}


/* Facebook Followers V98 — four separated, full-face mini profiles */
.cf82-facebook-followers{
  display:flex;
  align-items:center;
  gap:4px;
  margin-top:9px;
  height:27px;
  padding-left:0;
}
.cf82-facebook-followers .a{
  width:26px;
  height:26px;
  flex:0 0 26px;
  margin-left:0!important;
  border:1px solid #dfe3e8;
  border-radius:50%;
  overflow:hidden;
  background:#fff;
  box-shadow:none;
}
.cf82-facebook-followers .a img{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
  object-position:50% 42%;
  border-radius:50%;
}
.cf82-facebook-followers .more{
  width:26px;
  height:26px;
  flex:0 0 26px;
  margin-left:1px!important;
  display:grid;
  place-items:center;
  background:#f0f2f5!important;
  color:#606770!important;
  font-size:8px!important;
  border:1px solid #e1e4e8;
}


/* Facebook Followers V99 — compact action buttons */
.cf82-facebook-buttons button{
  height:28px!important;
  font-size:10px!important;
}


/* Facebook Followers V100 — likes/followers text */
.cf82-facebook-sub{
  font-size:9.5px!important;
}


.cf82-facebook-avatar{
  width:66.5px!important;
  height:66.5px!important;
}
.cf82-facebook-avatar svg{
  width:66.5px!important;
  height:66.5px!important;
}


/* V103 — Facebook avatar another 5% smaller */
.cf82-facebook-avatar{
  width:63.175px!important;
  height:63.175px!important;
}
.cf82-facebook-avatar svg{
  width:63.175px!important;
  height:63.175px!important;
}


/* V104 — Followers offer panel +15% on all social networks */
.cf82-offer{
  width:517.5px!important;
}

/* Main offer title */
.cf82-offer-title{
  font-size:1.15em!important;
}

/* Supporting copy / realtime label / counter */
.cf82-offer-sub,
.cf82-offer-label,
.cf82-offer-counter{
  font-size:1.15em!important;
}

/* Improve readability of all text inside the shared offer without changing colors/layout */
.cf82-offer{
  font-weight:500;
}
.cf82-offer strong,
.cf82-offer b{
  font-weight:700;
}


/* V105 — Facebook Followers typography */
.cf82-facebook-name strong{
  font-size:14px!important;
}
.cf82-facebook-sub{
  font-size:12px!important;
}
.cf82-facebook-buttons button{
  height:28px!important;
  font-size:13px!important;
}


/* V106 — Facebook verified + Messenger icons +15% */
.cf82-facebook-verified,
.cf82-facebook-verified svg{
  width:12.65px!important;
  height:12.65px!important;
  flex-basis:12.65px!important;
}
.cf82-messenger-icon.small,
.cf82-messenger-icon.small svg{
  width:14.95px!important;
  height:14.95px!important;
}


/* V107 — Shared Followers offer typography */
.cf82-offer strong,
.cf82-offer b{
  font-weight:800!important;
}

.cf82-offer-title strong{
  font-size:19px!important;
}

.cf82-offer-title{
  font-size:19px!important;
}

.cf82-offer-row{
  margin-top:13px!important;
  display:flex!important;
  justify-content:space-between!important;
  gap:10px!important;
  color:#1e293b!important;
  font-size:14px!important;
}

/* mobile */

@media(max-width:760px){

  .cf82-preview-facebook{
    width:350px!important;
    max-width:100%!important;
    min-height:196px!important;
  }
  .cf82-facebook-top{height:44px!important;padding:0 14px!important}
  .cf82-facebook-body{
    grid-template-columns:72px 1fr 22px!important;
    gap:11px!important;
    min-height:92px!important;
    padding:0 14px!important;
  }
  .cf82-facebook-avatar{width:70px!important;height:70px!important}
  .cf82-facebook-avatar svg{width:70px!important;height:70px!important}
  .cf82-facebook-buttons{padding:8px 14px 13px!important}


  .cf82-preview-facebook{width:350px!important;max-width:100%!important;min-height:184px!important}
  .cf82-facebook-top{height:42px!important;padding:0 13px!important}
  .cf82-facebook-body{grid-template-columns:66px 1fr 21px!important;gap:10px!important;min-height:82px!important;padding:0 13px!important}
  .cf82-facebook-avatar{width:64px!important;height:64px!important}
  .cf82-facebook-buttons{padding:7px 13px 13px!important}


  .cf82-preview-facebook{
    width:350px!important;
    max-width:100%!important;
    min-height:174px!important;
    border-radius:12px!important;
  }
  .cf82-facebook-top{height:43px!important;padding:0 14px!important}
  .cf82-facebook-body{
    grid-template-columns:72px 1fr 24px!important;
    gap:9px!important;
    padding:0 14px!important;
  }
  .cf82-facebook-avatar{width:68px!important;height:68px!important}
  .cf82-facebook-buttons{padding:9px 14px 13px!important}


  .cf82-preview-twitter{
    width: 350px;
    max-width: 92%;
    min-height: 196px;
    border-radius: 12px;
  }
  .cf82-x-top{height:36px!important;padding:0 13px!important}
  .cf82-x-profile{padding:3px 13px 0!important}
  .cf82-x-avatar{width:54px!important;height:54px!important}
  .cf82-x-name{padding:4px 13px 0!important}
  .cf82-stats-row.x{padding:8px 20px 10px!important}


  .cf82-preview-tiktok{
    width:350px!important;
    max-width:100%!important;
    min-height:185px!important;
    border-radius:14px!important;
  }
  .cf82-tiktok-header{height:43px!important;padding:0 14px!important}
  .cf82-tiktok-body{
    grid-template-columns:80px 1fr!important;
    gap:10px!important;
    padding:0 14px!important;
  }
  .cf82-tiktok-avatar{
    width:72px!important;
    height:72px!important;
  }
  .cf82-stats-row.tiktok{padding:10px 26px 12px!important}


  .cf82-header-followers{grid-template-columns:1fr 1fr}
  .cf82-header-followers .cf82-motto{justify-self:end}

  .cf82-page{padding:0 12px 24px}
  .cf82-header{width:100%;height:62px;grid-template-columns:1fr auto 1fr}
  .cf82-header>button:first-child{font-size:0;gap:0}.cf82-header>button:first-child svg{width:22px;height:22px}
  .cf82-logo{font-size:0}.cf82-logo:after{content:"Follower Plan Details";font-size:19px;font-weight:800;color:#111}.cf82-logo sup{display:none}
  .cf82-motto{font-size:0}.cf82-motto i{font-size:0}
  .cf82-shell{padding-top:18px}
  .cf82-badge{font-size:8px;padding:6px 10px;margin-bottom:10px}
  .cf82-hero h1{font-size:0}.cf82-hero h1:after{content:"";display:none}
  .cf82-hero p{display:none}
  .cf82-preview-stage{margin-top:0;padding-bottom:82px}
  .cf82-preview{width:100%;max-width:100%;min-height:192px;border-radius:15px}
  .cf82-preview-top{height:44px;padding:0 13px}
  .cf82-ig-body{grid-template-columns:78px 1fr auto;padding:12px 13px 18px}.cf82-ig-avatar{width:68px;height:68px}.cf82-ig-avatar svg{width:31px;height:31px}.cf82-ig-wordmark{font-size:19px}.cf82-name-row{font-size:12px}.cf82-stats-row strong{font-size:12px}.cf82-stats-row small{font-size:8px}
  .cf82-tiktok-body{grid-template-columns:82px 1fr;padding:4px 13px}.cf82-tiktok-avatar{width:68px;height:68px}.cf82-tiktok-avatar svg{width:42px;height:42px}.cf82-tiktok-wordmark{font-size:18px}.cf82-tiktok-buttons button{height:29px;padding:0 12px;font-size:9px}.cf82-tiktok-buttons .neutral{width:35px}.cf82-stats-row.tiktok{padding:11px 22px 15px}
  .cf82-x-profile{padding:7px 13px 0}.cf82-x-avatar{width:58px;height:58px}.cf82-x-avatar svg{width:31px;height:31px}.cf82-x-name{padding:5px 13px 0}.cf82-stats-row.x{padding:3px 13px 15px}
  .cf82-facebook-body{grid-template-columns:70px 1fr auto;padding:6px 13px 2px}.cf82-facebook-avatar{width:62px;height:62px}.cf82-facebook-avatar svg{width:62px;height:62px}.cf82-facebook-wordmark{font-size:20px}.cf82-facebook-buttons{padding:12px 13px 15px}
  .cf82-offer{width:96%;min-height:86px;padding:12px 13px}.cf82-offer-title{font-size:12px;gap:4px}.cf82-offer-title strong{font-size:15px}.cf82-offer-row{font-size:9px;margin-top:11px}
  .cf82-plans{width:100%;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
  .cf82-plan{min-height:305px;padding:16px 11px 12px;border-radius:15px}
  .cf82-plan-head{gap:7px}.cf82-plan-icon{width:34px;height:34px}.cf82-plan-icon svg{width:17px;height:17px}.cf82-plan-head h2{font-size:14px;line-height:1.1}.cf82-plan-head p{font-size:8px}
  .cf82-plan ul{margin-top:18px;gap:14px}.cf82-plan li{gap:6px;font-size:9px}.cf82-plan li svg{width:14px;height:14px}.cf82-start,.cf82-target{height:38px;font-size:9px}
  .cf82-deco{opacity:.025}.cf82-deco-top{right:-135px;top:70px;transform:scale(.65);transform-origin:top right}.cf82-deco-bottom{left:-115px;bottom:-5px;transform:scale(.58);transform-origin:bottom left}
}
@media(max-width:390px){
  .cf82-page{padding-left:10px;padding-right:10px}
  .cf82-logo:after{font-size:18px}
  .cf82-plans{gap:8px}
  .cf82-plan{padding-left:9px;padding-right:9px}
  .cf82-plan-head h2{font-size:13px}
  .cf82-plan li{font-size:8.5px}
}

/* V174 final safe overrides */
.cf82-page{background:#fff!important;background-image:none!important}
.cf82-platform-logo-slot{width:84px!important;height:84px!important;min-width:84px!important;min-height:84px!important;flex:0 0 84px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;border:0!important;background:none!important;box-shadow:none!important;overflow:visible!important}
.cf82-platform-logo-slot>img{width:84px!important;height:84px!important;min-width:84px!important;min-height:84px!important;max-width:84px!important;max-height:84px!important;aspect-ratio:84/84!important;object-fit:contain!important;display:block!important;border:0!important;background:none!important;box-shadow:none!important;transform:none!important}
.cf82-tiktok-username .cf82-verified,.cf82-tiktok-username .cf82-verified svg,.cf82-tiktok-username>svg,.cf82-tiktok-username strong+svg{width:13.8px!important;height:13.8px!important;min-width:13.8px!important;min-height:13.8px!important;flex:0 0 13.8px!important}
.cf82-motto>svg,.cf82-motto svg{width:15px!important;height:15px!important;min-width:15px!important;min-height:15px!important;flex:0 0 15px!important}
.cf82-motto>i,.cf82-motto i{font-size:15px!important;line-height:1!important}
.cf82-deco{opacity:.09!important;z-index:1!important;pointer-events:none!important}
.cf82-deco-top{right:0!important;top:90px!important;width:310px!important;height:310px!important;transform:none!important;transform-origin:top right!important}
.cf82-deco-bottom{left:0!important;bottom:10px!important;width:250px!important;height:350px!important;transform:none!important;transform-origin:bottom left!important}
@media(min-width:1025px){.cf82-page{padding-left:24px!important;padding-right:24px!important}.cf82-shell{width:min(100%,1000px)!important;max-width:1000px!important;margin-left:auto!important;margin-right:auto!important}.cf82-deco{opacity:.09!important}.cf82-deco-top{right:0!important;top:90px!important;transform:none!important}.cf82-deco-bottom{left:0!important;bottom:10px!important;transform:none!important}}
@media(max-width:1024px){.cf82-deco{opacity:.055!important}.cf82-deco-top{right:-82px!important;top:92px!important;transform:scale(.72)!important;transform-origin:top right!important}.cf82-deco-bottom{left:-72px!important;bottom:-5px!important;transform:scale(.68)!important;transform-origin:bottom left!important}}

`;

const profileCss = `
.cf82-profile-flow{min-height:100vh;background:#fff;color:#081126;font-family:Arial,Helvetica,sans-serif;padding:0 18px 36px}
.cf82-profile-flow .cf82-header{width:min(calc(100% - 20px),1000px)}
.cf82-profile-shell{width:min(100%,760px);margin:0 auto;padding:46px 0;text-align:center}
.cf82-profile-shell h1{text-transform:capitalize;font-size:40px;margin:12px 0 8px}
.cf82-profile-shell>p{color:#647089;margin-bottom:30px}
@media(max-width:760px){.cf82-profile-flow{padding:0 12px 28px}.cf82-profile-shell{padding-top:30px}.cf82-profile-shell h1{font-size:28px}.cf82-profile-shell>p{font-size:12px}}
`;
