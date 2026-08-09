"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFunnelStore } from "@/stores/funnel.store";
import { Header } from "@/components/layout/header";
import { PlanSelector } from "@/components/funnel/plan-selector";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlansPage() {
  const router = useRouter();
  const params = useParams() as { platform: string, service: string };
  const { username, profileData } = useFunnelStore();
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!username) {
      if (params.platform && params.service) {
        router.push(`/${params.platform}/${params.service}`);
      } else {
        router.push('/');
      }
      return;
    }

    // Mocking plans from DB
    // Setting state inside effect is fine here as it mimics fetching
    setPlans([
      { id: '1', name: '100', quantity: 100, regularPriceCents: 299, salePriceCents: 199, currency: 'USD', popular: false },
      { id: '2', name: '250', quantity: 250, regularPriceCents: 599, salePriceCents: 399, currency: 'USD', popular: false },
      { id: '3', name: '500', quantity: 500, regularPriceCents: 999, salePriceCents: 699, currency: 'USD', popular: false },
      { id: '4', name: '1000', quantity: 1000, regularPriceCents: 1999, salePriceCents: 1299, currency: 'USD', popular: true },
      { id: '5', name: '2500', quantity: 2500, regularPriceCents: 3999, salePriceCents: 2499, currency: 'USD', popular: false },
      { id: '6', name: '5000', quantity: 5000, regularPriceCents: 6999, salePriceCents: 4499, currency: 'USD', popular: false },
    ]);
  }, [username, params.platform, params.service, router]);

  if (!username) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container w-full max-w-[1200px] px-4 md:px-6 lg:px-8 mx-auto">
          <Button 
            variant="ghost" 
            className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push(`/${params.platform}/${params.service}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Change Profile
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Select Package
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We found <span className="font-bold text-foreground">@{username}</span>. 
              {profileData?.follower_count ? ` Currently has ${String(profileData.follower_count)} followers.` : ''}
              Choose how much you want to grow.
            </p>
          </div>

          <PlanSelector plans={plans} />
        </div>
      </main>
    </div>
  );
}