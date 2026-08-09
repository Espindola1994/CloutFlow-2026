"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";

export default function Home() {
  const scrollToPlatforms = () => {
    const platformsSection = document.getElementById('platforms-section');
    if (platformsSection) {
      platformsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex items-center justify-center bg-gradient-to-b from-background to-background/80 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container px-4 md:px-6 relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
              <Zap className="mr-2 h-4 w-4" />
              <span>The #1 Social Media Growth Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
              Premium Growth for <span className="text-primary">Serious Creators</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Accelerate your social media presence with high-quality, authentic growth services. No bots, no passwords required.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/instagram" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg px-8 rounded-full">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                onClick={scrollToPlatforms}
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-lg px-8 rounded-full"
              >
                View Services
              </Button>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-muted-foreground text-sm font-medium">
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Instant Delivery</div>
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> 24/7 Support</div>
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> 100% Secure</div>
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section id="platforms-section" className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Choose Your Platform</h2>
              <p className="text-muted-foreground">Select the social network you want to grow today.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-5 max-w-5xl mx-auto">
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
                  shadow: "group-hover:shadow-[0_0_15px_rgba(217,70,239,0.15)]",
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
                  shadow: "group-hover:shadow-[0_0_15px_rgba(0,242,254,0.15)]",
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
                  shadow: "group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
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
                  shadow: "group-hover:shadow-[0_0_15px_rgba(37,99,235,0.15)]",
                  href: "/facebook" 
                },
              ].map((platform) => (
                <Link key={platform.name} href={platform.href} className="group outline-none">
                  <div className={`h-full relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] transition-all duration-250 ease-out 
                    shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)]
                    md:hover:-translate-y-[2px] md:hover:border-white/10 md:hover:bg-white/[0.04] ${platform.shadow}
                    active:scale-[0.98]
                    flex items-center p-3 sm:p-4 md:p-5 gap-3 md:gap-4
                    min-h-[80px] md:min-h-[105px]
                  `}>
                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity ${platform.accent}`} />
                    
                    {/* Popular Badge */}
                    {platform.popular && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-500 border border-pink-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        POPULAR
                      </div>
                    )}
                    
                    {/* Icon Container */}
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 transition-colors relative z-10">
                      <platform.icon className={`h-5 w-5 md:h-6 md:w-6 ${platform.color} group-hover:scale-105 transition-transform`} />
                    </div>

                    {/* Text Container */}
                    <div className="flex-1 min-w-0 pr-4 md:pr-6">
                      <h3 className="text-base md:text-[18px] font-bold text-white truncate leading-tight mb-1">
                        {platform.name}
                      </h3>
                      <p className="text-[12px] md:text-[13px] text-white/55 truncate">
                        Grow followers
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-white/70 md:group-hover:translate-x-[3px] transition-all">
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* How it works */}
        <section className="w-full py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to supercharge your social media presence.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              {[
                { step: "01", title: "Select Service", desc: "Choose the platform and the type of growth you need." },
                { step: "02", title: "Enter Details", desc: "Provide your username or post link. We never ask for your password." },
                { step: "03", title: "Watch It Grow", desc: "Checkout securely and watch your numbers go up instantly." },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold mb-6 border border-primary/30">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                  
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-primary/50 to-transparent -z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
