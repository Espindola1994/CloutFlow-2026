"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFunnelStore } from "@/stores/funnel.store";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { platformSlug, serviceSlug, username, planId } = useFunnelStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // We mock the fetched plan data based on planId for demo
  const mockPlan = {
    quantity: 1000,
    priceCents: 1299,
    currency: 'USD',
    name: 'Followers'
  };

  useEffect(() => {
    if (!username || !planId) {
      router.push("/");
    }
  }, [username, planId, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    
    // Here we would call our real backend API to create the order and get payment link
    try {
      // Simulate API call to Centerpag
      await new Promise(r => setTimeout(r, 1500));
      
      toast.success("Order created! Redirecting to payment...");
      router.push(`/checkout/success?orderId=ORD-${Math.floor(Math.random() * 1000000)}`);
    } catch (error) {
      toast.error("Failed to process checkout");
      setLoading(false);
    }
  };

  if (!username || !planId) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container w-full max-w-[1200px] px-4 md:px-6 lg:px-8 mx-auto">
          <Button 
            variant="ghost" 
            className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <h1 className="text-3xl font-bold tracking-tight mb-8">Secure Checkout</h1>
              
              <Card className="border-border bg-surface-elevated">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-surface border-border"
                      />
                      <p className="text-xs text-muted-foreground">We'll send your receipt and tracking link here.</p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border bg-surface-elevated sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Target Profile</span>
                    <span className="font-medium">@{username}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium capitalize">{mockPlan.quantity.toLocaleString()} {platformSlug} {mockPlan.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatMoney(mockPlan.priceCents, mockPlan.currency)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button form="checkout-form" type="submit" size="lg" className="w-full text-lg h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:brightness-110 shadow-lg border-0" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Pay Securely"}
                  </Button>
                  
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
                    <ShieldCheck className="mr-1 h-4 w-4 text-emerald-500" />
                    256-bit SSL Secure Checkout
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}