"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20 relative">
        <div className="container px-4 mx-auto relative z-10">
          <Button 
            variant="ghost" 
            className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push(`/`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back Home
          </Button>

          <div className="max-w-3xl mb-12">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 capitalize">
              Select a {params.platform} Service
            </h1>
            <p className="text-lg text-muted-foreground">
              What do you want to grow today? Choose a service below to configure your campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((svc) => (
              <Link key={String(svc.slug)} href={`/${params.platform}/${String(svc.slug)}`}>
                <Card className="h-full group hover:border-primary/50 transition-all hover:bg-muted/50 cursor-pointer relative overflow-hidden">
                  {svc.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
                      <Star className="h-3 w-3 fill-current" /> BEST SELLER
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <div>
                      <CardTitle className="text-2xl mb-2">{String(svc.name)}</CardTitle>
                      <p className="text-muted-foreground">{String(svc.desc)}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}