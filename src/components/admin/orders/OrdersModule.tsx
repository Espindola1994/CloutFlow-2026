"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAutoRefresh } from "@/hooks/useAdminAutoRefresh";
import { 
  ShoppingBag, 
  DollarSign, 
  PieChart, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Coins, 
  Receipt, 
  RotateCcw
} from "lucide-react";
import { Order } from "../types";
import {
  AdminButton,
  AdminSearchInput,
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

export function OrdersModule() {
  const [activeTab, setActiveTab] = useState<"orders" | "margins" | "attribution">("orders");
  
  // Real Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Real Margins State (USD Only)
  const [margins, setMargins] = useState<{
    grossSales: number;
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    chargebacks: number;
    providerCost: number;
    gatewayFees: number;
    perfectPayFees: number;
    netProfit: number;
    marginPercent: string;
    netMarginPercent: string;
    aov: string;
    refundRate: string;
    chargebackRate: string;
    paidOrdersCount: number;
    refundedOrdersCount: number;
    chargebackOrdersCount: number;
    totalOrdersCount: number;
  }>({
    grossSales: 0,
    grossRevenue: 0,
    netRevenue: 0,
    refunds: 0,
    chargebacks: 0,
    providerCost: 0,
    gatewayFees: 0,
    perfectPayFees: 0,
    netProfit: 0,
    marginPercent: "0.0",
    netMarginPercent: "0.0",
    aov: "0.00",
    refundRate: "0.0",
    chargebackRate: "0.0",
    paidOrdersCount: 0,
    refundedOrdersCount: 0,
    chargebackOrdersCount: 0,
    totalOrdersCount: 0,
  });

  // Real Attribution State
  const [campaigns, setCampaigns] = useState<Array<{
    source: string;
    campaign: string;
    medium: string;
    orders: number;
    paidOrders: number;
    revenue: number;
    aov: string;
  }>>([]);
  const [loadingAttribution, setLoadingAttribution] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Orders from real API
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      else setIsRefreshingOrders(true);
      
      setOrdersError(null);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      if (debouncedQuery) params.append("search", debouncedQuery);
      if (platformFilter !== "all") params.append("platform", platformFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setOrders(json.data.orders || []);
        setTotalOrdersCount(json.data.totalCount || 0);
      } else {
        if (!silent) setOrdersError(json.error?.message || "Failed to load orders");
      }
    } catch {
      if (!silent) setOrdersError("Unable to connect to orders API");
    } finally {
      setLoadingOrders(false);
      setIsRefreshingOrders(false);
    }
  }, [page, debouncedQuery, platformFilter, statusFilter]);

  // Realtime subscription + auto-refresh for Orders
  useAdminAutoRefresh({
    entities: ["orders", "fulfillment", "payment_leads"],
    supabaseTables: ["orders", "order_items", "fulfillment_orders", "payment_leads"],
    pollInterval: 15000, // 15s polling for external provider status updates 
    enabled: activeTab === "orders",
    onRevalidate: () => fetchOrders(true),
  });

  // Fetch Margins Ledger
  const [, setLoadingMargins] = useState(false);
  const fetchMargins = async (silent = false) => {
    try {
      if (!silent) setLoadingMargins(true);
      const res = await fetch("/api/admin/margins");
      const json = await res.json();
      if (res.ok && json.success) {
        setMargins(json.data);
      }
    } catch {
      // Safe fallback
    } finally {
      if (!silent) setLoadingMargins(false);
    }
  };

  useAdminAutoRefresh({
    entities: ["margins", "orders"],
    supabaseTables: ["orders"],
    enabled: activeTab === "margins",
    onRevalidate: () => fetchMargins(true),
  });

  // Fetch Real UTM Attribution
  const fetchAttribution = async (silent = false) => {
    try {
      if (!silent) setLoadingAttribution(true);
      
      const res = await fetch("/api/admin/attribution");
      const json = await res.json();
      if (res.ok && json.success) {
        setCampaigns(json.data.campaigns || []);
      }
    } catch {
      // Safe fallback
    } finally {
      setLoadingAttribution(false);
    }
  };
  
  useAdminAutoRefresh({
    entities: ["attribution", "orders"],
    supabaseTables: ["orders"],
    enabled: activeTab === "attribution",
    onRevalidate: () => fetchAttribution(true),
  });

  useEffect(() => {
    if (activeTab === "orders") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchOrders(false);
    } else if (activeTab === "margins") {
      void fetchMargins(false);
    } else if (activeTab === "attribution") {
      void fetchAttribution(false);
    }
  }, [activeTab, fetchOrders]);

  const totalPages = Math.ceil(totalOrdersCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[650] text-[#142126] tracking-tight">
            Orders & Margins
          </h1>
          <p className="text-[13px] text-[#65737A] mt-0.5">
            Track purchases, fulfillment costs and profitability.
          </p>
        </div>

        <div className="flex items-center bg-[#FFFFFF] border border-[#D9E2E3] rounded-[8px] p-1 text-[12px] font-semibold shadow-[0_1px_2px_rgba(10,35,42,0.03)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            All Orders ({totalOrdersCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("margins")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === "margins"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            Margins & Costs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attribution")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === "attribution"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            Attribution (UTMs)
          </button>
        </div>
      </div>

      {/* 1. ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Single Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
            <div className="flex-1">
              <AdminSearchInput
                placeholder="Search by Order ID, username, email or external ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-3 py-2 text-[12px] text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X (Twitter)</option>
                <option value="youtube">YouTube</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-3 py-2 text-[12px] text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              {isRefreshingOrders && (
                <span className="text-[11px] text-[#0F8F8A] font-medium animate-pulse flex items-center gap-1 bg-[#EAF6F5] px-2 py-0.5 rounded-full border border-[#0F8F8A]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8F8A] animate-ping" />
                  Updating...
                </span>
              )}

              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => fetchOrders(false)}
                disabled={loadingOrders || isRefreshingOrders}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${(loadingOrders || isRefreshingOrders) ? "animate-spin" : ""}`} />
                Refresh
              </AdminButton>
            </div>
          </div>

          {ordersError && (
            <div className="p-3.5 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-[12px] flex items-center justify-between">
              <span>{ordersError}</span>
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="flex items-center gap-1 font-semibold underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Orders Table Section */}
          <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
            {orders.length === 0 ? (
              <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
                <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-semibold text-[#142126]">No orders found</p>
                <span className="text-[11px] text-[#65737A] mt-1 block">
                  {totalOrdersCount === 0 ? "Completed gateway webhooks will register transactions here in real-time." : "Try adjusting your search criteria or platform filters."}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop View */}
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
                      {orders.map((order) => {
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
                                <span className="capitalize font-semibold text-[#142126]">{order.platform}</span>
                              </div>
                            </AdminTableCell>
                            <AdminTableCell>
                              <span className="text-[#142126] block font-semibold">@{order.target || order.username}</span>
                              {order.email && (
                                <span className="text-[11px] text-[#8A979D] truncate block max-w-[140px]">{order.email}</span>
                              )}
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
                  {orders.map((order) => {
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#D9E2E3] text-[12px] text-[#65737A]">
                    <span>Showing page {page} of {totalPages} ({totalOrdersCount} total)</span>
                    <div className="flex items-center gap-2">
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                      </AdminButton>
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </AdminButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MARGINS TAB (USD Only) */}
      {activeTab === "margins" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  Gross Sales
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-[20px] font-bold tracking-tight text-[#142126] font-mono">
                  ${(margins.grossSales ?? margins.grossRevenue ?? 0).toFixed(2)}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5">Total customer checkouts</p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  Net Revenue
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#E8F8F2] text-[#16B77A] flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-[20px] font-bold tracking-tight text-[#16B77A] font-mono">
                  ${(margins.netRevenue ?? margins.grossRevenue ?? 0).toFixed(2)}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5">Paid minus refunds</p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  Refunds
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#FEECEB] text-[#EF4444] flex items-center justify-center">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-[20px] font-bold tracking-tight text-[#EF4444] font-mono">
                  ${(margins.refunds ?? 0).toFixed(2)}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5">{margins.refundedOrdersCount ?? 0} refunded orders</p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  PerfectPay Fees
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-[20px] font-bold tracking-tight text-[#D97706] font-mono">
                  ${(margins.perfectPayFees ?? margins.gatewayFees ?? 0).toFixed(2)}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5">8.9% + $1.00 USD / sale</p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  Provider Cost
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F5] text-[#65737A] flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-[20px] font-bold tracking-tight text-[#142126] font-mono">
                  ${(margins.providerCost ?? 0).toFixed(2)}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5">SMM execution costs</p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#65737A] uppercase tracking-wider">
                  Net Profit
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${(margins.netProfit ?? 0) >= 0 ? "bg-[#E8F8F2] text-[#16B77A]" : "bg-[#FEECEB] text-[#EF4444]"}`}>
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className={`text-[20px] font-bold tracking-tight font-mono ${(margins.netProfit ?? 0) >= 0 ? "text-[#16B77A]" : "text-[#EF4444]"}`}>
                  {(margins.netProfit ?? 0) < 0 ? `-$${Math.abs(margins.netProfit ?? 0).toFixed(2)}` : `$${(margins.netProfit ?? 0).toFixed(2)}`}
                </div>
                <p className="text-[10.5px] text-[#8A979D] mt-0.5">Margin: {margins.netMarginPercent ?? margins.marginPercent}%</p>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-8 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)] text-center">
            <div className="w-12 h-12 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-3">
              <PieChart className="w-6 h-6" />
            </div>
            <h4 className="text-[14px] font-bold text-[#142126]">CloutFlow USD Margin Ledger</h4>
            <p className="text-[12px] text-[#65737A] mt-1 max-w-md mx-auto">
              Real-time costs compute automatically in USD per order using configured admin pricing rules and PerfectPay 8.9% + $1.00 commercial fee standard.
            </p>
          </div>
        </div>
      )}

      {/* 3. ATTRIBUTION TAB */}
      {activeTab === "attribution" && (
        <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                CAMPAIGN & UTM ATTRIBUTION
              </h3>
              <p className="text-[12px] text-[#65737A] mt-0.5">
                Performance tracked per traffic source, campaign and medium
              </p>
            </div>
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => fetchAttribution(false)}
              disabled={loadingAttribution}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </AdminButton>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
              <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="text-[13px] font-semibold text-[#142126]">No attribution records captured yet</h4>
              <p className="text-[11px] text-[#65737A] mt-1 max-w-sm mx-auto">
                Inbound UTM parameters (`utm_source`, `utm_campaign`, `utm_medium`) will group revenue here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>UTM Source</AdminTableHead>
                    <AdminTableHead>Campaign</AdminTableHead>
                    <AdminTableHead>Medium</AdminTableHead>
                    <AdminTableHead className="text-right">Total Orders</AdminTableHead>
                    <AdminTableHead className="text-right">Paid Orders</AdminTableHead>
                    <AdminTableHead className="text-right">Revenue</AdminTableHead>
                    <AdminTableHead className="text-right">AOV</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {campaigns.map((c, i) => (
                    <AdminTableRow key={i}>
                      <AdminTableCell className="font-bold text-[#142126]">{c.source}</AdminTableCell>
                      <AdminTableCell className="text-[#142126] font-medium">{c.campaign}</AdminTableCell>
                      <AdminTableCell className="text-[#65737A]">{c.medium}</AdminTableCell>
                      <AdminTableCell className="text-right text-[#142126]">{c.orders}</AdminTableCell>
                      <AdminTableCell className="text-right text-[#16B77A] font-semibold">{c.paidOrders}</AdminTableCell>
                      <AdminTableCell className="text-right font-bold text-[#142126] font-mono">${c.revenue.toFixed(2)}</AdminTableCell>
                      <AdminTableCell className="text-right text-[#65737A] font-mono">{c.aov}</AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
