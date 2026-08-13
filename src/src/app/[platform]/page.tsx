"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Headphones, Heart, Lock, Medal,
  MessageSquareText, ShieldCheck, Sparkles, Star, UsersRound, Eye, Zap
} from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

type PlatformId = "instagram" | "tiktok" | "twitter" | "facebook";

type Theme = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accent: string;
  accent2: string;
  glow: string;
};

const THEMES: Record<PlatformId, Theme> = {
  instagram: { name: "Instagram", icon: FaInstagram, gradient: "linear-gradient(90deg,#ff7a35 0%,#f02d82 46%,#8d39ff 100%)", accent: "#9b36ff", accent2: "#ff2a98", glow: "rgba(170,38,255,.22)" },
  tiktok: { name: "TikTok", icon: FaTiktok, gradient: "linear-gradient(90deg,#00f2ea 0%,#ffffff 48%,#ff0050 100%)", accent: "#00e9f5", accent2: "#ff2c7d", glow: "rgba(0,234,245,.18)" },
  twitter: { name: "X / Twitter", icon: FaXTwitter, gradient: "linear-gradient(90deg,#ffffff 0%,#9fb0c8 100%)", accent: "#dbe7ff", accent2: "#6d8cff", glow: "rgba(110,140,255,.16)" },
  facebook: { name: "Facebook", icon: FaFacebook, gradient: "linear-gradient(90deg,#35a2ff 0%,#1877f2 100%)", accent: "#238bff", accent2: "#00c6ff", glow: "rgba(24,119,242,.2)" },
};

const NAV: { id: PlatformId; label: string; icon: Theme["icon"] }[] = [
  { id: "instagram", label: "Instagram", icon: FaInstagram },
  { id: "tiktok", label: "TikTok", icon: FaTiktok },
  { id: "twitter", label: "X / Twitter", icon: FaXTwitter },
  { id: "facebook", label: "Facebook", icon: FaFacebook },
];

const SERVICES = [
  { id: "followers", title: "Followers", desc: "High quality real\nfollowers.", icon: UsersRound, color: "#a637ff", glow: "rgba(157,40,255,.34)", popular: true },
  { id: "likes", title: "Likes", desc: "Instant post likes\nfrom real users.", icon: Heart, color: "#ff2a9b", glow: "rgba(255,32,151,.32)" },
  { id: "views", title: "Views", desc: "Boost video views\nand reach.", icon: Eye, color: "#ff9700", glow: "rgba(255,139,0,.31)" },
  { id: "comments", title: "Comments", desc: "Custom relevant\ncomments.", icon: MessageSquareText, color: "#00cfff", glow: "rgba(0,198,255,.28)" },
];

export default function PlatformPage() {
  const router = useRouter();
  const params = useParams<{ platform: string }>();
  const platform = (params?.platform in THEMES ? params.platform : "instagram") as PlatformId;
  const theme = THEMES[platform];

  return (
    <div className="select-screen" style={{ "--platform-glow": theme.glow } as React.CSSProperties}>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <button className="back" onClick={() => router.push("/")}><ArrowLeft /> <span>Back to Home</span></button>

      <nav className="platform-nav" aria-label="Choose platform">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === platform;
          return (
            <Link key={item.id} href={`/${item.id}`} className={`platform-tab ${active ? "active" : ""}`}>
              <Icon className={`platform-icon ${item.id}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Decor theme={theme} />

      <main className="content">
        <section className="hero">
          <h1>Select an <span style={{ backgroundImage: theme.gradient }}>{theme.name}</span> Service</h1>
          <p>Choose the service that fits your goal. Fast, simple and reliable growth.</p>
          <div className="hero-pills">
            <div><ShieldCheck style={{ color: "#9d31ff" }} /><b>Secure</b></div>
            <div><Zap style={{ color: "#b124ff" }} /><b>Fast Delivery</b></div>
            <div><Medal style={{ color: "#ffad00" }} /><b>Real Results</b></div>
          </div>
        </section>

        <section className="service-grid">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={`/${platform}/${service.id}`} className="service-link">
                <article className="service-card" style={{ "--card-color": service.color, "--card-glow": service.glow } as React.CSSProperties}>
                  {service.popular && <div className="best"><Star fill="currentColor" /> BEST SELLER</div>}
                  <Sparkles className="spark s1" /><Sparkles className="spark s2" />
                  <Sparkles className="spark s3" /><Sparkles className="spark s4" />
                  <div className="rings" />
                  <div className="hex"><Icon /></div>
                  <h2>{service.title}</h2>
                  <p>{service.desc}</p>
                  <div className="round-cta"><ArrowRight /></div>
                </article>
              </Link>
            );
          })}
        </section>

        <section className="benefit-bar">
          <Benefit icon={<Zap />} title="Instant Start" text="Begin within minutes" color="#a52dff" />
          <Benefit icon={<ShieldCheck />} title="Secure & Private" text="No password required" color="#00e97c" />
          <Benefit icon={<Star />} title="Real Engagement" text="Quality-focused service" color="#ff9f00" />
          <Benefit icon={<Headphones />} title="24/7 Support" text="We're here for you" color="#149dff" last />
        </section>

        <div className="security"><Lock /> Your information is 100% secure and protected.</div>
      </main>

      <style jsx global>{`
        .select-screen{--ink:#f8f9ff;position:relative;min-height:100vh;overflow:hidden;background:radial-gradient(circle at 50% 15%,var(--platform-glow),transparent 28%),radial-gradient(circle at 88% 52%,rgba(22,70,255,.09),transparent 24%),#030713;color:var(--ink);font-family:Arial,Helvetica,sans-serif;padding:30px 34px 26px}
        .select-screen:before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,rgba(102,57,255,.45) 1px,transparent 1.5px);background-size:48px 48px;mask-image:linear-gradient(to bottom,transparent 14%,#000 43%,transparent 73%);opacity:.12}
        .ambient{position:absolute;border-radius:999px;filter:blur(90px);pointer-events:none}.ambient-a{width:420px;height:250px;left:12%;top:36%;background:var(--platform-glow);opacity:.32}.ambient-b{width:400px;height:260px;right:4%;top:38%;background:rgba(0,77,255,.1)}
        .back{position:absolute;z-index:8;left:35px;top:48px;display:flex;align-items:center;gap:12px;border:0;background:transparent;color:#f2f3fb;font-size:16px;cursor:pointer}.back svg{width:23px;height:23px}
        .platform-nav{position:relative;z-index:10;margin:0 auto;display:flex;width:min(790px,66vw);height:67px;border:1px solid #26304a;border-radius:38px;background:rgba(4,8,18,.76);overflow:hidden;box-shadow:0 14px 35px rgba(0,0,0,.24)}
        .platform-tab{position:relative;display:flex;flex:1;align-items:center;justify-content:center;gap:14px;color:#fff;text-decoration:none;font-size:16px;font-weight:700;border-right:1px solid rgba(55,65,89,.42)}.platform-tab:last-child{border-right:0}.platform-tab.active{background:linear-gradient(105deg,rgba(255,84,51,.38),rgba(198,32,156,.25),rgba(75,29,156,.12));box-shadow:inset 0 0 34px rgba(255,57,163,.15)}.platform-icon{width:28px;height:28px}.platform-icon.instagram{color:#ff4e9b;filter:drop-shadow(0 0 7px #ff4e9b)}.platform-icon.tiktok{color:#fff;filter:drop-shadow(-2px 0 #00e8ef) drop-shadow(2px 0 #ff315f)}.platform-icon.twitter{color:#fff}.platform-icon.facebook{color:#1688ff}
        .content{position:relative;z-index:5;width:min(1185px,calc(100vw - 72px));margin:66px auto 0}.hero{text-align:center}.hero h1{margin:0;font-size:56px;line-height:1.05;letter-spacing:-2px;font-weight:850}.hero h1 span{background-clip:text;-webkit-background-clip:text;color:transparent}.hero p{margin:23px auto 0;color:#c6cad8;font-size:17px}.hero-pills{display:flex;justify-content:center;gap:17px;margin-top:30px}.hero-pills>div{min-width:160px;height:58px;border:1px solid #273149;border-radius:31px;background:rgba(5,9,19,.72);display:flex;align-items:center;justify-content:center;gap:13px;font-size:15px;box-shadow:inset 0 1px rgba(255,255,255,.025)}.hero-pills svg{width:24px;height:24px}
        .service-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:39px;margin:62px auto 0;max-width:1125px}.service-link{text-decoration:none;color:inherit}.service-card{position:relative;height:338px;border:1.5px solid var(--card-color);border-radius:25px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 24px 23px;background:radial-gradient(circle at 50% 15%,var(--card-glow),transparent 42%),linear-gradient(180deg,rgba(17,14,39,.94),rgba(4,8,19,.96));box-shadow:0 0 16px var(--card-glow),inset 0 0 26px rgba(255,255,255,.015);transition:.22s ease}.service-card:hover{transform:translateY(-4px);box-shadow:0 0 28px var(--card-glow),inset 0 0 28px rgba(255,255,255,.02)}.best{position:absolute;top:-29px;left:50%;transform:translateX(-50%);height:34px;padding:0 13px;white-space:nowrap;border-radius:6px 6px 2px 2px;background:linear-gradient(90deg,#8243ff,#c21dff);display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;box-shadow:0 0 16px rgba(164,48,255,.45)}.best svg{width:14px}.rings{position:absolute;top:25px;width:145px;height:110px;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 16px,rgba(255,255,255,.035) 17px 18px);opacity:.55}.hex{position:relative;z-index:2;width:82px;height:82px;clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(145deg,color-mix(in srgb,var(--card-color) 38%,#080817),#0b0b20 70%);filter:drop-shadow(0 0 10px var(--card-color))}.hex:before{content:"";position:absolute;inset:2px;clip-path:inherit;background:#111025;z-index:-1}.hex svg{width:39px;height:39px;color:white;filter:drop-shadow(0 0 5px var(--card-color))}.service-card h2{margin:20px 0 0;font-size:24px;font-weight:800}.service-card p{white-space:pre-line;text-align:center;margin:14px 0 0;color:#d0d3df;font-size:15px;line-height:1.5}.round-cta{position:absolute;bottom:23px;width:56px;height:56px;border-radius:50%;border:1.5px solid var(--card-color);display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,var(--card-glow),rgba(9,10,21,.9) 67%);box-shadow:0 0 12px var(--card-glow)}.round-cta svg{width:27px;height:27px}.spark{position:absolute;width:13px;height:13px;color:var(--card-color);opacity:.72}.s1{left:16px;top:16px}.s2{right:16px;top:16px}.s3{left:16px;bottom:16px}.s4{right:16px;bottom:16px}
        .benefit-bar{max-width:1185px;margin:59px auto 0;border:1px solid #273149;border-radius:25px;background:rgba(6,10,21,.73);min-height:115px;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;padding:0 35px}.benefit{display:flex;align-items:center;gap:18px;padding:0 28px;border-right:1px solid #222b42}.benefit:first-child{padding-left:18px}.benefit.last{border-right:0}.benefit .bicon svg{width:37px;height:37px}.benefit h3{font-size:15px;margin:0 0 9px;white-space:nowrap}.benefit p{font-size:13px;color:#aeb5c8;margin:0;white-space:nowrap}.security{display:flex;align-items:center;justify-content:center;gap:12px;color:#8e96ad;margin-top:35px;font-size:14px}.security svg{width:20px}
        .decor{position:absolute;inset:0;pointer-events:none;z-index:2}.decor .big-social{position:absolute;left:68px;top:122px;width:138px;height:138px;color:#f42a9a;transform:rotate(12deg);filter:drop-shadow(0 0 15px rgba(255,42,154,.7))}.decor .mini{position:absolute;width:52px;height:52px;padding:8px;border:2px solid currentColor;border-radius:12px;background:rgba(12,8,28,.78);filter:drop-shadow(0 0 12px currentColor)}.decor .ig1{right:75px;top:132px;color:#d83d9e}.decor .ig2{right:105px;top:250px;color:#c333d7;transform:rotate(13deg)}.decor .tt{left:18px;top:420px;color:#e130a3;transform:rotate(-10deg)}.decor .fb{left:34px;top:648px;color:#146bff;transform:rotate(-8deg)}.decor .xx{right:28px;top:438px;color:#1763ff;transform:rotate(13deg)}.metric{position:absolute;display:flex;align-items:center;gap:9px;border:1px solid #30204d;border-radius:9px;background:rgba(14,10,31,.86);padding:11px 18px;font-size:15px;box-shadow:0 0 24px rgba(127,35,255,.11)}.metric svg{width:22px}.metric.left{left:75px;top:310px;transform:rotate(-8deg)}.metric.right{right:27px;top:644px;transform:rotate(8deg)}
        @media(max-width:1050px){.decor{display:none}.content{width:min(94vw,900px)}.service-grid{gap:18px}.hero h1{font-size:45px}.benefit-bar{padding:0 10px}.benefit{padding:0 13px;gap:10px}}
        @media(max-width:760px){
          .select-screen{min-height:100svh;padding:14px 12px 24px;overflow-x:hidden;background:radial-gradient(circle at 50% 8%,var(--platform-glow),transparent 24%),#030713}
          .select-screen:before{opacity:.07;background-size:38px 38px}
          .back{position:relative;left:auto;top:auto;margin:3px 2px 12px;gap:8px;font-size:13px;font-weight:600}.back svg{width:19px;height:19px}
          .platform-nav{width:100%;height:52px;border-radius:20px;overflow:hidden;justify-content:stretch;box-shadow:0 10px 28px rgba(0,0,0,.22)}
          .platform-tab{min-width:0;flex:1;gap:5px;padding:0 5px;font-size:10px;white-space:nowrap}.platform-tab span{overflow:hidden;text-overflow:ellipsis}.platform-icon{width:18px;height:18px;flex:0 0 auto}
          .content{width:100%;margin-top:30px}
          .hero{padding:0 3px}.hero h1{max-width:340px;margin:0 auto;font-size:29px;line-height:1.08;letter-spacing:-.8px}.hero p{font-size:12px;line-height:1.45;max-width:320px;margin-top:14px;color:#b9bfd0}
          .hero-pills{gap:6px;margin-top:20px}.hero-pills>div{flex:1;min-width:0;max-width:112px;height:38px;padding:0 7px;border-radius:20px;font-size:9px;gap:5px}.hero-pills svg{width:15px;height:15px;flex:0 0 auto}
          .service-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 10px;margin-top:38px;padding:0 2px}
          .service-card{height:232px;border-radius:18px;padding:18px 8px 14px;box-shadow:0 0 11px var(--card-glow),inset 0 0 20px rgba(255,255,255,.012)}
          .rings{top:17px;width:100px;height:82px;opacity:.38}.hex{width:56px;height:56px}.hex svg{width:27px;height:27px}.service-card h2{font-size:17px;margin-top:12px}.service-card p{font-size:10.5px;line-height:1.35;margin-top:7px}.round-cta{width:40px;height:40px;bottom:13px}.round-cta svg{width:20px;height:20px}.spark{width:9px;height:9px}.s1{left:10px;top:10px}.s2{right:10px;top:10px}.s3{left:10px;bottom:10px}.s4{right:10px;bottom:10px}
          .best{top:-18px;height:24px;padding:0 7px;border-radius:5px;font-size:8px;gap:4px}.best svg{width:10px}
          .benefit-bar{margin-top:30px;grid-template-columns:1fr 1fr;padding:6px 8px;gap:0;min-height:0;border-radius:18px}.benefit{min-width:0;padding:10px 8px;gap:8px;border-right:0;border-bottom:1px solid #222b42}.benefit:nth-child(odd){border-right:1px solid #222b42}.benefit:nth-child(3),.benefit:nth-child(4){border-bottom:0}.benefit:first-child{padding-left:8px}.benefit .bicon svg{width:22px;height:22px}.benefit h3{font-size:10px;margin-bottom:3px;white-space:normal}.benefit p{font-size:8.5px;line-height:1.25;white-space:normal}.security{font-size:9.5px;margin-top:18px;gap:7px}.security svg{width:15px;height:15px}
        }
        @media(max-width:390px){
          .select-screen{padding-left:9px;padding-right:9px}.platform-tab{font-size:9px;padding:0 3px}.platform-icon{width:17px;height:17px}.hero h1{font-size:27px}.hero-pills>div{font-size:8.5px;padding:0 5px}.service-grid{gap-left:8px;gap-right:8px}.service-card{height:224px}.service-card h2{font-size:16px}.service-card p{font-size:10px}
        }
      `}</style>
    </div>
  );
}

function Benefit({ icon, title, text, color, last = false }: { icon: React.ReactNode; title: string; text: string; color: string; last?: boolean }) {
  return <div className={`benefit ${last ? "last" : ""}`}><div className="bicon" style={{ color }}>{icon}</div><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function Decor({ theme }: { theme: Theme }) {
  const MainIcon = theme.icon;
  return <div className="decor">
    <MainIcon className="big-social" />
    <FaInstagram className="mini ig1" /><FaInstagram className="mini ig2" />
    <FaTiktok className="mini tt" /><FaFacebook className="mini fb" /><FaXTwitter className="mini xx" />
    <div className="metric left"><UsersRound /> 12.8K</div><div className="metric right"><UsersRound /> 8.4K</div>
  </div>;
}
