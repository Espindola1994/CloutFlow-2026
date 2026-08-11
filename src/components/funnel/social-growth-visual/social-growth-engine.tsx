"use client";

import { useEffect, useState } from "react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Zap } from "lucide-react";

export function SocialGrowthEngine() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto flex items-center justify-center">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(124,92,252,0.1),transparent_50%)] pointer-events-none -z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(56,189,248,0.1),transparent_50%)] pointer-events-none -z-20" />
      
      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10" viewBox="0 0 400 400" fill="none">
        {/* Instagram line (Top Right) */}
        <path d="M200 200 L320 100" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite]" : ""} />
        {/* TikTok line (Bottom Right) */}
        <path d="M200 200 L320 300" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_0.5s]" : ""} />
        {/* Facebook line (Bottom Left) */}
        <path d="M200 200 L80 300" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_1s]" : ""} />
        {/* X line (Top Left) */}
        <path d="M200 200 L80 100" stroke="rgba(163,163,163,0.3)" strokeWidth="1.5" strokeDasharray="4 4" className={mounted ? "animate-[pulse_3s_ease-in-out_infinite_1.5s]" : ""} />
      </svg>

      {/* Central Core */}
      <div className="relative z-20 flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-surface-elevated border border-border shadow-[0_0_30px_rgba(124,92,252,0.3)]">
        <div className="absolute inset-0 rounded-full border border-primary/50 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Instagram Node (Top Right) */}
      <div className={`absolute top-[10%] md:top-[12%] right-[5%] md:right-[10%] flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} style={{ transitionDelay: '100ms' }}>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.2)] mb-2 relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-500 opacity-20 blur-sm -z-10" />
          <FaInstagram className="w-6 h-6 text-pink-500" />
        </div>
        <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground">
          +12.8K <span className="text-muted-foreground font-medium ml-1">Followers</span>
        </div>
      </div>

      {/* TikTok Node (Bottom Right) */}
      <div className={`absolute bottom-[10%] md:bottom-[12%] right-[5%] md:right-[10%] flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} style={{ transitionDelay: '200ms' }}>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] mb-2 relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#00f2fe] to-[#fe0979] opacity-20 blur-sm -z-10" />
          <FaTiktok className="w-5 h-5 text-[#00f2fe]" />
        </div>
        <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground">
          +84K <span className="text-muted-foreground font-medium ml-1">Views</span>
        </div>
      </div>

      {/* Facebook Node (Bottom Left) */}
      <div className={`absolute bottom-[10%] md:bottom-[12%] left-[5%] md:left-[10%] flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} style={{ transitionDelay: '300ms' }}>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] mb-2 relative">
          <div className="absolute -inset-1 rounded-2xl bg-blue-500 opacity-20 blur-sm -z-10" />
          <FaFacebook className="w-6 h-6 text-blue-500" />
        </div>
        <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground">
          +9.4K <span className="text-muted-foreground font-medium ml-1">Likes</span>
        </div>
      </div>

      {/* X Node (Top Left) */}
      <div className={`absolute top-[10%] md:top-[12%] left-[5%] md:left-[10%] flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} style={{ transitionDelay: '400ms' }}>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-2 relative">
          <div className="absolute -inset-1 rounded-2xl bg-neutral-400 opacity-20 blur-sm -z-10" />
          <FaXTwitter className="w-5 h-5 text-neutral-300" />
        </div>
        <div className="bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground">
          +6.2K <span className="text-muted-foreground font-medium ml-1">Followers</span>
        </div>
      </div>

    </div>
  );
}
