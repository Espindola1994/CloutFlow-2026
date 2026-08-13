"use client";

import { useFunnelStore } from "@/stores/funnel.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export function PlanSelector({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { setPlan, platformSlug, serviceSlug } = useFunnelStore();

  const handleSelectPlan = (planId: string) => {
    setPlan(planId);
    router.push("/checkout");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg ${plan.popular ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.15)] scale-[1.02]' : 'border-border/40'}`}
        >
          {plan.popular && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
              <Star className="h-3 w-3 fill-current" /> POPULAR
            </div>
          )}
          
          <CardHeader className="text-center pb-4 pt-8">
            <CardTitle className="text-3xl font-extrabold">{plan.quantity.toLocaleString()}</CardTitle>
            <p className="text-muted-foreground uppercase tracking-wider text-sm font-medium mt-1">
              {plan.name.replace(/[0-9]/g, '').trim() || 'Followers/Likes'}
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center">
            <div className="mb-6 flex items-baseline">
              <span className="text-4xl font-bold tracking-tight text-primary">
                {formatMoney(plan.salePriceCents || plan.regularPriceCents, plan.currency)}
              </span>
              {plan.salePriceCents && plan.salePriceCents < plan.regularPriceCents && (
                <span className="ml-2 text-sm line-through text-muted-foreground">
                  {formatMoney(plan.regularPriceCents, plan.currency)}
                </span>
              )}
            </div>
            
            <ul className="space-y-3 mb-8 w-full px-4">
              <li className="flex items-center text-sm">
                <Check className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>High Quality</span>
              </li>
              <li className="flex items-center text-sm">
                <Check className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>No Password Required</span>
              </li>
              <li className="flex items-center text-sm">
                <Check className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>{plan.deliveryEstimate || 'Instant Delivery'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Check className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>24/7 Support</span>
              </li>
            </ul>
            
            <Button 
              className={`w-full h-12 text-lg font-medium rounded-full ${plan.popular ? '' : 'variant-outline'}`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              Select Package
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}