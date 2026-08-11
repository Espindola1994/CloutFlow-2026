"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
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

          {/* 6. Platform Cards Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-14 md:mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400 fill-mode-both">
            
            {/* Instagram Card */}
            <Link href="/instagram" className="group outline-none block">
              <div className="w-full h-[145px] md:h-[165px] bg-surface border border-border rounded-[20px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-250 ease-out md:hover:-translate-y-[3px] md:hover:border-pink-500/50 md:hover:shadow-[0_12px_32px_rgba(236,72,153,0.15)] active:scale-[0.98]">
                <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center mb-3 md:group-hover:-translate-y-[2px] transition-transform duration-250">
                  <FaInstagram className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">Instagram</span>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-pink-500/5 to-transparent pointer-events-none opacity-50 md:group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* TikTok Card */}
            <Link href="/tiktok" className="group outline-none block">
              <div className="w-full h-[145px] md:h-[165px] bg-surface border border-border rounded-[20px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-250 ease-out md:hover:-translate-y-[3px] md:hover:border-[#00f2fe]/50 md:hover:shadow-[0_12px_32px_rgba(6,182,212,0.15)] active:scale-[0.98]">
                <div className="w-[58px] h-[58px] rounded-2xl bg-[#080B14] border border-border/50 flex items-center justify-center mb-3 md:group-hover:-translate-y-[2px] transition-transform duration-250 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2fe]/20 to-[#fe0979]/20" />
                  <FaTiktok className="w-6 h-6 text-white relative z-10" />
                </div>
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">TikTok</span>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#00f2fe]/5 to-transparent pointer-events-none opacity-50 md:group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* X / Twitter Card */}
            <Link href="/twitter" className="group outline-none block">
              <div className="w-full h-[145px] md:h-[165px] bg-surface border border-border rounded-[20px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-250 ease-out md:hover:-translate-y-[3px] md:hover:border-white/30 md:hover:shadow-[0_12px_32px_rgba(255,255,255,0.08)] active:scale-[0.98]">
                <div className="w-[58px] h-[58px] rounded-2xl bg-[#080B14] border border-border/50 flex items-center justify-center mb-3 md:group-hover:-translate-y-[2px] transition-transform duration-250">
                  <FaXTwitter className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">Twitter (X)</span>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/5 to-transparent pointer-events-none opacity-50 md:group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* Facebook Card */}
            <Link href="/facebook" className="group outline-none block">
              <div className="w-full h-[145px] md:h-[165px] bg-surface border border-border rounded-[20px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-250 ease-out md:hover:-translate-y-[3px] md:hover:border-blue-500/50 md:hover:shadow-[0_12px_32px_rgba(59,130,246,0.15)] active:scale-[0.98]">
                <div className="w-[58px] h-[58px] rounded-2xl bg-[#1877F2] flex items-center justify-center mb-3 md:group-hover:-translate-y-[2px] transition-transform duration-250">
                  <FaFacebook className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-[15px] md:text-[17px] text-foreground">Facebook</span>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none opacity-50 md:group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

          </div>

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