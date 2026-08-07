"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useFunnelStore } from "@/stores/funnel.store";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { reset } = useFunnelStore();

  useEffect(() => {
    // Clean up funnel store after successful order placement
    if (orderId) {
      reset();
    }
  }, [orderId, reset]);

  return (
    <div className="container px-4 mx-auto max-w-2xl text-center">
      <div className="mb-8 flex justify-center">
        <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
        Payment Complete!
      </h1>
      
      <p className="text-xl text-muted-foreground mb-8">
        Thank you for your order. We are now processing it.
      </p>
      
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm mb-12">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-sm text-muted-foreground mb-1">Order Tracking Number</p>
              <p className="text-2xl font-mono font-bold text-primary">{orderId || 'Loading...'}</p>
            </div>
            <Link href={`/track-order?id=${orderId}`}>
              <Button variant="secondary">
                Track Order <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-4">
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
        <Link href="/instagram">
          <Button>Start Another Order</Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-24 flex items-center justify-center">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
          <SuccessContent />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}