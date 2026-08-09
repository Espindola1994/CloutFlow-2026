"use client";

import { useFunnelStore } from "@/stores/funnel.store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight, Zap, CheckCircle2, CircleDollarSign, ShieldCheck, Flame, Wallet, BarChart, Target, Star } from "lucide-react";
import { FaInstagram, FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export function FollowerTypeSelector({ platform = 'instagram' }: { platform?: string }) {
  const { setFollowerType } = useFunnelStore();

  const isTiktok = platform === 'tiktok';
  const isTwitter = platform === 'twitter';
  const isFacebook = platform === 'facebook';
  const isInstagram = platform === 'instagram';
  
  let IconComponent = FaInstagram;
  let startPrice = "$7.90";
  
  if (isTiktok) {
    IconComponent = FaTiktok;
    startPrice = "$9.90";
  } else if (isTwitter) {
    IconComponent = FaXTwitter;
    startPrice = "$9.90";
  } else if (isFacebook) {
    IconComponent = FaFacebook;
    startPrice = "$7.90";
  }

  const platformName = platform === 'twitter' ? 'Twitter (X)' : platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8">
      {/* Real Followers Card - NO HOVER ON CARD */}
      <button 
        className="text-left w-full h-full cursor-default"
        type="button"
      >
        <Card className="h-full border-white/5 bg-muted/10 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:hover:-translate-y-0.5 md:hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0">
          <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-bl-lg z-10 flex items-center gap-1 border-b border-l border-primary/20">
            BEST VALUE
          </div>
          <CardHeader className="pb-4 pt-8">
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-xl flex items-center justify-center text-2xl h-12 w-12 border ${
                isFacebook ? 'bg-blue-500/10 border-blue-500/20' : isTiktok ? 'bg-cyan-500/10 border-cyan-500/20' : isInstagram ? 'bg-pink-500/10 border-pink-500/20' : 'bg-primary/10 border-primary/20'
              }`}>
                <IconComponent className={`h-6 w-6 ${isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : isInstagram ? 'text-pink-500' : 'text-primary'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">Real Followers</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Quick credibility boost</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real followers delivered fast. Perfect for anyone who wants to <strong className="text-foreground">look bigger</strong>, gain credibility and attract more visitors to their profile.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm">
                <Zap className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block text-foreground">Delivery in up to 24h</strong>
                  <span className="text-muted-foreground">Starts arriving right after payment</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block text-foreground">100% Real Followers</strong>
                  <span className="text-muted-foreground">Real and active accounts, no bots</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CircleDollarSign className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block text-foreground">Affordable pricing</strong>
                  <span className="text-muted-foreground">Starting at {startPrice} â€” best value</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block text-foreground">Zero account risk</strong>
                  <span className="text-muted-foreground">No password, 100% safe</span>
                </div>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-card border border-border/40 rounded-lg text-sm flex gap-2 items-start">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Great for:</strong> <span className="text-muted-foreground">Building social proof, impressing visitors and growing fast</span>
              </div>
            </div>
            
            {/* CTA BUTTON WITH INTERACTIVE HOVER */}
            <div 
              className={`mt-6 pt-4 border-t border-border/40`}
            >
              <div 
                className={`group flex items-center justify-center gap-2 rounded-full py-3 font-bold transition-all duration-200 ease-out cursor-pointer hover:-translate-y-[2px] hover:scale-[1.025] hover:brightness-[1.06] active:scale-[0.97] active:brightness-[1.06] active:shadow-[0_4px_16px_rgba(var(--primary),0.2)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isFacebook ? 'bg-blue-500 text-white hover:shadow-[0_4px_16px_rgba(59,130,246,0.3)]' : 
                  isTiktok ? 'bg-cyan-500 text-white hover:shadow-[0_4px_16px_rgba(6,182,212,0.3)]' : 
                  isInstagram ? 'bg-pink-500 text-white hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)]' : 
                  'bg-primary text-primary-foreground hover:shadow-[0_4px_16px_rgba(var(--primary),0.3)]'
                }`}
                onClick={(e) => {
                  e.stopPropagation(); // Avoid triggering parent if any
                  setFollowerType('real');
                }}
              >
                <span>Start growing</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-[4px] group-active:translate-x-[4px] motion-reduce:transform-none" />
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      {/* Niche-Targeted Followers Card - NO HOVER ON CARD */}
      <button 
        className="text-left w-full h-full cursor-default"
        type="button"
      >
        <Card className={`h-full relative overflow-hidden ${
          isTwitter 
            ? 'border-neutral-500/50 bg-gradient-to-b from-neutral-500/5 to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:hover:-translate-y-0.5 md:hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0' 
            : isFacebook 
              ? 'border-blue-500/50 bg-gradient-to-b from-blue-500/5 to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:hover:-translate-y-0.5 md:hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0' 
              : isTiktok
                ? 'border-pink-500/50 bg-gradient-to-b from-cyan-500/5 via-transparent to-pink-500/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:hover:-translate-y-0.5 md:hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0'
                : 'border-pink-500/50 bg-gradient-to-b from-pink-500/5 to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:hover:-translate-y-0.5 md:hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0'
        }`}>
          <div className={`absolute top-0 right-0 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-md ${
            isTwitter ? 'bg-gradient-to-r from-neutral-400 to-neutral-600' : isFacebook ? 'bg-gradient-to-r from-blue-400 to-blue-600' : isTiktok ? 'bg-gradient-to-r from-cyan-500 to-pink-500' : 'bg-gradient-to-r from-orange-500 to-pink-500'
          }`}>
            <Star className="h-3 w-3 fill-current" /> RECOMMENDED
          </div>
          <CardHeader className="pb-4 pt-8">
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-xl border flex items-center justify-center text-2xl h-12 w-12 ${
                isTwitter 
                  ? 'bg-gradient-to-br from-neutral-400/20 to-neutral-600/20 border-neutral-500/30' 
                  : isFacebook 
                    ? 'bg-gradient-to-br from-blue-400/20 to-blue-600/20 border-blue-500/30' 
                    : isTiktok
                      ? 'bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border-pink-500/30'
                      : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-pink-500/30'
              }`}>
                <Target className={`h-6 w-6 ${isTwitter ? 'text-neutral-400' : isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : 'text-pink-500'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">Niche-Targeted</CardTitle>
                <p className={`text-sm font-medium ${isTwitter ? 'text-neutral-400' : isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : 'text-pink-500'}`}>
                  Qualified audience that buys
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Followers from your specific niche - people who <strong className="text-foreground">genuinely care</strong> about what you post, comment, like and buy your products.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm">
                <Flame className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isTwitter ? 'text-neutral-400' : isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : 'text-pink-500'}`} />
                <div>
                  <strong className="block text-foreground">3x More Engagement</strong>
                  <span className="text-muted-foreground">More likes, comments and real reach</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Wallet className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isTwitter ? 'text-neutral-400' : isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : 'text-pink-500'}`} />
                <div>
                  <strong className="block text-foreground">Audience That Buys</strong>
                  <span className="text-muted-foreground">Followers ready to become your clients</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <BarChart className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isTwitter ? 'text-neutral-400' : isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : 'text-pink-500'}`} />
                <div>
                  <strong className="block text-foreground">Explore Page Reach</strong>
                  <span className="text-muted-foreground">{platformName} delivers more to your niche</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Target className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isTwitter ? 'text-neutral-400' : isFacebook ? 'text-blue-500' : isTiktok ? 'text-cyan-500' : 'text-pink-500'}`} />
                <div>
                  <strong className="block text-foreground">Targeted for You</strong>
                  <span className="text-muted-foreground">Fitness, Fashion, Business, Food and more</span>
                </div>
              </li>
            </ul>
            <div className={`mt-4 p-3 rounded-lg text-sm border flex gap-2 items-start ${
              isTwitter ? 'bg-neutral-500/5 border-neutral-500/20' : isFacebook ? 'bg-blue-500/5 border-blue-500/20' : isTiktok ? 'bg-pink-500/5 border-pink-500/20' : 'bg-pink-500/5 border-pink-500/20'
            }`}>
              <Star className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-500 fill-yellow-500" /> 
              <div>
                <strong className="text-foreground">Great for:</strong> <span className="text-muted-foreground">Sellers, course creators and creators who want to sell more</span>
              </div>
            </div>

            {/* CTA BUTTON WITH INTERACTIVE HOVER */}
            <div className="mt-6 pt-4 border-t border-border/40">
              <div 
                className={`group flex items-center justify-center gap-2 text-white rounded-full py-3 font-bold shadow-lg cursor-pointer transition-all duration-200 ease-out hover:-translate-y-[2px] hover:scale-[1.025] hover:brightness-[1.06] active:scale-[0.97] active:brightness-[1.06] active:shadow-[0_4px_16px_rgba(236,72,153,0.3)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isTwitter ? 'bg-gradient-to-r from-neutral-500 to-neutral-700 hover:shadow-[0_4px_16px_rgba(163,163,163,0.3)]' : 
                  isFacebook ? 'bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-[0_4px_16px_rgba(59,130,246,0.3)]' : 
                  isTiktok ? 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)]' : 
                  'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-[0_4px_16px_rgba(236,72,153,0.3)]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFollowerType('niche');
                }}
              >
                <span>Find my audience</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-[4px] group-active:translate-x-[4px] motion-reduce:transform-none" />
              </div>
            </div>
            
          </CardContent>
        </Card>
      </button>
    </div>
  );
}
