"use client";

import { useEffect, useState } from "react";
import { User, Heart, MessageCircle, BarChart3, Repeat2, Play, Users, CheckCircle2 } from "lucide-react";
import { FaInstagram, FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";

interface Props {
  platform: string;
}

export function SocialGrowthVisual({ platform }: Props) {
  // Configurações Dinâmicas por Plataforma (Tailwind classes + ícones + métricas base)
  const config = {
    instagram: {
      gradient: "from-pink-500/20 via-purple-500/10 to-orange-500/10",
      accent: "text-pink-500",
      bgAccent: "bg-pink-500",
      borderAccent: "border-pink-500",
      logo: FaInstagram,
      mockup: {
        avatarBg: "bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-500",
        stats: [
          { label: "posts", val: "48" },
          { label: "followers", val: "13.2K", highlight: true },
          { label: "following", val: "243" }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      cards: [
        { title: "+1,284", sub: "New Followers", small: "right now" },
        { title: "+347", sub: "Likes", small: "on your posts" },
        { title: "Delivery complete!", sub: "100% guaranteed", small: "safe" }
      ],
      bottom: { text: "Followers growing in real time", baseCount: 13242 }
    },
    tiktok: {
      gradient: "from-cyan-500/20 via-black to-pink-500/10",
      accent: "text-cyan-400",
      bgAccent: "bg-pink-600",
      borderAccent: "border-cyan-400",
      logo: FaTiktok,
      mockup: {
        avatarBg: "bg-gradient-to-tr from-cyan-400 to-pink-500",
        stats: [
          { label: "Following", val: "142" },
          { label: "Followers", val: "256K", highlight: true },
          { label: "Likes", val: "1.2M" }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      cards: [
        { title: "+3,782", sub: "New Views", small: "right now" },
        { title: "+1,247", sub: "New Likes", small: "on your videos" },
        { title: "Promotion active!", sub: "Results guaranteed", small: "safe" }
      ],
      bottom: { text: "Views increasing in real time", baseCount: 256782 }
    },
    twitter: {
      gradient: "from-neutral-600/20 to-neutral-900/10",
      accent: "text-neutral-300",
      bgAccent: "bg-neutral-100 text-black",
      borderAccent: "border-neutral-500",
      logo: FaTwitter,
      mockup: {
        avatarBg: "bg-neutral-800 border-2 border-black",
        stats: [
          { label: "Following", val: "452" },
          { label: "Followers", val: "8,742", highlight: true }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      cards: [
        { title: "+156", sub: "New Followers", small: "right now" },
        { title: "+89", sub: "Reposts", small: "on your post" },
        { title: "Campaign active!", sub: "100% secure", small: "safe" }
      ],
      bottom: { text: "Followers growing in real time", baseCount: 8742 }
    },
    facebook: {
      gradient: "from-blue-500/20 to-blue-800/10",
      accent: "text-blue-500",
      bgAccent: "bg-blue-600",
      borderAccent: "border-blue-500",
      logo: FaFacebook,
      mockup: {
        avatarBg: "bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-white",
        stats: [
          { label: "followers", val: "17K", highlight: true },
          { label: "likes", val: "12K" }
        ],
        btn1: "+ Follow",
        btn2: "Message"
      },
      cards: [
        { title: "+312", sub: "New Followers", small: "this week" },
        { title: "+734", sub: "New Likes", small: "on your page" },
        { title: "Boost active!", sub: "100% effective", small: "safe" }
      ],
      bottom: { text: "Engagement growing in real time", baseCount: 17832 }
    }
  };

  const current = config[platform as keyof typeof config] || config.instagram;
  const Logo = current.logo;

  // Lógica do Contador pseudo-aleatório
  const [count, setCount] = useState(current.bottom.baseCount);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const tick = () => {
      // Adiciona de 2 a 8 
      const increment = Math.floor(Math.random() * 7) + 2;
      setCount(prev => prev + increment);
      
      // Aumenta a barra levemente até 98% e reseta
      setProgress(prev => prev > 95 ? 10 : prev + (Math.random() * 2));
      
      // Tempo de espera pseudo-aleatório (entre 1s e 3s)
      const nextTick = Math.floor(Math.random() * 2000) + 1000;
      timeout = setTimeout(tick, nextTick);
    };

    timeout = setTimeout(tick, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative w-full max-w-[800px] mx-auto min-h-[450px] md:min-h-[520px] flex items-center justify-center my-12 overflow-hidden px-2 py-8">
      
      {/* Glow / Gradient de Fundo */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-[100px] bg-gradient-to-r ${current.gradient} opacity-50 md:opacity-70 pointer-events-none -z-10`} />

      {/* Partículas flutuantes discretas (ícones) */}
      <div className="absolute top-[10%] left-[20%] text-white/20 animate-[float_4s_ease-in-out_infinite_alternate]"><Heart size={20} /></div>
      <div className="absolute bottom-[25%] right-[18%] text-white/10 animate-[float_5s_ease-in-out_infinite_alternate-reverse]"><User size={24} /></div>
      {platform === 'tiktok' && <div className="absolute top-[30%] right-[25%] text-white/15 animate-[float_6s_ease-in-out_infinite_alternate]"><Play size={18} /></div>}
      {platform === 'twitter' && <div className="absolute top-[40%] right-[15%] text-white/15 animate-[float_6s_ease-in-out_infinite_alternate]"><Repeat2 size={22} /></div>}

      <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
        
        {/* Smartphone Central */}
        <div className="relative w-[280px] md:w-[310px] h-[550px] md:h-[600px] bg-[#0A0A0A] rounded-[45px] border-[6px] border-[#1f1f1f] shadow-2xl flex-shrink-0 animate-[float_6s_ease-in-out_infinite_alternate] z-20 overflow-hidden ring-1 ring-white/10">
          {/* Notch/Camera */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-[#1f1f1f] rounded-full z-30" />
          
          {/* Interface Interna Simulação */}
          <div className="w-full h-full pt-10 px-4 pb-4 flex flex-col items-center">
            
            {/* Header Platform */}
            <div className="flex justify-between items-center w-full mb-6">
              <span className="text-white/40 text-xs font-semibold">9:41</span>
              <Logo className="text-white/80 h-5 w-5" />
              <span className="text-white/40 text-xs font-semibold">📶 🔋</span>
            </div>

            {/* Profile Pic */}
            <div className={`w-20 h-20 rounded-full ${current.mockup.avatarBg} p-1 mb-3`}>
              <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center border-2 border-black">
                <User className="text-white/50 w-8 h-8" />
              </div>
            </div>

            <h3 className="text-white font-bold text-lg">@yourbrand</h3>
            <p className="text-white/50 text-xs mb-6">Digital Creator • Building audience 🚀</p>

            {/* Stats */}
            <div className="flex justify-around w-full px-2 mb-6 border-y border-white/5 py-3">
              {current.mockup.stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className={`font-bold text-sm ${stat.highlight ? current.accent : 'text-white'}`}>{stat.val}</span>
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full mb-6">
              <button className={`flex-1 ${current.bgAccent} ${platform === 'twitter' ? 'text-black' : 'text-white'} font-bold text-xs py-2 rounded-md`}>{current.mockup.btn1}</button>
              <button className="flex-1 bg-white/10 text-white font-bold text-xs py-2 rounded-md">{current.mockup.btn2}</button>
            </div>

            {/* Faux Grid */}
            <div className="grid grid-cols-3 gap-1 w-full flex-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-sm aspect-square flex items-center justify-center">
                   {platform === 'tiktok' ? <Play className="w-4 h-4 text-white/20" /> : <div className="w-full h-full bg-white/5" />}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Cards Flutuantes (Responsivos) */}
        
        {/* Card 1: Top Left na frente ou acima no mobile */}
        <div className="absolute top-[5%] md:top-[15%] left-1/2 md:left-[10%] -translate-x-1/2 md:-translate-x-0 w-[220px] bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 z-30 animate-[float_5s_ease-in-out_infinite_alternate-reverse] delay-100">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border ${current.borderAccent}`}>
            <Users className={`w-5 h-5 ${current.accent}`} />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{current.cards[0].title}</div>
            <div className="text-white/60 text-xs">{current.cards[0].sub}</div>
            <div className={`text-[10px] uppercase font-bold mt-0.5 ${current.accent}`}>{current.cards[0].small}</div>
          </div>
        </div>

        {/* Card 2: Right middle */}
        <div className="absolute top-[25%] md:top-[40%] right-[-10px] md:right-[10%] w-[190px] md:w-[220px] bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 z-30 animate-[float_4.5s_ease-in-out_infinite_alternate] delay-300">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border ${current.borderAccent}`}>
            <Heart className={`w-5 h-5 ${current.accent}`} />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{current.cards[1].title}</div>
            <div className="text-white/60 text-xs">{current.cards[1].sub}</div>
            <div className={`text-[10px] uppercase font-bold mt-0.5 ${current.accent}`}>{current.cards[1].small}</div>
          </div>
        </div>

        {/* Card 3: Bottom left */}
        <div className="hidden md:flex absolute bottom-[25%] left-[5%] w-[220px] bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl items-center gap-3 z-30 animate-[float_6s_ease-in-out_infinite_alternate] delay-500">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-emerald-500/50`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{current.cards[2].title}</div>
            <div className="text-white/60 text-xs">{current.cards[2].sub}</div>
          </div>
        </div>

      </div>

      {/* Barra Inferior (Live Counter) */}
      <div className="absolute bottom-[-10px] md:bottom-2 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-40">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className={`w-4 h-4 ${current.accent}`} />
            <span className="text-white text-xs font-semibold">{current.bottom.text}</span>
          </div>
          <span className="text-white font-bold text-sm tabular-nums">
            {count.toLocaleString()} <span className="text-emerald-400 text-xs ml-1">↑</span>
          </span>
        </div>
        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${current.bgAccent} transition-all duration-700 ease-out`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
      
    </div>
  );
}
