"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap, Users, Star, ArrowRight, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SocialIconRain } from "@/components/funnel/social-growth-visual/social-icon-rain";

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
            <Link href="/instagram" className="group outline-none block relative z-10 flex flex-col items-center cursor-pointer min-h-[110px] md:min-h-[135px]">
              
              <div className="relative mb-3 md:mb-4 transition-all duration-300 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] active:scale-[0.96]">
                
                <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[22px] bg-[#111728]/80 backdrop-blur-xl border border-white/20 md:group-hover:border-white/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  
                  {/* Inner Highlight / Reflection */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-[22px] pointer-events-none md:group-hover:from-white/25 transition-colors duration-300" />
                  
                  {/* Soft Background Glow inside */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/30 via-pink-500/30 to-purple-500/30 blur-md md:group-hover:opacity-100 opacity-80 transition-opacity duration-300" />
                  
                  {/* Instagram Icon Centered */}
                  <FaInstagram className="w-8 h-8 md:w-9 md:h-9 text-white relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
                </div>
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-[22px] bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-500 blur-2xl opacity-40 md:group-hover:opacity-60 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">Instagram</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-[#A8B1C7] mt-0.5 md:group-hover:text-pink-400 transition-colors">
                  Grow Instagram <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

            {/* TikTok Holographic Launcher */}
            <Link href="/tiktok" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[110px] md:min-h-[135px]">
              <div className="relative mb-3 md:mb-4">
                <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[22px] bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-300 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] active:scale-[0.96] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-[22px] pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2fe]/15 to-[#fe0979]/15 blur-md md:group-hover:opacity-100 opacity-50 transition-opacity duration-300" />
                  <FaTiktok className="w-[28px] h-[28px] md:w-8 md:h-8 text-white relative z-10 drop-shadow-[0_0_10px_rgba(0,242,254,0.4)]" />
                </div>
                {/* Circular Outer Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-[#00f2fe] to-[#fe0979] blur-2xl opacity-20 md:group-hover:opacity-40 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">TikTok</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-[#A8B1C7] mt-0.5 md:group-hover:text-[#00f2fe] transition-colors">
                  Grow TikTok <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

            {/* X / Twitter Holographic Launcher */}
            <Link href="/twitter" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[110px] md:min-h-[135px]">
              <div className="relative mb-3 md:mb-4">
                <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[22px] bg-[#0D1120]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-300 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] active:scale-[0.96] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[22px] pointer-events-none" />
                  <div className="absolute inset-0 bg-white/5 blur-md md:group-hover:opacity-100 opacity-50 transition-opacity duration-300" />
                  <FaXTwitter className="w-7 h-7 md:w-[30px] md:h-[30px] text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                </div>
                <div className="absolute inset-0 rounded-[22px] bg-white/20 blur-xl opacity-10 md:group-hover:opacity-20 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">Twitter (X)</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-[#A8B1C7] mt-0.5 md:group-hover:text-white transition-colors">
                  Grow on X <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

            {/* Facebook Holographic Launcher */}
            <Link href="/facebook" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[110px] md:min-h-[135px]">
              <div className="relative mb-3 md:mb-4">
                <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[22px] bg-[#111728]/80 backdrop-blur-xl border border-blue-400/20 flex items-center justify-center transition-all duration-300 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] active:scale-[0.96] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[22px] pointer-events-none" />
                  <div className="absolute inset-0 bg-blue-500/20 blur-md md:group-hover:opacity-100 opacity-60 transition-opacity duration-300" />
                  <FaFacebook className="w-[30px] h-[30px] md:w-8 md:h-8 text-white relative z-10 drop-shadow-[0_0_10px_rgba(24,119,242,0.5)]" />
                </div>
                <div className="absolute inset-0 rounded-[22px] bg-blue-500 blur-xl opacity-20 md:group-hover:opacity-40 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center text-center transition-transform duration-300">
                <span className="font-bold text-[15px] md:text-[16px] text-[#F8FAFF]">Facebook</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-[#A8B1C7] mt-0.5 md:group-hover:text-blue-400 transition-colors">
                  Grow Facebook <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
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