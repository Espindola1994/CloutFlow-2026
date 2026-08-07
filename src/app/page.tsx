"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { name: "Instagram", icon: Users, color: "text-pink-500", href: "/instagram", popular: true },
                { name: "TikTok", icon: Users, color: "text-white", href: "/tiktok" },
                { name: "X / Twitter", icon: Users, color: "text-blue-400", href: "/twitter" },
                { name: "Facebook", icon: Users, color: "text-blue-600", href: "/facebook" },
              ].map((platform) => (
                <Link key={platform.name} href={platform.href} className="group">
                  <Card className="h-full border-muted-foreground/20 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-background/50 backdrop-blur-sm relative overflow-hidden">
                    {platform.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                        POPULAR
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-muted p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <platform.icon className={`h-10 w-10 ${platform.color}`} />
                      </div>
                      <CardTitle className="text-2xl">{platform.name}</CardTitle>
                    </CardHeader>
                  </Card>
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
      
      <Footer />
    </div>
  );
}
