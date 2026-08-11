"use client";

import { useEffect, useState } from "react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Zap } from "lucide-react";

export function GrowthOverviewPreview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const platforms = [
    {
      id: "instagram",
      name: "Instagram",
      icon: FaInstagram,
      color: "text-pink-500",
      bgBase: "bg-pink-500/10",
      barGrad: "from-orange-500 via-pink-500 to-purple-500",
      target: "42.8K",
      progress: 85,
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: FaTiktok,
      color: "text-[#00f2fe]",
      bgBase: "bg-[#00f2fe]/10",
      barGrad: "from-[#00f2fe] to-[#fe0979]",
      target: "86.2K",
      progress: 92,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: FaFacebook,
      color: "text-blue-500",
      bgBase: "bg-blue-500/10",
      barGrad: "from-blue-400 to-blue-600",
      target: "28.4K",
      progress: 68,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      icon: FaXTwitter,
      color: "text-neutral-300",
      bgBase: "bg-neutral-500/10",
      barGrad: "from-neutral-400 to-white",
      target: "19.7K",
      progress: 74,
    }
  ];

  return (
    <div className="w-full relative max-w-[500px] mx-auto xl:mx-0">
      {/* Decorative Glow Behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(124,92,252,0.08),transparent_60%)] pointer-events-none -z-10" />
      
      <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-elevated/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20">
              <Zap className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="font-semibold text-sm text-foreground">Growth Overview</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* List */}
        <div className="p-5 space-y-5">
          {platforms.map((platform, index) => (
            <div key={platform.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-surface-elevated transition-colors ${platform.color} group-hover:${platform.bgBase}`}>
                    <platform.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{platform.name}</span>
                </div>
                <span className="font-bold text-sm text-foreground">{platform.target}</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="w-full h-1.5 bg-background-secondary rounded-full overflow-hidden relative">
                <div 
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${platform.barGrad} transition-all duration-1500 ease-out`}
                  style={{ 
                    width: mounted ? `${platform.progress}%` : "0%",
                    transitionDelay: `${index * 150}ms`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
