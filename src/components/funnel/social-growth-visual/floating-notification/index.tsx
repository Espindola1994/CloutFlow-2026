"use client";

import { useEffect, useState } from "react";
import { UserPlus, Heart, CheckCircle, Play, Eye, Repeat2, Users, ThumbsUp, TrendingUp, ShieldCheck, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingNotificationProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'facebook';
  type: 'followers' | 'likes' | 'status' | 'views' | 'reposts';
  position: 'top-left' | 'middle-right' | 'bottom-left';
  initialCount?: number;
}

export function FloatingNotification({ platform, type, position, initialCount = 124 }: FloatingNotificationProps) {
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particle, setParticle] = useState(false);

  // Position configurations
  const posClasses = {
    'top-left': 'top-[2%] md:top-[12%] left-1/2 md:left-[5%] -translate-x-1/2 md:-translate-x-0 z-30',
    'middle-right': 'top-[25%] md:top-[35%] right-[-10px] md:right-[2%] z-30',
    'bottom-left': 'hidden md:flex bottom-[18%] left-[2%] z-30'
  };

  // Organic floating animations
  const floatAnim = {
    'top-left': 'animate-[float_5.8s_ease-in-out_infinite_alternate-reverse]',
    'middle-right': 'animate-[float_6.7s_ease-in-out_infinite_alternate]',
    'bottom-left': 'animate-[float_7.4s_ease-in-out_infinite_alternate]'
  };

  useEffect(() => {
    // Staggered entrance
    let mountDelay = 150;
    if (position === 'middle-right') mountDelay = 300;
    if (position === 'bottom-left') mountDelay = 450;
    
    const mountTimer = setTimeout(() => setMounted(true), mountDelay);

    if (type === 'status') return () => clearTimeout(mountTimer);

    // Organic count updates
    const updateTick = () => {
      const increment = 
        type === 'views' ? Math.floor(Math.random() * 32) + 8 :
        type === 'likes' && platform === 'tiktok' ? Math.floor(Math.random() * 10) + 2 :
        Math.floor(Math.random() * 5) + 1;

      setCount(c => c + increment);
      setPulse(true);
      
      if (type === 'likes' || type === 'views') {
        setParticle(true);
        setTimeout(() => setParticle(false), 800);
      }

      setTimeout(() => setPulse(false), 300);

      // Random next interval
      const minBase = type === 'views' ? 2000 : 3000;
      const nextDelay = minBase + Math.random() * 2500;
      timeout = setTimeout(updateTick, nextDelay);
    };

    let timeout = setTimeout(updateTick, 2500 + Math.random() * 2000);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(timeout);
    };
  }, [type, platform, position]);

  // Platform Specific Styles & Content
  const getPlatformConfig = () => {
    switch (platform) {
      case 'instagram':
        return {
          bg: 'bg-[#0c0a0e]/90 backdrop-blur-md',
          border: 'border border-pink-500/20 shadow-[0_4px_24px_rgba(236,72,153,0.08)] relative',
          pseudoBorder: 'after:absolute after:inset-0 after:rounded-2xl after:p-[1px] after:bg-gradient-to-br after:from-pink-500/50 after:via-purple-500/20 after:to-orange-500/30 after:-z-10 after:[mask-image:linear-gradient(black,black)] after:pointer-events-none',
          iconWrap: 'bg-[#1a1118] border border-pink-500/30 relative overflow-hidden',
          iconGradient: 'absolute inset-0 bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 opacity-20',
          iconColor: 'text-white',
          numberColor: 'text-white',
          textColor: 'text-white/70',
          badgeColor: 'text-pink-400 bg-pink-500/10'
        };
      case 'tiktok':
        return {
          bg: 'bg-[#090909]/95 backdrop-blur-md',
          border: 'border border-[#222] shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
          pseudoBorder: 'shadow-[-1px_0_4px_rgba(105,201,208,0.15),1px_0_4px_rgba(254,44,85,0.15)]',
          iconWrap: 'bg-[#111] border border-[#333] shadow-[-1px_1px_3px_rgba(105,201,208,0.2),1px_-1px_3px_rgba(254,44,85,0.2)]',
          iconGradient: '',
          iconColor: type === 'likes' ? 'text-[#FE2C55]' : 'text-[#69C9D0]',
          numberColor: 'text-white',
          textColor: 'text-white/65',
          badgeColor: 'text-[#69C9D0]'
        };
      case 'twitter':
        return {
          bg: 'bg-[#080808]',
          border: 'border border-white/10 shadow-2xl',
          pseudoBorder: '',
          iconWrap: 'bg-[#161616] border border-white/5',
          iconGradient: '',
          iconColor: 'text-neutral-300',
          numberColor: 'text-white',
          textColor: 'text-neutral-400',
          badgeColor: 'text-blue-400' // subtle cold blue accent
        };
      case 'facebook':
        return {
          bg: 'bg-[#050c1c]/95 backdrop-blur-md',
          border: 'border border-blue-500/20 shadow-[0_4px_20px_rgba(24,119,242,0.1)]',
          pseudoBorder: '',
          iconWrap: 'bg-blue-600 border border-blue-400/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]',
          iconGradient: '',
          iconColor: 'text-white',
          numberColor: 'text-white',
          textColor: 'text-blue-100/70',
          badgeColor: 'text-blue-300'
        };
    }
  };

  const getMetricConfig = () => {
    switch (type) {
      case 'followers':
        return {
          icon: platform === 'twitter' || platform === 'facebook' ? UserPlus : Users,
          label: "New Followers",
          badge: platform === 'facebook' ? 'this week' : 'right now',
          prefix: '+'
        };
      case 'likes':
        return {
          icon: platform === 'facebook' ? ThumbsUp : Heart,
          label: platform === 'facebook' ? "New Likes" : "Likes",
          badge: platform === 'facebook' ? 'on your page' : platform === 'tiktok' ? 'on your videos' : 'on your posts',
          prefix: '+'
        };
      case 'views':
        return {
          icon: Play,
          label: "New Views",
          badge: "right now",
          prefix: '+'
        };
      case 'reposts':
        return {
          icon: Repeat2,
          label: "Reposts",
          badge: "on your post",
          prefix: '+'
        };
      case 'status':
        return {
          icon: platform === 'twitter' ? ShieldCheck : platform === 'tiktok' ? Activity : platform === 'facebook' ? TrendingUp : CheckCircle2,
          label: platform === 'facebook' ? '100% effective' : platform === 'twitter' ? '100% secure' : platform === 'tiktok' ? 'Results guaranteed' : '100% guaranteed',
          title: platform === 'facebook' ? 'Boost active!' : platform === 'twitter' ? 'Campaign active!' : platform === 'tiktok' ? 'Promotion active!' : 'Delivery complete!',
          badge: platform === 'instagram' ? 'DELIVERED' : 'ACTIVE',
          prefix: ''
        };
    }
  };

  const pConfig = getPlatformConfig();
  const mConfig = getMetricConfig();
  const Icon = mConfig.icon;

  const getPulseEffect = () => {
    if (!pulse) return '';
    if (type === 'reposts') return 'translate-x-[2px]';
    return 'scale-[1.15]';
  };

  return (
    <div className={cn(
      "absolute w-[200px] md:w-[220px] rounded-2xl p-3 flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
      posClasses[position],
      floatAnim[position],
      pConfig.bg,
      pConfig.border,
      pConfig.pseudoBorder,
      mounted ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-2 scale-[0.94] blur-[2px]"
    )}>
      
      {/* Icon Container */}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative", pConfig.iconWrap)}>
        {pConfig.iconGradient && <div className={pConfig.iconGradient} />}
        <Icon className={cn("w-5 h-5 relative z-10 transition-transform duration-300", pConfig.iconColor, getPulseEffect())} />
        
        {/* Temporary Reaction Particle */}
        {particle && (type === 'likes' || type === 'views') && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] animate-[slide-up-fade_800ms_ease-out_forwards]">
            {type === 'likes' && platform === 'facebook' ? 'ðŸ‘' : type === 'likes' ? 'â¤ï¸' : 'âœ¨'}
          </div>
        )}
      </div>

      {/* Text Container */}
      <div className="flex-1 min-w-0">
        {type === 'status' ? (
          <>
            <div className={cn("font-bold text-[13px] md:text-sm truncate", pConfig.numberColor)}>{mConfig.title}</div>
            <div className={cn("text-[11px] md:text-xs font-medium", pConfig.textColor)}>{mConfig.label}</div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <div className={cn("font-bold text-base md:text-lg tabular-nums tracking-tight", pConfig.numberColor)}>
                {mConfig.prefix}{(count).toLocaleString('en-US')}
              </div>
              <span className={cn("text-[10px] font-bold opacity-80", pConfig.badgeColor)}>â†‘</span>
            </div>
            <div className={cn("text-[12px] font-semibold tracking-tight -mt-0.5", pConfig.textColor)}>{mConfig.label}</div>
            <div className={cn("text-[9px] md:text-[10px] font-bold tracking-wider mt-0.5 uppercase", pConfig.badgeColor)}>
              {platform === 'tiktok' || platform === 'twitter' ? `â— ${mConfig.badge}` : mConfig.badge}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
