"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Headphones, Heart, Lock,
  MessageSquareText, ShieldCheck, Star, UsersRound, Eye, Zap
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
  instagram: { name: "Instagram", icon: FaInstagram, gradient: "linear-gradient(90deg,#ff7a35 0%,#f02d82 48%,#ec4899 100%)", accent: "#ec4899", accent2: "#ff2a98", glow: "rgba(236,72,153,.22)" },
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
  { id: "followers", title: "Followers", desc: "High quality real\nfollowers.", icon: UsersRound, popular: true },
  { id: "likes", title: "Likes", desc: "Instant post likes\nfrom real users.", icon: Heart },
  { id: "views", title: "Views", desc: "Boost video views\nand reach.", icon: Eye },
  { id: "comments", title: "Comments", desc: "Custom relevant\ncomments.", icon: MessageSquareText },
];

export default function PlatformPage() {
  const router = useRouter();
  const params = useParams<{ platform: string }>();
  const platform = (params?.platform in THEMES ? params.platform : "instagram") as PlatformId;
  const theme = THEMES[platform];
  const bestSellerStyle = platform === "tiktok"
    ? {
        backgroundImage: "linear-gradient(90deg,#00bfc4 0%,#2a6674 46%,#c50043 100%)",
        boxShadow: "0 0 4px rgba(0,234,245,.10)",
      }
    : platform === "twitter"
      ? {
          backgroundImage: "linear-gradient(90deg,#5f6b7c 0%,#7b8798 48%,#4b5667 100%)",
          boxShadow: "0 0 3px rgba(219,231,255,.08)",
        }
      : {
          backgroundImage: theme.gradient,
          boxShadow: `0 0 14px ${theme.glow}`,
        };

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
            <Link key={item.id} href={`/${item.id}`} className={`platform-tab ${active ? "active" : ""}`} style={({ "--active-gradient": THEMES[item.id].gradient, "--active-glow": THEMES[item.id].glow, "--tab-accent": THEMES[item.id].accent, "--tab-accent-2": THEMES[item.id].accent2 } as React.CSSProperties)}>
              <Icon className={`platform-icon ${item.id}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Decor theme={theme} />

      <main className="content">
        <section className="hero">
          <h1>Grow Your <span style={{ backgroundImage: theme.gradient }}>{theme.name}</span></h1>
          <p>Choose a service and start growing today.</p>
        </section>

        <section className="service-grid">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={`/${platform}/${service.id}`} className="service-link">
                <article className={`service-card service-${service.id}`} style={{ "--card-color": theme.accent, "--card-color-2": theme.accent2, "--card-glow": theme.glow } as React.CSSProperties}>
                  {service.popular && <div className="best" style={bestSellerStyle}><Star fill="currentColor" /> BEST SELLER</div>}
                  <div className="rings" />
                  <div className="hex"><Icon /></div>
                  <h2>{service.title}</h2>
                  <p>{service.desc}</p>
                  <div className="round-cta"><span className="cta-label">Start Growing</span><span className="cta-arrow"><ArrowRight /></span></div>
                </article>
              </Link>
            );
          })}
        </section>

        <section className="benefit-bar">
          <Benefit icon={<Zap />} title="Instant Start" text="Begin within minutes" color={theme.accent} />
          <Benefit icon={<ShieldCheck />} title="Secure & Private" text="No password required" color={theme.accent2} />
          <Benefit icon={<Star />} title="Real Engagement" text="Quality-focused service" color={theme.accent} />
          <Benefit icon={<Headphones />} title="24/7 Support" text="We're here for you" color={theme.accent2} last />
        </section>

        <div className="security"><Lock /> Your information is 100% secure and protected.</div>
      </main>

      <style jsx global>{`
        .select-screen{--ink:#f8f9ff;position:relative;min-height:100vh;overflow:hidden;background:radial-gradient(circle at 50% 15%,var(--platform-glow),transparent 28%),radial-gradient(circle at 88% 52%,rgba(22,70,255,.09),transparent 24%),#030713;color:var(--ink);font-family:Arial,Helvetica,sans-serif;padding:24px 24px 20px}
        .select-screen:before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,rgba(102,57,255,.45) 1px,transparent 1.5px);background-size:48px 48px;mask-image:linear-gradient(to bottom,transparent 14%,#000 43%,transparent 73%);opacity:.12}
        .ambient{position:absolute;border-radius:999px;filter:blur(90px);pointer-events:none}.ambient-a{width:420px;height:250px;left:12%;top:36%;background:var(--platform-glow);opacity:.32}.ambient-b{width:400px;height:260px;right:4%;top:38%;background:rgba(0,77,255,.1)}
        .back{position:absolute;z-index:8;left:max(34px,calc(50% - 575px));top:42px;display:flex;align-items:center;gap:9px;border:0;background:transparent;color:#f2f3fb;font-size:14px;cursor:pointer;padding:7px 10px;border-radius:12px;transition:transform .22s ease,color .22s ease,background .22s ease,box-shadow .22s ease}.back svg{width:20px;height:20px;animation:backArrowCue 2.8s ease-in-out infinite;transition:transform .22s ease,filter .22s ease}.back span{transition:transform .22s ease,letter-spacing .22s ease}.back:hover{background:rgba(255,255,255,.035);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);color:#fff}.back:hover svg{animation:none;transform:translateX(-5px);filter:drop-shadow(0 0 6px var(--platform-glow))}.back:hover span{transform:translateX(-1px);letter-spacing:.1px}.back:active{transform:scale(.97)}@keyframes backArrowCue{0%,72%,100%{transform:translateX(0)}82%{transform:translateX(-4px)}90%{transform:translateX(-1px)}}
        .platform-nav{position:relative;z-index:10;margin:0 auto;display:flex;gap:5px;width:min(620px,58vw);height:54px;padding:5px;border:1px solid rgba(74,87,119,.52);border-radius:29px;background:linear-gradient(180deg,rgba(14,19,34,.84),rgba(4,8,18,.88));overflow:hidden;box-shadow:0 14px 35px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.035);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .platform-tab{position:relative;isolation:isolate;display:flex;flex:1;align-items:center;justify-content:center;gap:9px;min-width:0;border-radius:22px;color:#aeb6ca;text-decoration:none;font-size:13px;font-weight:700;transition:color .22s ease,transform .22s ease,background .22s ease,box-shadow .22s ease}.platform-tab:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,color-mix(in srgb,var(--tab-accent) 10%,transparent),color-mix(in srgb,var(--tab-accent-2) 5%,transparent));border:1px solid transparent;opacity:0;transition:opacity .22s ease,border-color .22s ease;z-index:-1}.platform-tab:hover{color:#fff;transform:translateY(-1px)}.platform-tab:hover:before{opacity:1;border-color:color-mix(in srgb,var(--tab-accent) 24%,transparent)}.platform-tab.active{color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--tab-accent) 30%,#101526),color-mix(in srgb,var(--tab-accent-2) 16%,#080c17));box-shadow:0 5px 16px var(--active-glow),inset 0 0 20px color-mix(in srgb,var(--tab-accent) 9%,transparent),inset 0 1px 0 rgba(255,255,255,.09);animation:tabActivate .32s cubic-bezier(.2,.8,.2,1)}.platform-tab.active:before{opacity:1;border-color:color-mix(in srgb,var(--tab-accent) 46%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--tab-accent) 17%,transparent),color-mix(in srgb,var(--tab-accent-2) 8%,transparent))}.platform-tab.active:after{content:"";position:absolute;left:22%;right:22%;bottom:1px;height:2px;border-radius:99px;background:var(--active-gradient);box-shadow:0 0 9px var(--tab-accent);opacity:.9}.platform-tab.active .platform-icon{animation:tabIconPop .38s cubic-bezier(.2,.8,.2,1)}@keyframes tabActivate{0%{transform:scale(.97);opacity:.75}100%{transform:scale(1);opacity:1}}@keyframes tabIconPop{0%{transform:scale(.88)}55%{transform:scale(1.12)}100%{transform:scale(1)}}.platform-icon{width:22px;height:22px;transition:transform .22s ease,filter .22s ease}.platform-tab:hover .platform-icon{transform:scale(1.06)}.platform-icon.instagram{color:#ff4e9b;filter:drop-shadow(0 0 6px rgba(255,78,155,.65))}.platform-icon.tiktok{color:#fff;filter:drop-shadow(-2px 0 #00e8ef) drop-shadow(2px 0 #ff315f)}.platform-icon.twitter{color:#fff;filter:drop-shadow(0 0 5px rgba(219,231,255,.3))}.platform-icon.facebook{color:#1688ff;filter:drop-shadow(0 0 5px rgba(22,136,255,.45))}
        .content{position:relative;z-index:5;width:min(1200px,calc(100vw - 64px));height:calc(100vh - 92px);margin:10px auto 0;display:flex;flex-direction:column;justify-content:center;padding:18px 0 12px;transform:translateY(-42px);box-sizing:border-box}.hero{text-align:center;flex:0 0 auto}.hero h1{margin:0;font-size:42px;line-height:1.08;letter-spacing:-1.2px;font-weight:850}.hero h1 span{background-clip:text;-webkit-background-clip:text;color:transparent}.hero p{margin:15px auto 0;color:#c6cad8;font-size:16px;line-height:1.5}
        .service-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:34px auto 0;max-width:940px;width:100%;flex:0 0 auto}.service-link{text-decoration:none;color:inherit}.service-card{position:relative;height:292px;border:1.5px solid var(--card-color);border-radius:21px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:26px 18px 18px;background:radial-gradient(circle at 50% 15%,var(--card-glow),transparent 42%),linear-gradient(180deg,color-mix(in srgb,var(--card-color-2) 8%,rgba(17,14,39,.94)),rgba(4,8,19,.96));box-shadow:0 0 16px var(--card-glow),inset 0 0 26px rgba(255,255,255,.015);transition:.22s ease}.service-card:hover{transform:translateY(-4px);box-shadow:0 0 28px var(--card-glow),inset 0 0 28px rgba(255,255,255,.02)}.best{position:absolute;top:-29px;left:50%;transform:translateX(-50%);height:34px;padding:0 13px;white-space:nowrap;border-radius:6px 6px 2px 2px;background-image:linear-gradient(90deg,var(--card-color),var(--card-color-2));display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;box-shadow:0 0 16px var(--card-glow)}.best{color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.42)}.best svg{width:14px;filter:none}.rings{position:absolute;top:19px;width:112px;height:88px;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 16px,rgba(255,255,255,.035) 17px 18px);opacity:.55}.hex{position:relative;z-index:2;width:68px;height:68px;clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(145deg,color-mix(in srgb,var(--card-color) 38%,#080817),#0b0b20 70%);filter:drop-shadow(0 0 10px var(--card-color))}.hex:before{content:"";position:absolute;inset:2px;clip-path:inherit;background:#111025;z-index:-1}.hex svg{width:32px;height:32px;color:white;filter:drop-shadow(0 0 5px var(--card-color));transform-origin:center;will-change:transform,filter,opacity}.service-followers .hex svg{animation:followersFloat 2.8s ease-in-out infinite}.service-likes .hex svg{animation:likesBeat 1.9s ease-in-out infinite}.service-views .hex svg{animation:viewsFocus 2.6s ease-in-out infinite}.service-comments .hex svg{animation:commentsNudge 2.4s ease-in-out infinite}@keyframes followersFloat{0%,100%{transform:translateY(0) scale(1);filter:drop-shadow(0 0 5px var(--card-color))}50%{transform:translateY(-3px) scale(1.04);filter:drop-shadow(0 0 9px var(--card-color))}}@keyframes likesBeat{0%,100%{transform:scale(1);filter:drop-shadow(0 0 5px var(--card-color))}18%{transform:scale(1.10);filter:drop-shadow(0 0 10px var(--card-color))}34%{transform:scale(.98)}50%{transform:scale(1.07)}68%{transform:scale(1)}}@keyframes viewsFocus{0%,100%{transform:scale(1);filter:drop-shadow(0 0 5px var(--card-color));opacity:.92}45%{transform:scale(1.09);filter:drop-shadow(0 0 11px var(--card-color));opacity:1}58%{transform:scale(1.03)}}@keyframes commentsNudge{0%,100%{transform:translateY(0) rotate(0deg);filter:drop-shadow(0 0 5px var(--card-color))}38%{transform:translateY(-2px) rotate(-3deg);filter:drop-shadow(0 0 9px var(--card-color))}55%{transform:translateY(0) rotate(2deg)}70%{transform:rotate(0deg)}}@media(prefers-reduced-motion:reduce){.platform-tab.active,.platform-tab.active .platform-icon,.back svg{animation:none!important}.service-followers .hex svg,.service-likes .hex svg,.service-views .hex svg,.service-comments .hex svg,.service-card,.service-card:after,.service-card:hover .round-cta svg{animation:none!important}}.service-card h2{margin:16px 0 0;font-size:20px;font-weight:800}.service-card p{white-space:pre-line;text-align:center;margin:9px 0 0;color:#d0d3df;font-size:12.5px;line-height:1.45}.round-cta{position:absolute;bottom:17px;left:18px;right:18px;height:43px;display:flex;align-items:center;justify-content:space-between;padding-left:16px;border-radius:999px;border:1px solid color-mix(in srgb,var(--card-color) 82%,#fff 10%);background:linear-gradient(90deg,color-mix(in srgb,var(--card-color) 8%,rgba(5,8,20,.94)),rgba(5,8,20,.9) 55%,color-mix(in srgb,var(--card-color) 13%,rgba(5,8,20,.92)));box-shadow:inset 0 0 0 1px rgba(255,255,255,.02),0 8px 18px rgba(0,0,0,.24),0 0 10px var(--card-glow);overflow:visible;transition:transform .24s ease,box-shadow .24s ease,border-color .24s ease,background .24s ease}.round-cta:before{content:"";position:absolute;left:42%;right:32px;height:1px;background:linear-gradient(90deg,transparent,var(--card-color),transparent);opacity:.35;transform:scaleX(.65);transition:transform .24s ease,opacity .24s ease}.round-cta:after{content:"";position:absolute;right:34px;width:28px;height:12px;background:repeating-linear-gradient(0deg,transparent 0 2px,color-mix(in srgb,var(--card-color) 60%,transparent) 2px 3px);filter:blur(.2px);opacity:.22;transform:scaleX(.65);transform-origin:right;transition:.24s ease}.cta-label{position:relative;z-index:2;color:#fff;font-size:12px;font-weight:700;letter-spacing:.01em;white-space:nowrap}.cta-arrow{position:relative;z-index:3;width:43px;height:43px;margin-right:-1px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--card-color);background:linear-gradient(180deg,color-mix(in srgb,var(--card-color) 16%,#0b0d1b),#080b17);box-shadow:0 0 12px var(--card-glow),inset 0 0 10px color-mix(in srgb,var(--card-color) 7%,transparent);transition:transform .24s ease,box-shadow .24s ease}.cta-arrow svg{width:20px;height:20px;color:#fff;filter:drop-shadow(0 0 3px var(--card-color));transition:transform .24s ease,filter .24s ease}.service-card:hover .round-cta{transform:translateY(-2px);border-color:var(--card-color);box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 10px 22px rgba(0,0,0,.28),0 0 16px var(--card-glow)}.service-card:hover .round-cta:before{transform:scaleX(1);opacity:.75}.service-card:hover .round-cta:after{transform:scaleX(1);opacity:.48}.service-card:hover .cta-arrow{transform:translateX(3px) scale(1.05);box-shadow:0 0 18px var(--card-glow),inset 0 0 12px color-mix(in srgb,var(--card-color) 10%,transparent)}.service-card:hover .cta-arrow svg{transform:translateX(3px);filter:drop-shadow(0 0 6px var(--card-color))}.service-card:focus-within .round-cta{border-color:var(--card-color);box-shadow:0 0 16px var(--card-glow)}
        .benefit-bar{max-width:1000px;width:100%;margin:34px auto 0;border:1px solid #273149;border-radius:20px;background:rgba(6,10,21,.73);min-height:86px;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;padding:0 35px}.benefit{display:flex;align-items:center;gap:12px;padding:0 18px;border-right:1px solid #222b42}.benefit:first-child{padding-left:12px}.benefit.last{border-right:0}.benefit .bicon svg{width:29px;height:29px}.benefit h3{font-size:12px;margin:0 0 5px;white-space:nowrap}.benefit p{font-size:12px;color:#b8bfd1;margin:0;white-space:nowrap;line-height:1.35}.security{display:flex;align-items:center;justify-content:center;gap:9px;color:#8e96ad;margin-top:20px;font-size:12.5px;line-height:1.4}.security svg{width:17px;height:17px}
        .decor{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}.fall-icon{position:absolute;top:-90px;color:var(--fall-color);opacity:.055;filter:drop-shadow(0 0 8px var(--fall-color));animation:neonFall var(--dur) linear infinite;animation-delay:var(--delay);transform:rotate(var(--rot));will-change:transform}.fall-icon svg{width:100%;height:100%}@keyframes neonFall{0%{transform:translate3d(0,-120px,0) rotate(var(--rot));opacity:0}10%{opacity:.055}85%{opacity:.04}100%{transform:translate3d(var(--drift),calc(100vh + 180px),0) rotate(calc(var(--rot) + 75deg));opacity:0}}
        @media(max-width:1050px){.fall-icon{opacity:.035}.content{width:min(94vw,900px)}.service-grid{gap:18px}.hero h1{font-size:40px}.benefit-bar{padding:0 10px}.benefit{padding:0 13px;gap:10px}}
        @media(min-width:761px) and (max-height:820px){.content{height:calc(100vh - 82px);margin-top:4px;padding-top:10px;padding-bottom:8px;transform:translateY(-26px)}.hero h1{font-size:38px}.hero p{margin-top:11px;font-size:14px}.service-grid{margin-top:27px}.service-card{height:270px}.benefit-bar{margin-top:26px;min-height:76px}.security{margin-top:14px}.platform-nav{height:50px}.back{top:34px}}
        @media(max-width:760px){
          .select-screen{min-height:100svh;padding:14px 12px 24px;overflow-x:hidden;background:radial-gradient(circle at 50% 8%,var(--platform-glow),transparent 24%),#030713}
          .select-screen:before{opacity:.07;background-size:38px 38px}
          .back{position:relative;left:auto;top:auto;margin:3px 2px 12px;gap:8px;font-size:13px;font-weight:600;padding:7px 9px}.back svg{width:19px;height:19px}.back:active{transform:scale(.96);background:rgba(255,255,255,.045)}.back:active svg{animation:none;transform:translateX(-4px);filter:drop-shadow(0 0 5px var(--platform-glow))}
          .platform-nav{width:100%;height:50px;padding:4px;gap:3px;border-radius:21px;overflow:hidden;justify-content:stretch;box-shadow:0 10px 28px rgba(0,0,0,.22)}
          .platform-tab{min-width:0;flex:1;gap:5px;padding:0 5px;border-radius:17px;font-size:10px;white-space:nowrap}.platform-tab:active{transform:scale(.97)}.platform-tab span{overflow:hidden;text-overflow:ellipsis}.platform-icon{width:18px;height:18px;flex:0 0 auto}
          .content{width:100%;height:auto;min-height:0;margin-top:30px;display:block;padding:0;transform:none}
          .hero{padding:0 3px}.hero h1{max-width:none;margin:0 auto;font-size:clamp(22px,7.2vw,29px);line-height:1.08;letter-spacing:-.8px;white-space:nowrap}.hero p{font-size:13px;line-height:1.5;max-width:330px;margin-top:14px;color:#c2c8d8}
          
          .service-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 10px;margin-top:38px;padding:0 2px}
          .service-card{height:232px;border-radius:18px;padding:18px 8px 14px;box-shadow:0 0 11px var(--card-glow),inset 0 0 20px rgba(255,255,255,.012);overflow:hidden;animation:mobileCardBreathe 4.8s ease-in-out infinite;animation-delay:var(--mobile-delay,0s);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.service-link:nth-child(1) .service-card{--mobile-delay:0s}.service-link:nth-child(2) .service-card{--mobile-delay:-1.2s}.service-link:nth-child(3) .service-card{--mobile-delay:-2.4s}.service-link:nth-child(4) .service-card{--mobile-delay:-3.6s}.service-card:after{content:"";position:absolute;inset:-35%;pointer-events:none;background:linear-gradient(115deg,transparent 42%,color-mix(in srgb,var(--card-color) 16%,transparent) 49%,rgba(255,255,255,.12) 50%,color-mix(in srgb,var(--card-color) 12%,transparent) 51%,transparent 58%);transform:translateX(-75%) rotate(8deg);animation:mobileSheen 5.6s ease-in-out infinite;animation-delay:var(--mobile-delay,0s);opacity:.55}.service-card:active{transform:scale(.975);box-shadow:0 0 22px var(--card-glow),inset 0 0 26px color-mix(in srgb,var(--card-color) 7%,transparent)}.service-card:active .hex{transform:scale(1.06)}.service-card:active .round-cta{transform:scale(1.12);box-shadow:0 0 20px var(--card-color),0 0 30px var(--card-glow)}.service-card:active .round-cta svg{transform:translateX(4px)}@keyframes mobileCardBreathe{0%,100%{box-shadow:0 0 10px var(--card-glow),inset 0 0 20px rgba(255,255,255,.012)}50%{box-shadow:0 0 16px var(--card-glow),inset 0 0 24px color-mix(in srgb,var(--card-color) 4%,transparent)}}@keyframes mobileSheen{0%,68%{transform:translateX(-80%) rotate(8deg);opacity:0}76%{opacity:.42}100%{transform:translateX(80%) rotate(8deg);opacity:0}}
          .rings{top:17px;width:100px;height:82px;opacity:.38}.hex{width:56px;height:56px;transition:transform .18s ease}.hex svg{width:27px;height:27px}.service-card h2{font-size:17px;margin-top:12px}.service-card p{font-size:10.5px;line-height:1.35;margin-top:7px}.round-cta{left:10px;right:10px;height:36px;bottom:12px;padding-left:11px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.02),0 6px 14px rgba(0,0,0,.2),0 0 8px var(--card-glow)}.cta-label{font-size:9.5px}.round-cta:before{left:42%;right:27px}.round-cta:after{right:28px;width:20px;height:9px}.cta-arrow{width:36px;height:36px}.cta-arrow svg{width:17px;height:17px}.service-card:active .round-cta{transform:scale(.98);border-color:var(--card-color);box-shadow:0 0 14px var(--card-glow)}.service-card:active .cta-arrow{transform:translateX(2px) scale(.96);box-shadow:0 0 14px var(--card-glow)}.service-card:active .cta-arrow svg{transform:translateX(2px)}
          .best{top:-18px;height:24px;padding:0 7px;border-radius:5px;font-size:8px;gap:4px}.best svg{width:10px}
          .benefit-bar{margin-top:30px;grid-template-columns:1fr 1fr;padding:6px 8px;gap:0;min-height:0;border-radius:18px}.benefit{min-width:0;padding:10px 8px;gap:8px;border-right:0;border-bottom:1px solid #222b42}.benefit:nth-child(odd){border-right:1px solid #222b42}.benefit:nth-child(3),.benefit:nth-child(4){border-bottom:0}.benefit:first-child{padding-left:8px}.benefit .bicon svg{width:22px;height:22px}.benefit h3{font-size:10px;margin-bottom:3px;white-space:normal}.benefit p{font-size:10px;line-height:1.3;white-space:normal;color:#b8bfd1}.security{font-size:10.5px;margin-top:18px;gap:7px}.security svg{width:15px;height:15px}
        }
        @media(max-width:390px){
          .select-screen{padding-left:9px;padding-right:9px}.platform-tab{font-size:9px;padding:0 3px}.platform-icon{width:17px;height:17px}.hero h1{font-size:clamp(21px,6.8vw,27px);white-space:nowrap}.service-grid{gap-left:8px;gap-right:8px}.service-card{height:224px}.service-card h2{font-size:16px}.service-card p{font-size:10px}
        }
      `}</style>
    </div>
  );
}

function Benefit({ icon, title, text, color, last = false }: { icon: React.ReactNode; title: string; text: string; color: string; last?: boolean }) {
  return <div className={`benefit ${last ? "last" : ""}`}><div className="bicon" style={{ color }}>{icon}</div><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function Decor({ theme }: { theme: Theme }) {
  const Icon = theme.icon;
  const particles = [
    { left: "4%", size: 34, dur: "17s", delay: "-3s", rot: "-18deg", drift: "34px" },
    { left: "13%", size: 24, dur: "22s", delay: "-11s", rot: "14deg", drift: "-26px" },
    { left: "23%", size: 30, dur: "19s", delay: "-7s", rot: "-9deg", drift: "20px" },
    { left: "76%", size: 26, dur: "21s", delay: "-14s", rot: "18deg", drift: "-20px" },
    { left: "86%", size: 36, dur: "18s", delay: "-5s", rot: "-14deg", drift: "28px" },
    { left: "94%", size: 23, dur: "24s", delay: "-17s", rot: "12deg", drift: "-22px" },
  ];
  return <div className="decor" aria-hidden="true">
    {particles.map((p, i) => <div key={i} className="fall-icon" style={{ left:p.left, width:p.size, height:p.size, "--dur":p.dur, "--delay":p.delay, "--rot":p.rot, "--drift":p.drift, "--fall-color": i % 2 ? theme.accent2 : theme.accent } as React.CSSProperties}><Icon /></div>)}
  </div>;
}
