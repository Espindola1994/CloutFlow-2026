"use client";

import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { AdminCard, AdminStatCard, AdminBadge } from "../ui";

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
    <div className="space-y-4 select-none mb-6">
      <AdminCard className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3E8EA]">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[#0F8F8A] shrink-0" />
            <div>
               <h3 className="text-[14px] font-bold text-[#142126] tracking-tight">
                 AUTOMATIC STATUS SYNC
               </h3>
               <p className="text-[12px] text-[#65737A]">Read-only monitoring of provider order synchronization.</p>
            </div>
            <AdminBadge variant={enabled ? "success" : "default"} className="ml-2">
              Automatic Sync: {enabled ? "ENABLED" : "DISABLED"}
            </AdminBadge>
          </div>

          <button
            type="button"
            onClick={onRunSync}
            disabled={loading}
            className="px-4 py-2 rounded-[8px] bg-[#0F8F8A] hover:bg-[#0B7A76] text-white font-sans text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Run Status Sync Now</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            <AdminStatCard 
              title="Last Manual Run" 
              value={metrics?.lastRun || "—"} 
              className="bg-[#F7F9FA]" 
            />
            <AdminStatCard 
              title="Checked" 
              value={metrics?.checked ?? "—"} 
              className="bg-[#F7F9FA]" 
              icon={RefreshCw}
            />
            <AdminStatCard 
              title="Updated" 
              value={metrics?.updated ?? "—"} 
              className="bg-[#F7F9FA]" 
            />
            <AdminStatCard 
              title="Completed" 
              value={metrics?.completed ?? "—"} 
              className="bg-[#E8F8F2] border-[#B6ECD7]" 
            />
            <AdminStatCard 
              title="Partial" 
              value={metrics?.partial ?? "—"} 
              className="bg-[#FEF6E7] border-[#FDE68A]" 
            />
            <AdminStatCard 
              title="Canceled" 
              value={metrics?.canceled ?? "—"} 
              className="bg-[#FEECEB] border-[#FCA5A5]" 
            />
            <AdminStatCard 
              title="Errors" 
              value={metrics?.errors ?? "—"} 
              className="bg-[#FEECEB] border-[#FCA5A5]" 
            />
        </div>
      </AdminCard>
    </div>
  );
}
