"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { 
  DollarSign, 
  ShoppingCart, 
  Activity, 
  Package,
  ArrowUpRight
} from "lucide-react";

export function DashboardContent() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-destructive">Failed to load dashboard data.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(Number(stats.revenueToday))}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(Number(stats.revenueMonth))}</div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String(stats.ordersToday)}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders placed today</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Fulfillments</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String(stats.processingFulfillments)}</div>
            <p className="text-xs text-muted-foreground mt-1 text-amber-500">Requires attention</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders placeholder - we can flesh this out more if needed */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(stats.recentOrders) && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order: Record<string, unknown>) => (
                <div key={String(order.id)} className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{String(order.publicId)}</p>
                    <p className="text-sm text-muted-foreground">{String(order.username || 'No username')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(Number(order.totalCents))}</p>
                    <p className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full mt-1 inline-block">
                      {String(order.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent orders</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
