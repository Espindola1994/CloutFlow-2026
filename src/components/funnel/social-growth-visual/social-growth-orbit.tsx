"use client";

import { useEffect, useState } from "react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Sparkles, TrendingUp, Users, Heart, Play } from "lucide-react";

export function SocialGrowthOrbit() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full max-w-[800px] mx-auto mt-12 mb-8 flex flex-col items-center justify-center">
      
      {/* Mobile Layout (< 768px) */}
      <div className="md:hidden relative w-full h-[320px] flex items-center justify-center">
        {/* Core CF */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-surface-elevated border border-border shadow-[0_0_30px_rgba(124,92,252,0.25)]">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-tight">CF</span>
          </div>
        </div>

        {/* Connecting Lines (SVG curves) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 320 320" fill="none">
          {/* Instagram (Top) */}
          <path d="M160 50 Q160 100 160 160" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite]" : ""} />
          {/* TikTok (Left) */}
          <path d="M50 160 Q100 160 160 160" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_0.5s]" : ""} />
          {/* Facebook (Right) */}
          <path d="M270 160 Q210 160 160 160" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_1s]" : ""} />
          {/* X (Bottom) */}
          <path d="M160 270 Q160 210 160 160" stroke="rgba(163,163,163,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_1.5s]" : ""} />
        </svg>

        {/* Instagram Node (Top) */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '100ms' }}>
          <div className="w-[44px] h-[44px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.15)] mb-1.5">
            <FaInstagram className="w-5 h-5 text-pink-500" />
          </div>
          <span className="text-[10px] font-bold text-foreground bg-surface/80 backdrop-blur-sm border border-border px-2 py-0.5 rounded-full">+12.8K</span>
        </div>

        {/* TikTok Node (Left) */}
        <div className={`absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '200ms' }}>
          <div className="w-[44px] h-[44px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-1.5">
            <FaTiktok className="w-[18px] h-[18px] text-[#00f2fe]" />
          </div>
          <span className="text-[10px] font-bold text-foreground bg-surface/80 backdrop-blur-sm border border-border px-2 py-0.5 rounded-full">+84K</span>
        </div>

        {/* Facebook Node (Right) */}
        <div className={`absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '300ms' }}>
          <div className="w-[44px] h-[44px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)] mb-1.5">
            <FaFacebook className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[10px] font-bold text-foreground bg-surface/80 backdrop-blur-sm border border-border px-2 py-0.5 rounded-full">+9.4K</span>
        </div>

        {/* X Node (Bottom) */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '400ms' }}>
          <span className="text-[10px] font-bold text-foreground bg-surface/80 backdrop-blur-sm border border-border px-2 py-0.5 rounded-full mb-1.5">+6.2K</span>
          <div className="w-[44px] h-[44px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.08)]">
            <FaXTwitter className="w-4 h-4 text-neutral-300" />
          </div>
        </div>
      </div>


      {/* Desktop Layout (>= 768px) */}
      <div className="hidden md:flex relative w-full h-[180px] lg:h-[220px] items-center justify-center">
        {/* Core CF */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-[76px] h-[76px] rounded-full bg-surface-elevated border border-border shadow-[0_0_30px_rgba(124,92,252,0.25)]">
          <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-xl tracking-tight">CF</span>
          </div>
        </div>

        {/* Connecting Lines (SVG curves) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 220" fill="none" preserveAspectRatio="none">
          {/* Instagram (Far Left) to Center */}
          <path d="M100 110 Q250 110 400 110" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite]" : ""} />
          {/* TikTok (Mid Left) to Center */}
          <path d="M260 50 Q330 80 400 110" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_0.5s]" : ""} />
          {/* Facebook (Mid Right) to Center */}
          <path d="M540 50 Q470 80 400 110" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_1s]" : ""} />
          {/* X (Far Right) to Center */}
          <path d="M700 110 Q550 110 400 110" stroke="rgba(163,163,163,0.3)" strokeWidth="1.5" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_1.5s]" : ""} />
        </svg>

        {/* Instagram Node (Far Left) */}
        <div className={`absolute top-1/2 left-[5%] lg:left-[10%] -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 translate-x-4 scale-95'}`} style={{ transitionDelay: '100ms' }}>
          <div className="w-[52px] h-[52px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.15)] mb-2 relative">
            <FaInstagram className="w-6 h-6 text-pink-500 relative z-10" />
            <div className="absolute inset-0 bg-pink-500/5 rounded-2xl" />
          </div>
          <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground whitespace-nowrap">
            +12.8K <span className="text-muted-foreground font-medium ml-1">Followers</span>
          </div>
        </div>

        {/* TikTok Node (Mid Left) */}
        <div className={`absolute top-[10%] left-[28%] flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} style={{ transitionDelay: '200ms' }}>
          <div className="w-[52px] h-[52px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-2 relative">
            <FaTiktok className="w-[22px] h-[22px] text-[#00f2fe] relative z-10" />
            <div className="absolute inset-0 bg-[#00f2fe]/5 rounded-2xl" />
          </div>
          <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground whitespace-nowrap">
            +84K <span className="text-muted-foreground font-medium ml-1">Views</span>
          </div>
        </div>

        {/* Facebook Node (Mid Right) */}
        <div className={`absolute top-[10%] right-[28%] flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} style={{ transitionDelay: '300ms' }}>
          <div className="w-[52px] h-[52px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)] mb-2 relative">
            <FaFacebook className="w-6 h-6 text-blue-500 relative z-10" />
            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl" />
          </div>
          <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground whitespace-nowrap">
            +9.4K <span className="text-muted-foreground font-medium ml-1">Likes</span>
          </div>
        </div>

        {/* X Node (Far Right) */}
        <div className={`absolute top-1/2 right-[5%] lg:right-[10%] -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-out z-10 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 -translate-x-4 scale-95'}`} style={{ transitionDelay: '400ms' }}>
          <div className="w-[52px] h-[52px] rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.08)] mb-2 relative">
            <FaXTwitter className="w-5 h-5 text-neutral-300 relative z-10" />
            <div className="absolute inset-0 bg-white/5 rounded-2xl" />
          </div>
          <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground whitespace-nowrap">
            +6.2K <span className="text-muted-foreground font-medium ml-1">Followers</span>
          </div>
        </div>
      </div>

      {/* Growth Labels Below */}
      <div className={`mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-5 text-[13px] md:text-sm font-medium text-muted-foreground transition-all duration-1000 ease-out delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Followers</div>
        <span className="text-border text-[10px]">●</span>
        <div className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-primary" /> Likes</div>
        <span className="text-border text-[10px]">●</span>
        <div className="flex items-center gap-1.5"><Play className="w-4 h-4 text-primary" /> Views</div>
      </div>

    </div>
  );
}
