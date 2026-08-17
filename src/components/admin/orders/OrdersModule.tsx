"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  ShoppingBag, 
  DollarSign, 
  PieChart, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { Order } from "../types";

export function OrdersModule() {
  const [activeTab, setActiveTab] = useState<"orders" | "margins" | "attribution">("orders");
  
  // Orders Tab State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Margins Tab State
  const [margins, setMargins] = useState<{
    grossRevenue: number;
    providerCost: number;
    gatewayFees: number;
    netProfit: number;
    marginPercent: string;
    paidOrdersCount: number;
  }>({
    grossRevenue: 0,
    providerCost: 0,
    gatewayFees: 0,
    netProfit: 0,
    marginPercent: "0.0",
    paidOrdersCount: 0,
  });
  const [loadingMargins, setLoadingMargins] = useState(false);

  // Attribution Tab State
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

  // 300ms Debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      setOrdersError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });

      if (platformFilter !== "all") params.append("platform", platformFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setOrders(json.data.items);
        setTotalPages(json.data.totalPages || 1);
        setTotalOrdersCount(json.data.total || 0);
      } else {
        setOrdersError(json.error?.message || "Failed to load orders");
      }
    } catch {
      setOrdersError("Error connecting to orders API");
    } finally {
      setLoadingOrders(false);
    }
  }, [page, platformFilter, statusFilter, debouncedSearch]);

  // Fetch Margins
  const fetchMargins = async () => {
    try {
      setLoadingMargins(true);
      const res = await fetch("/api/admin/margins");
      const json = await res.json();
      if (res.ok && json.success) {
        setMargins(json.data);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingMargins(false);
    }
  };

  // Fetch Attribution
  const fetchAttribution = async () => {
    try {
      setLoadingAttribution(true);
      const res = await fetch("/api/admin/attribution");
      const json = await res.json();
      if (res.ok && json.success) {
        setCampaigns(json.data.campaigns || []);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingAttribution(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "margins") {
      fetchMargins();
    } else if (activeTab === "attribution") {
      fetchAttribution();
    }
  }, [activeTab, fetchOrders]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Orders & Margins</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Real-time fulfillment, attribution and profitability ledger</p>
        </div>

        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "orders" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            All Orders ({totalOrdersCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("margins")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "margins" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Margins & Costs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attribution")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "attribution" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Attribution (UTMs)
          </button>
        </div>
      </div>

      {/* 1. ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#12161f] border border-neutral-800/80 rounded-2xl p-4 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by Order ID, username, email or external ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X / Twitter</option>
                <option value="youtube">YouTube</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {ordersError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
              <span>{ordersError}</span>
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="flex items-center gap-1 font-bold underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs overflow-hidden">
            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500 mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-neutral-300">No orders found</p>
                <span className="text-xs text-neutral-500 mt-1 block">
                  {totalOrdersCount === 0 ? "Completed gateway webhooks will register transactions here in real-time." : "Try adjusting your search criteria or platform filters."}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="pb-3 font-semibold">Order ID</th>
                        <th className="pb-3 font-semibold">Platform</th>
                        <th className="pb-3 font-semibold">Target User</th>
                        <th className="pb-3 font-semibold">Service & Plan</th>
                        <th className="pb-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Gateway</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-800/20 transition-colors">
                          <td className="py-3.5 font-mono text-neutral-400">#{(order as any).publicId || order.id.slice(0, 8)}</td>
                          <td className="py-3.5 capitalize font-semibold">{order.platform}</td>
                          <td className="py-3.5">
                            <span className="text-white block font-semibold">@{order.username}</span>
                            <span className="text-[11px] text-neutral-500 truncate block max-w-[140px]">{order.email}</span>
                          </td>
                          <td className="py-3.5">{order.plan}</td>
                          <td className="py-3.5 font-bold text-white">${order.amount.toFixed(2)}</td>
                          <td className="py-3.5 text-neutral-400 capitalize">{order.gateway}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === "delivered" || order.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                              order.status === "failed" ? "bg-red-500/10 text-red-400" :
                              "bg-amber-500/10 text-amber-400"
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 text-neutral-500">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
                    <span>Showing page {page} of {totalPages} ({totalOrdersCount} total)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-40 hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-40 hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MARGINS TAB */}
      {activeTab === "margins" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Gross Revenue</span>
              <div className="text-2xl font-bold text-white">${margins.grossRevenue.toFixed(2)}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Paid customer checkouts</p>
            </div>

            <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Provider Cost</span>
              <div className="text-2xl font-bold text-neutral-300">${margins.providerCost.toFixed(2)}</div>
              <p className="text-[11px] text-neutral-500 mt-1">SMM execution costs</p>
            </div>

            <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Gateway Fees</span>
              <div className="text-2xl font-bold text-amber-400">${margins.gatewayFees.toFixed(2)}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Processor transaction fees</p>
            </div>

            <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Net Profit</span>
              <div className="text-2xl font-bold text-emerald-400">${margins.netProfit.toFixed(2)}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Net after all fees</p>
            </div>

            <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Profit Margin</span>
              <div className="text-2xl font-bold text-purple-400">{margins.marginPercent}%</div>
              <p className="text-[11px] text-neutral-500 mt-1">Net efficiency ratio</p>
            </div>
          </div>

          <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs text-center py-12">
            <PieChart className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">Automated Margin Ledger</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Real-time costs compute automatically per order using configured admin pricing rules.
            </p>
          </div>
        </div>
      )}

      {/* 3. ATTRIBUTION TAB */}
      {activeTab === "attribution" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Campaign & UTM Attribution</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Performance tracked per traffic source, campaign and medium</p>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
              <Tag className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-300">No attribution records captured yet</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Inbound UTM parameters (`utm_source`, `utm_campaign`, `utm_medium`) will group revenue here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="pb-3 font-semibold">UTM Source</th>
                    <th className="pb-3 font-semibold">Campaign</th>
                    <th className="pb-3 font-semibold">Medium</th>
                    <th className="pb-3 font-semibold">Total Orders</th>
                    <th className="pb-3 font-semibold">Paid Orders</th>
                    <th className="pb-3 font-semibold">Revenue</th>
                    <th className="pb-3 font-semibold">AOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                  {campaigns.map((c, i) => (
                    <tr key={i} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="py-3.5 font-bold text-white">{c.source}</td>
                      <td className="py-3.5">{c.campaign}</td>
                      <td className="py-3.5 text-neutral-400">{c.medium}</td>
                      <td className="py-3.5">{c.orders}</td>
                      <td className="py-3.5 text-emerald-400">{c.paidOrders}</td>
                      <td className="py-3.5 font-bold text-white">${c.revenue.toFixed(2)}</td>
                      <td className="py-3.5 text-neutral-300">{c.aov}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
