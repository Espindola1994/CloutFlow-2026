"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, Star, ShieldCheck, Zap, HeartHandshake, Headphones,
  UsersRound, Heart, Eye, MessageCircle, TrendingUp, Lock
} from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";

type ThemeConfig = {
  name: string;
  id: string;
  icon: React.FC<any>;
  glow: string;
  baseColor: string;
  textColor: string;
  borderHover: string;
  cards: {
    followers: { glow: string, text: string };
    likes: { glow: string, text: string };
    views: { glow: string, text: string };
    comments: { glow: string, text: string };
  }
};

const THEMES: Record<string, ThemeConfig> = {
  instagram: {
    name: "Instagram",
    id: "instagram",
    icon: FaInstagram,
    glow: "bg-[radial-gradient(circle,rgba(225,48,108,0.1),rgba(131,58,180,0.05),transparent_70%)]",
    baseColor: "from-[#F77737] via-[#E1306C] to-[#833AB4]",
    textColor: "text-transparent bg-clip-text bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4]",
    borderHover: "group-hover:border-pink-500/50",
    cards: {
      followers: { glow: "group-hover:shadow-[0_10px_30px_rgba(131,58,180,0.25)]", text: "text-purple-400" },
      likes: { glow: "group-hover:shadow-[0_10px_30px_rgba(225,48,108,0.25)]", text: "text-pink-500" },
      views: { glow: "group-hover:shadow-[0_10px_30px_rgba(247,119,55,0.25)]", text: "text-orange-400" },
      comments: { glow: "group-hover:shadow-[0_10px_30px_rgba(6,182,212,0.2)]", text: "text-cyan-400" },
    }
  },
  tiktok: {
    name: "TikTok",
    id: "tiktok",
    icon: FaTiktok,
    glow: "bg-[radial-gradient(circle,rgba(0,242,254,0.08),rgba(254,9,121,0.05),transparent_70%)]",
    baseColor: "from-[#00f2fe] to-[#fe0979]",
    textColor: "text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#fe0979]",
    borderHover: "group-hover:border-[#00f2fe]/50",
    cards: {
      followers: { glow: "group-hover:shadow-[0_10px_30px_rgba(0,242,254,0.25)]", text: "text-[#00f2fe]" },
      likes: { glow: "group-hover:shadow-[0_10px_30px_rgba(254,9,121,0.25)]", text: "text-[#fe0979]" },
      views: { glow: "group-hover:shadow-[0_10px_30px_rgba(0,242,254,0.2)]", text: "text-cyan-400" },
      comments: { glow: "group-hover:shadow-[0_10px_30px_rgba(254,9,121,0.2)]", text: "text-pink-400" },
    }
  },
  twitter: {
    name: "X / Twitter",
    id: "twitter",
    icon: FaXTwitter,
    glow: "bg-[radial-gradient(circle,rgba(255,255,255,0.05),rgba(124,92,252,0.05),transparent_70%)]",
    baseColor: "from-gray-300 to-white",
    textColor: "text-white",
    borderHover: "group-hover:border-white/40",
    cards: {
      followers: { glow: "group-hover:shadow-[0_10px_30px_rgba(124,92,252,0.2)]", text: "text-purple-400" },
      likes: { glow: "group-hover:shadow-[0_10px_30px_rgba(255,255,255,0.15)]", text: "text-white" },
      views: { glow: "group-hover:shadow-[0_10px_30px_rgba(163,163,163,0.2)]", text: "text-gray-300" },
      comments: { glow: "group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]", text: "text-blue-400" },
    }
  },
  facebook: {
    name: "Facebook",
    id: "facebook",
    icon: FaFacebook,
    glow: "bg-[radial-gradient(circle,rgba(24,119,242,0.1),rgba(0,242,254,0.05),transparent_70%)]",
    baseColor: "from-[#1877F2] to-[#3b8ef5]",
    textColor: "text-[#1877F2]",
    borderHover: "group-hover:border-[#1877F2]/50",
    cards: {
      followers: { glow: "group-hover:shadow-[0_10px_30px_rgba(24,119,242,0.3)]", text: "text-blue-500" },
      likes: { glow: "group-hover:shadow-[0_10px_30px_rgba(124,92,252,0.2)]", text: "text-indigo-400" },
      views: { glow: "group-hover:shadow-[0_10px_30px_rgba(0,242,254,0.2)]", text: "text-cyan-400" },
      comments: { glow: "group-hover:shadow-[0_10px_30px_rgba(56,189,248,0.2)]", text: "text-sky-400" },
    }
  }
};

const NAV_PLATFORMS = [
  { id: 'instagram', icon: FaInstagram, label: 'Instagram' },
  { id: 'tiktok', icon: FaTiktok, label: 'TikTok' },
  { id: 'twitter', icon: FaXTwitter, label: 'X / Twitter' },
  { id: 'facebook', icon: FaFacebook, label: 'Facebook' },
];

const SERVICES_DATA = [
  { id: "followers", icon: UsersRound, title: "Followers", desc: "High quality real followers", popular: true },
  { id: "likes", icon: Heart, title: "Likes", desc: "Instant post likes", popular: false },
  { id: "views", icon: Eye, title: "Views", desc: "Boost video views and reach", popular: false },
  { id: "comments", icon: MessageCircle, title: "Comments", desc: "Custom relevant comments", popular: false }
];

export default function PlatformPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as { platform: string };
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = THEMES[params.platform] || THEMES['instagram'];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      
      {/* Platform Ambient Glow */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] pointer-events-none -z-10 ${theme.glow}`} />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 flex flex-col items-center">
        
        {/* Top Controls: Back & Platform Selector */}
        <div className="w-full relative flex flex-col items-center justify-center mb-10 md:mb-16 gap-6 md:gap-0">
          
          <button 
            onClick={() => router.push('/')}
            className="group flex items-center text-[13px] md:text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors self-start md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          {/* Segmented Control / Glass Navigation */}
          <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 flex justify-center">
            <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#111728]/60 backdrop-blur-md border border-[#26314D] shadow-[0_4px_16px_rgba(0,0,0,0.2)] min-w-max mx-auto">
              {NAV_PLATFORMS.map((plat) => {
                const isActive = params.platform === plat.id;
                return (
                  <Link 
                    key={plat.id} 
                    href={`/${plat.id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 outline-none
                      ${isActive 
                        ? `bg-surface-elevated shadow-sm border border-white/5` 
                        : `hover:bg-white/5 text-muted-foreground`
                      }`}
                  >
                    <plat.icon className={`w-3.5 h-3.5 ${isActive ? theme.textColor.split(' ')[0] : 'opacity-70'}`} />
                    <span className={`text-[13px] font-bold ${isActive ? 'text-foreground' : ''}`}>{plat.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compact Hero */}
        <div className="text-center mb-10 md:mb-16 flex flex-col items-center animate-in fade-in slide-in-from-bottom-3 duration-700">
          <h1 className="text-[32px] md:text-[46px] lg:text-[52px] font-extrabold tracking-tight leading-[1.1] mb-4 md:mb-5">
            Select an <span className={`${theme.textColor}`}>{theme.name}</span> Service
          </h1>
          <p className="text-[15px] md:text-[17px] text-[#A8B1C7] max-w-[550px] leading-relaxed">
            Choose the service that fits your goal. Fast, simple and reliable growth.
          </p>

          {/* Micro Benefits (Pills) */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8">
            <div className="flex items-center gap-2 bg-[#111728]/80 backdrop-blur-md border border-white/5 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <ShieldCheck className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_currentColor]" /> 
              <span className="text-[12px] md:text-[13px] font-medium text-white">Secure</span>
            </div>
            <div className="flex items-center gap-2 bg-[#111728]/80 backdrop-blur-md border border-white/5 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <Zap className="w-4 h-4 text-[#38BDF8] drop-shadow-[0_0_8px_currentColor]" /> 
              <span className="text-[12px] md:text-[13px] font-medium text-white">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 bg-[#111728]/80 backdrop-blur-md border border-white/5 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <TrendingUp className="w-4 h-4 text-[#7C5CFC] drop-shadow-[0_0_8px_currentColor]" /> 
              <span className="text-[12px] md:text-[13px] font-medium text-white">Real Results</span>
            </div>
          </div>
        </div>

        {/* Services Holographic Grid (Vertical Cards) */}
        <div className="w-full grid grid-cols-2 md:flex md:flex-row md:flex-wrap md:justify-center gap-4 md:gap-[36px] mb-16 md:mb-24 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          {SERVICES_DATA.map((svc) => {
            const cardTheme = theme.cards[svc.id as keyof typeof theme.cards];
            
            return (
              <Link key={svc.id} href={`/${params.platform}/${svc.id}`} className="group outline-none block w-full md:w-[250px]">
                <div className={`w-full min-h-[220px] md:h-[335px] relative bg-[#111728]/80 backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 md:p-8 flex flex-col items-center text-center justify-between transition-all duration-300 ease-out md:hover:-translate-y-1.5 active:scale-[0.98] ${theme.borderHover} group-hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative z-10`}>
                  
                  {/* Internal Radial Glow Permanent */}
                  <div className={`absolute inset-0 opacity-40 blur-2xl transition-opacity duration-300 md:group-hover:opacity-60 pointer-events-none -z-10 ${cardTheme.glow.replace('group-hover:shadow-[0_10px_30px_', 'bg-[').replace(']', ']')}`} style={{ background: `radial-gradient(circle at center 30%, ${cardTheme.text.replace('text-', '') === 'purple-400' ? 'rgba(168,85,247,0.25)' : cardTheme.text.replace('text-', '') === 'pink-500' ? 'rgba(236,72,153,0.25)' : cardTheme.text.replace('text-', '') === 'orange-400' ? 'rgba(251,146,60,0.25)' : 'rgba(34,211,238,0.25)'}, transparent 70%)` }} />

                  {/* Inner Highlight / Reflection */}
                  <div className="absolute top-0 left-0 w-full h-[80px] bg-gradient-to-b from-white/10 to-transparent rounded-t-[24px] md:rounded-t-[32px] pointer-events-none" />

                  {/* Top Floating Badge overlapping border strictly on Followers */}
                  {svc.popular && (
                    <div className="absolute -top-[10px] right-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white text-[9px] md:text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border border-white/20 shadow-[0_4px_12px_rgba(236,72,153,0.4)] z-30">
                      ★ BEST SELLER
                    </div>
                  )}

                  {/* Corner Sparkles (Desktop Hover) */}
                  <div className="hidden md:block absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"><Star className={`w-3 h-3 ${cardTheme.text}`} /></div>
                  <div className="hidden md:block absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"><Star className={`w-2 h-2 ${cardTheme.text}`} /></div>
                  <div className="hidden md:block absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"><Star className={`w-2 h-2 ${cardTheme.text}`} /></div>
                  <div className="hidden md:block absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"><Star className={`w-3 h-3 ${cardTheme.text}`} /></div>

                  {/* Top Element: Hexagon Icon Box */}
                  <div className="relative mt-2 mb-4 md:mb-6">
                    <div className="w-[60px] h-[60px] md:w-[84px] md:h-[84px] bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:border-white/40 transition-colors z-20 relative" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                      <svc.icon className={`w-7 h-7 md:w-10 md:h-10 ${cardTheme.text} drop-shadow-[0_0_12px_currentColor] group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    {/* Behind-Hexagon strict glow */}
                    <div className="absolute inset-0 bg-current opacity-40 blur-xl rounded-full scale-150 pointer-events-none -z-10" style={{ color: cardTheme.text.replace('text-', '') === 'purple-400' ? '#c084fc' : cardTheme.text.replace('text-', '') === 'pink-500' ? '#ec4899' : cardTheme.text.replace('text-', '') === 'orange-400' ? '#fb923c' : '#22d3ee' }} />
                  </div>

                  {/* Middle Elements: Title + Subtitle */}
                  <div className="flex-1 flex flex-col items-center justify-center relative z-20 mb-4 md:mb-6">
                    <h3 className="text-[17px] md:text-[22px] font-extrabold text-[#F8FAFF] mb-2 tracking-tight">{svc.title}</h3>
                    <p className="text-[12px] md:text-[14.5px] text-[#D0D4DF] leading-snug px-1">{svc.desc}</p>
                  </div>

                  {/* Bottom Element: Circular CTA */}
                  <div className="mt-auto relative z-20">
                    <div className={`w-[44px] h-[44px] md:w-[52px] md:h-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-white/15 transition-all overflow-hidden relative`}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-30 blur-md bg-current transition-opacity" style={{ color: cardTheme.text.replace('text-', '') === 'purple-400' ? '#c084fc' : cardTheme.text.replace('text-', '') === 'pink-500' ? '#ec4899' : cardTheme.text.replace('text-', '') === 'orange-400' ? '#fb923c' : '#22d3ee' }} />
                      <ArrowRight className={`w-5 h-5 md:w-6 md:h-6 ${cardTheme.text} group-hover:translate-x-[3px] transition-transform`} />
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Benefit Bar */}
        <div className="w-full max-w-[900px] mb-8 animate-in fade-in duration-700 delay-300">
          
          {/* Desktop Version */}
          <div className="hidden md:flex flex-row items-center justify-between bg-[#111728]/50 backdrop-blur-md border border-[#26314D] rounded-[24px] px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-foreground">Instant Start</h4>
                <p className="text-[12px] text-muted-foreground">Begin within minutes</p>
              </div>
            </div>

            <div className="w-[1px] h-[30px] bg-[#26314D]" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-foreground">Secure & Private</h4>
                <p className="text-[12px] text-muted-foreground">No password required</p>
              </div>
            </div>

            <div className="w-[1px] h-[30px] bg-[#26314D]" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-[#7C5CFC]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-foreground">Real Engagement</h4>
                <p className="text-[12px] text-muted-foreground">Quality-focused service</p>
              </div>
            </div>

            <div className="w-[1px] h-[30px] bg-[#26314D]" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center">
                <Headphones className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-foreground">Support</h4>
                <p className="text-[12px] text-muted-foreground">We're here for you</p>
              </div>
            </div>
          </div>

          {/* Mobile Version (Compact Grid) */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-[#111728]/50 backdrop-blur-md border border-[#26314D] rounded-[16px] p-3">
              <Zap className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[12px] font-bold text-foreground leading-tight">Instant Start</h4>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Begin within minutes</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-[#111728]/50 backdrop-blur-md border border-[#26314D] rounded-[16px] p-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[12px] font-bold text-foreground leading-tight">Secure & Private</h4>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">No password required</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#111728]/50 backdrop-blur-md border border-[#26314D] rounded-[16px] p-3">
              <HeartHandshake className="w-4 h-4 text-[#7C5CFC] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[12px] font-bold text-foreground leading-tight">Real Engagement</h4>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Quality-focused</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#111728]/50 backdrop-blur-md border border-[#26314D] rounded-[16px] p-3">
              <Headphones className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[12px] font-bold text-foreground leading-tight">Support</h4>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">We're here for you</p>
              </div>
            </div>
          </div>

        </div>

        {/* Security Message */}
        <div className="flex items-center justify-center gap-1.5 mt-2 mb-10 text-[#A8B1C7] opacity-80 animate-in fade-in duration-700 delay-500">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[11px] md:text-[13px] font-medium tracking-wide">Your information is 100% secure and protected.</span>
        </div>

      </main>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
