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
import {
  AdminButton,
  AdminStatusBadge,
  PlatformIcon,
  MobileDataCard,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
} from "../ui";

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

  const kpis = [
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      description: "Real paid sales",
      icon: DollarSign,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      description: "All registered checkouts",
      icon: ShoppingBag,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Paid Orders",
      value: String(stats.paidOrders),
      description: "Verified payments",
      icon: CheckCircle2,
      iconBg: "bg-[#E8F8F2] text-[#16B77A]",
      valueColor: stats.paidOrders > 0 ? "text-[#16B77A]" : "text-[#142126]",
    },
    {
      label: "Conversion",
      value: stats.conversionRate,
      description: "Session-level ratio",
      icon: TrendingUp,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Avg Order Value",
      value: `$${stats.averageOrderValue}`,
      description: "Average per paid customer",
      icon: Layers,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[650] text-[#142126] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[13px] text-[#65737A] mt-0.5">
            Monitor revenue, orders and fulfillment performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </AdminButton>
        </div>
      </div>

      {/* Top 5 KPI Cards - Design System standard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#65737A] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className={`text-[22px] font-bold tracking-tight ${kpi.valueColor}`}>
                  {kpi.value}
                </div>
                <p className="text-[11px] text-[#8A979D] mt-0.5">
                  {kpi.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-[12px] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="flex items-center gap-1 font-semibold underline hover:opacity-80 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Main Grid: Revenue Overview & Platform Share (2fr / 1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart Area */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                REVENUE OVERVIEW
              </h3>
              <p className="text-[12px] text-[#65737A] mt-0.5">
                Real-time performance analytics.
              </p>
            </div>
            <div className="flex items-center bg-[#F1F5F5] border border-[#D9E2E3] rounded-[7px] p-0.5 text-[12px] font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPeriod("7d")}
                className={`px-3 py-1 rounded-[5px] text-[12px] font-medium transition-colors ${
                  period === "7d"
                    ? "bg-[#FFFFFF] text-[#142126] shadow-xs font-semibold"
                    : "text-[#65737A] hover:text-[#142126]"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setPeriod("30d")}
                className={`px-3 py-1 rounded-[5px] text-[12px] font-medium transition-colors ${
                  period === "30d"
                    ? "bg-[#FFFFFF] text-[#142126] shadow-xs font-semibold"
                    : "text-[#65737A] hover:text-[#142126]"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Empty Chart State (Zero Mocks) */}
          <div className="h-60 rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col items-center justify-center text-center p-6 my-2">
            <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-[13px] font-semibold text-[#142126]">
              {stats.paidOrders === 0 ? "No chart data available for this timeframe" : "Live timeline active"}
            </p>
            <span className="text-[11px] text-[#65737A] mt-1 max-w-sm">
              Real-time daily graphs automatically aggregate as transactions are completed.
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#65737A] pt-3 mt-2 border-t border-[#D9E2E3]">
            <span>Period: {period === "7d" ? "Last 7 Days" : "Last 30 Days"}</span>
            <span className="text-[#16B77A] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16B77A]" />
              Live sync active
            </span>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)] flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                PLATFORM SHARE
              </h3>
              <p className="text-[12px] text-[#65737A] mt-0.5">
                Distribution of revenue across networks
              </p>
            </div>

            <div className="space-y-4">
              {(["instagram", "tiktok", "twitter", "youtube"] as Platform[]).map((pKey) => {
                const item = stats.platformBreakdown[pKey] || { count: 0, revenue: 0, percentage: 0 };
                const label =
                  pKey === "instagram" ? "Instagram" :
                  pKey === "tiktok" ? "TikTok" :
                  pKey === "twitter" ? "X (Twitter)" : "YouTube";

                return (
                  <div key={pKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={pKey} size={18} />
                        <span className="font-semibold text-[#142126]">{label}</span>
                      </div>
                      <span className="text-[#65737A] font-medium font-mono">
                        ${item.revenue.toFixed(2)}{" "}
                        <span className="text-[#8A979D]">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F1F5F5] overflow-hidden border border-[#E5ECEC]">
                      <div
                        className="h-full rounded-full bg-[#0F8F8A] transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#D9E2E3] text-[11px] text-[#65737A] flex items-center justify-between">
            <span>Supported: 4 Networks</span>
            <span className="text-[#142126] font-medium">CloutFlow Engine</span>
          </div>
        </div>
      </div>

      {/* Latest Orders Section - Full width table & mobile cards */}
      <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
              RECENT ORDERS
            </h3>
            <p className="text-[12px] text-[#65737A] mt-0.5">
              Real-time incoming customer transactions
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="text-[12px] font-semibold text-[#0F8F8A] hover:text-[#0C736F] flex items-center gap-1 cursor-pointer transition-colors"
          >
            View all orders <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-12 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
            <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-[13px] font-semibold text-[#142126]">No orders registered yet</p>
            <span className="text-[11px] text-[#65737A] mt-1 block">
              Completed gateway webhooks will register transactions here in real-time.
            </span>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>Order ID</AdminTableHead>
                    <AdminTableHead>Platform</AdminTableHead>
                    <AdminTableHead>Customer</AdminTableHead>
                    <AdminTableHead>Plan</AdminTableHead>
                    <AdminTableHead className="text-right">Amount</AdminTableHead>
                    <AdminTableHead className="text-center">Status</AdminTableHead>
                    <AdminTableHead className="text-right">Date</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {stats.recentOrders.map((order) => {
                    const orderPublicId = (order as { publicId?: string }).publicId || order.id.slice(0, 8);
                    return (
                      <AdminTableRow key={order.id}>
                        <AdminTableCell className="font-mono text-[#65737A]">
                          #{orderPublicId}
                        </AdminTableCell>
                        <AdminTableCell>
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={order.platform} size={18} />
                            <span className="capitalize text-[#142126] font-medium">{order.platform}</span>
                          </div>
                        </AdminTableCell>
                        <AdminTableCell className="font-medium text-[#142126]">
                          @{order.username}
                        </AdminTableCell>
                        <AdminTableCell className="text-[#65737A]">
                          {order.plan}
                        </AdminTableCell>
                        <AdminTableCell className="text-right font-bold text-[#142126] font-mono">
                          ${order.amount.toFixed(2)}
                        </AdminTableCell>
                        <AdminTableCell className="text-center">
                          <AdminStatusBadge status={order.status} />
                        </AdminTableCell>
                        <AdminTableCell className="text-right text-[#8A979D] text-[11px]">
                          {order.date}
                        </AdminTableCell>
                      </AdminTableRow>
                    );
                  })}
                </AdminTableBody>
              </AdminTable>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {stats.recentOrders.map((order) => {
                const orderPublicId = (order as { publicId?: string }).publicId || order.id.slice(0, 8);
                return (
                  <MobileDataCard
                    key={order.id}
                    platform={order.platform}
                    title={`#${orderPublicId}`}
                    subtitle={`@${order.username} • ${order.plan}`}
                    status={<AdminStatusBadge status={order.status} />}
                    metrics={[
                      { label: "Platform", value: order.platform },
                      { label: "Amount", value: `$${order.amount.toFixed(2)}` },
                      { label: "Date", value: order.date },
                    ]}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
