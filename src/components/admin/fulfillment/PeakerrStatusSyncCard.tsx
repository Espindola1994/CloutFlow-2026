"use client";

import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";

export interface StatusSyncMetrics {
  checked: number;
  updated: number;
  completed: number;
  partial: number;
  canceled: number;
  errors: number;
  lastRun?: string;
}

interface PeakerrStatusSyncCardProps {
  enabled: boolean;
  loading: boolean;
  metrics: StatusSyncMetrics | null;
  onRunSync: () => void;
  buildMarker?: string;
  error?: string | null;
}

export const PEAKERR_SYNC_BUILD_ID = "02bf761-fase39b";

/**
 * ISOLATED UNCONDITIONAL STATUS SYNC CARD:
 * Rendered at the top level of Fulfillment & Peakerr tab regardless of order simulation or live API state.
 */
export function PeakerrStatusSyncCard({
  enabled,
  loading,
  metrics,
  onRunSync,
  buildMarker = PEAKERR_SYNC_BUILD_ID,
  error,
}: PeakerrStatusSyncCardProps) {
  return (
    <div className="space-y-2 select-none">
      {/* Visual forensic build marker for bundle verification */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono font-bold text-sky-400/90 tracking-wider">
          STATUS SYNC UI BUILD: <span className="text-white underline">{buildMarker}</span>
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
          READ-ONLY MONITORING • ZERO ACTION=ADD
        </span>
      </div>

      {/* Main Status Sync Panel */}
      <div className="p-4 rounded-2xl bg-[#0b101b] border border-sky-500/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              AUTOMATIC STATUS SYNC (READ-ONLY MONITORING)
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                enabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
              }`}
            >
              Automatic Sync: {enabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>

          <button
            type="button"
            onClick={onRunSync}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Run Status Sync Now</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Last Manual Run</span>
            <strong className="text-white text-xs">{metrics?.lastRun || "—"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Checked</span>
            <strong className="text-neutral-200 text-xs">{metrics?.checked ?? "—"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Updated</span>
            <strong className="text-sky-400 text-xs">{metrics?.updated ?? "—"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Completed</span>
            <strong className="text-emerald-400 text-xs">{metrics?.completed ?? "—"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Partial</span>
            <strong className="text-amber-400 text-xs">{metrics?.partial ?? "—"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Canceled</span>
            <strong className="text-rose-400 text-xs">{metrics?.canceled ?? "—"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Errors</span>
            <strong className={`${metrics?.errors ? "text-red-400" : "text-neutral-400"} text-xs`}>
              {metrics?.errors ?? "—"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
