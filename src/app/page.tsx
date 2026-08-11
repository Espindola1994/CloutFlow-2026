"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Layers, Link as LinkIcon, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SocialGrowthEngine } from "@/components/funnel/social-growth-visual/social-growth-engine";

export default function Home() {
  const scrollToPlatforms = () => {
    const platformsSection = document.getElementById('platforms-section');
    if (platformsSection) {
      platformsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full pt-10 pb-16 md:pt-14 md:pb-24 lg:pt-16 lg:pb-32 flex items-center justify-center relative overflow-hidden bg-background">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[800px] max-h-[800px] bg-[radial-gradient(circle,rgba(124,92,252,0.12),transparent_55%)] pointer-events-none" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.08),transparent_60%)] pointer-events-none" />
          
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-[1200px]">
            
            {/* 2-Column Desktop / Stacked Mobile */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
              
              {/* LEFT COLUMN: Content */}
              <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left relative z-20">
                
                <div className="mb-8 md:mb-10 w-[170px] md:w-[230px] flex items-center justify-center lg:justify-start">
                  <Image 
                    src="/cloutflow-logo.png" 
                    alt="CloutFlow Logo" 
                    width={400} 
                    height={100} 
                    className="w-full h-auto object-contain drop-shadow-[0_2px_10px_rgba(124,92,252,0.15)]"
                    priority
                  />
                </div>

                <div className="inline-flex items-center rounded-full border border-primary/30 bg-surface px-3 py-1 text-sm font-medium text-foreground mb-6 shadow-[0_0_15px_rgba(124,92,252,0.15)]">
                  <Zap className="mr-2 h-4 w-4 text-accent" />
                  <span>The #1 Social Media Growth Platform</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.1] font-extrabold tracking-tight mb-6 text-foreground">
                  Grow Your Social Presence. <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Across Every Platform.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-[520px]">
                  Choose your network, select the growth you want, and manage everything from one place. No passwords required.
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link href="/instagram" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-[17px] font-semibold px-8 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground hover:brightness-110 hover:-translate-y-[1px] active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(124,92,252,0.25)] border-0">
                      Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    onClick={scrollToPlatforms}
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto text-[17px] font-medium px-8 h-14 rounded-full bg-surface border-border text-foreground hover:bg-surface-elevated active:scale-[0.98] transition-all"
                  >
                    View Services
                  </Button>
                </div>
                
                {/* Social Proof */}
                <div className="mt-8 flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-background bg-surface overflow-hidden shrink-0">
                        <img src="https://i.pravatar.cc/100?img=1" alt="Customer" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-background bg-surface overflow-hidden -ml-2 shrink-0">
                        <img src="https://i.pravatar.cc/100?img=2" alt="Customer" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-background bg-surface overflow-hidden -ml-2 shrink-0">
                        <img src="https://i.pravatar.cc/100?img=3" alt="Customer" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-background bg-surface overflow-hidden -ml-2 shrink-0">
                        <img src="https://i.pravatar.cc/100?img=4" alt="Customer" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] text-foreground leading-tight">52,749+ satisfied customers</span>
                      <span className="text-[12px] text-muted-foreground leading-tight">Trusted by creators worldwide</span>
                    </div>
                  </div>
                </div>
                
              </div>
              
              {/* RIGHT COLUMN: Visual */}
              <div className="w-full lg:w-[45%]">
                <SocialGrowthEngine />
              </div>
              
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section id="platforms-section" className="w-full py-20 bg-background-secondary relative border-t border-border/30 group/section">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none transition-colors duration-700 bg-[radial-gradient(circle_at_50%_0%,var(--hover-bg,transparent),transparent_70%)] opacity-30" />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground">Where do you want to grow?</h2>
              <p className="text-muted-foreground">Choose a platform and start building your audience.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-5 max-w-5xl mx-auto"
                 onMouseLeave={(e) => {
                   const target = e.currentTarget.parentElement?.parentElement;
                   if (target) target.style.setProperty('--hover-bg', 'transparent');
                 }}>
              {[
                { 
                  name: "Instagram", 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  ),
                  color: "text-white", 
                  accent: "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500",
                  glowColor: "rgba(236,72,153,0.15)",
                  href: "/instagram", 
                  popular: true 
                },
                { 
                  name: "TikTok", 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                    </svg>
                  ),
                  color: "text-white", 
                  accent: "bg-gradient-to-r from-[#00f2fe] to-[#fe0979]",
                  glowColor: "rgba(6,182,212,0.15)",
                  href: "/tiktok" 
                },
                { 
                  name: "X / Twitter", 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                      <path d="M4 4l11.733 16h4.267l-11.733-16z"/>
                      <path d="M4 20l6.768-6.768m2.46-2.46L20 4"/>
                    </svg>
                  ),
                  color: "text-white", 
                  accent: "bg-gradient-to-r from-gray-400 to-white",
                  glowColor: "rgba(255,255,255,0.1)",
                  href: "/twitter" 
                },
                { 
                  name: "Facebook", 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  ),
                  color: "text-white", 
                  accent: "bg-blue-600",
                  glowColor: "rgba(59,130,246,0.15)",
                  href: "/facebook" 
                },
              ].map((platform) => (
                <Link key={platform.name} href={platform.href} className="group outline-none" 
                  onMouseEnter={(e) => {
                    const target = e.currentTarget.closest('section');
                    if (target) target.style.setProperty('--hover-bg', platform.glowColor);
                  }}
                  onFocus={(e) => {
                    const target = e.currentTarget.closest('section');
                    if (target) target.style.setProperty('--hover-bg', platform.glowColor);
                  }}>
                  <div className={`h-full relative overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 ease-out 
                    shadow-sm
                    md:hover:-translate-y-[2px] md:hover:border-transparent group-hover:shadow-[0_12px_32px_var(--glow)]
                    active:scale-[0.98]
                    flex items-center p-3 sm:p-4 md:p-5 gap-3 md:gap-4
                    min-h-[80px] md:min-h-[105px]
                  `} style={{ '--glow': platform.glowColor } as React.CSSProperties}>
                    
                    {/* Hover Border Overlay to simulate gradient border */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl p-[1px] -z-10 ${platform.accent}`}>
                       <div className="w-full h-full bg-surface-elevated rounded-[11px]" />
                    </div>

                    {/* Top Accent Line (Mobile fallback if hover is not triggered) */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-0 transition-opacity ${platform.accent}`} />
                    
                    {/* Popular Badge */}
                    {platform.popular && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-500 border border-pink-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        POPULAR
                      </div>
                    )}
                    
                    {/* Icon Container */}
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0 border border-border group-hover:bg-transparent group-hover:border-transparent transition-colors relative z-10">
                      <platform.icon className={`h-5 w-5 md:h-6 md:w-6 ${platform.color} group-hover:scale-110 transition-transform duration-300`} />
                    </div>

                    {/* Text Container */}
                    <div className="flex-1 min-w-0 pr-4 md:pr-6 z-10">
                      <h3 className="text-base md:text-[18px] font-bold text-foreground truncate leading-tight mb-1">
                        {platform.name}
                      </h3>
                      <p className="text-[12px] md:text-[13px] text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                        Grow followers
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-foreground transition-all duration-300 group-hover:translate-x-[3px] z-10">
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* How it works -> Growth Journey */}
        <section className="w-full py-24 bg-background relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">Growth Journey</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to supercharge your social media presence.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-6 max-w-5xl mx-auto relative">
              {/* Desktop Connecting Line */}
              <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-border z-0 overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-[20%] bg-gradient-to-r from-transparent via-primary to-transparent animate-[slide-right_6s_ease-in-out_infinite]" />
              </div>
              
              {/* Mobile Connecting Line */}
              <div className="md:hidden absolute top-[10%] bottom-[10%] left-[39px] w-[2px] bg-border z-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-transparent via-primary to-transparent animate-[slide-down_6s_ease-in-out_infinite]" />
              </div>

              {[
                { 
                  step: "01", 
                  title: "Select Service", 
                  desc: "Choose the platform and the type of growth you need.",
                  icon: Layers
                },
                { 
                  step: "02", 
                  title: "Enter Details", 
                  desc: "Provide your username or post link. We never ask for your password.",
                  icon: LinkIcon
                },
                { 
                  step: "03", 
                  title: "Watch It Grow", 
                  desc: "Checkout securely and watch your numbers go up instantly.",
                  icon: TrendingUp
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-row md:flex-col items-center md:items-center text-left md:text-center relative z-10 bg-surface-elevated border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all w-full md:w-1/3 group">
                  <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center mb-0 md:mb-6 mr-5 md:mr-0 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(124,92,252,0.2)] transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <item.icon className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-foreground opacity-50 group-hover:opacity-100 group-hover:border-primary/50 transition-all">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile Sticky CTA Bar */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500 delay-1000 fill-mode-both">
          <div className="bg-surface-elevated border border-border shadow-[0_10px_40px_rgba(0,0,0,0.6)] rounded-2xl p-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground ml-2">Ready to grow?</span>
            <Link href="#platforms-section" onClick={(e) => { e.preventDefault(); scrollToPlatforms(); }}>
              <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 font-bold px-5">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Footer (Basic for now to accommodate logo) */}
        <footer className="w-full bg-background-secondary border-t border-border py-12 md:py-16">
          <div className="container px-4 md:px-6 mx-auto flex flex-col items-center justify-center">
            <div className="w-[140px] md:w-[160px] opacity-80 mb-6">
              <Image 
                src="/cloutflow-logo.png" 
                alt="CloutFlow Logo" 
                width={300} 
                height={75} 
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              &copy; {new Date().getFullYear()} CloutFlow. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
