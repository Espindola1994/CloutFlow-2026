"use client";

import React from "react";
import { RefreshCw, Loader2, Clock, CheckCircle, ArrowRightCircle, AlertTriangle, XCircle, AlertOctagon, RotateCw } from "lucide-react";

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

export const PEAKERR_SYNC_BUILD_ID = "02bf761-fase31-rebalance";

/**
 * AUTOMATIC STATUS SYNC
 * Height: Section Header ~44px, Cards 82px–88px.
 * White cards with 28x28 soft icon container and semantic dot/value highlights.
 */
export function PeakerrStatusSyncCard({
  loading,
  metrics,
  onRunSync,
  error,
}: PeakerrStatusSyncCardProps) {
  const syncItems = [
    {
      label: "Last Manual Run",
      value: metrics?.lastRun || "—",
      icon: Clock,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Checked",
      value: metrics?.checked !== undefined ? String(metrics.checked) : "—",
      icon: RotateCw,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#142126]",
    },
    {
      label: "Updated",
      value: metrics?.updated !== undefined ? String(metrics.updated) : "—",
      icon: ArrowRightCircle,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: "text-[#0F8F8A]",
    },
    {
      label: "Completed",
      value: metrics?.completed !== undefined ? String(metrics.completed) : "—",
      icon: CheckCircle,
      iconBg: "bg-[#E8F8F2] text-[#16B77A]",
      valueColor: (metrics?.completed ?? 0) > 0 ? "text-[#16B77A]" : "text-[#142126]",
    },
    {
      label: "Partial",
      value: metrics?.partial !== undefined ? String(metrics.partial) : "—",
      icon: AlertTriangle,
      iconBg: "bg-[#FEF3C7] text-[#D97706]",
      valueColor: (metrics?.partial ?? 0) > 0 ? "text-[#D97706]" : "text-[#142126]",
    },
    {
      label: "Canceled",
      value: metrics?.canceled !== undefined ? String(metrics.canceled) : "—",
      icon: XCircle,
      iconBg: "bg-[#F1F5F5] text-[#65737A]",
      valueColor: (metrics?.canceled ?? 0) > 0 ? "text-[#65737A]" : "text-[#142126]",
    },
    {
      label: "Errors",
      value: metrics?.errors !== undefined ? String(metrics.errors) : "—",
      icon: AlertOctagon,
      iconBg: "bg-[#FEECEB] text-[#EF4444]",
      valueColor: (metrics?.errors ?? 0) > 0 ? "text-[#EF4444]" : "text-[#142126]",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between min-h-[44px]">
        <div>
          <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
            AUTOMATIC STATUS SYNC
          </h3>
          <p className="text-[12px] text-[#65737A] mt-0.5">
            Read-only monitoring of provider order synchronization.
          </p>
        </div>
        <button
          type="button"
          onClick={onRunSync}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#0F8F8A] hover:text-[#0B7A76] bg-white border border-[#D9E2E3] rounded-[7px] hover:bg-[#F8FAFA] transition-colors cursor-pointer disabled:opacity-50 shadow-[0_1px_2px_rgba(10,35,42,0.02)]"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>Sync Now</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-[12px]">
          {error}
        </div>
      )}

      {/* 7-column metrics grid (cards ~78px height, 150-190px width) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {syncItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="min-h-[78px] bg-[#FFFFFF] border border-[#D9E2E3] rounded-[8px] p-[10px_14px] flex flex-col justify-between shadow-[0_1px_2px_rgba(10,35,42,0.02)]"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#65737A] truncate">
                  {item.label}
                </span>
                <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <Icon className="w-3 h-3" />
                </div>
              </div>
              <span
                className={`text-[19px] font-bold font-mono tracking-tight leading-none ${item.valueColor}`}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
