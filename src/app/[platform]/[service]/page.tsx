"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFunnelStore } from "@/stores/funnel.store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProfileInput } from "@/components/funnel/profile-input";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlatformServicePage() {
  const router = useRouter();
  const params = useParams() as { platform: string, service: string };
  const { setPlatform, setService } = useFunnelStore();

  // We are resolving params properly for React 19 / Next.js 15
  useEffect(() => {
    // We would normally fetch the service from the DB here to validate it
    setPlatform(params.platform);
    setService(params.service);
  }, [params.platform, params.service, setPlatform, setService]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20 relative">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="container px-4 mx-auto relative z-10">
          <Button 
            variant="ghost" 
            className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push(`/${params.platform}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Button>

          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 capitalize">
              {params.platform} Growth
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 capitalize">
              {params.platform} {params.service.replace('-', ' ')}
            </h1>
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
      </main>
      
      <Footer />
    </div>
  );
}