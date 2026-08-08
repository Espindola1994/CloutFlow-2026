"use client";

import { useEffect, useState } from "react";
import { UserPlus, Heart, CheckCircle, Play, Eye, Repeat2, Users, ThumbsUp, TrendingUp, ShieldCheck, Activity, CheckCircle2, ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingNotificationProps {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'facebook';
  type: 'followers' | 'likes' | 'status' | 'views' | 'reposts';
  position: 'top-left' | 'middle-right' | 'bottom-left';
  initialCount?: number;
}

export function FloatingNotification({ platform, type, position, initialCount = 124 }: FloatingNotificationProps) {
  const [count, setCount] = useState(0); // Mudança Principal: Iniciar as animações de todos em 0!
  const [pulse, setPulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particle, setParticle] = useState(false);

  // Position configurations - SHARED EXTREMELY STRICT FACEBOOK TEMPLATE
  // These absolute coordinates apply perfectly over the master Absolute wrapper container.
  const posClasses = {
    'top-left': 'top-[16%] left-[6%] md:top-[18%] md:left-[10%] z-30',
    'middle-right': 'top-[42%] right-[4%] md:top-[44%] md:right-[6%] z-30',
    'bottom-left': 'bottom-[15%] left-[5%] md:bottom-[20%] md:left-[8%] z-30'
  };

  // Organic floating animations wrapper class logic. Kept structurally the same for all.
  const floatAnim = {
    'top-left': 'animate-[float_5.8s_ease-in-out_infinite_alternate-reverse]',
    'middle-right': 'animate-[float_6.7s_ease-in-out_infinite_alternate]',
    'bottom-left': 'animate-[float_7.4s_ease-in-out_infinite_alternate]'
  };

  useEffect(() => {
    // IntersecionObserver simulation
    let mountDelay = 150;
    if (position === 'middle-right') mountDelay = 300;
    if (position === 'bottom-left') mountDelay = 450;
    
    const mountTimer = setTimeout(() => {
      setMounted(true);
      
      // NOVA LÓGICA DE CONTAGEM SOLICITADA (Subida do Zero contínua e desacelerada)
      if (type !== 'status') {
        let startTime: number;
        const duration = 5500; // 5.5s cravado
        const target = initialCount;
        
        const animateCount = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          
          if (elapsed < duration) {
            // Curva ease-out 
            const t = elapsed / duration;
            const progress = 1 - Math.pow(1 - t, 3);
            
            // Não piscar o botão excessivamente na subida super rápida, apenas quando ficar lento
            const currentValue = Math.floor(progress * target);
            setCount(currentValue);
            
            if (elapsed > duration * 0.7 && Math.random() > 0.8) {
               setPulse(true);
               setTimeout(() => setPulse(false), 200);
               
               if ((type === 'likes' || type === 'views') && Math.random() > 0.85) {
                 setParticle(true);
                 setTimeout(() => setParticle(false), 800);
               }
            }
            
            requestAnimationFrame(animateCount);
          } else {
            // Cava no Target Máximo no final
            setCount(target);
            setPulse(true);
            setTimeout(() => setPulse(false), 400);
            if (type === 'likes' || type === 'views') {
                 setParticle(true);
                 setTimeout(() => setParticle(false), 800);
            }
          }
        };
        requestAnimationFrame(animateCount);
      }
    }, mountDelay);

    return () => {
      clearTimeout(mountTimer);
    };
  }, [type, position, initialCount, platform]);

  // Unified visual architectural model based off Facebook's dark UI block approach.
  const getPlatformConfig = () => {
    switch (platform) {
      case 'facebook':
        return {
          bg: 'bg-[#050c1c]/92 backdrop-blur-md',
          border: 'border border-blue-500/20 shadow-[0_4px_20px_rgba(24,119,242,0.1)]',
          pseudoBorder: '',
          iconWrap: 'bg-blue-600 border border-blue-400/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]',
          iconGradient: '',
          iconColor: 'text-white',
          numberColor: 'text-white',
          textColor: 'text-blue-100/70',
          badgeColor: 'text-blue-300'
        };
      case 'instagram':
        // PERFECT COPY of Facebook's structure but keeping the Instagram accenting context
        return {
          bg: 'bg-[#0a0a0a]/92 backdrop-blur-md',
          border: 'border border-[#222] shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
          pseudoBorder: '',
          iconWrap: 'bg-[#111] border border-pink-500/30 relative overflow-hidden',
          iconGradient: 'absolute inset-0 bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 opacity-30',
          iconColor: 'text-white',
          numberColor: 'text-white',
          textColor: 'text-white/70',
          badgeColor: 'text-pink-400'
        };
      case 'tiktok':
        return {
          bg: 'bg-[#070707]/95 backdrop-blur-md',
          border: 'border border-[#222] shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
          pseudoBorder: 'shadow-[-1px_0_4px_rgba(105,201,208,0.15),1px_0_4px_rgba(254,44,85,0.15)]',
          iconWrap: 'bg-[#111] border border-[#333] shadow-[-1px_1px_3px_rgba(105,201,208,0.2),1px_-1px_3px_rgba(254,44,85,0.2)]',
          iconGradient: '',
          iconColor: type === 'likes' ? 'text-pink-500' : 'text-cyan-400',
          numberColor: 'text-white',
          textColor: 'text-white/65',
          badgeColor: 'text-cyan-400'
        };
      case 'twitter':
        return {
          bg: 'bg-[#050505]',
          border: 'border border-white/10 shadow-2xl',
          pseudoBorder: '',
          iconWrap: 'bg-[#1a1a1a] border border-white/5',
          iconGradient: '',
          iconColor: 'text-white',
          numberColor: 'text-white',
          textColor: 'text-neutral-400',
          badgeColor: 'text-blue-400'
        };
    }
  };

  const getMetricConfig = () => {
    switch (type) {
      case 'followers':
        return {
          icon: platform === 'twitter' || platform === 'facebook' ? UserPlus : Users,
          label: "New Followers",
          badge: platform === 'facebook' ? 'THIS WEEK' : 'RIGHT NOW',
          prefix: '+'
        };
      case 'likes':
        return {
          icon: platform === 'facebook' ? ThumbsUp : Heart,
          label: platform === 'facebook' ? "New Likes" : "Likes",
          badge: platform === 'facebook' ? 'ON YOUR PAGE' : platform === 'tiktok' ? 'ON YOUR VIDEOS' : 'ON YOUR POSTS',
          prefix: '+'
        };
      case 'views':
        return {
          icon: Play,
          label: "New Views",
          badge: "RIGHT NOW",
          prefix: '+'
        };
      case 'reposts':
        return {
          icon: Repeat2,
          label: "Reposts",
          badge: "ON YOUR POST",
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
    return 'scale-[1.12]';
  };

  return (
    <div className={cn(
      "absolute w-[160px] md:w-[200px] rounded-[16px] p-2.5 md:p-3 flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
      posClasses[position],
      floatAnim[position],
      pConfig.bg,
      pConfig.border,
      pConfig.pseudoBorder,
      mounted ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-2 scale-[0.96] blur-[2px]"
    )}>
      
      {/* Icon Container - Exact identical scale logic to Facebook baseline */}
      <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 relative", pConfig.iconWrap)}>
        {pConfig.iconGradient && <div className={pConfig.iconGradient} />}
        <Icon className={cn("w-4 h-4 md:w-[18px] md:h-[18px] relative z-10 transition-transform duration-250", pConfig.iconColor, getPulseEffect())} />
        
        {/* Temporary Reaction Particle (SVG only) */}
        {particle && (type === 'likes' || type === 'views') && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] animate-[slide-up-fade_800ms_ease-out_forwards]">
            {type === 'likes' && platform === 'facebook' ? <ThumbsUp className="w-3 h-3 text-blue-500 fill-blue-500" /> : type === 'likes' ? <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> : <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
          </div>
        )}
      </div>

      {/* Text Container */}
      <div className="flex-1 min-w-0">
        {type === 'status' ? (
          <>
            <div className={cn("font-bold text-[12px] md:text-[14px] leading-tight whitespace-nowrap overflow-visible", pConfig.numberColor)}>{mConfig.title}</div>
            <div className={cn("text-[10px] md:text-[11px] font-medium mt-0.5 whitespace-nowrap", pConfig.textColor)}>{mConfig.label}</div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <div className={cn("font-bold text-[15px] md:text-[17px] tabular-nums tracking-tight leading-none font-variant-numeric", pConfig.numberColor)} style={{ fontVariantNumeric: "tabular-nums" }}>
                {mConfig.prefix}{(count).toLocaleString('en-US')}
              </div>
              <ArrowUpRight className={cn("w-2.5 h-2.5 md:w-3 md:h-3 stroke-[3] ml-1", pConfig.badgeColor)} />
            </div>
            <div className={cn("text-[10px] md:text-[11px] font-semibold tracking-tight mt-1 leading-none", pConfig.textColor)}>{mConfig.label}</div>
            <div className={cn("text-[8px] md:text-[9px] font-bold tracking-wider mt-1 uppercase", pConfig.badgeColor)}>
              {mConfig.badge}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
