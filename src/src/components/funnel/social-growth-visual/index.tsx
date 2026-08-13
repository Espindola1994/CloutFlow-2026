"use client";

import { useEffect, useState, useRef } from "react";
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
      bgAccent: "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500",
      logo: FaInstagram,
      mockup: {
        avatarBg: "bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-500",
        stats: [
          { label: "Posts", val: "48" },
          { label: "Followers", val: "13.2K", highlight: true, rawValue: 13344 },
          { label: "Following", val: "243" }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      bottom: { text: "Followers growing in real time", baseCount: 13344, icon: BarChart3 }
    },
    tiktok: {
      gradient: "from-cyan-500/20 via-black to-pink-500/10",
      accent: "text-cyan-400",
      bgAccent: "bg-gradient-to-r from-cyan-400 to-pink-500",
      logo: FaTiktok,
      mockup: {
        avatarBg: "bg-gradient-to-tr from-cyan-400 to-pink-500",
        stats: [
          { label: "Following", val: "142" },
          { label: "Followers", val: "256.8K", highlight: true, rawValue: 256782 },
          { label: "Likes", val: "1.2M" }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      bottom: { text: "Views increasing in real time", baseCount: 256782, icon: Play }
    },
    twitter: {
      gradient: "from-neutral-400/10 to-neutral-700/5",
      accent: "text-foreground",
      bgAccent: "bg-white text-black",
      logo: FaXTwitter,
      mockup: {
        avatarBg: "bg-neutral-800 border-2 border-black",
        stats: [
          { label: "Following", val: "452" },
          { label: "Followers", val: "8,752", highlight: true, rawValue: 8752 }
        ],
        btn1: "Follow",
        btn2: "Message"
      },
      bottom: { text: "Followers growing in real time", baseCount: 8752, icon: User }
    },
    facebook: {
      gradient: "from-blue-500/20 to-blue-800/10",
      accent: "text-blue-500",
      bgAccent: "bg-blue-500",
      logo: FaFacebook,
      mockup: {
        avatarBg: "bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-white",
        stats: [
          { label: "Likes", val: "17K", highlight: true },
          { label: "Followers", val: "18K", rawValue: 18000 }
        ],
        btn1: "+ Follow",
        btn2: "Message"
      },
      bottom: { text: "Engagement growing in real time", baseCount: 18000, icon: BarChart3 }
    }
  };

  const current = config[platformType];
  const Logo = current.logo;
  const BottomIcon = current.bottom.icon;

  // Single Source of Truth for Follower Animation
  const [followerCount, setFollowerCount] = useState(0);
  const targetFollowers = current.bottom.baseCount;
  
  // Progress Bar specific
  const [progress, setProgress] = useState(48);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let observer: IntersectionObserver;

    const startAnimation = () => {
      let startTime: number | null = null;
      const duration = 5500; // 5.5s total duration
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        if (elapsed < duration) {
          const t = elapsed / duration;
          const easeOutProgress = 1 - Math.pow(1 - t, 3);
          
          setFollowerCount(Math.floor(easeOutProgress * targetFollowers));
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setFollowerCount(targetFollowers); // Snap to target when done
        }
      };
      
      animationFrameId = requestAnimationFrame(animate);
    };

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Start animation only once
        startAnimation();
        observer.disconnect();
      }
    }, { threshold: 0.25 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    // Bar animation logic
    let progressTimer: NodeJS.Timeout;
    const progressTick = () => {
      setProgress(prev => {
        if (prev > 75) return prev - (Math.random() * 10);
        return prev + (Math.random() * 5);
      });
      const nextTick = Math.floor(Math.random() * 2000) + 1500;
      progressTimer = setTimeout(progressTick, nextTick);
    };
    progressTimer = setTimeout(progressTick, 1000);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (progressTimer) clearTimeout(progressTimer);
      if (observer) observer.disconnect();
    };
  }, [targetFollowers]);

  // Formatter for Phone Internal Display (Compact format like 13.3K)
  const formatCompactFollowers = (val: number, isTwitter: boolean) => {
    if (val === 0) return "0";
    if (isTwitter && val < 10000) return val.toLocaleString('en-US'); // X uses full comma formatting below 10K
    
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      // Show exactly one decimal place unless it's perfectly round
      const kVal = val / 1000;
      return (kVal % 1 === 0 ? kVal : kVal.toFixed(1)) + 'K';
    }
    return val.toString();
  };

  const currentDisplayFollowers = formatCompactFollowers(followerCount, platformType === 'twitter');

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
              <div className="text-white/50"><span className="text-white font-bold font-variant-numeric tabular-nums">{currentDisplayFollowers}</span> Followers</div>
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
              <div><span className="font-variant-numeric tabular-nums">{currentDisplayFollowers}</span> <span className="font-normal text-gray-500">Followers</span></div>
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
            
            <span className="text-white/80"><Repeat2 className="w-5 h-5" /></span>
          </div>

          <div className="w-full px-4 pt-2 pb-4 flex flex-col items-center border-b border-white/10">
            <div className={`w-20 h-20 rounded-full ${current.mockup.avatarBg} p-0.5 mb-3`}>
              <div className="w-full h-full bg-surface rounded-full flex items-center justify-center border-2 border-black">
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
                <span className="font-bold text-sm text-white font-variant-numeric tabular-nums">{currentDisplayFollowers}</span>
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
        <div className="flex justify-end items-center w-full px-4 pt-4 pb-0">
          <span className="text-white/80"><BarChart3 className="w-5 h-5" /></span>
        </div>

        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className={`w-[70px] h-[70px] rounded-full ${current.mockup.avatarBg} p-[2.5px] shrink-0`}>
            <div className="w-full h-full bg-surface rounded-full flex items-center justify-center border-2 border-black"><User className="text-white/50 w-6 h-6" /></div>
          </div>
          <div className="flex flex-1 justify-around items-center ml-2 md:ml-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-white">48</span>
              <span className="text-[10px] text-white/70">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-white font-variant-numeric tabular-nums">{currentDisplayFollowers}</span>
              <span className="text-[10px] text-white/70">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-white">243</span>
              <span className="text-[10px] text-white/70">Following</span>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="flex items-center gap-1"><h3 className="text-white font-bold text-sm">Your Brand</h3><svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#0095F6"/><path d="M16.5 8.5L10.5 14.5L7.5 11.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
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
    <div ref={observerRef} className="relative w-full max-w-[850px] mx-auto min-h-[500px] md:min-h-[550px] flex items-center justify-center mt-2 mb-16 md:my-6 px-0 md:px-2 py-4 md:py-8 overflow-hidden md:overflow-visible">
      
      {/* Glow / Gradient de Fundo - Shared Across Platforms */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-[100px] opacity-40 md:opacity-50 pointer-events-none -z-10",
        platformType === 'instagram' ? "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500" :
        platformType === 'tiktok' ? "bg-gradient-to-r from-cyan-500 via-black to-pink-500" :
        platformType === 'facebook' ? "bg-blue-600" :
        "bg-neutral-600"
      )} />

      {/* Shared Absolute Container for All Platforms Geometry */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center h-[520px] md:h-[620px]">
        
        {/* Central Smartphone */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72vw,285px)] md:w-[310px] h-full bg-black rounded-[40px] md:rounded-[45px] border-[8px] md:border-[10px] border-surface shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 overflow-hidden ring-1 ring-white/5 animate-[float_7s_ease-in-out_infinite_alternate]">
          {/* Notch/Speaker */}
          {platform !== 'twitter' && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70px] h-[20px] bg-surface rounded-full z-30 shadow-[inset_0_-2px_4px_rgba(255,255,255,0.05)]" />}
          
          {/* Interface Interna Original Preservada */}
          {renderPhoneScreen()}
        </div>

        {/* Floating Notifications */}
        <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-30">
          
          {/* Notification 1 */}
          <FloatingNotification 
            platform={platformType} 
            type="followers" 
            position="top-left" 
            initialCount={followerCount} 
          />
          
          {/* Notification 2 */}
          <FloatingNotification 
            platform={platformType} 
            type={platformType === 'tiktok' ? 'views' : platformType === 'twitter' ? 'reposts' : 'likes'} 
            position="middle-right" 
            initialCount={platformType === 'tiktok' ? 100000 : platformType === 'instagram' ? 100000 : platformType === 'twitter' ? 100000 : 100000}
          />
          
          <FloatingNotification 
            platform={platformType} 
            type="status" 
            position="bottom-left" 
          />
        </div>

      </div>

      {/* Advanced Bottom Growth Bar (Absolute Centered) */}
      <div className={cn(
        "absolute -bottom-[16px] md:bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[460px] backdrop-blur-xl border rounded-[16px] md:rounded-[18px] p-3 md:p-4 shadow-2xl z-40 transition-all duration-300",
        platformType === 'facebook' ? "bg-[#050c1c]/90 border-blue-500/20" :
        platformType === 'tiktok' ? "bg-[#0a0a0a]/90 border-cyan-500/20" :
        platformType === 'twitter' ? "bg-[#080808]/90 border-white/10" :
        "bg-[#0a0a0a]/90 border-pink-500/20"
      )}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <BottomIcon className={cn("w-4 h-4", current.accent)} />
            <span className="text-white/90 text-[13px] font-semibold">{current.bottom.text}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-sm tabular-nums">
              {followerCount.toLocaleString('en-US')}
            </span>
            <ArrowUpRight className={cn("w-3 h-3 md:w-4 md:h-4 stroke-[3]", platformType === 'facebook' ? 'text-blue-400' : platformType === 'twitter' ? 'text-neutral-400' : platformType === 'tiktok' ? 'text-cyan-400' : 'text-pink-400')} />
          </div>
        </div>
        
        {/* Animated Progress Bar Customizada por Plataforma */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className={cn(
              "h-full transition-all duration-700 ease-in-out rounded-full relative",
              current.bgAccent
            )}
            style={{ width: `${progress}%` }} 
          >
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px]" />
          </div>
        </div>
      </div>
      
    </div>
  );
}
