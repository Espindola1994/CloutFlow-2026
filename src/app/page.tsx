"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      <main className="flex-1 flex flex-col justify-center py-10 md:py-16">
        
        {/* Ambient Glows */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle,rgba(124,92,252,0.06),transparent_60%)]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.04),transparent_60%)]" />
          <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-[radial-gradient(circle,rgba(236,72,153,0.02),transparent_60%)]" />
        </div>

        <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-[1200px] flex flex-col items-center">
          
          {/* 1. CloutFlow Logo Centered */}
          <div className="mb-6 md:mb-8 w-[140px] md:w-[170px] animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <Image 
              src="/cloutflow-logo.png" 
              alt="CloutFlow Logo" 
              width={340} 
              height={85} 
              className="w-full h-auto object-contain"
              priority
            />
          </div>

          {/* 2. Badge */}
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-surface/40 backdrop-blur-sm px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-1000 delay-75 fill-mode-both">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-accent" />
            <span>⚡ Instant growth, real engagement</span>
          </div>

          {/* 3. Headline */}
          <h1 className="text-[32px] sm:text-[40px] md:text-[52px] lg:text-[60px] leading-[1.05] font-bold tracking-tight mb-5 text-center text-foreground max-w-[850px] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
            Grow your business or <br className="hidden sm:block" />
            personal profile <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">fast</span>
          </h1>

          {/* 4. Subheadline */}
          <p className="text-[15px] md:text-[17px] text-muted-foreground mb-12 text-center max-w-[330px] md:max-w-[650px] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-both">
            Pick your platform below and we'll show you the best growth options for it — delivered in as little as 24h.
          </p>

          {/* 5. Platform Title */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300 fill-mode-both">
            <h2 className="text-[20px] md:text-[24px] font-bold tracking-tight text-foreground">Choose your social network</h2>
            <p className="text-[13px] md:text-[14px] text-muted-foreground mt-1">Select the platform you want to grow</p>
          </div>

          {/* 6. Platform Launchers Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-5 md:gap-x-8 gap-y-8 md:gap-y-10 mb-14 md:mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400 fill-mode-both max-w-[900px] mx-auto">
            
            {/* Instagram Launcher */}
            <Link href="/instagram" className="group outline-none block relative z-10 flex flex-col items-center cursor-pointer min-h-[125px]">
              {/* Badge POPULAR */}
              <div className="absolute top-[-8px] md:top-[-10px] right-[10%] md:right-[20%] z-20 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold text-[9px] md:text-[10px] tracking-[0.04em] px-2.5 py-0.5 rounded-full shadow-[0_2px_10px_rgba(236,72,153,0.3)] border border-white/20">
                POPULAR
              </div>
              <div className="relative">
                <div className="w-[64px] h-[64px] md:w-[76px] md:h-[76px] rounded-[20px] md:rounded-[24px] bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center transition-all duration-250 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] md:group-hover:shadow-[0_12px_24px_rgba(236,72,153,0.3)] active:scale-[0.96]">
                  <FaInstagram className="w-8 h-8 md:w-9 md:h-9 text-white" />
                </div>
                <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] bg-pink-500/20 blur-xl opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center mt-3 text-center transition-transform duration-250">
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">Instagram</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-muted-foreground mt-0.5 md:group-hover:text-pink-400 transition-colors">
                  Grow Instagram <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

            {/* TikTok Launcher */}
            <Link href="/tiktok" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[125px]">
              <div className="relative">
                <div className="w-[64px] h-[64px] md:w-[76px] md:h-[76px] rounded-[20px] md:rounded-[24px] bg-[#07090F] border border-white/10 flex items-center justify-center transition-all duration-250 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] md:group-hover:shadow-[0_12px_24px_rgba(6,182,212,0.2)] active:scale-[0.96] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2fe]/10 to-[#fe0979]/10" />
                  <FaTiktok className="w-7 h-7 md:w-8 md:h-8 text-white relative z-10 drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]" />
                </div>
                <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] bg-[#00f2fe]/20 blur-xl opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center mt-3 text-center transition-transform duration-250">
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">TikTok</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-muted-foreground mt-0.5 md:group-hover:text-[#00f2fe] transition-colors">
                  Grow TikTok <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

            {/* X / Twitter Launcher */}
            <Link href="/twitter" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[125px]">
              <div className="relative">
                <div className="w-[64px] h-[64px] md:w-[76px] md:h-[76px] rounded-[20px] md:rounded-[24px] bg-[#0A0A0A] border border-white/15 flex items-center justify-center transition-all duration-250 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] md:group-hover:shadow-[0_12px_24px_rgba(255,255,255,0.1)] active:scale-[0.96]">
                  <FaXTwitter className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] bg-white/10 blur-xl opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center mt-3 text-center transition-transform duration-250">
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">X / Twitter</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-muted-foreground mt-0.5 md:group-hover:text-white transition-colors">
                  Grow on X <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

            {/* Facebook Launcher */}
            <Link href="/facebook" className="group outline-none block relative flex flex-col items-center cursor-pointer min-h-[125px]">
              <div className="relative">
                <div className="w-[64px] h-[64px] md:w-[76px] md:h-[76px] rounded-[20px] md:rounded-[24px] bg-gradient-to-tr from-[#1877F2] to-[#3b8ef5] border border-blue-400/30 flex items-center justify-center transition-all duration-250 ease-out md:group-hover:-translate-y-[4px] md:group-hover:scale-[1.04] md:group-hover:shadow-[0_12px_24px_rgba(24,119,242,0.3)] active:scale-[0.96]">
                  <FaFacebook className="w-8 h-8 md:w-9 md:h-9 text-white" />
                </div>
                <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] bg-blue-500/20 blur-xl opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
              </div>
              <div className="flex flex-col items-center mt-3 text-center transition-transform duration-250">
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">Facebook</span>
                <span className="flex items-center text-[12px] md:text-[13px] text-muted-foreground mt-0.5 md:group-hover:text-blue-400 transition-colors">
                  Grow Facebook <ArrowRight className="ml-1 w-3 h-3 md:group-hover:translate-x-[3px] transition-transform" />
                </span>
              </div>
            </Link>

          </div>
          
          {/* Subtle Decorative Line Below Launchers (Desktop only) */}
          <div className="hidden md:block w-full max-w-[500px] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-12 animate-in fade-in duration-1000 delay-500" />

          {/* 7. Social Proof / Metrics Bar */}
          <div className="w-full max-w-[800px] bg-surface border border-border rounded-[20px] py-4 px-2 md:px-8 shadow-sm flex flex-row items-center justify-between animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
            
            <div className="flex-1 flex flex-col items-center text-center px-1 md:px-4 border-r border-border">
              <span className="text-[15px] md:text-[20px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-0.5">52,749+</span>
              <span className="text-[11px] md:text-[13px] text-muted-foreground leading-tight">Satisfied<br className="md:hidden" /> customers</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center text-center px-1 md:px-4 border-r border-border">
              <span className="text-[15px] md:text-[20px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-0.5">24h</span>
              <span className="text-[11px] md:text-[13px] text-muted-foreground leading-tight">Avg.<br className="md:hidden" /> delivery</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center text-center px-1 md:px-4">
              <span className="text-[15px] md:text-[20px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-0.5">4.9★</span>
              <span className="text-[11px] md:text-[13px] text-muted-foreground leading-tight">Avg.<br className="md:hidden" /> rating</span>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}