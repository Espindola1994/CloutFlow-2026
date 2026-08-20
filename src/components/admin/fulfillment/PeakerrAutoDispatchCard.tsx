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
} from "lucide-react";

export interface FulfillmentOverviewData {
  notDispatched: number;
  submitting: number;
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
  const [fulfillmentStats, setFulfillmentStats] = useState<FulfillmentOverviewData | null>(null);
  const [autoDispatchStats, setAutoDispatchStats] = useState<AutoDispatchOverviewData | null>(null);
  const [candidates, setCandidates] = useState<CandidateOrder[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/fulfillment/overview');
      const json = await res.json();
      if (json.success && json.data) {
        setFulfillmentStats(json.data.fulfillment);
        setAutoDispatchStats(json.data.autoDispatch);
      } else {
        setError(json.error?.message || 'Failed to load fulfillment overview.');
      }
    } catch {
      setError('Network error loading fulfillment overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/fulfillment/auto-dispatch/candidates?limit=25');
      const json = await res.json();
      if (json.success && json.data) {
        setCandidates(json.data);
        setShowCandidates(true);
      } else {
        setError(json.error?.message || 'Failed to load auto-dispatch candidates.');
      }
    } catch {
      setError('Network error fetching candidates.');
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="space-y-6">
      {/* CARD 1: FULFILLMENT OVERVIEW (Real Accumulated DB Metrics) */}
      <div className="p-5 rounded-2xl bg-[#0e131f] border border-neutral-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fulfillment Overview</h3>
              <p className="text-[11px] text-neutral-400">
                Real accumulated database metrics across all orders (distinct from execution run metrics).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Accumulated Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Not Dispatched</span>
            <span className="text-lg font-bold font-mono text-amber-400">{fulfillmentStats?.notDispatched ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Submitting</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{fulfillmentStats?.submitting ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Processing</span>
            <span className="text-lg font-bold font-mono text-blue-400">{fulfillmentStats?.processing ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Partial</span>
            <span className="text-lg font-bold font-mono text-yellow-400">{fulfillmentStats?.partial ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Completed</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{fulfillmentStats?.completed ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Failed</span>
            <span className="text-lg font-bold font-mono text-red-400">{fulfillmentStats?.failed ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Canceled</span>
            <span className="text-lg font-bold font-mono text-neutral-400">{fulfillmentStats?.canceled ?? '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 border-l-2 border-l-emerald-500">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Dispatched</span>
            <span className="text-lg font-bold font-mono text-white">{fulfillmentStats?.totalDispatched ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: AUTO DISPATCH (Safe Guarded Infrastructure) */}
      <div className="p-5 rounded-2xl bg-[#0e131f] border border-neutral-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Auto Dispatch</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300">
                  EVALUATION ONLY (FASE 4.0)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Safe automated dispatch evaluation for verified paid orders. Mass submit disabled.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCandidates}
              disabled={candidatesLoading}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {candidatesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
              <span>Preview Eligible Orders</span>
            </button>
          </div>
        </div>

        {/* Runtime Flags & Provider Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Auto Dispatch</span>
              <span className={`text-xs font-bold ${autoDispatchStats?.autoDispatchEnabled ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {autoDispatchStats?.autoDispatchEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${autoDispatchStats?.autoDispatchEnabled ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Live Fulfillment</span>
              <span className={`text-xs font-bold ${autoDispatchStats?.liveFulfillmentEnabled ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {autoDispatchStats?.liveFulfillmentEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${autoDispatchStats?.liveFulfillmentEnabled ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Eligible Orders</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {autoDispatchStats?.eligiblePaidOrders ?? 0}
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Provider Balance</span>
              <span className="text-sm font-bold font-mono text-white">
                {autoDispatchStats?.providerBalance !== undefined
                  ? `${autoDispatchStats.currency || 'USD'} ${autoDispatchStats.providerBalance.toFixed(2)}`
                  : '—'}
              </span>
            </div>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        {/* Breakdown of Blocked Reasons */}
        <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80 space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Auto Dispatch Eligibility Breakdown (Paid Orders)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60">
              <span className="text-neutral-500 text-[10px] block">Eligible</span>
              <strong className="text-emerald-400">{autoDispatchStats?.eligiblePaidOrders ?? 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60">
              <span className="text-neutral-500 text-[10px] block">Missing Target</span>
              <strong className="text-neutral-300">{autoDispatchStats?.blockedMissingTarget ?? 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60">
              <span className="text-neutral-500 text-[10px] block">Missing Chain</span>
              <strong className="text-neutral-300">{autoDispatchStats?.blockedMissingChain ?? 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60">
              <span className="text-neutral-500 text-[10px] block">Invalid Qty</span>
              <strong className="text-neutral-300">{autoDispatchStats?.blockedInvalidQuantity ?? 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60">
              <span className="text-neutral-500 text-[10px] block">Inactive Offer</span>
              <strong className="text-neutral-300">{autoDispatchStats?.blockedInactiveOffer ?? 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60">
              <span className="text-neutral-500 text-[10px] block">Low Balance</span>
              <strong className="text-neutral-300">{autoDispatchStats?.blockedInsufficientBalance ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Candidate Orders List (Read-Only Preview) */}
        {showCandidates && (
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Candidate Orders Evaluation ({candidates.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowCandidates(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                Hide
              </button>
            </div>

            {candidates.length === 0 ? (
              <p className="text-xs text-neutral-500">No paid un-dispatched orders currently found.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{c.publicId}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase">
                          {c.platform} / {c.service} ({c.quantity})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.evaluation.eligible
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {c.evaluation.eligible ? 'ELIGIBLE' : c.evaluation.code || 'BLOCKED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono truncate max-w-md">
                        Target: {c.evaluation.target || 'None'} {c.evaluation.reason ? `• ${c.evaluation.reason}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                      {c.evaluation.primaryServiceId && (
                        <span className="text-neutral-400">
                          Primary: <strong className="text-white">{c.evaluation.primaryServiceId}</strong>
                        </span>
                      )}
                      {c.evaluation.estimatedCost !== undefined && (
                        <span className="text-neutral-400">
                          Est: <strong className="text-white">${c.evaluation.estimatedCost.toFixed(4)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
