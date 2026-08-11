"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PlatformPage() {
  const router = useRouter();
  const params = useParams() as { platform: string };
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    // We would fetch this from DB. Mocking for demonstration of structure
    setServices([
      { name: "Followers", slug: "followers", desc: "High quality real followers", popular: true },
      { name: "Likes", slug: "likes", desc: "Instant post likes", popular: false },
      { name: "Views", slug: "views", desc: "Boost video reach", popular: false },
      { name: "Comments", slug: "comments", desc: "Custom relevant comments", popular: false }
    ]);
  }, [params.platform]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 py-12 md:py-20 relative">
        {/* Platform Glow Background (Generic / can be specialized later) */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(124,92,252,0.08),transparent_70%)] pointer-events-none" />

        <div className="container w-full max-w-[1200px] px-4 md:px-6 lg:px-8 mx-auto relative z-10">
          <Button 
            variant="ghost" 
            className="mb-8 pl-0 text-muted-foreground hover:bg-transparent hover:text-accent"
            onClick={() => router.push(`/`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back Home
          </Button>

          <div className="max-w-3xl mb-12">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 capitalize text-foreground">
              Select a {params.platform} Service
            </h1>
            <p className="text-lg text-muted-foreground">
              What do you want to grow today? Choose a service below to configure your campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((svc) => (
              <Link key={String(svc.slug)} href={`/${params.platform}/${String(svc.slug)}`}>
                <Card className="h-full group border-border bg-surface hover:border-primary/50 transition-all hover:bg-surface-elevated shadow-[0_12px_32px_rgba(0,0,0,0.30)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.40)] cursor-pointer relative overflow-hidden">
                  {svc.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
                      <Star className="h-3 w-3 fill-current" /> BEST SELLER
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <div>
                      <CardTitle className="text-2xl mb-2 text-foreground">{String(svc.name)}</CardTitle>
                      <p className="text-muted-foreground">{String(svc.desc)}</p>
                    </div>
                    <div className="bg-surface-elevated border border-border p-3 rounded-full text-muted-foreground group-hover:border-primary/50 group-hover:text-accent transition-colors">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}