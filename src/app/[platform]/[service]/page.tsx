"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFunnelStore } from "@/stores/funnel.store";
import { Header } from "@/components/layout/header";
import { ProfileInput } from "@/components/funnel/profile-input";
import { FollowerTypeSelector } from "@/components/funnel/follower-type-selector";
import { SocialGrowthVisual } from "@/components/funnel/social-growth-visual";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Button } from "@/components/ui/button";

export default function PlatformServicePage() {
  const router = useRouter();
  const params = useParams() as { platform: string, service: string };
  const { setPlatform, setService, followerType } = useFunnelStore();

  useEffect(() => {
    setPlatform(params.platform);
    setService(params.service);
  }, [params.platform, params.service, setPlatform, setService]);

  const showTypeSelector = (params.platform === 'instagram' || params.platform === 'tiktok' || params.platform === 'twitter' || params.platform === 'facebook') 
                           && params.service === 'followers' 
                           && !followerType;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-5 md:py-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="container w-full max-w-[1200px] px-4 md:px-6 lg:px-8 mx-auto relative z-10">
          <Button 
            variant="ghost" 
            className="mb-4 md:mb-6 pl-0 hover:bg-transparent hover:text-primary relative z-20 -ml-1"
            onClick={() => {
              if (followerType) {
                // If they picked a type, back button clears the type selection first
                useFunnelStore.getState().setFollowerType(null);
              } else {
                // If no type picked yet, go back to platforms
                router.push(`/${params.platform}`);
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {followerType ? "Back to Follower Types" : "Back to Services"}
          </Button>

          <div className="max-w-3xl mx-auto text-center mb-0">
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 capitalize">
              {params.platform === "instagram" && <FaInstagram className="w-3.5 h-3.5 shrink-0" />}
              {params.platform === "tiktok" && <FaTiktok className="w-3.5 h-3.5 shrink-0" />}
              {params.platform === "twitter" && <FaXTwitter className="w-3.5 h-3.5 shrink-0 text-primary" />}
              {params.platform === "facebook" && <FaFacebook className="w-3.5 h-3.5 shrink-0 text-[#1877F2]" />}
              {params.platform === 'twitter' ? 'Twitter (X)' : params.platform} Growth
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 capitalize">
              {params.platform === 'twitter' ? 'Twitter (X)' : params.platform} {params.service.replace('-', ' ')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {followerType || !showTypeSelector
                ? "Enter your profile details below to see the available packages and get started immediately."
                : "What type of followers do you want? Choose below and see the difference each option makes on your profile."
              }
            </p>
          </div>

          {/* O Telefone Animado 3D sempre entra aqui, LOGO ABAIXO do tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tulo */}
          {showTypeSelector && (
            <SocialGrowthVisual platform={params.platform} />
          )}

          {/* Show Type Selector if it's IG/TikTok/Twitter/Facebook Followers and they haven't picked a type yet */}
          {showTypeSelector ? (
            <div className="mt-8 md:mt-16 relative z-20">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-[20px] md:text-[24px] font-bold tracking-tight mb-3">What type of followers do you want?</h2>
                <p className="text-muted-foreground">
                  Choose below and see the difference each option makes on your profile:
                </p>
              </div>
              <FollowerTypeSelector platform={params.platform} />
            </div>
          ) : (
            <div className="mt-12">
              <div className="text-center mb-10">
                <p className="text-lg text-muted-foreground">
                  Enter your profile details below to see the available packages and get started immediately.
                </p>
              </div>
              <ProfileInput />
              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground text-sm">
                <div className="flex items-center bg-card/50 px-4 py-2 rounded-full border border-border/40">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> 
                  No passwords needed
                </div>
                <div className="flex items-center bg-card/50 px-4 py-2 rounded-full border border-border/40">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> 
                  Instant Start
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
