"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight,
  X,
  TrendingUp,
} from "lucide-react";
import { AdminCard, AdminBadge, AdminButton, AdminModal } from "../ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface FulfillmentOverviewData {
  notDispatched: number;
  submitting: number;
  waitingProvider?: number;
  processing: number;
  partial: number;
  completed: number;
  failed: number;
  canceled: number;
  totalDispatched: number;
  totalPaid: number;
}

export interface AutoDispatchOverviewData {
  autoDispatchEnabled: boolean;
  liveFulfillmentEnabled: boolean;
  paymentTriggerConnected?: boolean;
  eligiblePaidOrders: number;
  blockedMissingTarget: number;
  blockedMissingChain: number;
  blockedInvalidQuantity: number;
  blockedInactiveOffer: number;
  blockedInsufficientBalance: number;
  blockedPaymentIneligible: number;
  blockedAlreadyClaimed: number;
  providerBalance?: number;
  currency?: string;
}

export interface CandidateOrder {
  id: string;
  publicId: string;
  platform: string;
  service: string;
  quantity: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  evaluation: {
    eligible: boolean;
    reason?: string;
    code?: string;
    target?: string;
    primaryServiceId?: string;
    estimatedCost?: number;
    providerBalance?: number;
    currency?: string;
  };
}

export function PeakerrAutoDispatchCard() {
  const [loading, setLoading] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [fulfillmentStats, setFulfillmentStats] = useState<FulfillmentOverviewData | null>(null);
  const [autoDispatchStats, setAutoDispatchStats] = useState<AutoDispatchOverviewData | null>(null);
  const [candidates, setCandidates] = useState<CandidateOrder[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CandidateOrder | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [dispatchSuccess, setDispatchSuccess] = useState<{ id: string; providerOrder: string } | null>(null);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedOrdersData, setFailedOrdersData] = useState<any[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [inspectFailedOrder, setInspectFailedOrder] = useState<any | null>(null);

  // Reconciliation & Recovery State
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileConfirmText, setReconcileConfirmText] = useState("");
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileSuccess, setReconcileSuccess] = useState<string | null>(null);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryConfirmText, setRecoveryConfirmText] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [preCheckData, setPreCheckData] = useState<any | null>(null);
  const [preCheckLoading, setPreCheckLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment/overview");
      const json = await res.json();
      if (json.success && json.data) {
        setFulfillmentStats(json.data.fulfillment);
        setAutoDispatchStats(json.data.autoDispatch);
      } else {
        setError(json.error?.message || "Failed to load fulfillment overview.");
      }
    } catch {
      setError("Network error loading fulfillment overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment/auto-dispatch/candidates?limit=25");
      const json = await res.json();
      if (json.success && json.data) {
        setCandidates(json.data);
        setShowCandidates(true);
      } else {
        setError(json.error?.message || "Failed to load auto-dispatch candidates.");
      }
    } catch {
      setError("Network error fetching candidates.");
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleReviewOrder = (order: CandidateOrder) => {
    setSelectedOrder(order);
    setConfirmText("");
    setDispatchSuccess(null);
  };

  const submitSingleOrder = async () => {
    if (!selectedOrder) return;

    setDispatchLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/auto-dispatch-submit`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        setDispatchSuccess({
          id: selectedOrder.id,
          providerOrder: String(json.providerOrderId),
        });

        // Remove from candidates UI immediately
        setCandidates((prev) => prev.filter((c) => c.id !== selectedOrder.id));

        // Update stats
        fetchOverview();
      } else {
        setError(json.error?.message || json.code || "Failed to submit order.");
      }
    } catch {
      setError("Network error during auto-dispatch submit.");
    } finally {
      setDispatchLoading(false);
    }
  };

  const fetchFailedOrders = async () => {
    setLoadingFailed(true);
    try {
      const res = await fetch("/api/admin/debug-failed-orders");
      const json = await res.json();
      if (json.success && json.data) {
        setFailedOrdersData(json.data);
        setShowFailedModal(true);
      }
    } catch {
      // ignore
    } finally {
      setLoadingFailed(false);
    }
  };

  const handleReconcileOrder = async (orderId: string) => {
    setReconcileLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fulfillment/reconcile-waiting-provider`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setReconcileSuccess("Order successfully reconciled to WAITING_PROVIDER.");
        fetchOverview();
        fetchFailedOrders();
      } else {
        setError(json.error || json.code || "Failed to reconcile order.");
      }
    } catch {
      setError("Network error reconciling order.");
    } finally {
      setReconcileLoading(false);
    }
  };

  const handleRetryRecovery = async (orderId: string) => {
    setRecoveryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fulfillment/retry-waiting-provider`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setRecoverySuccess(`Recovery successfully submitted. Provider Order #${json.data.providerOrderId}`);
        fetchOverview();
        fetchFailedOrders();
      } else {
        setError(json.error || json.code || "Failed to submit recovery retry.");
      }
    } catch {
      setError("Network error executing recovery retry.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const fetchTargetPreCheck = async (orderId: string) => {
    setPreCheckLoading(true);
    setPreCheckData(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fulfillment/check-target-availability`);
      const json = await res.json();
      if (json.success) {
        setPreCheckData(json.data);
      }
    } catch {
      // non-blocking
    } finally {
      setPreCheckLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Chart data preparation from real fulfillmentStats
  const chartData = [
    { name: "Not Dispatched", count: fulfillmentStats?.notDispatched ?? 0, color: "#D97706" },
    { name: "Submitting", count: fulfillmentStats?.submitting ?? 0, color: "#169BD5" },
    { name: "Waiting Prov.", count: fulfillmentStats?.waitingProvider ?? 0, color: "#F59E0B" },
    { name: "Processing", count: fulfillmentStats?.processing ?? 0, color: "#0F8F8A" },
    { name: "Partial", count: fulfillmentStats?.partial ?? 0, color: "#EAB308" },
    { name: "Completed", count: fulfillmentStats?.completed ?? 0, color: "#16B77A" },
    { name: "Failed", count: fulfillmentStats?.failed ?? 0, color: "#EF4444" },
    { name: "Canceled", count: fulfillmentStats?.canceled ?? 0, color: "#8A979D" },
  ];

  return (
    <div className="space-y-6">
      {/* MAIN GRID: 58% Fulfillment Overview | 42% Auto Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: FULFILLMENT OVERVIEW (Col 7 / 12 ~ 58%) */}
        <div className="lg:col-span-7 space-y-4">
          <AdminCard className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3E8EA]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E7F5F4] text-[#0F8F8A]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#142126] tracking-tight">
                    FULFILLMENT OVERVIEW
                  </h3>
                  <p className="text-[12px] text-[#65737A]">
                    Real accumulated fulfillment metrics across current orders.
                  </p>
                </div>
              </div>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={fetchOverview}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Refresh</span>
              </AdminButton>
            </div>

            {/* Visual Real State Chart (Recharts Bar) */}
            <div className="bg-[#F7F9FA] border border-[#E3E8EA] rounded-[8px] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
                  Order Status Distribution
                </span>
                <span className="text-[11px] text-[#8A979D]">
                  Total Dispatched: <strong className="text-[#142126]">{fulfillmentStats?.totalDispatched ?? "—"}</strong>
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F2" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#8A979D"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#E3E8EA" }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#8A979D"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E3E8EA",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value: any) => [value, "Orders"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Grid (3x3 compact blocks) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-semibold text-[#65737A] block">Not Dispatched</span>
                <span className="text-[16px] font-bold text-[#D97706]">{fulfillmentStats?.notDispatched ?? "—"}</span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-semibold text-[#65737A] block">Submitting</span>
                <span className="text-[16px] font-bold text-[#169BD5]">{fulfillmentStats?.submitting ?? "—"}</span>
              </div>

              <div
                className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA] border-l-[3px] border-l-[#F59E0B] cursor-pointer hover:bg-[#FBFCFC] transition-colors"
                onClick={fetchFailedOrders}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#D97706] block">Waiting Prov.</span>
                  <span className="text-[10px] text-[#0F8F8A] underline font-medium">Inspect</span>
                </div>
                <span className="text-[16px] font-bold text-[#D97706]">{fulfillmentStats?.waitingProvider ?? 0}</span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-semibold text-[#65737A] block">Processing</span>
                <span className="text-[16px] font-bold text-[#0F8F8A]">{fulfillmentStats?.processing ?? "—"}</span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-semibold text-[#65737A] block">Partial</span>
                <span className="text-[16px] font-bold text-[#D97706]">{fulfillmentStats?.partial ?? "—"}</span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-semibold text-[#65737A] block">Completed</span>
                <span className="text-[16px] font-bold text-[#16B77A]">{fulfillmentStats?.completed ?? "—"}</span>
              </div>

              <div
                className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA] border-l-[3px] border-l-[#EF4444] cursor-pointer hover:bg-[#FBFCFC] transition-colors"
                onClick={fetchFailedOrders}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#EF4444] block">Failed</span>
                  <span className="text-[10px] text-[#EF4444] underline font-medium">Inspect</span>
                </div>
                <span className="text-[16px] font-bold text-[#EF4444]">{fulfillmentStats?.failed ?? "—"}</span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white border border-[#E3E8EA]">
                <span className="text-[10px] uppercase font-semibold text-[#65737A] block">Canceled</span>
                <span className="text-[16px] font-bold text-[#65737A]">{fulfillmentStats?.canceled ?? "—"}</span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#E7F5F4] border border-[#BFE5E2] border-l-[3px] border-l-[#0F8F8A]">
                <span className="text-[10px] uppercase font-semibold text-[#0F8F8A] block">Total Dispatched</span>
                <span className="text-[16px] font-bold text-[#142126]">{fulfillmentStats?.totalDispatched ?? "—"}</span>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* RIGHT COLUMN: AUTO DISPATCH (Col 5 / 12 ~ 42%) */}
        <div className="lg:col-span-5 space-y-4">
          <AdminCard className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3E8EA]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#F3E8FF] text-[#9333EA]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-[#142126] tracking-tight">
                      AUTO DISPATCH
                    </h3>
                    <AdminBadge variant="default">EVALUATION ONLY</AdminBadge>
                  </div>
                  <p className="text-[12px] text-[#65737A]">
                    Safe automated dispatch evaluation for verified paid orders.
                  </p>
                </div>
              </div>

              <AdminButton
                variant="primary"
                size="sm"
                onClick={fetchCandidates}
                disabled={candidatesLoading}
              >
                {candidatesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                <span>Preview Orders</span>
              </AdminButton>
            </div>

            {/* Operational Status Rows */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex items-center justify-between">
                <span className="font-medium text-[#65737A]">Payment Trigger</span>
                <AdminBadge variant={autoDispatchStats?.paymentTriggerConnected ? "success" : "default"}>
                  {autoDispatchStats?.paymentTriggerConnected ? "CONNECTED" : "NOT CONNECTED"}
                </AdminBadge>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex items-center justify-between">
                <span className="font-medium text-[#65737A]">Auto Dispatch</span>
                <AdminBadge variant={autoDispatchStats?.autoDispatchEnabled ? "success" : "default"}>
                  {autoDispatchStats?.autoDispatchEnabled ? "ENABLED" : "DISABLED"}
                </AdminBadge>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex items-center justify-between">
                <span className="font-medium text-[#65737A]">Live Fulfillment</span>
                <AdminBadge variant={autoDispatchStats?.liveFulfillmentEnabled ? "success" : "default"}>
                  {autoDispatchStats?.liveFulfillmentEnabled ? "ENABLED" : "DISABLED"}
                </AdminBadge>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex items-center justify-between">
                <span className="font-medium text-[#65737A]">Eligible Orders</span>
                <span className="text-[14px] font-bold text-[#16B77A]">
                  {autoDispatchStats?.eligiblePaidOrders ?? 0}
                </span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex items-center justify-between">
                <span className="font-medium text-[#65737A]">Provider Balance</span>
                <span className="text-[13px] font-bold text-[#142126]">
                  {autoDispatchStats?.providerBalance !== undefined
                    ? `${autoDispatchStats.currency || "USD"} ${autoDispatchStats.providerBalance.toFixed(2)}`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Eligibility Breakdown */}
            <div className="p-3 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] space-y-2">
              <span className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider block">
                Eligibility Breakdown (Paid Orders)
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-[6px] bg-white border border-[#E3E8EA]">
                  <span className="text-[#8A979D] text-[10px] block">Eligible</span>
                  <strong className="text-[#16B77A] text-[13px]">{autoDispatchStats?.eligiblePaidOrders ?? 0}</strong>
                </div>
                <div className="p-2 rounded-[6px] bg-white border border-[#E3E8EA]">
                  <span className="text-[#8A979D] text-[10px] block">No Target</span>
                  <strong className="text-[#142126] text-[13px]">{autoDispatchStats?.blockedMissingTarget ?? 0}</strong>
                </div>
                <div className="p-2 rounded-[6px] bg-white border border-[#E3E8EA]">
                  <span className="text-[#8A979D] text-[10px] block">No Chain</span>
                  <strong className="text-[#142126] text-[13px]">{autoDispatchStats?.blockedMissingChain ?? 0}</strong>
                </div>
                <div className="p-2 rounded-[6px] bg-white border border-[#E3E8EA]">
                  <span className="text-[#8A979D] text-[10px] block">Invalid Qty</span>
                  <strong className="text-[#142126] text-[13px]">{autoDispatchStats?.blockedInvalidQuantity ?? 0}</strong>
                </div>
                <div className="p-2 rounded-[6px] bg-white border border-[#E3E8EA]">
                  <span className="text-[#8A979D] text-[10px] block">Inactive</span>
                  <strong className="text-[#142126] text-[13px]">{autoDispatchStats?.blockedInactiveOffer ?? 0}</strong>
                </div>
                <div className="p-2 rounded-[6px] bg-white border border-[#E3E8EA]">
                  <span className="text-[#8A979D] text-[10px] block">Low Bal.</span>
                  <strong className="text-[#142126] text-[13px]">{autoDispatchStats?.blockedInsufficientBalance ?? 0}</strong>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </AdminCard>
        </div>
      </div>

      {/* Candidate Orders List (Read-Only Preview Section) */}
      {showCandidates && (
        <AdminCard className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E8EA]">
            <h4 className="text-[13px] font-bold text-[#142126] uppercase tracking-wider">
              Candidate Orders Evaluation ({candidates.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowCandidates(false)}
              className="text-xs text-[#65737A] hover:text-[#142126] cursor-pointer font-medium"
            >
              Hide List
            </button>
          </div>

          {candidates.length === 0 ? (
            <p className="text-xs text-[#8A979D] py-4 text-center">No paid un-dispatched orders currently found.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#142126]">{c.publicId}</span>
                      <AdminBadge variant="secondary" size="sm">
                        {c.platform} / {c.service} ({c.quantity})
                      </AdminBadge>
                      <AdminBadge variant={c.evaluation.eligible ? "success" : "warning"} size="sm">
                        {c.evaluation.eligible ? "ELIGIBLE" : c.evaluation.code || "BLOCKED"}
                      </AdminBadge>
                    </div>
                    <p className="text-[11px] text-[#65737A] font-mono truncate max-w-md">
                      Target: {c.evaluation.target || "None"} {c.evaluation.reason ? `• ${c.evaluation.reason}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                    {c.evaluation.primaryServiceId && (
                      <span className="text-[#65737A]">
                        Primary: <strong className="text-[#142126]">{c.evaluation.primaryServiceId}</strong>
                      </span>
                    )}
                    {c.evaluation.estimatedCost !== undefined && (
                      <span className="text-[#65737A]">
                        Est: <strong className="text-[#142126]">${c.evaluation.estimatedCost.toFixed(4)}</strong>
                      </span>
                    )}
                    {c.evaluation.eligible && (
                      <AdminButton
                        size="sm"
                        variant="primary"
                        onClick={() => handleReviewOrder(c)}
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </AdminButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}

      {/* MODAL: CONTROLLED AUTO DISPATCH REVIEW */}
      <AdminModal
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setConfirmText("");
            setDispatchSuccess(null);
          }
        }}
        title="Controlled Auto Dispatch Review"
        description="Single Eligible Order Safe Peakerr Submission"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {dispatchSuccess ? (
              <div className="p-4 rounded-[8px] bg-[#E8F8F2] border border-[#B6ECD7] space-y-3">
                <div className="flex items-center gap-2 text-[#16B77A] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>AUTO DISPATCH SUBMITTED</span>
                </div>
                <div className="text-xs font-mono space-y-1 text-[#142126]">
                  <p>
                    Provider Order: <strong className="text-[#0F8F8A]">#{dispatchSuccess.providerOrder}</strong>
                  </p>
                  <p>
                    Status: <strong className="text-[#16B77A]">PROCESSING</strong>
                  </p>
                </div>
                <div className="pt-2">
                  <AdminButton
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setSelectedOrder(null);
                      setConfirmText("");
                      setDispatchSuccess(null);
                    }}
                  >
                    Close
                  </AdminButton>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Public ID</span>
                    <strong className="text-[#142126]">{selectedOrder.publicId}</strong>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Platform / Service</span>
                    <strong className="text-[#142126]">
                      {selectedOrder.platform} / {selectedOrder.service}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Quantity</span>
                    <strong className="text-[#142126]">{selectedOrder.quantity}</strong>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Primary Peakerr Service</span>
                    <strong className="text-[#0F8F8A]">{selectedOrder.evaluation.primaryServiceId || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] col-span-2">
                    <span className="text-[#65737A] text-[10px] block">Canonical Target</span>
                    <strong className="text-[#142126] break-all">{selectedOrder.evaluation.target || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Estimated Cost</span>
                    <strong className="text-[#142126]">
                      {selectedOrder.evaluation.estimatedCost !== undefined
                        ? `$${selectedOrder.evaluation.estimatedCost.toFixed(4)}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Provider Balance</span>
                    <strong className="text-[#142126]">
                      {autoDispatchStats?.providerBalance !== undefined
                        ? `$${autoDispatchStats.providerBalance.toFixed(2)}`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-[8px] bg-[#FEF6E7] border border-[#FDE68A] text-[#D97706] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Strong Confirmation Required</span>
                  </div>
                  <p className="text-[11px] text-[#65737A]">
                    To authorize controlled dispatch of this single order, type{" "}
                    <strong className="text-[#142126] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E3E8EA]">
                      AUTO DISPATCH
                    </strong>{" "}
                    below.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="AUTO DISPATCH"
                    className="w-full px-3 py-2 bg-white border border-[#D1D9DC] rounded-[8px] text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF1F2]">
                  <AdminButton
                    variant="secondary"
                    onClick={() => {
                      setSelectedOrder(null);
                      setConfirmText("");
                    }}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    onClick={submitSingleOrder}
                    disabled={confirmText !== "AUTO DISPATCH" || dispatchLoading}
                    isLoading={dispatchLoading}
                  >
                    <span>Dispatch This Order</span>
                  </AdminButton>
                </div>
              </>
            )}
          </div>
        )}
      </AdminModal>

      {/* MODAL: FAILED ORDERS FORENSIC (Read Only) */}
      <AdminModal
        open={showFailedModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowFailedModal(false);
            setInspectFailedOrder(null);
          }
        }}
        title="Failed Orders Forensic (Read-Only)"
        description="Strictly no mutations allowed."
        className="sm:max-w-3xl"
      >
        <div>
          {inspectFailedOrder ? (
            <div className="space-y-4">
              <button
                onClick={() => setInspectFailedOrder(null)}
                className="text-xs text-[#0F8F8A] hover:underline font-semibold inline-block cursor-pointer"
              >
                ← Back to List
              </button>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                  <span className="text-[#65737A] text-[10px] block">Public ID</span>
                  <strong className="text-[#142126]">{inspectFailedOrder.order.publicId}</strong>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                  <span className="text-[#65737A] text-[10px] block">UUID</span>
                  <strong className="text-[#65737A]">{inspectFailedOrder.order.id}</strong>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                  <span className="text-[#65737A] text-[10px] block">Payment / Fulfillment</span>
                  <strong className="text-[#142126]">
                    {inspectFailedOrder.order.paymentStatus} / {inspectFailedOrder.order.fulfillmentStatus}
                  </strong>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                  <span className="text-[#65737A] text-[10px] block">Platform / Service</span>
                  <strong className="text-[#142126]">
                    {inspectFailedOrder.order.platform} / {inspectFailedOrder.order.service} (
                    {inspectFailedOrder.order.quantity})
                  </strong>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] col-span-2">
                  <span className="text-[#65737A] text-[10px] block">Target</span>
                  <strong className="text-[#142126] break-all">{inspectFailedOrder.order.targetUrl || "—"}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#142126] uppercase tracking-wider">Fulfillment Orders</h4>
                {inspectFailedOrder.fulfillmentOrders.length === 0 ? (
                  <div className="p-3 bg-[#F7F9FA] rounded-[8px] text-xs text-[#8A979D] border border-[#E3E8EA]">
                    No records found.
                  </div>
                ) : (
                  inspectFailedOrder.fulfillmentOrders.map((fo: any) => {
                    const isConflict =
                      fo.lastError &&
                      (fo.lastError.toLowerCase().includes("active order") ||
                        fo.lastError.toLowerCase().includes("wait until order being completed"));
                    return (
                      <div
                        key={fo.id}
                        className="p-3 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA] text-xs font-mono space-y-1"
                      >
                        <div>
                          <span className="text-[#65737A]">Provider:</span>{" "}
                          <span className="text-[#142126]">{fo.provider}</span>
                        </div>
                        <div>
                          <span className="text-[#65737A]">Provider Service:</span>{" "}
                          <span className="text-[#142126]">{fo.externalServiceId || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[#65737A]">Provider Order ID:</span>{" "}
                          <span className="text-[#D97706] font-bold">
                            {fo.externalOrderId || "NO PROVIDER ORDER ID RECORDED"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#65737A]">Status:</span>{" "}
                          <span className="text-[#EF4444] font-bold">{fo.status}</span>
                        </div>
                        {isConflict && (
                          <div className="p-2 my-1 rounded-[6px] bg-[#FEF6E7] border border-[#FDE68A] text-[#D97706] font-bold">
                            Classification: PROVIDER_ACTIVE_ORDER_CONFLICT
                          </div>
                        )}
                        <div>
                          <span className="text-[#65737A]">Error:</span>{" "}
                          <span className="text-[#EF4444]">{fo.lastError || "—"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#142126] uppercase tracking-wider">Order Events</h4>
                <div className="p-3 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA] max-h-48 overflow-y-auto space-y-2">
                  {inspectFailedOrder.orderEvents.map((ev: any) => (
                    <div key={ev.id} className="text-[11px] font-mono border-b border-[#E3E8EA] pb-2 last:border-0">
                      <span className="text-[#8A979D]">[{new Date(ev.createdAt).toISOString()}]</span>{" "}
                      <span className="text-[#0F8F8A] font-semibold">{ev.status || ev.fulfillmentStatus}</span>{" "}
                      <span className="text-[#142126]">{ev.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EDF1F2] flex items-center justify-end gap-2">
                {inspectFailedOrder.order.fulfillmentStatus === "FAILED" && (
                  <AdminButton
                    variant="primary"
                    onClick={() => {
                      setShowReconcileModal(true);
                      setReconcileConfirmText("");
                      setReconcileSuccess(null);
                    }}
                  >
                    <span>Reconcile as WAITING_PROVIDER</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </AdminButton>
                )}

                {inspectFailedOrder.order.fulfillmentStatus === "WAITING_PROVIDER" && (
                  <AdminButton
                    variant="primary"
                    onClick={() => {
                      setShowRecoveryModal(true);
                      setRecoveryConfirmText("");
                      setRecoverySuccess(null);
                      fetchTargetPreCheck(inspectFailedOrder.order.id);
                    }}
                  >
                    <span>Review Recovery</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </AdminButton>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {failedOrdersData.length === 0 ? (
                <p className="text-xs text-[#8A979D] text-center py-8">No FAILED orders found.</p>
              ) : (
                failedOrdersData.map((d) => (
                  <div
                    key={d.order.id}
                    className="p-3 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono text-xs text-[#142126] font-bold">{d.order.publicId}</div>
                      <div className="text-[11px] text-[#65737A]">
                        {d.order.platform} / {d.order.service} ({d.order.quantity})
                      </div>
                    </div>
                    <AdminButton size="sm" variant="secondary" onClick={() => setInspectFailedOrder(d)}>
                      Inspect
                    </AdminButton>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </AdminModal>

      {/* MODAL: ACTIVE ORDER CONFLICT RECONCILIATION */}
      <AdminModal
        open={showReconcileModal && Boolean(inspectFailedOrder)}
        onOpenChange={(open) => {
          if (!open) setShowReconcileModal(false);
        }}
        title="Active Order Conflict Reconciliation"
        description="Reconcile FAILED to WAITING_PROVIDER"
      >
        {inspectFailedOrder && (
          <div className="space-y-4">
            {reconcileSuccess ? (
              <div className="p-4 rounded-[8px] bg-[#E8F8F2] border border-[#B6ECD7] space-y-3">
                <div className="flex items-center gap-2 text-[#16B77A] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{reconcileSuccess}</span>
                </div>
                <AdminButton
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setShowReconcileModal(false);
                    setShowFailedModal(false);
                    setInspectFailedOrder(null);
                  }}
                >
                  Done
                </AdminButton>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Public ID</span>
                    <strong className="text-[#142126]">{inspectFailedOrder.order.publicId}</strong>
                  </div>
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Payment / Quantity</span>
                    <strong className="text-[#142126]">
                      {inspectFailedOrder.order.paymentStatus} / {inspectFailedOrder.order.quantity}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA] col-span-2">
                    <span className="text-[#65737A] text-[10px] block">Target</span>
                    <strong className="text-[#142126] break-all">{inspectFailedOrder.order.targetUrl || "—"}</strong>
                  </div>
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA] col-span-2">
                    <span className="text-[#65737A] text-[10px] block">Stored Error</span>
                    <strong className="text-[#EF4444]">
                      {inspectFailedOrder.fulfillmentOrders[0]?.lastError || "None"}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-[8px] bg-[#FEF6E7] border border-[#FDE68A] text-[#D97706] text-xs space-y-1.5">
                  <p className="text-[11px] text-[#65737A]">
                    To confirm reconciling this order to{" "}
                    <strong className="text-[#142126] font-mono bg-white px-1 py-0.5 rounded border border-[#E3E8EA]">
                      WAITING_PROVIDER
                    </strong>
                    , type{" "}
                    <strong className="text-[#142126] font-mono bg-white px-1 py-0.5 rounded border border-[#E3E8EA]">
                      RECONCILE
                    </strong>{" "}
                    below.
                  </p>
                  <input
                    type="text"
                    value={reconcileConfirmText}
                    onChange={(e) => setReconcileConfirmText(e.target.value)}
                    placeholder="RECONCILE"
                    className="w-full px-3 py-2 bg-white border border-[#D1D9DC] rounded-[8px] text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF1F2]">
                  <AdminButton variant="secondary" onClick={() => setShowReconcileModal(false)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    onClick={() => handleReconcileOrder(inspectFailedOrder.order.id)}
                    disabled={reconcileConfirmText !== "RECONCILE" || reconcileLoading}
                    isLoading={reconcileLoading}
                  >
                    <span>Confirm Reconciliation</span>
                  </AdminButton>
                </div>
              </>
            )}
          </div>
        )}
      </AdminModal>

      {/* MODAL: WAITING PROVIDER RECOVERY REVIEW */}
      <AdminModal
        open={showRecoveryModal && Boolean(inspectFailedOrder)}
        onOpenChange={(open) => {
          if (!open) setShowRecoveryModal(false);
        }}
        title="Waiting Provider Recovery Review"
        description="Execute exactly one controlled action=add attempt"
      >
        {inspectFailedOrder && (
          <div className="space-y-4">
            {recoverySuccess ? (
              <div className="p-4 rounded-[8px] bg-[#E8F8F2] border border-[#B6ECD7] space-y-3">
                <div className="flex items-center gap-2 text-[#16B77A] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{recoverySuccess}</span>
                </div>
                <AdminButton
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setShowFailedModal(false);
                    setInspectFailedOrder(null);
                  }}
                >
                  Close
                </AdminButton>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Public ID</span>
                    <strong className="text-[#142126]">{inspectFailedOrder.order.publicId}</strong>
                  </div>
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA]">
                    <span className="text-[#65737A] text-[10px] block">Platform / Service</span>
                    <strong className="text-[#142126]">
                      {inspectFailedOrder.order.platform} / {inspectFailedOrder.order.service} (
                      {inspectFailedOrder.order.quantity})
                    </strong>
                  </div>
                  <div className="p-2.5 bg-[#F7F9FA] rounded-[8px] border border-[#E3E8EA] col-span-2">
                    <span className="text-[#65737A] text-[10px] block">Canonical Target</span>
                    <strong className="text-[#142126] break-all">{inspectFailedOrder.order.targetUrl || "—"}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#142126] uppercase tracking-wider">
                      Target Activity Pre-Check
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchTargetPreCheck(inspectFailedOrder.order.id)}
                      disabled={preCheckLoading}
                      className="text-[11px] text-[#0F8F8A] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {preCheckLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>Refresh Check</span>
                    </button>
                  </div>

                  {preCheckLoading ? (
                    <div className="p-3 text-center text-xs text-[#65737A] flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0F8F8A]" />
                      <span>Checking known related provider orders...</span>
                    </div>
                  ) : preCheckData ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div
                        className={`p-2.5 rounded-[8px] border ${
                          preCheckData.recoverySafety === "BLOCKED_KNOWN_ACTIVE_ORDER"
                            ? "bg-[#FEECEB] border-[#FCA5A5] text-[#EF4444]"
                            : "bg-[#E8F8F2] border-[#B6ECD7] text-[#16B77A]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {preCheckData.recoverySafety === "BLOCKED_KNOWN_ACTIVE_ORDER" ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                              <span>ACTIVE PEAKERR ORDER FOUND IN RECORDS</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#16B77A] shrink-0" />
                              <span>NO KNOWN ACTIVE ORDER FOUND</span>
                            </>
                          )}
                        </div>
                        <p className="text-[10px] mt-1 text-[#65737A] font-sans">
                          {preCheckData.recoverySafety === "BLOCKED_KNOWN_ACTIVE_ORDER"
                            ? "A known related order is currently active at Peakerr. Do NOT retry until it completes."
                            : "CloutFlow found no active provider order among known records. Note: Peakerr does not expose global target-level lookup, so external activity outside CloutFlow cannot be ruled out."}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 bg-white rounded-[6px] border border-[#E3E8EA]">
                          <span className="text-[#8A979D] block text-[9px]">Related Orders</span>
                          <strong className="text-[#142126]">{preCheckData.relatedOrders?.length || 0}</strong>
                        </div>
                        <div className="p-2 bg-white rounded-[6px] border border-[#E3E8EA]">
                          <span className="text-[#8A979D] block text-[9px]">Known Active</span>
                          <strong className={preCheckData.activeOrders?.length > 0 ? "text-[#EF4444]" : "text-[#16B77A]"}>
                            {preCheckData.activeOrders?.length || 0}
                          </strong>
                        </div>
                        <div className="p-2 bg-white rounded-[6px] border border-[#E3E8EA]">
                          <span className="text-[#8A979D] block text-[9px]">Terminal</span>
                          <strong className="text-[#65737A]">{preCheckData.terminalOrders?.length || 0}</strong>
                        </div>
                      </div>

                      {preCheckData.activeOrders?.length > 0 && (
                        <div className="p-2 bg-white rounded-[6px] border border-[#FCA5A5] text-[10px] space-y-1">
                          <span className="text-[#EF4444] font-bold block">Active Orders List:</span>
                          {preCheckData.activeOrders.map((ao: any) => (
                            <div key={ao.id} className="text-[#142126]">
                              • Order: <strong>{ao.publicId}</strong> | Provider ID:{" "}
                              <strong>#{ao.providerOrderId}</strong> | Status:{" "}
                              <strong className="text-[#0F8F8A]">{ao.livePeakerrStatus}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="p-3 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Warning: Live Single Attempt</span>
                  </div>
                  <p className="text-[11px] text-[#65737A]">
                    This will perform one new Peakerr action=add attempt. To proceed, type{" "}
                    <strong className="text-[#142126] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E3E8EA]">
                      RETRY ONCE
                    </strong>{" "}
                    below.
                  </p>
                  <input
                    type="text"
                    value={recoveryConfirmText}
                    onChange={(e) => setRecoveryConfirmText(e.target.value)}
                    placeholder="RETRY ONCE"
                    disabled={preCheckData?.safeToRetry === false}
                    className="w-full px-3 py-2 bg-white border border-[#D1D9DC] rounded-[8px] text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A] disabled:opacity-50"
                  />
                  {preCheckData?.safeToRetry === false && (
                    <p className="text-[10px] text-[#EF4444] font-semibold">
                      Retry is disabled while an active order is known to be in progress.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF1F2]">
                  <AdminButton variant="secondary" onClick={() => setShowRecoveryModal(false)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    onClick={() => handleRetryRecovery(inspectFailedOrder.order.id)}
                    disabled={recoveryConfirmText !== "RETRY ONCE" || recoveryLoading || preCheckData?.safeToRetry === false}
                    isLoading={recoveryLoading}
                  >
                    <span>Execute Recovery Retry</span>
                  </AdminButton>
                </div>
              </>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
