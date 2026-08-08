"use client";

import { useEffect, useState } from "react";
import { User, Heart, MessageCircle, BarChart3, Repeat2, Play, Users, CheckCircle2 } from "lucide-react";
import { FaInstagram, FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";

interface Props {
  platform: string;
}

export function SocialGrowthVisual({ platform }: Props) {
  // Configs
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

  const [count, setCount] = useState(current.bottom.baseCount);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const tick = () => {
      const increment = Math.floor(Math.random() * 7) + 2;
      setCount(prev => prev + increment);
      
      setProgress(prev => prev > 95 ? 10 : prev + (Math.random() * 2));
      
      const nextTick = Math.floor(Math.random() * 2000) + 1000;
      timeout = setTimeout(tick, nextTick);
    };

    timeout = setTimeout(tick, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Telas internas por plataforma
  const renderPhoneScreen = () => {
    if (platform === 'twitter') {
      return (
        <div className="w-full h-full flex flex-col relative text-white bg-black">
          {/* Twitter Cover */}
          <div className="h-[80px] bg-gradient-to-r from-neutral-800 to-neutral-700 w-full relative">
            <div className="absolute top-4 left-4"><ArrowRight className="w-5 h-5 text-white rotate-180" /></div>
          </div>
          
          {/* Avatar and Profile */}
          <div className="px-4 relative pb-4 border-b border-white/10">
            <div className={`w-[68px] h-[68px] rounded-full ${current.mockup.avatarBg} -mt-8 mb-2 flex items-center justify-center`}>
               <User className="text-white/50 w-8 h-8" />
            </div>
            <button className="absolute top-3 right-4 bg-white text-black font-bold text-xs px-4 py-1.5 rounded-full">Follow</button>
            <h3 className="text-white font-bold text-lg leading-tight flex items-center gap-1">Your Brand <CheckCircle2 className="w-4 h-4 text-white fill-blue-500" /></h3>
            <p className="text-white/50 text-sm mb-3">@yourbrand</p>
            <p className="text-white/90 text-xs mb-3 leading-relaxed">Digital Creator & Growth Expert<br/>Helping you grow on X.<br/>Real engagement. Real results.</p>
            
            <div className="flex gap-4 text-xs">
              <div className="text-white/50"><span className="text-white font-bold">452</span> Following</div>
              <div className="text-white/50"><span className="text-white font-bold">8,742</span> Followers</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 px-4">
            <div className="flex-1 py-3 text-center border-b-2 border-blue-500 font-bold text-sm">Posts</div>
            <div className="flex-1 py-3 text-center text-white/50 font-medium text-sm">Replies</div>
            <div className="flex-1 py-3 text-center text-white/50 font-medium text-sm">Media</div>
          </div>

          {/* Feed Mockup */}
          <div className="flex-1 overflow-hidden px-4 pt-4 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-1">
                  <span className="font-bold">Your Brand</span>
                  <span className="text-white/50">@yourbrand • 2h</span>
                </div>
                <p className="text-xs mb-2">Content that connects.<br/>Growth that lasts. 🚀</p>
                <div className="flex justify-between text-white/50 text-[10px]">
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 24</span>
                  <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> 67</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 248</span>
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> 12K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (platform === 'facebook') {
      return (
        <div className="w-full h-full flex flex-col relative text-black bg-[#f0f2f5]">
          {/* FB Cover */}
          <div className="h-[90px] bg-gradient-to-r from-blue-600 to-blue-400 w-full relative"></div>
          
          {/* Avatar and Profile */}
          <div className="bg-white px-4 relative pb-4 border-b border-gray-300 flex flex-col items-center shadow-sm z-10">
            <div className={`w-[80px] h-[80px] rounded-full ${current.mockup.avatarBg} -mt-10 mb-2 flex items-center justify-center`}>
               <User className="text-white/70 w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl leading-tight flex items-center gap-1">Your Brand <CheckCircle2 className="w-4 h-4 text-white fill-blue-500" /></h3>
            <p className="text-gray-500 text-xs mb-4">Page • Digital Creator</p>
            
            <div className="flex gap-3 text-sm font-bold text-gray-700 mb-4">
              <div>17K <span className="font-normal text-gray-500">Likes</span></div>
              <div>18K <span className="font-normal text-gray-500">Followers</span></div>
            </div>

            <div className="flex gap-2 w-full">
              <button className="flex-1 bg-blue-600 text-white font-bold text-sm py-2 rounded-md flex items-center justify-center gap-1"><Heart className="w-4 h-4 fill-white" /> Like</button>
              <button className="flex-1 bg-gray-200 text-black font-semibold text-sm py-2 rounded-md flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4" /> Message</button>
              <button className="bg-gray-200 text-black font-bold text-sm px-3 rounded-md">...</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border-b border-gray-300 px-2 mb-2 shadow-sm">
            <div className="flex-1 py-3 text-center border-b-2 border-blue-600 text-blue-600 font-bold text-xs">Home</div>
            <div className="flex-1 py-3 text-center text-gray-500 font-bold text-xs">About</div>
            <div className="flex-1 py-3 text-center text-gray-500 font-bold text-xs">Photos</div>
            <div className="flex-1 py-3 text-center text-gray-500 font-bold text-xs">Videos</div>
          </div>

          {/* Feed Mockup */}
          <div className="flex-1 overflow-hidden px-2 flex flex-col gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex-shrink-0" />
                <div>
                  <div className="font-bold text-xs">Your Brand</div>
                  <div className="text-gray-500 text-[10px]">2h • 🌐</div>
                </div>
              </div>
              <p className="text-xs mb-2 text-gray-800">We deliver real results.<br/>Grow your brand with us. 🚀</p>
              <div className="h-[100px] bg-gray-100 rounded-md border border-gray-200 mb-2"></div>
              <div className="flex justify-between items-center text-gray-500 text-[10px] pb-2 border-b border-gray-200 mb-2">
                <span className="flex items-center gap-1">👍 ❤️ 312</span>
                <span>47 Comments • 89 Shares</span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs font-bold px-2">
                <span>Like</span>
                <span>Comment</span>
                <span>Share</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (platform === 'tiktok') {
      return (
        <div className="w-full h-full flex flex-col relative text-white bg-black">
          <div className="flex justify-between items-center w-full px-4 pt-4 pb-2">
            <span className="text-white/80"><ArrowRight className="w-5 h-5 rotate-180" /></span>
            <span className="font-bold text-sm">@yourbrand</span>
            <span className="text-white/80"><Repeat2 className="w-5 h-5" /></span>
          </div>

          <div className="w-full px-4 pt-2 pb-4 flex flex-col items-center border-b border-white/10">
            <div className={`w-20 h-20 rounded-full ${current.mockup.avatarBg} p-0.5 mb-3`}>
              <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center border-2 border-black">
                <User className="text-white/50 w-8 h-8" />
              </div>
            </div>

            <h3 className="text-white font-bold text-base mb-3">@yourbrand</h3>

            <div className="flex justify-center gap-6 w-full mb-4">
              <div className="flex flex-col items-center">
                <span className="font-bold text-sm text-white">142</span>
                <span className="text-[10px] text-white/50">Following</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/20 px-6">
                <span className="font-bold text-sm text-white">256K</span>
                <span className="text-[10px] text-white/50">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-sm text-white">1.2M</span>
                <span className="text-[10px] text-white/50">Likes</span>
              </div>
            </div>

            <div className="flex gap-2 w-full mb-4 px-4">
              <button className="flex-1 bg-[#FE2C55] text-white font-bold text-sm py-2.5 rounded-sm">Follow</button>
              <button className="px-4 bg-white/10 text-white font-bold text-sm py-2.5 rounded-sm"><FaInstagram /></button>
              <button className="px-3 bg-white/10 text-white font-bold text-sm py-2.5 rounded-sm">▾</button>
            </div>

            <p className="text-white/80 text-xs text-center">Digital Creator<br/>Building audience 🚀<br/>Link in bio ↓</p>
          </div>

          <div className="flex border-b border-white/10">
            <div className="flex-1 py-3 flex justify-center border-b-2 border-white"><BarChart3 className="w-5 h-5 text-white" /></div>
            <div className="flex-1 py-3 flex justify-center"><Heart className="w-5 h-5 text-white/40" /></div>
            <div className="flex-1 py-3 flex justify-center"><ShieldCheck className="w-5 h-5 text-white/40" /></div>
          </div>

          <div className="grid grid-cols-3 gap-0.5 w-full flex-1 overflow-hidden">
            {[25.7, 18.6, 32.1, 14.2, 27.3, 21.8].map((v, i) => (
              <div key={i} className="bg-neutral-900 aspect-[3/4] relative flex items-end p-1.5 border border-white/5">
                <div className="text-white font-bold text-[10px] flex items-center gap-1"><Play className="w-3 h-3" /> {v}K</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default: Instagram
    return (
      <div className="w-full h-full flex flex-col relative text-white bg-black">
        <div className="flex justify-between items-center w-full px-4 pt-4 pb-2">
          <span className="font-bold text-sm flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> yourbrand</span>
          <span className="text-white/80"><BarChart3 className="w-5 h-5" /></span>
        </div>

        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className={`w-20 h-20 rounded-full ${current.mockup.avatarBg} p-1`}>
            <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center border-2 border-black">
              <User className="text-white/50 w-8 h-8" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-white">48</span>
              <span className="text-[10px] text-white/70">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-white">13.2K</span>
              <span className="text-[10px] text-white/70">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-white">243</span>
              <span className="text-[10px] text-white/70">Following</span>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <h3 className="text-white font-bold text-sm">Your Brand ✨</h3>
          <p className="text-white/80 text-xs mt-0.5">Digital Creator<br/>Helping brands grow online 🚀<br/>Link in bio ↓</p>
        </div>

        <div className="flex gap-2 w-full px-4 mb-4">
          <button className="flex-1 bg-blue-500 text-white font-bold text-xs py-2 rounded-md">Follow</button>
          <button className="flex-1 bg-neutral-800 text-white font-bold text-xs py-2 rounded-md">Message</button>
          <button className="bg-neutral-800 text-white font-bold text-xs px-3 rounded-md">▾</button>
        </div>

        {/* Story Highlights */}
        <div className="flex gap-4 px-4 overflow-hidden mb-4">
          {['Results', 'Growth', 'Packages', 'Reviews', 'FAQ'].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full border border-neutral-700 p-0.5">
                <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center">
                   <Star className="w-4 h-4 text-white/30" />
                </div>
              </div>
              <span className="text-[9px] text-white/80">{h}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/10">
          <div className="flex-1 py-3 flex justify-center border-t-2 border-white -mt-[1px]"><BarChart3 className="w-5 h-5 text-white" /></div>
          <div className="flex-1 py-3 flex justify-center"><Play className="w-5 h-5 text-white/40" /></div>
          <div className="flex-1 py-3 flex justify-center"><User className="w-5 h-5 text-white/40" /></div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-0.5 w-full flex-1 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-900 aspect-square relative flex items-center justify-center border border-white/5">
               {i === 0 && <span className="absolute bottom-1 right-1 text-[10px] text-white font-bold bg-black/50 px-1 rounded flex items-center gap-1"><Heart className="w-2 h-2" /> 2.1K</span>}
               {i === 1 && <span className="absolute bottom-1 right-1 text-[10px] text-white font-bold bg-black/50 px-1 rounded flex items-center gap-1"><Heart className="w-2 h-2" /> 3.2K</span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[850px] mx-auto min-h-[450px] md:min-h-[520px] flex items-center justify-center my-6 overflow-visible px-2 py-8">
      
      {/* Glow / Gradient de Fundo */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-[100px] bg-gradient-to-r ${current.gradient} opacity-50 md:opacity-70 pointer-events-none -z-10`} />

      {/* Partículas flutuantes discretas */}
      <div className="hidden md:block absolute top-[10%] left-[20%] text-white/20 animate-float"><Heart size={20} /></div>
      <div className="hidden md:block absolute bottom-[25%] right-[18%] text-white/10 animate-[float_5s_ease-in-out_infinite_alternate-reverse]"><User size={24} /></div>
      {platform === 'tiktok' && <div className="hidden md:block absolute top-[30%] right-[25%] text-white/15 animate-float"><Play size={18} /></div>}
      {platform === 'twitter' && <div className="hidden md:block absolute top-[40%] right-[15%] text-white/15 animate-float"><Repeat2 size={22} /></div>}

      <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
        
        {/* Smartphone Central */}
        <div className="relative w-[280px] md:w-[320px] h-[580px] md:h-[620px] bg-black rounded-[45px] border-[8px] border-[#161616] shadow-2xl flex-shrink-0 animate-float z-20 overflow-hidden ring-1 ring-white/10">
          {/* Notch/Speaker */}
          {platform !== 'twitter' && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[60px] h-[15px] bg-[#161616] rounded-full z-30 shadow-[inset_0_0_2px_rgba(255,255,255,0.1)]" />}
          
          {/* Interface Interna */}
          {renderPhoneScreen()}
        </div>

        {/* Cards Flutuantes (Responsivos) */}
        
        {/* Card 1: Top Left */}
        <div className="absolute top-[2%] md:top-[12%] left-1/2 md:left-[5%] -translate-x-1/2 md:-translate-x-0 w-[200px] md:w-[220px] bg-black/70 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 z-30 animate-[float_5s_ease-in-out_infinite_alternate-reverse] delay-100">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border ${current.borderAccent}`}>
            <Users className={`w-5 h-5 ${current.accent}`} />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{current.cards[0].title}</div>
            <div className="text-white/60 text-[11px]">{current.cards[0].sub}</div>
            <div className={`text-[9px] uppercase font-bold mt-0.5 ${current.accent}`}>{current.cards[0].small}</div>
          </div>
        </div>

        {/* Card 2: Right middle */}
        <div className="absolute top-[25%] md:top-[35%] right-[-10px] md:right-[5%] w-[190px] md:w-[220px] bg-black/70 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 z-30 animate-[float_4.5s_ease-in-out_infinite_alternate] delay-300">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border ${current.borderAccent}`}>
            <Heart className={`w-5 h-5 ${current.accent}`} />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{current.cards[1].title}</div>
            <div className="text-white/60 text-[11px]">{current.cards[1].sub}</div>
            <div className={`text-[9px] uppercase font-bold mt-0.5 ${current.accent}`}>{current.cards[1].small}</div>
          </div>
        </div>

        {/* Card 3: Bottom left */}
        <div className="hidden md:flex absolute bottom-[25%] left-[2%] w-[220px] bg-black/70 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl items-center gap-3 z-30 animate-[float_6s_ease-in-out_infinite_alternate] delay-500">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-emerald-500/50`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{current.cards[2].title}</div>
            <div className="text-white/60 text-[11px]">{current.cards[2].sub}</div>
          </div>
        </div>

      </div>

      {/* Barra Inferior (Live Counter) */}
      <div className="absolute bottom-[-10px] md:bottom-2 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl z-40">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className={`w-4 h-4 ${current.accent}`} />
            <span className="text-white text-xs font-semibold">{current.bottom.text}</span>
          </div>
          <span className="text-white font-bold text-sm tabular-nums flex items-center gap-1">
            {count.toLocaleString()} <span className="text-emerald-400 text-[10px] px-1 bg-emerald-500/10 rounded font-bold">+284</span>
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
