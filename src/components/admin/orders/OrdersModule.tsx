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
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  User,
  ShieldCheck,
  TrendingUp,
  Percent
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
  AdminNeonIcon,
  AdminTooltip,
  AdminModal,
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

  // Selected Order for Modal/Drawer Details (Progressive Disclosure)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

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
    pollInterval: 15000,
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
      void fetchOrders(false);
    } else if (activeTab === "margins") {
      void fetchMargins(false);
    } else if (activeTab === "attribution") {
      void fetchAttribution(false);
    }
  }, [activeTab, fetchOrders]);

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalPages = Math.ceil(totalOrdersCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
        <div>
          <h1 className="text-[20px] font-bold text-[#142126] tracking-tight">
            Orders & Margins
          </h1>
          <p className="text-[12px] text-[#65737A] mt-0.5">
            Monitor transactions, payments, fulfillment status, and unit economics.
          </p>
        </div>

        <div className="flex items-center bg-[#F1F5F5] border border-[#D9E2E3] rounded-[8px] p-1 text-[12px] font-semibold shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-white text-[#0F8F8A] shadow-xs font-semibold"
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
                ? "bg-white text-[#0F8F8A] shadow-xs font-semibold"
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
                ? "bg-white text-[#0F8F8A] shadow-xs font-semibold"
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
          {/* Operational Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-[#D9E2E3] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
            <div className="flex-1">
              <AdminSearchInput
                placeholder="Search by Order ID, target username, customer email or gateway ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
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
                <span className="text-[11px] text-[#0F8F8A] font-medium animate-pulse flex items-center gap-1 bg-[#EAF6F5] px-2 py-1 rounded-full border border-[#0F8F8A]/20">
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
                <AdminNeonIcon color="teal" className="w-3.5 h-3.5 mr-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${(loadingOrders || isRefreshingOrders) ? "animate-spin" : ""}`} />
                </AdminNeonIcon>
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

          {/* Orders Section */}
          <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 md:p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
            {orders.length === 0 ? (
              <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
                <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mx-auto mb-2">
                  <AdminNeonIcon color="blue" icon={ShoppingBag} className="w-6 h-6" />
                </div>
                <p className="text-[13px] font-semibold text-[#142126]">No orders match the selected filters</p>
                <span className="text-[11px] text-[#65737A] mt-1 block">
                  {totalOrdersCount === 0 ? "Completed gateway webhooks will register transactions here in real-time." : "Try adjusting your search criteria or platform filters."}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <AdminTable>
                    <AdminTableHeader>
                      <AdminTableRow>
                        <AdminTableHead>Order ID</AdminTableHead>
                        <AdminTableHead>Platform</AdminTableHead>
                        <AdminTableHead>Target</AdminTableHead>
                        <AdminTableHead>Product</AdminTableHead>
                        <AdminTableHead className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <span>Gross</span>
                            <AdminTooltip content="Customer payment amount collected before fees in USD." />
                          </div>
                        </AdminTableHead>
                        <AdminTableHead className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <span>PP Fee</span>
                            <AdminTooltip content="PerfectPay transaction fee: 8.9% + $1.00 USD standard." />
                          </div>
                        </AdminTableHead>
                        <AdminTableHead className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <span>Cost</span>
                            <AdminTooltip content="Supplier API fulfillment execution cost." />
                          </div>
                        </AdminTableHead>
                        <AdminTableHead className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <span>Net Profit</span>
                            <AdminTooltip content="Gross revenue minus gateway fees and provider fulfillment costs." />
                          </div>
                        </AdminTableHead>
                        <AdminTableHead className="text-center">Payment</AdminTableHead>
                        <AdminTableHead className="text-center">Fulfillment</AdminTableHead>
                        <AdminTableHead className="text-right">Date</AdminTableHead>
                        <AdminTableHead className="text-center w-12">Details</AdminTableHead>
                      </AdminTableRow>
                    </AdminTableHeader>
                    <AdminTableBody>
                      {orders.map((order) => {
                        const orderPublicId = order.publicId || order.id.slice(0, 8);
                        const gross = order.grossAmount ?? order.amount ?? 0;
                        const ppFee = order.perfectPayFee ?? ((gross * 0.089) + 1.00);
                        const cost = order.providerCost ?? 0;
                        const profit = order.netProfit ?? (order.status === 'paid' ? (gross - ppFee - cost) : -(ppFee + cost));
                        const isExpanded = !!expandedOrderIds[order.id];

                        return (
                          <React.Fragment key={order.id}>
                            <AdminTableRow className={isExpanded ? "bg-[#F8FAFB]" : ""}>
                              <AdminTableCell className="font-mono text-[#65737A] font-semibold text-[12px]">
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
                                {order.providerCost !== null && order.providerCost !== undefined
                                  ? `$${order.providerCost.toFixed(2)}`
                                  : order.providerCostSource === 'UNKNOWN'
                                  ? "—"
                                  : `$${cost.toFixed(2)}`}
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
                              <AdminTableCell className="text-right text-[#8A979D] text-[11px] whitespace-nowrap">
                                {order.date}
                              </AdminTableCell>
                              <AdminTableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleOrderExpand(order.id)}
                                    className="p-1 text-[#65737A] hover:text-[#142126] hover:bg-[#EEF2F3] rounded transition-colors cursor-pointer"
                                    title="Toggle quick inline details"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-1 text-[#0F8F8A] hover:bg-[#E7F5F4] rounded transition-colors cursor-pointer"
                                    title="Open complete order inspection modal"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </AdminTableCell>
                            </AdminTableRow>

                            {/* Inline Expandable Details Row */}
                            {isExpanded && (
                              <tr className="bg-[#FAFBFB] border-b border-[#E3E8EA]">
                                <td colSpan={12} className="p-4 text-[12px]">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-3 rounded-[8px] border border-[#E2E8E9]">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Customer & Target</span>
                                      <div className="font-semibold text-[#142126] mt-0.5">@{order.target || order.username}</div>
                                      <div className="text-[11px] text-[#65737A] truncate">{order.email || "No email"}</div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Financial Breakdown</span>
                                      <div className="text-[#142126] mt-0.5">Gross: <strong>${gross.toFixed(2)}</strong> | Fee: <strong>${ppFee.toFixed(2)}</strong></div>
                                      <div className="text-[#142126]">Cost: <strong>${cost.toFixed(2)}</strong> | Net: <strong className={profit >= 0 ? "text-[#16B77A]" : "text-[#EF4444]"}>${profit.toFixed(2)}</strong></div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Attribution</span>
                                      <div className="text-[#142126] mt-0.5">Source: <strong>{order.utmSource || "direct"}</strong></div>
                                      <div className="text-[#65737A] text-[11px]">Campaign: {order.utmCampaign || "none"} • Medium: {order.utmMedium || "none"}</div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Provider & Delivery</span>
                                      <div className="text-[#142126] mt-0.5">Status: <strong>{order.fulfillmentStatus || order.providerStatus || "PENDING"}</strong></div>
                                      <div className="text-[#65737A] text-[11px]">Gateway: {order.gateway || "PerfectPay"}</div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </AdminTableBody>
                  </AdminTable>
                </div>

                {/* Mobile View: Structured Cards (Zero horizontal overflow, touch-optimized) */}
                <div className="md:hidden space-y-3">
                  {orders.map((order) => {
                    const orderPublicId = order.publicId || order.id.slice(0, 8);
                    const gross = order.grossAmount ?? order.amount ?? 0;
                    const ppFee = order.perfectPayFee ?? ((gross * 0.089) + 1.00);
                    const cost = order.providerCost ?? 0;
                    const profit = order.netProfit ?? (order.status === 'paid' ? (gross - ppFee - cost) : -(ppFee + cost));

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={order.platform} size={20} />
                            <div>
                              <div className="font-bold text-[14px] text-[#142126]">#{orderPublicId}</div>
                              <div className="text-[12px] text-[#65737A]">@{order.target || order.username}</div>
                            </div>
                          </div>
                          <AdminStatusBadge status={order.status} />
                        </div>

                        <div className="text-[12px] text-[#65737A] bg-[#F8FAFB] p-2 rounded-[6px] border border-[#EEF2F3]">
                          {order.product || `${order.service} • ${order.plan}`}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[12px] py-1 border-t border-[#F1F5F5]">
                          <div>
                            <span className="text-[10px] uppercase text-[#8A979D] block">Gross</span>
                            <span className="font-bold font-mono text-[#142126]">${gross.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#8A979D] block">Net Profit</span>
                            <span className={`font-bold font-mono ${profit >= 0 ? "text-[#16B77A]" : "text-[#EF4444]"}`}>
                              {profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `$${profit.toFixed(2)}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#8A979D] block">Fulfillment</span>
                            <span className="font-mono text-[11px] text-[#65737A]">{order.fulfillmentStatus || order.providerStatus || "PENDING"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#8A979D] block">Date</span>
                            <span className="text-[11px] text-[#8A979D]">{order.date}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#F1F5F5] flex items-center justify-end">
                          <AdminButton
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="w-full text-[12px] min-h-[44px] justify-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Full Details
                          </AdminButton>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#D9E2E3] text-[12px] text-[#65737A]">
                    <span>Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalOrdersCount} total)</span>
                    <div className="flex items-center gap-2">
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="min-h-[38px]"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                      </AdminButton>
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="min-h-[38px]"
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
          {/* Section 1: Commercial Result KPI Cards */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#65737A] mb-2 flex items-center gap-1.5">
              <span>Commercial Results (USD)</span>
              <AdminTooltip content="Aggregated operational commerce figures for all verified purchases in USD." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="bg-white border border-[#D9E2E3] rounded-[9px] p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-[#65737A] uppercase tracking-wider">
                      Gross Revenue
                    </span>
                    <AdminTooltip content="Total value collected before payment fees, provider costs, refunds and chargebacks." />
                  </div>
                  <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[24px] font-bold tracking-tight text-[#142126] font-mono">
                    ${(margins.grossSales ?? margins.grossRevenue ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-[#8A979D] mt-0.5">Total customer checkouts ({margins.totalOrdersCount} total)</p>
                </div>
              </div>

              <div className="bg-white border border-[#D9E2E3] rounded-[9px] p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-[#65737A] uppercase tracking-wider">
                      Net Revenue
                    </span>
                    <AdminTooltip content="Verified gross revenue minus processed customer refunds." />
                  </div>
                  <div className="p-1.5 rounded-[6px] bg-[#16B77A]/10 text-[#16B77A]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[24px] font-bold tracking-tight text-[#16B77A] font-mono">
                    ${(margins.netRevenue ?? margins.grossRevenue ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-[#8A979D] mt-0.5">Paid minus {margins.refundedOrdersCount} refunds</p>
                </div>
              </div>

              <div className="bg-white border border-[#D9E2E3] rounded-[9px] p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-[#65737A] uppercase tracking-wider">
                      Net Profit
                    </span>
                    <AdminTooltip content="Revenue remaining after gateway fees, refunds and provider fulfillment costs." />
                  </div>
                  <div className={`p-1.5 rounded-[6px] ${(margins.netProfit ?? 0) >= 0 ? "bg-[#16B77A]/10 text-[#16B77A]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}>
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className={`text-[24px] font-bold tracking-tight font-mono ${(margins.netProfit ?? 0) >= 0 ? "text-[#16B77A]" : "text-[#EF4444]"}`}>
                    {(margins.netProfit ?? 0) < 0 ? `-$${Math.abs(margins.netProfit ?? 0).toFixed(2)}` : `$${(margins.netProfit ?? 0).toFixed(2)}`}
                  </div>
                  <p className="text-[11px] text-[#8A979D] mt-0.5">Net Margin: <strong>{margins.netMarginPercent ?? margins.marginPercent}%</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Technical Financial Reconciliation & Cost Centers */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#65737A] mb-2 flex items-center gap-1.5">
              <span>Technical Reconciliation & Costs</span>
              <AdminTooltip content="Itemized cost centers deduction breakdown applied to orders." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="bg-white border border-[#D9E2E3] rounded-[9px] p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-[#65737A] uppercase tracking-wider">
                      Gateway Fees (PP)
                    </span>
                    <AdminTooltip content="Payment gateway fee charged per transaction (standard 8.9% + $1.00 USD)." />
                  </div>
                  <div className="p-1.5 rounded-[6px] bg-[#D97706]/10 text-[#D97706]">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[20px] font-bold tracking-tight text-[#D97706] font-mono">
                    ${(margins.perfectPayFees ?? margins.gatewayFees ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[10.5px] text-[#8A979D] mt-0.5">PerfectPay 8.9% + $1.00 / sale</p>
                </div>
              </div>

              <div className="bg-white border border-[#D9E2E3] rounded-[9px] p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-[#65737A] uppercase tracking-wider">
                      Provider Cost
                    </span>
                    <AdminTooltip content="Fulfillment cost charged by the configured supplier API." />
                  </div>
                  <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[20px] font-bold tracking-tight text-[#142126] font-mono">
                    ${(margins.providerCost ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[10.5px] text-[#8A979D] mt-0.5">SMM execution costs</p>
                </div>
              </div>

              <div className="bg-white border border-[#D9E2E3] rounded-[9px] p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-[#65737A] uppercase tracking-wider">
                      Refunds & Chargebacks
                    </span>
                    <AdminTooltip content="Reversals returned to customers or charged back by card issuers." />
                  </div>
                  <div className="p-1.5 rounded-[6px] bg-[#EF4444]/10 text-[#EF4444]">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[20px] font-bold tracking-tight text-[#EF4444] font-mono">
                    ${(margins.refunds ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[10.5px] text-[#8A979D] mt-0.5">{margins.refundedOrdersCount ?? 0} refunded ({margins.refundRate}%)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-6 shadow-xs flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-full bg-[#0F8F8A]/10 text-[#0F8F8A] shrink-0">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#142126]">CloutFlow USD Margin Ledger</h4>
              <p className="text-[12px] text-[#65737A] mt-0.5 max-w-2xl">
                Real-time costs compute automatically in USD per order using configured admin pricing rules and PerfectPay 8.9% + $1.00 commercial fee standard. All provider costs reflect actual API fulfillment execution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ATTRIBUTION TAB */}
      {activeTab === "attribution" && (
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF2F3] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-[#142126]">
                  CAMPAIGN & UTM ATTRIBUTION
                </h3>
                <AdminTooltip content="Traffic source and campaign parameters associated with the customer journey from first click to purchase." />
              </div>
              <p className="text-[12px] text-[#65737A] mt-0.5">
                Performance grouped by traffic source, campaign, and marketing medium
              </p>
            </div>
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => fetchAttribution(false)}
              disabled={loadingAttribution}
            >
              <AdminNeonIcon color="teal" className="w-3.5 h-3.5 mr-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAttribution ? "animate-spin" : ""}`} />
              </AdminNeonIcon>
              Refresh
            </AdminButton>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
              <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mx-auto mb-2">
                <AdminNeonIcon color="cyan" icon={Tag} className="w-6 h-6" />
              </div>
              <h4 className="text-[13px] font-semibold text-[#142126]">No attribution records captured yet</h4>
              <p className="text-[11px] text-[#65737A] mt-1 max-w-sm mx-auto">
                Inbound UTM parameters (`utm_source`, `utm_campaign`, `utm_medium`) will group revenue here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[8px] border border-[#E3E8EA]">
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
                      <AdminTableCell className="text-right text-[#142126] font-mono">{c.orders}</AdminTableCell>
                      <AdminTableCell className="text-right text-[#16B77A] font-semibold font-mono">{c.paidOrders}</AdminTableCell>
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

      {/* Progressive Disclosure: Order Details Modal */}
      {selectedOrder && (
        <AdminModal
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          title={`Order #${selectedOrder.publicId || selectedOrder.id.slice(0, 8)}`}
          description="Detailed transaction, payment, fulfillment and financial breakdown"
          className="sm:max-w-xl"
        >
          <div className="space-y-4 pt-1">
            {/* Top Status & Platform Banner */}
            <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#F8FAFB] border border-[#E3E8EA]">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={selectedOrder.platform} size={22} />
                <div>
                  <span className="font-bold text-[14px] text-[#142126] capitalize">{selectedOrder.platform}</span>
                  <span className="text-[12px] text-[#65737A] block">@{selectedOrder.target || selectedOrder.username}</span>
                </div>
              </div>
              <AdminStatusBadge status={selectedOrder.status} />
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-3.5 rounded-[8px] border border-[#E3E8EA] space-y-2">
              <span className="text-[10.5px] uppercase font-bold text-[#8A979D] block">Financial Breakdown (USD)</span>
              {(() => {
                const gross = selectedOrder.grossAmount ?? selectedOrder.amount ?? 0;
                const ppFee = selectedOrder.perfectPayFee ?? ((gross * 0.089) + 1.00);
                const cost = selectedOrder.providerCost ?? 0;
                const profit = selectedOrder.netProfit ?? (selectedOrder.status === 'paid' ? (gross - ppFee - cost) : -(ppFee + cost));

                return (
                  <div className="space-y-1.5 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#65737A]">Customer Paid (Gross):</span>
                      <span className="font-bold font-mono text-[#142126]">${gross.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#65737A]">PerfectPay Fee (8.9% + $1.00):</span>
                      <span className="font-mono text-[#D97706]">-${ppFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#65737A]">Provider Execution Cost:</span>
                      <span className="font-mono text-[#65737A]">-${cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#EEF2F3] font-bold">
                      <span className="text-[#142126]">Net Profit:</span>
                      <span className={`font-mono ${profit >= 0 ? "text-[#16B77A]" : "text-[#EF4444]"}`}>
                        {profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `$${profit.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Target & Package Info */}
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-[8px] bg-[#FAFBFB] border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Package Selected</span>
                <span className="font-semibold text-[#142126] block mt-0.5">
                  {selectedOrder.product || `${selectedOrder.service} • ${selectedOrder.plan}`}
                </span>
                {selectedOrder.email && (
                  <span className="text-[11px] text-[#65737A] block mt-1 truncate">{selectedOrder.email}</span>
                )}
              </div>
              <div className="p-3 rounded-[8px] bg-[#FAFBFB] border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Fulfillment Delivery</span>
                <span className="font-semibold text-[#142126] block mt-0.5 font-mono">
                  {selectedOrder.fulfillmentStatus || selectedOrder.providerStatus || "NOT_DISPATCHED"}
                </span>
                <span className="text-[11px] text-[#65737A] block mt-1">Gateway: {selectedOrder.gateway || "PerfectPay"}</span>
              </div>
            </div>

            {/* Attribution Details if present */}
            <div className="p-3 rounded-[8px] bg-[#FAFBFB] border border-[#E3E8EA] text-[12px]">
              <span className="text-[10px] uppercase font-bold text-[#8A979D] block">Marketing Attribution</span>
              <div className="grid grid-cols-3 gap-2 mt-1 text-[11px]">
                <div>
                  <span className="text-[#8A979D] block">Source:</span>
                  <span className="font-medium text-[#142126]">{selectedOrder.utmSource || "direct / organic"}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] block">Campaign:</span>
                  <span className="font-medium text-[#142126]">{selectedOrder.utmCampaign || "none"}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] block">Medium:</span>
                  <span className="font-medium text-[#142126]">{selectedOrder.utmMedium || "none"}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#8A979D] text-right">
              Recorded: {selectedOrder.date}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
