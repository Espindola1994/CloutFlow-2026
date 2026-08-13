"use client";

import Link from "next/link";
import { Zap, Users, Star, ArrowRight, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SocialIconRain } from "@/components/funnel/social-growth-visual/social-icon-rain";


function OrganicSocialIcon({ platform }: { platform: "instagram" | "tiktok" | "twitter" | "facebook" }) {
  const base = "relative w-[86px] h-[86px] md:w-[96px] md:h-[96px] transition-all duration-300 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.06] active:scale-[0.96]";

  if (platform === "instagram") {
    return (
      <div className={base}>
        <span className="absolute inset-[8px] rounded-[36%_64%_58%_42%/46%_40%_60%_54%] bg-gradient-to-br from-[#7C3AED] via-[#E1306C] to-[#FF8A00] rotate-[-11deg] opacity-90" />
        <span className="absolute inset-[12px] rounded-[58%_42%_37%_63%/44%_61%_39%_56%] bg-gradient-to-tr from-[#FF9F0A] via-[#FF2D85] to-[#9B5CFF] rotate-[10deg] opacity-95" />
        <span className="absolute inset-[18px] rounded-[42%_58%_54%_46%/57%_42%_58%_43%] bg-gradient-to-br from-[#FF8A3D] via-[#E1306C] to-[#B83DFF] shadow-[0_12px_28px_rgba(225,48,108,0.28)]" />
        <FaInstagram className="absolute inset-0 m-auto w-[38px] h-[38px] md:w-[42px] md:h-[42px] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.28)]" />
      </div>
    );
  }

  if (platform === "tiktok") {
    return (
      <div className={base}>
        <span className="absolute inset-[8px] rounded-[58%_42%_35%_65%/41%_63%_37%_59%] bg-[#25F4EE] rotate-[-12deg] opacity-85" />
        <span className="absolute inset-[10px] rounded-[37%_63%_57%_43%/60%_39%_61%_40%] bg-[#FE2C55] rotate-[13deg] opacity-90" />
        <span className="absolute inset-[17px] rounded-[47%_53%_43%_57%/55%_44%_56%_45%] bg-gradient-to-br from-[#111827] to-[#05070D] border border-white/10 shadow-[0_12px_28px_rgba(37,244,238,0.14)]" />
        <FaTiktok className="absolute inset-0 m-auto w-[36px] h-[36px] md:w-[40px] md:h-[40px] text-white drop-shadow-[3px_2px_0_#FE2C55] [filter:drop-shadow(-3px_-1px_0_#25F4EE)]" />
      </div>
    );
  }

  if (platform === "facebook") {
    return (
      <div className={base}>
        <span className="absolute inset-[8px] rounded-[61%_39%_54%_46%/43%_58%_42%_57%] bg-[#00B8FF] rotate-[-10deg] opacity-85" />
        <span className="absolute inset-[11px] rounded-[39%_61%_42%_58%/60%_44%_56%_40%] bg-[#2358FF] rotate-[12deg] opacity-95" />
        <span className="absolute inset-[17px] rounded-[44%_56%_61%_39%/47%_57%_43%_53%] bg-gradient-to-br from-[#2189FF] to-[#1554E8] shadow-[0_12px_28px_rgba(24,119,242,0.24)]" />
        <FaFacebook className="absolute inset-0 m-auto w-[40px] h-[40px] md:w-[44px] md:h-[44px] text-white" />
      </div>
    );
  }

  return (
    <div className={base}>
      <span className="absolute inset-[8px] rounded-[56%_44%_35%_65%/44%_61%_39%_56%] bg-[#4B5563] rotate-[-12deg] opacity-55" />
      <span className="absolute inset-[10px] rounded-[38%_62%_59%_41%/62%_39%_61%_38%] bg-[#1F2937] rotate-[12deg] opacity-90" />
      <span className="absolute inset-[17px] rounded-[46%_54%_42%_58%/58%_45%_55%_42%] bg-gradient-to-br from-[#151B25] to-[#05070A] border border-white/20 shadow-[0_12px_28px_rgba(255,255,255,0.08)]" />
      <FaXTwitter className="absolute inset-0 m-auto w-[34px] h-[34px] md:w-[38px] md:h-[38px] text-white" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] py-6 md:py-8 lg:py-10">
        
        {/* Experimental Neon Ambient Background (Reversible) */}
        <SocialIconRain />

        {/* Ambient Glows */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* Top Left Violet */}
          <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[radial-gradient(circle,rgba(124,92,252,0.08),transparent_60%)]" />
          {/* Bottom Right Cyan */}
          <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[radial-gradient(circle,rgba(56,189,248,0.06),transparent_60%)]" />
          {/* Center Pink Highlight */}
          <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-[radial-gradient(circle,rgba(236,72,153,0.03),transparent_60%)]" />
        </div>

        <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-[1200px] flex flex-col items-center justify-center w-full h-full">
          
          {/* 1. CloutFlow Wordmark */}
          <div className="mb-4 md:mb-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h1 className="text-[24px] md:text-[30px] lg:text-[34px] font-extrabold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#C83CFF] via-[#7C5CFC] to-[#38BDF8]">
              CLOUTFLOW
            </h1>
          </div>

          {/* 2. Badge */}
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-[#111728]/40 backdrop-blur-md px-3 py-1 text-[11px] md:text-[12px] font-medium text-[#A8B1C7] mb-5 md:mb-6 shadow-[0_0_15px_rgba(124,92,252,0.08)] animate-in fade-in duration-700 delay-75 fill-mode-both">
            <Zap className="mr-1.5 h-3 w-3 text-accent" />
            <span>Instant growth, real engagement</span>
          </div>

          {/* 3. Headline */}
          <h2 className="text-[34px] sm:text-[42px] md:text-[50px] lg:text-[58px] leading-[1.05] font-extrabold tracking-tight mb-4 md:mb-5 text-center text-[#F8FAFF] max-w-[850px] animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150 fill-mode-both">
            Grow your audience. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#38BDF8]">Get noticed faster.</span>
          </h2>

          {/* 4. Subheadline */}
          <p className="text-[15px] md:text-[17px] lg:text-[18px] text-[#A8B1C7] mb-8 md:mb-10 text-center max-w-[340px] md:max-w-[600px] leading-relaxed animate-in fade-in duration-700 delay-200 fill-mode-both">
            Followers, likes and views for the platforms that matter to you.
          </p>

          {/* 5. Platform Title */}
          <div className="text-center mb-6 md:mb-8 animate-in fade-in duration-700 delay-300 fill-mode-both">
            <h3 className="text-[20px] md:text-[24px] font-bold tracking-tight text-[#F8FAFF]">Where do you want to grow?</h3>
            <p className="text-[13px] md:text-[15px] text-[#A8B1C7] mt-1.5">Choose your platform to explore your options.</p>
          </div>

          {/* 6. Platform Launchers Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-0 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-both max-w-[900px] mx-auto">
            
            {/* Instagram Holographic Launcher */}
            <Link href="/instagram" className="group outline-none block relative z-10 flex flex-col items-center cursor-pointer min-h-[90px] md:min-h-[110px]">
              
              <div className="relative mb-2 md:mb-3"><OrganicSocialIcon platform="instagram" /></div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">Instagram</span>
              </div>
            </Link>

            {/* TikTok Holographic Launcher */}
            <Link href="/tiktok" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[90px] md:min-h-[110px]">
              <div className="relative mb-2 md:mb-3"><OrganicSocialIcon platform="tiktok" /></div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">TikTok</span>
              </div>
            </Link>

            {/* X / Twitter Holographic Launcher */}
            <Link href="/twitter" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[90px] md:min-h-[110px]">
              <div className="relative mb-2 md:mb-3"><OrganicSocialIcon platform="twitter" /></div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">Twitter (X)</span>
              </div>
            </Link>

            {/* Facebook Holographic Launcher */}
            <Link href="/facebook" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[90px] md:min-h-[110px]">
              <div className="relative mb-2 md:mb-3"><OrganicSocialIcon platform="facebook" /></div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">Facebook</span>
              </div>
            </Link>

          </div>

          {/* 7. Social Proof / Metrics Bar */}
          <div className="w-full max-w-[800px] bg-[#111728]/60 backdrop-blur-md border border-[#26314D] rounded-[18px] md:rounded-[24px] py-2.5 md:py-4 px-2 md:px-6 shadow-lg flex flex-row items-center justify-between animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
            
            <div className="flex-1 flex flex-col items-center text-center px-1 md:px-4 border-r border-[#26314D]/50 relative">
              <Users className="w-3 h-3 md:w-4 md:h-4 text-primary mb-1 md:mb-1.5 opacity-80" />
              <span className="text-[14px] md:text-[22px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#C83CFF] mb-0.5 leading-none">52,749+</span>
              <span className="text-[10px] md:text-[13px] text-[#A8B1C7] font-medium leading-[1.1] md:leading-tight mt-[1px]">Satisfied<br className="md:hidden" /> customers</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center text-center px-1 md:px-4 border-r border-[#26314D]/50 relative">
              <Zap className="w-3 h-3 md:w-4 md:h-4 text-accent mb-1 md:mb-1.5 opacity-80" />
              <span className="text-[14px] md:text-[22px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] mb-0.5 leading-none">24h</span>
              <span className="text-[10px] md:text-[13px] text-[#A8B1C7] font-medium leading-[1.1] md:leading-tight mt-[1px]">Avg.<br className="md:hidden" /> delivery</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center text-center px-1 md:px-4 relative">
              <Star className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 mb-1 md:mb-1.5 opacity-80" />
              <span className="text-[14px] md:text-[22px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-0.5 leading-none">4.9★</span>
              <span className="text-[10px] md:text-[13px] text-[#A8B1C7] font-medium leading-[1.1] md:leading-tight mt-[1px]">Avg.<br className="md:hidden" /> rating</span>
            </div>

          </div>

          {/* 8. Feature Strip (Trust Signals - Desktop Only) */}
          <div className="hidden md:block w-full mt-10 md:mt-12 animate-in fade-in duration-700 delay-700 fill-mode-both">
            
            {/* Desktop Version */}
            <div className="flex flex-row items-center justify-center gap-x-8">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C5CFC]" />
                <span className="text-[14px] text-[#A8B1C7] font-medium">Real followers</span>
              </div>
              <div className="w-[3px] h-[3px] rounded-full bg-[#26314D] opacity-60" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-[14px] text-[#A8B1C7] font-medium">Safe & guaranteed</span>
              </div>
              <div className="w-[3px] h-[3px] rounded-full bg-[#26314D] opacity-60" />
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-[14px] text-[#A8B1C7] font-medium">Instant start</span>
              </div>
            </div>
            
          </div>

        </div>

      </main>
    </div>
  );
}