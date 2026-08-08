"use client";

import { useFunnelStore } from "@/stores/funnel.store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function FollowerTypeSelector({ platform = 'instagram' }: { platform?: string }) {
  const { setFollowerType } = useFunnelStore();

  const isTiktok = platform === 'tiktok';
  const isTwitter = platform === 'twitter';
  const isFacebook = platform === 'facebook';
  
  let iconText = "👥";
  let startPrice = "$7.90";
  
  if (isTiktok) {
    iconText = "🎵";
    startPrice = "$9.90";
  } else if (isTwitter) {
    iconText = "🐦";
    startPrice = "$9.90";
  } else if (isFacebook) {
    iconText = "📘";
    startPrice = "$7.90";
  }

  const platformName = platform === 'twitter' ? 'Twitter (X)' : platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8">
      {/* Real Followers Card */}
      <button 
        className="text-left w-full h-full"
        onClick={() => setFollowerType('real')}
      >
        <Card className="h-full border-border/40 hover:border-primary/50 transition-all hover:bg-muted/30 cursor-pointer relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-bl-lg z-10 flex items-center gap-1 border-b border-l border-primary/20">
            BEST VALUE
          </div>
          <CardHeader className="pb-4 pt-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-primary/10 p-3 rounded-xl flex items-center justify-center text-2xl h-12 w-12 border border-primary/20">
                {iconText}
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
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">⚡</span>
                <div>
                  <strong className="block text-foreground">Delivery in up to 24h</strong>
                  <span className="text-muted-foreground">Starts arriving right after payment</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">✅</span>
                <div>
                  <strong className="block text-foreground">100% Real Followers</strong>
                  <span className="text-muted-foreground">Real and active accounts, no bots</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">💰</span>
                <div>
                  <strong className="block text-foreground">Affordable pricing</strong>
                  <span className="text-muted-foreground">Starting at {startPrice} — best value</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">🛡️</span>
                <div>
                  <strong className="block text-foreground">Zero account risk</strong>
                  <span className="text-muted-foreground">No password · 100% safe</span>
                </div>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-card border border-border/40 rounded-lg text-sm">
              ✅ <strong className="text-foreground">Great for:</strong> <span className="text-muted-foreground">Building social proof, impressing visitors and growing fast</span>
            </div>
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-2 text-foreground bg-secondary/50 rounded-full py-3 font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <span>Start growing</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </button>

      {/* Niche-Targeted Followers Card */}
      <button 
        className="text-left w-full h-full"
        onClick={() => setFollowerType('niche')}
      >
        <Card className="h-full border-pink-500/50 bg-gradient-to-b from-pink-500/5 to-transparent hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-md">
            ⭐ RECOMMENDED
          </div>
          <CardHeader className="pb-4 pt-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-xl border border-pink-500/30 flex items-center justify-center text-2xl h-12 w-12">
                🎯
              </div>
              <div>
                <CardTitle className="text-xl">Niche-Targeted</CardTitle>
                <p className="text-sm text-pink-500 font-medium">Qualified audience that buys</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Followers from your specific niche — people who <strong className="text-foreground">genuinely care</strong> about what you post, comment, like and buy your products.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">🔥</span>
                <div>
                  <strong className="block text-foreground">3x More Engagement</strong>
                  <span className="text-muted-foreground">More likes, comments and real reach</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">💸</span>
                <div>
                  <strong className="block text-foreground">Audience That Buys</strong>
                  <span className="text-muted-foreground">Followers ready to become your clients</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">📊</span>
                <div>
                  <strong className="block text-foreground">Explore Page Reach</strong>
                  <span className="text-muted-foreground">{platformName} delivers more to your niche</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none">🎯</span>
                <div>
                  <strong className="block text-foreground">Targeted for You</strong>
                  <span className="text-muted-foreground">Fitness, Fashion, Business, Food and more</span>
                </div>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-pink-500/5 border border-pink-500/20 rounded-lg text-sm">
              🌟 <strong className="text-foreground">Great for:</strong> <span className="text-muted-foreground">Sellers, course creators and creators who want to sell more</span>
            </div>
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full py-3 font-bold group-hover:opacity-90 transition-opacity shadow-lg">
              <span>Find my audience</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </button>
    </div>
  );
}