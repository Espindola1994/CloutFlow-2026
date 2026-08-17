"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  TrendingUp, 
  Layers,
  ArrowUpRight,
  Clock,
  RefreshCw
} from "lucide-react";
import { Order, Platform } from "../types";

interface DashboardOverviewProps {
  onNavigateToOrders: () => void;
}

export function DashboardOverview({ onNavigateToOrders }: DashboardOverviewProps) {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    conversionRate: string;
    averageOrderValue: string;
    platformBreakdown: Record<string, { count: number; revenue: number; percentage: number }>;
    recentOrders: Order[];
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    paidOrders: 0,
    conversionRate: "N/A",
    averageOrderValue: "0.00",
    platformBreakdown: {
      instagram: { count: 0, revenue: 0, percentage: 0 },
      tiktok: { count: 0, revenue: 0, percentage: 0 },
      twitter: { count: 0, revenue: 0, percentage: 0 },
      youtube: { count: 0, revenue: 0, percentage: 0 },
    },
    recentOrders: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();

      if (res.ok && json.success) {
        setStats(json.data);
      } else {
        setError(json.error?.message || "Unable to load dashboard data");
      }
    } catch {
      setError("Unable to connect to dashboard API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Real paid sales</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats.totalOrders}
          </div>
          <p className="text-xs text-neutral-500 mt-1">All registered checkouts</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Paid Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats.paidOrders}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Verified payments</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats.conversionRate}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Session-level ratio</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${stats.averageOrderValue}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Average per paid customer</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="flex items-center gap-1 font-bold underline hover:opacity-80 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Main Grid: Revenue Overview & Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart Area */}
        <div className="lg:col-span-2 bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Revenue Overview</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Real-time performance analytics</p>
            </div>
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPeriod("7d")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  period === "7d" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setPeriod("30d")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  period === "30d" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Empty Chart State (Zero Mocks) */}
          <div className="h-60 rounded-xl bg-neutral-950/50 border border-neutral-800/50 flex flex-col items-center justify-center text-center p-6 my-2">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">
              {stats.paidOrders === 0 ? "No chart data available for this timeframe" : "Live timeline active"}
            </p>
            <span className="text-xs text-neutral-500 mt-1 max-w-sm">
              Real-time daily graphs automatically aggregate as transactions are completed.
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/60">
            <span>Period: {period === "7d" ? "Last 7 Days" : "Last 30 Days"}</span>
            <span className="text-emerald-400 font-medium">Live sync active</span>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-1">Platform Share</h3>
            <p className="text-xs text-neutral-400 mb-5">Distribution of revenue across networks</p>

            <div className="space-y-4">
              {(["instagram", "tiktok", "twitter", "youtube"] as Platform[]).map((pKey) => {
                const item = stats.platformBreakdown[pKey] || { count: 0, revenue: 0, percentage: 0 };
                const color = 
                  pKey === "instagram" ? "#E1306C" :
                  pKey === "tiktok" ? "#25F4EE" :
                  pKey === "twitter" ? "#1D9BF0" : "#FF0000";

                const label =
                  pKey === "instagram" ? "Instagram" :
                  pKey === "tiktok" ? "TikTok" :
                  pKey === "twitter" ? "X / Twitter" : "YouTube";

                return (
                  <div key={pKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-200">{label}</span>
                      <span className="text-neutral-400">${item.revenue.toFixed(2)} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-800/60 text-xs text-neutral-400 flex items-center justify-between">
            <span>Supported: 4 Networks</span>
            <span className="text-neutral-300 font-medium">CloutFlow Engine</span>
          </div>
        </div>
      </div>

      {/* Latest Orders */}
      <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Orders</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Real-time incoming customer transactions</p>
          </div>
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            View all orders <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500 mx-auto mb-2">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">No orders registered yet</p>
            <span className="text-xs text-neutral-500 mt-1 block">
              Completed gateway webhooks will register transactions here in real-time.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3 font-mono text-neutral-400">#{(order as any).publicId || order.id.slice(0, 8)}</td>
                    <td className="py-3 capitalize">{order.platform}</td>
                    <td className="py-3">@{order.username}</td>
                    <td className="py-3">{order.plan}</td>
                    <td className="py-3 font-bold text-white">${order.amount.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                        order.status === "paid" ? "bg-blue-500/10 text-blue-400" :
                        order.status === "failed" ? "bg-red-500/10 text-red-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-500">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
