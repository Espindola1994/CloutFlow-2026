"use client";

import { useEffect, useState } from "react";
import { User, Heart, MessageCircle, BarChart3, Repeat2, Play, CheckCircle2, Star, ArrowRight, ArrowLeft, ShieldCheck, ArrowUpRight } from "lucide-react";
import { FaInstagram, FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FloatingNotification } from "./floating-notification";
import { cn } from "@/lib/utils";

interface Props {
  platform: string;
}

export function SocialGrowthVisual({ platform }: Props) {
  // Cast platform to specific types for safety
  const platformType = (['instagram', 'tiktok', 'twitter', 'facebook'].includes(platform) ? platform : 'instagram') as 'instagram' | 'tiktok' | 'twitter' | 'facebook';

  // Configs
  const config = {
    instagram: {
      gradient: "from-pink-500/20 via-purple-500/10 to-orange-500/10",
      accent: "text-pink-500",
      bgAccent: "bg-pink-500",
      logo: FaInstagram,
      mockup: {
        avatarBg: "bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-500",
        stats: [
          { label: "Posts", val: "48" },
          { label: "Followers", val: "13.2K", highlight: true },
          { label: "Following", val: "243" }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      bottom: { text: "Followers growing in real time", baseCount: 13242, icon: BarChart3 }
    },
    tiktok: {
      gradient: "from-cyan-500/20 via-black to-pink-500/10",
      accent: "text-cyan-400",
      bgAccent: "bg-pink-600",
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
      bottom: { text: "Views increasing in real time", baseCount: 256782, icon: Play }
    },
    twitter: {
      gradient: "from-neutral-600/20 to-neutral-900/10",
      accent: "text-neutral-300",
      bgAccent: "bg-neutral-100 text-black",
      logo: FaXTwitter,
      mockup: {
        avatarBg: "bg-neutral-800 border-2 border-black",
        stats: [
          { label: "Following", val: "452" },
          { label: "Followers", val: "8,742", highlight: true }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      bottom: { text: "Followers growing in real time", baseCount: 8742, icon: User }
    },
    facebook: {
      gradient: "from-blue-500/20 to-blue-800/10",
      accent: "text-blue-500",
      bgAccent: "bg-blue-600",
      logo: FaFacebook,
      mockup: {
        avatarBg: "bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-white",
        stats: [
          { label: "Likes", val: "17K", highlight: true },
          { label: "Followers", val: "18K" }
        ],
        btn1: "+ Follow",
        btn2: "Message"
      },
      bottom: { text: "Engagement growing in real time", baseCount: 17832, icon: BarChart3 }
    }
  };

  const current = config[platformType];
  const Logo = current.logo;
  const BottomIcon = current.bottom.icon;

  const [count, setCount] = useState(current.bottom.baseCount);
  const [progress, setProgress] = useState(48);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const tick = () => {
      const increment = Math.floor(Math.random() * 5) + 1;
      setCount(prev => prev + increment);
      
      setProgress(prev => {
        if (prev > 75) return prev - (Math.random() * 10);
        return prev + (Math.random() * 5);
      });
      
      const nextTick = Math.floor(Math.random() * 2000) + 1500;
      timeout = setTimeout(tick, nextTick);
    };

    timeout = setTimeout(tick, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const renderPhoneScreen = () => {
    if (platform === 'twitter') {
      return (
        <div className="w-full h-full flex flex-col relative text-white bg-black">
          <div className="h-[80px] bg-gradient-to-r from-neutral-800 to-neutral-700 w-full relative">
            <div className="absolute top-4 left-4"><ArrowLeft className="w-5 h-5 text-white" /></div>
          </div>
          
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

          <div className="flex border-b border-white/10 px-4">
            <div className="flex-1 py-3 text-center border-b-2 border-blue-500 font-bold text-sm">Posts</div>
            <div className="flex-1 py-3 text-center text-white/50 font-medium text-sm">Replies</div>
            <div className="flex-1 py-3 text-center text-white/50 font-medium text-sm">Media</div>
          </div>

          <div className="flex-1 overflow-hidden px-4 pt-4 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-1">
                  <span className="font-bold">Your Brand</span>
                  <span className="text-white/50">@yourbrand - 2h</span>
                </div>
                <p className="text-xs mb-2">Content that connects.<br/>Growth that lasts.</p>
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
          <div className="h-[90px] bg-gradient-to-r from-blue-600 to-blue-400 w-full relative"></div>
          
          <div className="bg-white px-4 relative pb-4 border-b border-gray-300 flex flex-col items-center shadow-sm z-10">
            <div className={`w-[80px] h-[80px] rounded-full ${current.mockup.avatarBg} -mt-10 mb-2 flex items-center justify-center`}>
               <User className="text-white/70 w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl leading-tight flex items-center gap-1">Your Brand <CheckCircle2 className="w-4 h-4 text-white fill-blue-500" /></h3>
            <p className="text-gray-500 text-xs mb-4">Page - Digital Creator</p>
            
            <div className="flex gap-3 text-sm font-bold text-gray-700 mb-4">
              <div>17K <span className="font-normal text-gray-500">Likes</span></div>
              <div>18K <span className="font-normal text-gray-500">Followers</span></div>
            </div>

            <div className="flex gap-2 w-full">
              <button className="flex-1 bg-blue-600 text-white font-bold text-sm py-2 rounded-md flex items-center justify-center gap-1"><Heart className="w-4 h-4 fill-white" /> Like</button>
              <button className="flex-1 bg-gray-200 text-black font-semibold text-sm py-2 rounded-md flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4" /> Message</button>
            </div>
          </div>

          <div className="flex bg-white border-b border-gray-300 px-2 mb-2 shadow-sm">
            <div className="flex-1 py-3 text-center border-b-2 border-blue-600 text-blue-600 font-bold text-xs">Home</div>
            <div className="flex-1 py-3 text-center text-gray-500 font-bold text-xs">About</div>
            <div className="flex-1 py-3 text-center text-gray-500 font-bold text-xs">Photos</div>
            <div className="flex-1 py-3 text-center text-gray-500 font-bold text-xs">Videos</div>
          </div>

          <div className="flex-1 overflow-hidden px-2 flex flex-col gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex-shrink-0" />
                <div>
                  <div className="font-bold text-xs">Your Brand</div>
                  <div className="text-gray-500 text-[10px]">2h - Public</div>
                </div>
              </div>
              <p className="text-xs mb-2 text-gray-800">We deliver real results.<br/>Grow your brand with us.</p>
              <div className="h-[100px] bg-gray-100 rounded-md border border-gray-200 mb-2"></div>
              <div className="flex justify-between items-center text-gray-500 text-[10px] pb-2 border-b border-gray-200 mb-2">
                <span className="flex items-center gap-1">312 reactions</span>
                <span>47 comments - 89 shares</span>
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
            <span className="text-white/80"><ArrowLeft className="w-5 h-5" /></span>
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
            </div>

            <p className="text-white/80 text-xs text-center">Digital Creator<br/>Building your audience<br/>Link in bio</p>
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
          <h3 className="text-white font-bold text-sm">Your Brand</h3>
          <p className="text-white/80 text-xs mt-0.5">Digital Creator<br/>Helping brands grow online<br/>Link in bio</p>
        </div>

        <div className="flex gap-2 w-full px-4 mb-4">
          <button className="flex-1 bg-blue-500 text-white font-bold text-xs py-2 rounded-md">Follow</button>
          <button className="flex-1 bg-neutral-800 text-white font-bold text-xs py-2 rounded-md">Message</button>
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
      
      {/* Glow / Gradient de Fundo - Preservando efeito da plataforma */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-[100px] opacity-40 md:opacity-50 pointer-events-none -z-10",
        platformType === 'instagram' ? "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500" :
        platformType === 'tiktok' ? "bg-gradient-to-r from-cyan-500 via-black to-pink-500" :
        platformType === 'facebook' ? "bg-blue-600" :
        "bg-neutral-600"
      )} />

      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-6">
        
        {/* Smartphone Central Refinado */}
        <div className="relative w-[280px] md:w-[310px] h-[580px] md:h-[620px] bg-black rounded-[45px] border-[10px] border-[#111] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-shrink-0 animate-[float_7s_ease-in-out_infinite_alternate] z-20 overflow-hidden ring-1 ring-white/5">
          {/* Notch/Speaker */}
          {platform !== 'twitter' && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70px] h-[20px] bg-[#111] rounded-full z-30 shadow-[inset_0_-2px_4px_rgba(255,255,255,0.05)]" />}
          
          {/* Interface Interna Original Preservada */}
          {renderPhoneScreen()}
        </div>

        {/* Dynamic Floating Notifications */}
        <FloatingNotification 
          platform={platformType} 
          type="followers" 
          position="top-left" 
          initialCount={platformType === 'tiktok' ? 256782 : platformType === 'instagram' ? 13242 : platformType === 'twitter' ? 8742 : 17832} 
        />
        
        <FloatingNotification 
          platform={platformType} 
          type={platformType === 'tiktok' ? 'views' : platformType === 'twitter' ? 'reposts' : 'likes'} 
          position="middle-right" 
          initialCount={platformType === 'tiktok' ? 1421000 : platformType === 'instagram' ? 3241 : platformType === 'twitter' ? 67 : 12431}
        />
        
        <FloatingNotification 
          platform={platformType} 
          type="status" 
          position="bottom-left" 
        />

      </div>

      {/* Advanced Bottom Growth Bar */}
      <div className={cn(
        "absolute bottom-[-10px] md:bottom-2 left-1/2 -translate-x-1/2 w-[90%] md:w-[480px] backdrop-blur-xl border rounded-2xl p-4 shadow-2xl z-40 transition-all duration-300",
        platformType === 'instagram' ? "bg-[#110e15]/90 border-pink-500/20" :
        platformType === 'tiktok' ? "bg-[#0a0a0a]/90 border-cyan-500/20" :
        platformType === 'facebook' ? "bg-[#061022]/90 border-blue-500/20" :
        "bg-[#080808]/90 border-white/10"
      )}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <BottomIcon className={cn("w-4 h-4", current.accent)} />
            <span className="text-white/90 text-[13px] font-semibold">{current.bottom.text}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-sm tabular-nums">
              {count.toLocaleString('en-US')}
            </span>
            <ArrowUpRight className={cn("w-3 h-3 ml-1", platformType === 'facebook' ? 'text-blue-400' : platformType === 'twitter' ? 'text-neutral-400' : 'text-emerald-400')} />
          </div>
        </div>
        
        {/* Animated Progress Bar Customizada por Plataforma */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className={cn(
              "h-full transition-all duration-700 ease-in-out rounded-full relative",
              platformType === 'instagram' ? "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500" :
              platformType === 'tiktok' ? "bg-gradient-to-r from-cyan-400 to-pink-500" :
              platformType === 'facebook' ? "bg-gradient-to-r from-blue-500 to-blue-400" :
              "bg-gradient-to-r from-neutral-500 to-white"
            )}
            style={{ width: `${progress}%` }} 
          >
            {/* Brilho na ponta da barra */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px]" />
          </div>
        </div>
      </div>
      
    </div>
  );
}