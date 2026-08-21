"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAdminAutoRefresh } from "@/hooks/useAdminAutoRefresh";
import { 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  RefreshCw,
  RotateCcw,
  Receipt,
  Coins,
  Percent
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
    grossSales: number;
    netRevenue: number;
    refunds: number;
    chargebacks: number;
    perfectPayFees: number;
    providerCosts: number;
    netProfit: number;
    netMarginPercent: string;
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    refundedOrders: number;
    chargebackOrders: number;
    conversionRate: string;
    averageOrderValue: string;
    refundRate: string;
    chargebackRate: string;
    platformBreakdown: Record<string, { count: number; revenue: number; percentage: number }>;
    recentOrders: Order[];
  }>({
    grossSales: 0,
    netRevenue: 0,
    refunds: 0,
    chargebacks: 0,
    perfectPayFees: 0,
    providerCosts: 0,
    netProfit: 0,
    netMarginPercent: "0.0",
    totalRevenue: 0,
    totalOrders: 0,
    paidOrders: 0,
    refundedOrders: 0,
    chargebackOrders: 0,
    conversionRate: "N/A",
    averageOrderValue: "0.00",
    refundRate: "0.0",
    chargebackRate: "0.0",
    platformBreakdown: {
      instagram: { count: 0, revenue: 0, percentage: 0 },
      tiktok: { count: 0, revenue: 0, percentage: 0 },
      twitter: { count: 0, revenue: 0, percentage: 0 },
      youtube: { count: 0, revenue: 0, percentage: 0 },
    },
    recentOrders: [],
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const initialLoadDone = useRef(false);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsUpdating(true);
      }
      setError(null);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();

      if (res.ok && json.success) {
        setStats(json.data);
      } else {
        if (!silent) setError(json.error?.message || "Unable to load dashboard data");
      }
    } catch {
      if (!silent) setError("Unable to connect to dashboard API");
    } finally {
      setLoading(false);
      setIsUpdating(false);
      initialLoadDone.current = true;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDashboardData(false);
  }, []);

  // Realtime subscription + event revalidation + window focus + network reconnect
  useAdminAutoRefresh({
    entities: ["dashboard", "orders", "payment_leads"],
    supabaseTables: ["orders", "order_items", "payment_leads"],
    pollInterval: 30000, // 30s background sync
    onRevalidate: () => fetchDashboardData(true),
  });

  // Primary 6 Financial KPIs (USD Only)
  const primaryKpis = [
    {
      label: "Gross Sales",
      value: `$${(stats.grossSales ?? stats.totalRevenue ?? 0).toFixed(2)}`,
      description: "Total checkout volume",
      icon: DollarSign,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Net Revenue",
      value: `$${(stats.netRevenue ?? stats.totalRevenue ?? 0).toFixed(2)}`,
      description: "Excludes refunds/chargebacks",
      icon: CheckCircle2,
      iconBg: "bg-[#E8F8F2] text-[#16B77A]",
      valueColor: (stats.netRevenue ?? stats.totalRevenue ?? 0) > 0 ? "text-[#16B77A]" : "text-[#142126]",
    },
    {
      label: "Refunds",
      value: `$${(stats.refunds ?? 0).toFixed(2)}`,
      description: `${stats.refundedOrders ?? 0} refunded orders (${stats.refundRate ?? '0.0'}%)`,
      icon: RotateCcw,
      iconBg: "bg-[#FEECEB] text-[#EF4444]",
      valueColor: (stats.refunds ?? 0) > 0 ? "text-[#EF4444]" : "text-[#142126]",
    },
    {
      label: "PerfectPay Fees",
      value: `$${(stats.perfectPayFees ?? 0).toFixed(2)}`,
      description: "8.9% + $1.00 USD / transaction",
      icon: Coins,
      iconBg: "bg-[#FEF3C7] text-[#D97706]",
      valueColor: "text-[#D97706]",
    },
    {
      label: "Provider Costs",
      value: `$${(stats.providerCosts ?? 0).toFixed(2)}`,
      description: "Incurred fulfillment cost",
      icon: Receipt,
      iconBg: "bg-[#F1F5F5] text-[#65737A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Net Profit",
      value: (stats.netProfit ?? 0) < 0 ? `-$${Math.abs(stats.netProfit ?? 0).toFixed(2)}` : `$${(stats.netProfit ?? 0).toFixed(2)}`,
      description: `Margin: ${stats.netMarginPercent ?? '0.0'}%`,
      icon: TrendingUp,
      iconBg: (stats.netProfit ?? 0) >= 0 ? "bg-[#E8F8F2] text-[#16B77A]" : "bg-[#FEECEB] text-[#EF4444]",
      valueColor: (stats.netProfit ?? 0) >= 0 ? "text-[#16B77A]" : "text-[#EF4444]",
    },
  ];

  // Secondary Ratio KPIs
  const secondaryKpis = [
    {
      label: "Net Margin",
      value: `${stats.netMarginPercent ?? '0.0'}%`,
      description: "Profit / Net Revenue",
      icon: Percent,
    },
    {
      label: "AOV (Average Order)",
      value: `$${stats.averageOrderValue ?? '0.00'}`,
      description: "Average per paid order",
      icon: Layers,
    },
    {
      label: "Refund Rate",
      value: `${stats.refundRate ?? '0.0'}%`,
      description: "Refunds / Gross Sales",
      icon: RotateCcw,
    },
    {
      label: "Chargeback Rate",
      value: `${stats.chargebackRate ?? '0.0'}%`,
      description: "Disputes / Gross Sales",
      icon: RotateCcw,
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
            USD Financial KPIs, orders and fulfillment performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUpdating && (
            <span className="text-[11px] text-[#0F8F8A] font-medium animate-pulse flex items-center gap-1 bg-[#EAF6F5] px-2 py-0.5 rounded-full border border-[#0F8F8A]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F8F8A] animate-ping" />
              Updating...
            </span>
          )}
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(false)}
            disabled={loading || isUpdating}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${(loading || isUpdating) ? "animate-spin" : ""}`} />
            Refresh
          </AdminButton>
        </div>
      </div>

      {/* Primary Financial KPIs Grid (USD-Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className={`text-[20px] font-bold tracking-tight font-mono ${kpi.valueColor}`}>
                  {kpi.value}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5 truncate">
                  {kpi.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Financial Health Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFA] border border-[#D9E2E3] rounded-[9px] p-3">
        {secondaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#D9E2E3] flex items-center justify-center text-[#0F8F8A] shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10.5px] text-[#65737A] block font-medium uppercase tracking-wider">{kpi.label}</span>
                <span className="text-[15px] font-bold text-[#142126] font-mono">{kpi.value}</span>
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
            onClick={() => fetchDashboardData(false)}
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
                REVENUE OVERVIEW (USD)
              </h3>
              <p className="text-[12px] text-[#65737A] mt-0.5">
                Real-time USD sales and performance analytics.
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
              Real-time daily USD graphs automatically aggregate as transactions are completed.
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#65737A] pt-3 mt-2 border-t border-[#D9E2E3]">
            <span>Period: {period === "7d" ? "Last 7 Days" : "Last 30 Days"}</span>
            <span className="text-[#16B77A] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16B77A]" />
              USD Live sync active
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
                Distribution of USD net revenue across networks
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
            <span className="text-[#142126] font-medium">CloutFlow Engine (USD)</span>
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
              Real-time incoming customer transactions (USD)
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
            <div className="hidden md:block overflow-x-auto">
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>Order</AdminTableHead>
                    <AdminTableHead>Platform</AdminTableHead>
                    <AdminTableHead>Target</AdminTableHead>
                    <AdminTableHead>Product</AdminTableHead>
                    <AdminTableHead className="text-right">Gross</AdminTableHead>
                    <AdminTableHead className="text-right">PP Fee</AdminTableHead>
                    <AdminTableHead className="text-right">Provider Cost</AdminTableHead>
                    <AdminTableHead className="text-right">Net Profit</AdminTableHead>
                    <AdminTableHead className="text-center">Payment Status</AdminTableHead>
                    <AdminTableHead className="text-center">Fulfillment</AdminTableHead>
                    <AdminTableHead className="text-right">Date</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {stats.recentOrders.map((order) => {
                    const orderPublicId = order.publicId || order.id.slice(0, 8);
                    const gross = order.grossAmount ?? order.amount ?? 0;
                    const ppFee = order.perfectPayFee ?? ((gross * 0.089) + 1.00);
                    const cost = order.providerCost ?? 0;
                    const profit = order.netProfit ?? (order.status === 'paid' ? (gross - ppFee - cost) : -(ppFee + cost));

                    return (
                      <AdminTableRow key={order.id}>
                        <AdminTableCell className="font-mono text-[#65737A] font-semibold">
                          #{orderPublicId}
                        </AdminTableCell>
                        <AdminTableCell>
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={order.platform} size={18} />
                            <span className="capitalize text-[#142126] font-medium">{order.platform}</span>
                          </div>
                        </AdminTableCell>
                        <AdminTableCell className="font-medium text-[#142126]">
                          @{order.target || order.username}
                        </AdminTableCell>
                        <AdminTableCell className="text-[#65737A]">
                          {order.product || `${order.service} • ${order.plan}`}
                        </AdminTableCell>
                        <AdminTableCell className="text-right font-bold text-[#142126] font-mono">
                          ${gross.toFixed(2)}
                        </AdminTableCell>
                        <AdminTableCell className="text-right text-[#D97706] font-mono text-[12px]">
                          ${ppFee.toFixed(2)}
                        </AdminTableCell>
                        <AdminTableCell className="text-right text-[#65737A] font-mono text-[12px]">
                          ${cost.toFixed(2)}
                        </AdminTableCell>
                        <AdminTableCell className={`text-right font-bold font-mono text-[12px] ${profit >= 0 ? "text-[#16B77A]" : "text-[#EF4444]"}`}>
                          {profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `$${profit.toFixed(2)}`}
                        </AdminTableCell>
                        <AdminTableCell className="text-center">
                          <AdminStatusBadge status={order.status} />
                        </AdminTableCell>
                        <AdminTableCell className="text-center text-[11px] font-mono text-[#65737A]">
                          {order.fulfillmentStatus || order.providerStatus || 'NOT_DISPATCHED'}
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
                const orderPublicId = order.publicId || order.id.slice(0, 8);
                const gross = order.grossAmount ?? order.amount ?? 0;
                const ppFee = order.perfectPayFee ?? ((gross * 0.089) + 1.00);
                const cost = order.providerCost ?? 0;
                const profit = order.netProfit ?? (order.status === 'paid' ? (gross - ppFee - cost) : -(ppFee + cost));

                return (
                  <MobileDataCard
                    key={order.id}
                    platform={order.platform}
                    title={`#${orderPublicId}`}
                    subtitle={`@${order.target || order.username} • ${order.plan}`}
                    status={<AdminStatusBadge status={order.status} />}
                    metrics={[
                      { label: "Gross", value: `$${gross.toFixed(2)}` },
                      { label: "PP Fee", value: `$${ppFee.toFixed(2)}` },
                      { label: "Cost", value: `$${cost.toFixed(2)}` },
                      { label: "Net Profit", value: profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `$${profit.toFixed(2)}` },
                      { label: "Fulfillment", value: order.fulfillmentStatus || 'NOT_DISPATCHED' },
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

