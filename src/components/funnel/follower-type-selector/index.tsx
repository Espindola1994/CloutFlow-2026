"use client";

import { useFunnelStore } from "@/stores/funnel.store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Target, Users } from "lucide-react";

export function FollowerTypeSelector({ platform = 'instagram' }: { platform?: string }) {
  const { setFollowerType } = useFunnelStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8">
      {/* Real Followers Card */}
      <button 
        className="text-left w-full h-full"
        onClick={() => setFollowerType('real')}
      >
        <Card className="h-full border-border/40 hover:border-primary/50 transition-all hover:bg-muted/30 cursor-pointer relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10"></div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
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
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <strong className="block text-foreground">Delivery in up to 24h</strong>
                  <span className="text-muted-foreground">Starts arriving right after payment</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <strong className="block text-foreground">100% Real Followers</strong>
                  <span className="text-muted-foreground">Real and active accounts, no bots</span>
                </div>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-primary font-bold">
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
        <Card className="h-full border-primary/50 bg-gradient-to-b from-primary/5 to-transparent hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
            ⭐ RECOMMENDED
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 p-3 rounded-xl border border-pink-500/20">
                <Target className="h-6 w-6 text-pink-500" />
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
                <CheckCircle2 className="h-4 w-4 text-pink-500 mt-0.5" />
                <div>
                  <strong className="block text-foreground">3x More Engagement</strong>
                  <span className="text-muted-foreground">More likes, comments and real reach</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-pink-500 mt-0.5" />
                <div>
                  <strong className="block text-foreground">Audience That Buys</strong>
                  <span className="text-muted-foreground">Followers ready to become your clients</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-pink-500 mt-0.5" />
                <div>
                  <strong className="block text-foreground">Explore Page Reach</strong>
                  <span className="text-muted-foreground">{platform.charAt(0).toUpperCase() + platform.slice(1)} delivers more to your niche</span>
                </div>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-pink-500 font-bold">
              <span>Find my audience</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </button>
    </div>
  );
}