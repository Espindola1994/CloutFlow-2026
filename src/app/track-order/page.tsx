"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Package, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError("");
    
    // Simulate API call for now since we don't have public order fetching route active yet
    try {
      await new Promise(r => setTimeout(r, 1000));
      
      // Mock data response
      if (orderId.length > 5) {
        setOrder({
          publicId: orderId.toUpperCase(),
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          fulfillmentStatus: 'PROCESSING',
          createdAt: new Date().toISOString(),
          totalCents: 1299,
          currency: 'USD',
          target: '@username',
          service: 'Instagram Followers',
          quantity: 1000
        });
      } else {
        setError("Order not found. Please check your order ID and try again.");
        setOrder(null);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
      case 'PROCESSING': return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      default: return <Clock className="h-6 w-6 text-amber-500" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-24">
        <div className="container px-4 mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Track Your Order
            </h1>
            <p className="text-lg text-muted-foreground">
              Enter your Order ID below to check the real-time status of your delivery.
            </p>
          </div>

          <Card className="border-border bg-surface-elevated mb-8 shadow-xl">
            <CardContent className="p-6">
              <form onSubmit={handleTrack} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter Order ID (e.g. ORD-A1B2C3D4)" 
                    className="pl-10 h-12 text-lg"
                    required
                  />
                </div>
                <Button type="submit" className="h-12 px-8" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Track"}
                </Button>
              </form>
              {error && <p className="text-destructive mt-4 text-sm font-medium">{error}</p>}
            </CardContent>
          </Card>

          {order && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-border overflow-hidden bg-surface">
                <div className="bg-surface-elevated px-6 py-4 flex justify-between items-center border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-mono font-bold">{order.publicId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="flex flex-col items-center text-center p-4 bg-surface-elevated border border-border rounded-lg">
                      <CreditCard className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className="font-bold">{order.paymentStatus}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <Package className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Delivery Status</p>
                      <p className="font-bold flex items-center gap-2">
                        {getStatusIcon(order.fulfillmentStatus)}
                        {order.fulfillmentStatus}
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-surface-elevated border border-border rounded-lg">
                      <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Target Profile</p>
                      <p className="font-bold">{order.target}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold mb-4">Order Details</h3>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{order.quantity.toLocaleString()} {order.service}</span>
                      <span className="font-medium">{formatMoney(order.totalCents, order.currency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}