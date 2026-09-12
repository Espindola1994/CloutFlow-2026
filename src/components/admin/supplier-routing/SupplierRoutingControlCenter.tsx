"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { 
  Sliders, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search, 
  ShieldAlert, 
  RotateCcw, 
  Layers, 
  FileText, 
  Lock, 
  TrendingUp,
  DollarSign,
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";

import { AdminCard, AdminStatCard } from "../ui/AdminCard";
import { AdminTable, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableHead, AdminTableCell } from "../ui/AdminTable";
import { AdminBadge, AdminStatusBadge } from "../ui/AdminBadge";
import { AdminButton } from "../ui/AdminButton";
import { AdminModal } from "../ui/AdminModal";
import { PlatformBadge, PlatformIcon } from "../ui/PlatformIcon";
import { AdminTooltip } from "../ui/AdminTooltip";

export function SupplierRoutingControlCenter() {
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "manual-review" | "alerts" | "history">("catalog");

  // Overview Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Products / Catalog (66 Cards)
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeCatalogPlatform, setActiveCatalogPlatform] = useState<string>("all");

  // Manual Review Queue
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // History (Paginated)
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Card Detail & Edit Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editWarningModalOpen, setEditWarningModalOpen] = useState(false);
  const [editWarningDetails, setEditWarningDetails] = useState<any>(null);

  // Manual Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedQueueOrder, setSelectedQueueOrder] = useState<any | null>(null);
  const [overrideSupplierId, setOverrideSupplierId] = useState("");
  const [overrideSupplierCost, setOverrideSupplierCost] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideWarning, setOverrideWarning] = useState<any | null>(null);
  const [overrideWarningOpen, setOverrideWarningOpen] = useState(false);

  // Rate refresh state
  const [refreshingRates, setRefreshingRates] = useState(false);

  // Load Overview Metrics
  const fetchOverview = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch("/api/admin/supplier-routing/overview");
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Load Products (66 cards)
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/supplier-routing/products");
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load Manual Review
  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/admin/supplier-routing/manual-review");
      const json = await res.json();
      if (json.success) {
        setQueue(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // Load Alerts
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/admin/supplier-routing/alerts");
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  // Load History
  const fetchHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/supplier-routing/history?page=${page}&pageSize=15`);
      const json = await res.json();
      if (json.success) {
        setHistoryItems(json.data.items || []);
        setHistoryTotalPages(json.data.totalPages || 1);
        setHistoryPage(json.data.page || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchProducts();
  }, [fetchOverview, fetchProducts]);

  useEffect(() => {
    if (activeSubTab === "manual-review") fetchQueue();
    if (activeSubTab === "alerts") fetchAlerts();
    if (activeSubTab === "history") fetchHistory(1);
  }, [activeSubTab, fetchQueue, fetchAlerts, fetchHistory]);

  // Refresh Rates Handler
  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      const res = await fetch("/api/admin/supplier-routing/rates/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Rates refreshed: ${json.data?.updatedCount || 0} services updated.`);
        fetchProducts();
        fetchOverview();
        fetchAlerts();
      } else {
        const errorDetail = json.error || (json.code ? `Error code: ${json.code}` : "Unknown error");
        toast.error("Failed to refresh rates: " + errorDetail);
      }
    } catch (err: any) {
      toast.error("Network error while refreshing rates: " + (err?.message || "Unknown"));
    } finally {
      setRefreshingRates(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchFilter === "" ||
        p.platform.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.service.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.plan.toLowerCase().includes(searchFilter.toLowerCase()) ||
        String(p.priorityServiceId || "").includes(searchFilter) ||
        String(p.fallback1ServiceId || "").includes(searchFilter) ||
        String(p.fallback2ServiceId || "").includes(searchFilter);

      const effectivePlatform = activeCatalogPlatform !== "all" ? activeCatalogPlatform : platformFilter;
      const matchPlatform = effectivePlatform === "all" || p.platform === effectivePlatform;
      const matchHealth = healthFilter === "all" || p.routingHealth === healthFilter;
      const matchCategory = serviceCategoryFilter === "all" || p.service.toLowerCase() === serviceCategoryFilter.toLowerCase();

      return matchSearch && matchPlatform && matchHealth && matchCategory;
    });
  }, [products, searchFilter, platformFilter, activeCatalogPlatform, healthFilter, serviceCategoryFilter]);

  // Group filtered products by Platform and Service Category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, {
      platform: string;
      service: string;
      key: string;
      items: any[];
      healthyCount: number;
      warningCount: number;
      unsafeCount: number;
      avgMargin: number;
    }> = {};

    filteredProducts.forEach((p) => {
      const key = `${p.platform}:${p.service}`;
      if (!groups[key]) {
        groups[key] = {
          platform: p.platform,
          service: p.service,
          key,
          items: [],
          healthyCount: 0,
          warningCount: 0,
          unsafeCount: 0,
          avgMargin: 0,
        };
      }
      groups[key].items.push(p);
      if (p.routingHealth === "GREEN") groups[key].healthyCount++;
      else if (p.routingHealth === "YELLOW") groups[key].warningCount++;
      else if (p.routingHealth === "RED") groups[key].unsafeCount++;
    });

    // Calculate avg margin per group
    Object.values(groups).forEach((g) => {
      const totalMargin = g.items.reduce((acc, item) => acc + (item.minimumGrossMarginPercent || 0), 0);
      g.avgMargin = g.items.length > 0 ? Math.round(totalMargin / g.items.length) : 0;
    });

    return Object.values(groups);
  }, [filteredProducts]);

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    groupedProducts.forEach((g) => { next[g.key] = true; });
    setCollapsedGroups(next);
  };

  const expandAllGroups = () => {
    setCollapsedGroups({});
  };

  // Retry Routing
  const handleRetryOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/supplier-routing/manual-review/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Order routed successfully: ${json.message}`);
        fetchQueue();
        fetchOverview();
      } else {
        toast.error(`Retry failed: ${json.message}`);
      }
    } catch {
      toast.error("Error retrying routing");
    }
  };

  // Open Override Modal
  const openOverrideModal = (ord: any) => {
    setSelectedQueueOrder(ord);
    setOverrideSupplierId(ord.priorityAttempt?.supplierId || ord.fallback1Attempt?.supplierId || "");
    setOverrideSupplierCost(ord.priorityAttempt?.cost ? String(ord.priorityAttempt.cost) : "");
    setOverrideReason("");
    setOverrideModalOpen(true);
  };

  // Submit Override
  const submitOverride = async (confirmed = false) => {
    if (!selectedQueueOrder) return;
    try {
      const res = await fetch("/api/admin/supplier-routing/manual-review/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedQueueOrder.id,
          supplierId: overrideSupplierId,
          supplierCost: parseFloat(overrideSupplierCost),
          reason: overrideReason,
          confirmedViolation: confirmed,
        }),
      });
      const json = await res.json();

      if (!json.success && json.requiresConfirmation) {
        setOverrideWarning(json.warningDetails);
        setOverrideWarningOpen(true);
        return;
      }

      if (json.success) {
        toast.success(json.message);
        setOverrideModalOpen(false);
        setOverrideWarningOpen(false);
        fetchQueue();
        fetchOverview();
      } else {
        toast.error(json.message || "Override failed");
      }
    } catch {
      toast.error("Error submitting manual override");
    }
  };

  // Resolve Alert
  const handleResolveAlert = async (alertId: string, action: "RESOLVE" | "DISMISS") => {
    try {
      const res = await fetch("/api/admin/supplier-routing/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Alert ${action.toLowerCase()}ed`);
        fetchAlerts();
      }
    } catch {
      toast.error("Error resolving alert");
    }
  };

  // Open Card Edit
  const handleOpenEdit = (prod: any) => {
    setSelectedProduct(prod);
    setEditFormData({
      priorityServiceId: prod.priorityServiceId || "",
      fallback1ServiceId: prod.fallback1ServiceId || "",
      fallback2ServiceId: prod.fallback2ServiceId || "",
      minimumGrossMarginPercent: prod.minimumGrossMarginPercent,
      minimumGrossProfit: prod.minimumGrossProfit,
      maxSupplierCostAbsolute: prod.maxSupplierCostAbsolute ?? "",
      costCeilingEnabled: prod.costCeilingEnabled,
      manualReviewEnabled: prod.manualReviewEnabled,
    });
    setIsEditModalOpen(true);
  };

  // Save Card Edit
  const handleSaveEdit = async (confirmed = false) => {
    if (!selectedProduct) return;
    try {
      const res = await fetch(`/api/admin/supplier-routing/products/${selectedProduct.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          minimumGrossMarginPercent: Number(editFormData.minimumGrossMarginPercent),
          minimumGrossProfit: Number(editFormData.minimumGrossProfit),
          maxSupplierCostAbsolute: editFormData.maxSupplierCostAbsolute !== "" ? Number(editFormData.maxSupplierCostAbsolute) : null,
          confirmedReduction: confirmed,
        }),
      });
      const json = await res.json();

      if (!json.success && json.requiresConfirmation) {
        setEditWarningDetails(json);
        setEditWarningModalOpen(true);
        return;
      }

      if (json.success) {
        toast.success("Card rules saved successfully!");
        setIsEditModalOpen(false);
        setEditWarningModalOpen(false);
        fetchProducts();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch {
      toast.error("Error saving product rules");
    }
  };

  // Helper for Health Badge
  const renderHealthBadge = (health: string) => {
    switch (health) {
      case "GREEN":
        return <AdminStatusBadge status="completed" label="HEALTHY" />;
      case "YELLOW":
        return <AdminStatusBadge status="pending" label="FALLBACK" />;
      case "RED":
        return <AdminStatusBadge status="failed" label="UNSAFE" />;
      default:
        return <AdminStatusBadge status="disabled" label="UNKNOWN" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#142126] tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-[#0F8F8A]" />
            Supplier Routing & Financial Control Center
          </h1>
          <p className="text-[13px] text-[#65737A] mt-0.5">
            Administer priority & fallback supplier rates, Cost Ceilings, gross margins, and manual review queues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={handleRefreshRates}
            isLoading={refreshingRates}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Rates
          </AdminButton>
        </div>
      </div>

      {/* Top Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <AdminStatCard
          title="Revenue Today"
          value={metrics?.revenueTodayFormatted || "$0.00"}
          icon={DollarSign}
        />
        <AdminStatCard
          title="Supplier Spend"
          value={metrics?.supplierSpendTodayFormatted || "$0.00"}
          icon={TrendingUp}
        />
        <AdminStatCard
          title="Est. Profit Today"
          value={metrics?.estimatedGrossProfitTodayFormatted || "$0.00"}
          icon={DollarSign}
        />
        <AdminStatCard
          title="Avg Gross Margin"
          value={`${metrics?.averageGrossMarginPercent || 0}%`}
          icon={Activity}
        />
        <AdminStatCard
          title="Routed: Priority"
          value={metrics?.ordersRoutedPriority || 0}
          icon={CheckCircle2}
        />
        <AdminStatCard
          title="Routed: Fallback 1"
          value={metrics?.ordersRoutedFallback1 || 0}
          icon={AlertTriangle}
        />
        <AdminStatCard
          title="Routed: Fallback 2"
          value={metrics?.ordersRoutedFallback2 || 0}
          icon={AlertTriangle}
        />
        <AdminStatCard
          title="Orders on HOLD"
          value={(metrics?.ordersOnHold || 0) + (metrics?.manualReviews || 0)}
          icon={ShieldAlert}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-[#E3E8EA] gap-6 text-[13px] font-semibold text-[#65737A] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("catalog")}
          className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "catalog" ? "text-[#0F8F8A]" : "hover:text-[#142126]"
          }`}
        >
          <span>Product Routing Catalog</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#EBF4F4] text-[#0F8F8A] font-bold">
            {products.length || 66}
          </span>
          {activeSubTab === "catalog" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F8F8A]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("manual-review")}
          className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "manual-review" ? "text-[#0F8F8A]" : "hover:text-[#142126]"
          }`}
        >
          <span>Manual Review Queue</span>
          {queue.length > 0 ? (
            <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {queue.length}
            </span>
          ) : (
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#EBF4F4] text-[#65737A]">0</span>
          )}
          {activeSubTab === "manual-review" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F8F8A]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("alerts")}
          className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "alerts" ? "text-[#0F8F8A]" : "hover:text-[#142126]"
          }`}
        >
          <span>Rate & Margin Alerts</span>
          {alerts.filter((a) => !a.resolved).length > 0 && (
            <span className="bg-[#F59E0B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {alerts.filter((a) => !a.resolved).length}
            </span>
          )}
          {activeSubTab === "alerts" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F8F8A]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("history")}
          className={`pb-3 relative transition-colors whitespace-nowrap ${
            activeSubTab === "history" ? "text-[#0F8F8A]" : "hover:text-[#142126]"
          }`}
        >
          Supplier Routing History
          {activeSubTab === "history" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F8F8A]" />
          )}
        </button>
      </div>

      {/* 1. PRODUCT CATALOG VIEW */}
      {activeSubTab === "catalog" && (
        <div className="space-y-4">
          {/* Platform Quick Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#D9E2E3] rounded-[9px] p-3 shadow-[0_1px_2px_rgba(10,35,42,0.02)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#65737A] mr-2">Platform:</span>
              <button
                type="button"
                onClick={() => setActiveCatalogPlatform("all")}
                className={`px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-all cursor-pointer ${
                  activeCatalogPlatform === "all"
                    ? "bg-[#0F8F8A] text-white shadow-sm"
                    : "bg-[#F7F9FA] text-[#65737A] hover:text-[#142126] hover:bg-[#EDF1F2]"
                }`}
              >
                All Platforms ({products.length})
              </button>
              {(["instagram", "tiktok", "twitter", "youtube"] as const).map((plat) => {
                const count = products.filter((p) => p.platform === plat).length;
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setActiveCatalogPlatform(plat)}
                    className={`px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCatalogPlatform === plat
                        ? "bg-[#0F8F8A] text-white shadow-sm"
                        : "bg-[#F7F9FA] text-[#65737A] hover:text-[#142126] hover:bg-[#EDF1F2]"
                    }`}
                  >
                    <PlatformIcon platform={plat === "twitter" ? "x" : plat} size={15} />
                    <span className="capitalize">{plat === "twitter" ? "X" : plat}</span>
                    <span className={`text-[10px] px-1 rounded ${activeCatalogPlatform === plat ? "bg-white/20 text-white" : "bg-[#E3E8EA] text-[#65737A]"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllGroups}
                className="text-[11px] font-semibold text-[#0F8F8A] hover:underline cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-[#D9E2E3]">•</span>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="text-[11px] font-semibold text-[#65737A] hover:text-[#142126] cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <AdminCard padded={false}>
            <div className="p-3.5 border-b border-[#E3E8EA] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F7F9FA]">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-[#8A979D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search service, package, SKU, supplier ID (e.g. 31714)..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-white border border-[#D1D9DC] rounded-[6px] focus:outline-none focus:border-[#0F8F8A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="text-[12px] bg-white border border-[#D1D9DC] rounded-[6px] px-2.5 py-1.5 text-[#142126]"
                >
                  <option value="all">All Services (Followers, Likes, Views)</option>
                  <option value="followers">Followers</option>
                  <option value="likes">Likes</option>
                  <option value="views">Views</option>
                </select>

                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="text-[12px] bg-white border border-[#D1D9DC] rounded-[6px] px-2.5 py-1.5 text-[#142126]"
                >
                  <option value="all">All Health Statuses</option>
                  <option value="GREEN">GREEN (Healthy)</option>
                  <option value="YELLOW">YELLOW (Fallback)</option>
                  <option value="RED">RED (Unsafe)</option>
                  <option value="UNKNOWN">UNKNOWN (No Rate)</option>
                </select>
              </div>
            </div>

            {/* Platform & Service Grouped Catalog */}
            {loadingProducts ? (
              <div className="py-16 text-center text-[#65737A] text-[13px]">
                <div className="w-6 h-6 border-2 border-[#0F8F8A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading 66 commercial cards and current supplier rates...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-[#65737A] text-[13px]">
                No cards found matching current filters.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E8EA]">
                {groupedProducts.map((group) => {
                  const isCollapsed = collapsedGroups[group.key];
                  return (
                    <div key={group.key} className="transition-colors">
                      {/* Group Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(group.key)}
                        className="w-full px-4 py-3 bg-[#FCFDFD] hover:bg-[#F3F7F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors cursor-pointer border-b border-[#F0F4F4]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#0F8F8A] transition-transform duration-150">
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                          <PlatformBadge platform={group.platform} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[14px] text-[#142126] capitalize">
                                {group.platform === "twitter" ? "X" : group.platform} {group.service}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF4F4] text-[#0F8F8A]">
                                {group.items.length} {group.items.length === 1 ? "tier" : "tiers"}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#65737A]">
                              Target Margin: ~{group.avgMargin}% • Primary Provider: Peakerr
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          {group.healthyCount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#E8F8F2] text-[#16B77A] border border-[#B6ECD7] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16B77A]" />
                              {group.healthyCount} Healthy
                            </span>
                          )}
                          {group.warningCount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                              {group.warningCount} Fallback
                            </span>
                          )}
                          {group.unsafeCount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                              {group.unsafeCount} Unsafe
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Group Table (Desktop) / Cards (Mobile) */}
                      {!isCollapsed && (
                        <div>
                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto">
                            <AdminTable>
                              <AdminTableHeader>
                                <AdminTableRow className="bg-[#FAFCFC]">
                                  <AdminTableHead className="w-[180px]">Package / Plan</AdminTableHead>
                                  <AdminTableHead className="w-[90px]">Qty</AdminTableHead>
                                  <AdminTableHead className="w-[100px]">Selling Price</AdminTableHead>
                                  <AdminTableHead>
                                    <div className="flex items-center gap-1">
                                      <span>Primary Provider</span>
                                      <AdminTooltip content="Supplier service routed as priority tier. Shows rate per 1,000 and estimated package fulfillment cost." />
                                    </div>
                                  </AdminTableHead>
                                  <AdminTableHead>
                                    <div className="flex items-center gap-1">
                                      <span>Fallback 1</span>
                                      <AdminTooltip content="First fallback supplier if priority provider is offline, rate violates ceiling, or capacity is exceeded." />
                                    </div>
                                  </AdminTableHead>
                                  <AdminTableHead>
                                    <div className="flex items-center gap-1">
                                      <span>Fallback 2</span>
                                      <AdminTooltip content="Secondary fallback supplier ensuring uninterrupted order fulfillment." />
                                    </div>
                                  </AdminTableHead>
                                  <AdminTableHead>
                                    <div className="flex items-center gap-1">
                                      <span>Cost Ceiling</span>
                                      <AdminTooltip content="Strict maximum provider cost allowed for this tier before automatically holding orders for manual review." />
                                    </div>
                                  </AdminTableHead>
                                  <AdminTableHead>
                                    <div className="flex items-center gap-1">
                                      <span>Min Margin</span>
                                      <AdminTooltip content="Target minimum gross margin percentage and gross profit dollar threshold." />
                                    </div>
                                  </AdminTableHead>
                                  <AdminTableHead>Status</AdminTableHead>
                                  <AdminTableHead className="text-right">Actions</AdminTableHead>
                                </AdminTableRow>
                              </AdminTableHeader>
                              <AdminTableBody>
                                {group.items.map((p) => (
                                  <AdminTableRow
                                    key={p.id}
                                    onClick={() => handleOpenEdit(p)}
                                    className="cursor-pointer hover:bg-[#F0F5F5] transition-colors"
                                  >
                                    <AdminTableCell>
                                      <div className="font-semibold text-[#142126] text-[13px]">
                                        {p.plan}
                                      </div>
                                      <div className="text-[11px] text-[#65737A]">
                                        SKU #{p.id.slice(0, 8)}
                                      </div>
                                    </AdminTableCell>
                                    <AdminTableCell className="font-mono text-[12px] font-semibold text-[#142126]">
                                      {p.quantity.toLocaleString()}
                                    </AdminTableCell>
                                    <AdminTableCell className="font-semibold text-[#142126] text-[13px]">
                                      ${p.sellingPrice.toFixed(2)}
                                    </AdminTableCell>
                                    <AdminTableCell>
                                      {p.priorityServiceId ? (
                                        <div className="text-[12px] space-y-0.5">
                                          <div className="font-mono font-medium text-[#142126] flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] uppercase font-bold text-[#0F8F8A] bg-[#EBF4F4] px-1 py-0.2 rounded">Primary</span>
                                            <span>#{p.priorityServiceId}</span>
                                            {p.priorityRate !== null ? (
                                              <span className="text-[#65737A] font-normal">(${p.priorityRate.toFixed(3)}/k)</span>
                                            ) : (
                                              <span className="text-gray-400 font-normal">(no rate)</span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-[#0F8F8A] font-medium flex items-center gap-1.5">
                                            <span>Est: {p.priorityEstimatedCost !== null ? `$${p.priorityEstimatedCost.toFixed(2)}` : "--"}</span>
                                            {p.effectiveEligibleSupplier === "priority" && (
                                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#E8F8F2] text-[#16B77A] font-bold border border-[#B6ECD7]">
                                                ACTIVE
                                              </span>
                                            )}
                                          </div>
                                          {p.isSplitRoute && (
                                            <div className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 inline-flex items-center gap-1 mt-0.5">
                                              <span>⚡ SPLIT ROUTE ({p.splitChunkCount}x {(p.splitChunkSize ? p.splitChunkSize / 1000 : 5)}K)</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">Not configured</span>
                                      )}
                                    </AdminTableCell>
                                    <AdminTableCell>
                                      {p.fallback1ServiceId ? (
                                        <div className="text-[12px] space-y-0.5">
                                          <div className="font-mono text-[#142126] flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] uppercase font-bold text-[#D97706] bg-[#FFFBEB] px-1 py-0.2 rounded">FB 1</span>
                                            <span>#{p.fallback1ServiceId}</span>
                                            {p.fallback1Rate !== null && (
                                              <span className="text-[#65737A] font-normal">(${p.fallback1Rate.toFixed(3)}/k)</span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-[#65737A]">
                                            Est: {p.fallback1EstimatedCost !== null ? `$${p.fallback1EstimatedCost.toFixed(2)}` : "--"}
                                            {p.effectiveEligibleSupplier === "fallback1" && (
                                              <span className="ml-1 text-[9.5px] px-1.5 py-0.2 rounded bg-[#E8F8F2] text-[#16B77A] font-bold border border-[#B6ECD7]">
                                                ACTIVE
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">--</span>
                                      )}
                                    </AdminTableCell>
                                    <AdminTableCell>
                                      {p.fallback2ServiceId ? (
                                        <div className="text-[12px] space-y-0.5">
                                          <div className="font-mono text-[#142126] flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] uppercase font-bold text-[#65737A] bg-[#F1F5F5] px-1 py-0.2 rounded">FB 2</span>
                                            <span>#{p.fallback2ServiceId}</span>
                                            {p.fallback2Rate !== null && (
                                              <span className="text-[#65737A] font-normal">(${p.fallback2Rate.toFixed(3)}/k)</span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-[#65737A]">
                                            Est: {p.fallback2EstimatedCost !== null ? `$${p.fallback2EstimatedCost.toFixed(2)}` : "--"}
                                            {p.effectiveEligibleSupplier === "fallback2" && (
                                              <span className="ml-1 text-[9.5px] px-1.5 py-0.2 rounded bg-[#E8F8F2] text-[#16B77A] font-bold border border-[#B6ECD7]">
                                                ACTIVE
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">--</span>
                                      )}
                                    </AdminTableCell>
                                    <AdminTableCell className="font-mono text-[12px] font-semibold text-[#142126]">
                                      ${p.allowedSupplierCost.toFixed(2)}
                                    </AdminTableCell>
                                    <AdminTableCell className="text-[12px] text-[#65737A]">
                                      {p.minimumGrossMarginPercent}% / ${p.minimumGrossProfit.toFixed(2)}
                                    </AdminTableCell>
                                    <AdminTableCell>
                                      {renderHealthBadge(p.routingHealth)}
                                    </AdminTableCell>
                                    <AdminTableCell className="text-right">
                                      <AdminButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEdit(p);
                                        }}
                                      >
                                        Inspect
                                      </AdminButton>
                                    </AdminTableCell>
                                  </AdminTableRow>
                                ))}
                              </AdminTableBody>
                            </AdminTable>
                          </div>

                          {/* Mobile Cards View (viewport < 768px) */}
                          <div className="block md:hidden p-3 space-y-2.5 bg-[#F7F9FA]">
                            {group.items.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => handleOpenEdit(p)}
                                className="p-3.5 bg-white border border-[#D9E2E3] rounded-[8px] space-y-2.5 shadow-sm active:bg-[#F3F7F7] cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="font-bold text-[13.5px] text-[#142126]">
                                      {p.plan} ({p.quantity.toLocaleString()} units)
                                    </div>
                                    <div className="text-[11px] text-[#65737A]">
                                      Selling Price: <strong className="text-[#142126] font-mono">${p.sellingPrice.toFixed(2)}</strong>
                                    </div>
                                  </div>
                                  {renderHealthBadge(p.routingHealth)}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-[#F7F9FA] p-2 rounded-[6px] border border-[#E3E8EA]">
                                  <div>
                                    <span className="text-[#65737A] text-[10px] uppercase font-bold block">Primary ID</span>
                                    <span className="font-mono font-bold text-[#0F8F8A]">
                                      {p.priorityServiceId ? `#${p.priorityServiceId}` : "None"}
                                    </span>
                                    {p.priorityEstimatedCost !== null && (
                                      <span className="text-[10px] text-[#65737A] block font-mono">
                                        Est: ${p.priorityEstimatedCost.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[#65737A] text-[10px] uppercase font-bold block">Fallback 1</span>
                                    <span className="font-mono text-[#142126]">
                                      {p.fallback1ServiceId ? `#${p.fallback1ServiceId}` : "—"}
                                    </span>
                                    {p.fallback1EstimatedCost !== null && (
                                      <span className="text-[10px] text-[#65737A] block font-mono">
                                        Est: ${p.fallback1EstimatedCost.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[#65737A] text-[10px] uppercase font-bold block">Max Cost</span>
                                    <span className="font-mono font-bold text-[#142126]">
                                      ${p.allowedSupplierCost.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#65737A] text-[10px] uppercase font-bold block">Target Margin</span>
                                    <span className="text-[#142126]">
                                      {p.minimumGrossMarginPercent}% (${p.minimumGrossProfit.toFixed(2)})
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-mono text-[#8A979D]">
                                    ID: {p.id.slice(0, 8)}
                                  </span>
                                  <span className="text-[12px] font-semibold text-[#0F8F8A] hover:underline">
                                    Configure Rules &rarr;
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AdminCard>
        </div>
      )}

      {/* 2. MANUAL REVIEW QUEUE */}
      {activeSubTab === "manual-review" && (
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#E3E8EA] flex items-center justify-between bg-[#F7F9FA]">
            <div>
              <h3 className="text-[14px] font-bold text-[#142126]">Orders on Financial Hold</h3>
              <p className="text-[12px] text-[#65737A]">
                Orders held due to Cost Ceiling violations or missing suppliers requiring administrative decision.
              </p>
            </div>
            <AdminButton size="sm" variant="outline" onClick={fetchQueue} isLoading={loadingQueue}>
              Refresh Queue
            </AdminButton>
          </div>

          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Order ID / Date</AdminTableHead>
                <AdminTableHead>Package</AdminTableHead>
                <AdminTableHead>Customer Paid</AdminTableHead>
                <AdminTableHead>Priority Attempt</AdminTableHead>
                <AdminTableHead>Fallback 1 Attempt</AdminTableHead>
                <AdminTableHead>Hold Reason / Max Cost</AdminTableHead>
                <AdminTableHead className="text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {loadingQueue ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={7} className="text-center py-8 text-[#65737A]">
                    Loading held orders...
                  </AdminTableCell>
                </AdminTableRow>
              ) : queue.length === 0 ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={7} className="text-center py-8 text-[#16B77A] font-medium">
                    No orders currently on HOLD. All routing pipeline is clear!
                  </AdminTableCell>
                </AdminTableRow>
              ) : (
                queue.map((ord) => (
                  <AdminTableRow key={ord.id}>
                    <AdminTableCell>
                      <div className="font-mono text-[12px] font-bold text-[#142126]">{ord.publicId || ord.id.slice(0, 8)}</div>
                      <div className="text-[11px] text-[#65737A]">
                        {new Date(ord.createdAt).toLocaleString()}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="text-[13px] font-medium text-[#142126]">{ord.platform} &gt; {ord.service}</div>
                      <div className="text-[11px] text-[#65737A]">Qty: {ord.quantity?.toLocaleString()} | @{ord.username}</div>
                    </AdminTableCell>
                    <AdminTableCell className="font-bold text-[#142126] text-[13px]">
                      {ord.customerPaidFormatted}
                    </AdminTableCell>
                    <AdminTableCell>
                      {ord.priorityAttempt ? (
                        <div className="text-[12px]">
                          <div className="font-mono text-[#142126]">ID {ord.priorityAttempt.supplierId}</div>
                          <div className="text-[11px] text-[#EF4444]">Cost: ${ord.priorityAttempt.cost.toFixed(2)} ({ord.priorityAttempt.decision})</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">--</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      {ord.fallback1Attempt ? (
                        <div className="text-[12px]">
                          <div className="font-mono text-[#142126]">ID {ord.fallback1Attempt.supplierId}</div>
                          <div className="text-[11px] text-[#EF4444]">Cost: ${ord.fallback1Attempt.cost.toFixed(2)} ({ord.fallback1Attempt.decision})</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">--</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="text-[12px] font-semibold text-[#EF4444]">{ord.holdReason}</div>
                      <div className="text-[11px] text-[#65737A]">
                        Max Allowed: {ord.allowedSupplierCost !== null ? `$${ord.allowedSupplierCost.toFixed(2)}` : "--"}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <AdminButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryOrder(ord.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Retry Routing
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="danger"
                          onClick={() => openOverrideModal(ord)}
                        >
                          <Lock className="w-3.5 h-3.5 mr-1" />
                          Override
                        </AdminButton>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminCard>
      )}

      {/* 3. ALERTS VIEW */}
      {activeSubTab === "alerts" && (
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#E3E8EA] flex items-center justify-between bg-[#F7F9FA]">
            <div>
              <h3 className="text-[14px] font-bold text-[#142126]">Rate & Margin Protection Alerts</h3>
              <p className="text-[12px] text-[#65737A]">
                Real-time alerts for supplier price increases (&ge; 15%), stale rates, and margin drops.
              </p>
            </div>
            <AdminButton size="sm" variant="outline" onClick={fetchAlerts} isLoading={loadingAlerts}>
              Refresh Alerts
            </AdminButton>
          </div>

          <div className="divide-y divide-[#E3E8EA]">
            {loadingAlerts ? (
              <div className="text-center py-8 text-[#65737A]">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-[#16B77A] font-medium">
                No active alerts at this time.
              </div>
            ) : (
              alerts.map((al) => (
                <div key={al.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F9FA]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AdminBadge variant={al.severity === "CRITICAL" ? "danger" : "warning"}>
                        {al.type}
                      </AdminBadge>
                      <span className="text-[13px] font-bold text-[#142126]">{al.title}</span>
                      <span className="text-[11px] text-[#8A979D]">
                        {new Date(al.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#42525A]">{al.message}</p>
                    {al.resolved && (
                      <div className="text-[11px] text-[#16B77A] font-medium">
                        Resolved by {al.resolvedBy} at {new Date(al.resolvedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {!al.resolved && (
                    <div className="flex items-center gap-2 shrink-0">
                      <AdminButton
                        size="sm"
                        variant="primary"
                        onClick={() => handleResolveAlert(al.id, "RESOLVE")}
                      >
                        Resolve
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveAlert(al.id, "DISMISS")}
                      >
                        Dismiss
                      </AdminButton>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </AdminCard>
      )}

      {/* 4. SUPPLIER ROUTING HISTORY VIEW */}
      {activeSubTab === "history" && (
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#E3E8EA] flex items-center justify-between bg-[#F7F9FA]">
            <div>
              <h3 className="text-[14px] font-bold text-[#142126]">Supplier Routing Attempt History</h3>
              <p className="text-[12px] text-[#65737A]">
                Full audit trail of supplier rate calculations, margin evaluations, and decisions.
              </p>
            </div>
            <AdminButton size="sm" variant="outline" onClick={() => fetchHistory(historyPage)} isLoading={loadingHistory}>
              Refresh History
            </AdminButton>
          </div>

          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Date / Time</AdminTableHead>
                <AdminTableHead>Order ID</AdminTableHead>
                <AdminTableHead>Position</AdminTableHead>
                <AdminTableHead>Supplier ID</AdminTableHead>
                <AdminTableHead>Rate / Cost</AdminTableHead>
                <AdminTableHead>Selling Price</AdminTableHead>
                <AdminTableHead>Profit / Margin</AdminTableHead>
                <AdminTableHead>Allowed Cost</AdminTableHead>
                <AdminTableHead>Decision</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {loadingHistory ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={9} className="text-center py-8 text-[#65737A]">
                    Loading routing history...
                  </AdminTableCell>
                </AdminTableRow>
              ) : historyItems.length === 0 ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={9} className="text-center py-8 text-[#65737A]">
                    No routing attempts recorded yet.
                  </AdminTableCell>
                </AdminTableRow>
              ) : (
                historyItems.map((item) => (
                  <AdminTableRow key={item.id}>
                    <AdminTableCell className="text-[11px] text-[#65737A]">
                      {new Date(item.createdAt).toLocaleString()}
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-[12px] font-medium text-[#142126]">
                      {item.orderId?.slice(0, 8)}
                    </AdminTableCell>
                    <AdminTableCell className="capitalize text-[12px] font-semibold text-[#65737A]">
                      {item.supplierPosition}
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-[12px] text-[#142126]">
                      {item.supplierServiceId}
                    </AdminTableCell>
                    <AdminTableCell className="text-[12px]">
                      <div>${item.supplierRate.toFixed(3)}/K</div>
                      <div className="font-semibold text-[#0F8F8A]">Est: ${item.supplierCalculatedCost.toFixed(2)}</div>
                    </AdminTableCell>
                    <AdminTableCell className="font-bold text-[12px] text-[#142126]">
                      ${item.sellingPrice.toFixed(2)}
                    </AdminTableCell>
                    <AdminTableCell className="text-[12px]">
                      <div>${item.grossProfit.toFixed(2)}</div>
                      <div className="text-[11px] text-[#65737A] font-semibold">{item.grossMarginPercent}%</div>
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-[12px] text-[#142126]">
                      ${item.allowedSupplierCost.toFixed(2)}
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge
                        variant={item.decision === "ACCEPTED" ? "success" : "danger"}
                      >
                        {item.decision}
                      </AdminBadge>
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </AdminTable>

          {/* Pagination */}
          <div className="p-3 border-t border-[#E3E8EA] flex items-center justify-between bg-[#F7F9FA] text-[12px] text-[#65737A]">
            <div>
              Page {historyPage} of {historyTotalPages}
            </div>
            <div className="flex items-center gap-2">
              <AdminButton
                size="sm"
                variant="outline"
                disabled={historyPage <= 1}
                onClick={() => fetchHistory(historyPage - 1)}
              >
                Previous
              </AdminButton>
              <AdminButton
                size="sm"
                variant="outline"
                disabled={historyPage >= historyTotalPages}
                onClick={() => fetchHistory(historyPage + 1)}
              >
                Next
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      )}

      {/* CARD DETAIL & EDIT MODAL */}
      {selectedProduct && (
        <AdminModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title={`Edit Supplier Routing: ${selectedProduct.platform} > ${selectedProduct.service} > ${selectedProduct.plan}`}
          className="sm:max-w-2xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <AdminButton variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={() => handleSaveEdit(false)}>
                Save Changes
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-4 text-[13px]">
            {/* Card Overview Banner */}
            <div className="bg-[#F7F9FA] border border-[#E3E8EA] rounded-[8px] p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#65737A] uppercase font-bold">Package</div>
                <div className="text-[14px] font-bold text-[#142126]">
                  {selectedProduct.quantity.toLocaleString()} units @ ${selectedProduct.sellingPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#65737A] uppercase font-bold">Max Cost Allowed</div>
                <div className="text-[14px] font-mono font-bold text-[#0F8F8A]">
                  ${selectedProduct.allowedSupplierCost.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Split Routing Notification Banner */}
            {selectedProduct.isSplitRoute && (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-[8px] space-y-1">
                <div className="font-bold text-[#065F46] flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Split Routing Route Active
                </div>
                <div className="text-[12px] text-[#047857]">
                  This package uses automatic split routing to Peakerr #{selectedProduct.priorityServiceId} in{" "}
                  <strong>{selectedProduct.splitChunkCount} child orders</strong> of {selectedProduct.splitChunkSize?.toLocaleString()} likes each. Execution Mode:{" "}
                  <strong className="uppercase">{selectedProduct.splitExecutionMode || 'SEQUENTIAL'}</strong>.
                </div>
              </div>
            )}

            {/* Price Recommendation Notice if risky */}
            {selectedProduct.suggestedPriceFormatted && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-[8px] space-y-1">
                <div className="font-bold text-[#B45309] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Commercial Price Recommendation
                </div>
                <div className="text-[12px] text-[#92400E]">
                  To maintain the target <strong>{selectedProduct.minimumGrossMarginPercent}% margin</strong> and <strong>${selectedProduct.minimumGrossProfit.toFixed(2)} profit</strong> with current rates, the suggested minimum price is <strong>{selectedProduct.suggestedPriceFormatted}</strong>.
                </div>
              </div>
            )}

            {/* Supplier IDs Configuration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                  Priority Service ID
                </label>
                <input
                  type="text"
                  value={editFormData.priorityServiceId || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, priorityServiceId: e.target.value })}
                  className="w-full text-[13px] font-mono px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                  Fallback 1 Service ID
                </label>
                <input
                  type="text"
                  value={editFormData.fallback1ServiceId || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, fallback1ServiceId: e.target.value })}
                  className="w-full text-[13px] font-mono px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                  Fallback 2 Service ID
                </label>
                <input
                  type="text"
                  value={editFormData.fallback2ServiceId || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, fallback2ServiceId: e.target.value })}
                  className="w-full text-[13px] font-mono px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Protection Settings */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                  Min Margin %
                </label>
                <input
                  type="number"
                  value={editFormData.minimumGrossMarginPercent || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, minimumGrossMarginPercent: e.target.value })}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                  Min Profit ($)
                </label>
                <input
                  type="number"
                  step="0.50"
                  value={editFormData.minimumGrossProfit || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, minimumGrossProfit: e.target.value })}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                  Absolute Cost Ceiling ($)
                </label>
                <input
                  type="number"
                  step="1.00"
                  placeholder="Optional override"
                  value={editFormData.maxSupplierCostAbsolute ?? ""}
                  onChange={(e) => setEditFormData({ ...editFormData, maxSupplierCostAbsolute: e.target.value })}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editFormData.costCeilingEnabled ?? true}
                  onChange={(e) => setEditFormData({ ...editFormData, costCeilingEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0F8F8A]"
                />
                <span className="text-[13px] font-medium text-[#142126]">Cost Ceiling Protection Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editFormData.manualReviewEnabled ?? false}
                  onChange={(e) => setEditFormData({ ...editFormData, manualReviewEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0F8F8A]"
                />
                <span className="text-[13px] font-medium text-[#142126]">Force Manual Review</span>
              </label>
            </div>
          </div>
        </AdminModal>
      )}

      {/* PROTECTION REDUCTION WARNING MODAL */}
      {editWarningDetails && (
        <AdminModal
          open={editWarningModalOpen}
          onOpenChange={setEditWarningModalOpen}
          title="⚠️ Financial Protection Reduction Warning"
          className="sm:max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <AdminButton variant="outline" onClick={() => setEditWarningModalOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={() => handleSaveEdit(true)}>
                Confirm & Apply Reduction
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-3 text-[13px]">
            <p className="text-[#EF4444] font-semibold">
              {editWarningDetails.warningMessage}
            </p>

            <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-[8px] space-y-2 text-[12px]">
              <div className="font-bold text-[#991B1B]">Comparison (Before vs After):</div>
              <div className="flex items-center justify-between">
                <span>Minimum Gross Margin:</span>
                <span className="font-mono">
                  {editWarningDetails.before?.minimumGrossMarginPercent}% &rarr;{" "}
                  <strong className="text-[#EF4444]">{editWarningDetails.after?.minimumGrossMarginPercent}%</strong>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Minimum Gross Profit:</span>
                <span className="font-mono">
                  ${editWarningDetails.before?.minimumGrossProfit.toFixed(2)} &rarr;{" "}
                  <strong className="text-[#EF4444]">${editWarningDetails.after?.minimumGrossProfit.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            <p className="text-[#65737A] text-[12px]">
              This action will be permanently recorded in the Admin Audit Log.
            </p>
          </div>
        </AdminModal>
      )}

      {/* MANUAL OVERRIDE MODAL */}
      {selectedQueueOrder && (
        <AdminModal
          open={overrideModalOpen}
          onOpenChange={setOverrideModalOpen}
          title={`Manual Supplier Override: Order ${selectedQueueOrder.publicId || selectedQueueOrder.id.slice(0, 8)}`}
          className="sm:max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <AdminButton variant="outline" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={() => submitOverride(false)}>
                Submit Override
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-4 text-[13px]">
            <div className="bg-[#F7F9FA] border border-[#E3E8EA] p-3 rounded-[8px] space-y-1">
              <div className="font-bold text-[#142126]">
                {selectedQueueOrder.platform} &gt; {selectedQueueOrder.service} ({selectedQueueOrder.quantity?.toLocaleString()} units)
              </div>
              <div className="text-[12px] text-[#65737A]">
                Customer Paid: <strong>{selectedQueueOrder.customerPaidFormatted}</strong>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                Supplier Service ID
              </label>
              <input
                type="text"
                value={overrideSupplierId}
                onChange={(e) => setOverrideSupplierId(e.target.value)}
                placeholder="e.g. 30159"
                className="w-full text-[13px] font-mono px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                Total Supplier Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={overrideSupplierCost}
                onChange={(e) => setOverrideSupplierCost(e.target.value)}
                placeholder="e.g. 12.50"
                className="w-full text-[13px] px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#142126] mb-1">
                Override Reason (Mandatory)
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State clearly why this override is being authorized..."
                className="w-full text-[13px] px-3 py-1.5 border border-[#D1D9DC] rounded-[6px] focus:border-[#0F8F8A] focus:outline-none"
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* OVERRIDE VIOLATION WARNING MODAL */}
      {overrideWarning && (
        <AdminModal
          open={overrideWarningOpen}
          onOpenChange={setOverrideWarningOpen}
          title="🚨 Financial Protection Violation Warning"
          className="sm:max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <AdminButton variant="outline" onClick={() => setOverrideWarningOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={() => submitOverride(true)}>
                Explicitly Authorize Loss / Override
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-3 text-[13px]">
            <p className="text-[#EF4444] font-bold">
              {overrideWarning.violationMessage}
            </p>

            <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-[8px] space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span>Supplier Cost:</span>
                <strong className="font-mono">${overrideWarning.supplierCost?.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Customer Paid:</span>
                <strong className="font-mono">${overrideWarning.customerPaid?.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Gross Profit:</span>
                <strong className="font-mono text-[#EF4444]">${overrideWarning.grossProfit?.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Gross Margin:</span>
                <strong className="font-mono text-[#EF4444]">{overrideWarning.grossMargin?.toFixed(1)}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Required Margin:</span>
                <strong className="font-mono">{overrideWarning.requiredMargin}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Cost Ceiling:</span>
                <strong className="font-mono">${overrideWarning.costCeiling?.toFixed(2)}</strong>
              </div>
            </div>

            <p className="text-[#65737A] text-[12px]">
              An audit entry with your admin credentials will be logged permanently.
            </p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
