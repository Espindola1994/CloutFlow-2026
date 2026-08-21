"use client";

import React from "react";
import { RefreshCw, Loader2, Clock, CheckCircle, ArrowRightCircle, AlertTriangle, XCircle, AlertOctagon, RotateCw, ListOrdered, CheckCheck, ShieldAlert } from "lucide-react";

export interface StatusSyncMetrics {
  checked: number;
  updated: number;
  completed: number;
  partial: number;
  canceled: number;
  errors: number;
  queueReleaseAttempts?: number;
  queueReleaseSuccess?: number;
  queueReleaseBlocked?: number;
  lastRun?: string;
}

interface PeakerrStatusSyncCardProps {
  enabled: boolean;
  loading: boolean;
  metrics: StatusSyncMetrics | null;
  onRunSync: () => void;
  buildMarker?: string;
  error?: string | null;
  targetQueueAutoReleaseEnabled?: boolean;
}

export const PEAKERR_SYNC_BUILD_ID = "02bf761-fase48-auto-release";

/**
 * AUTOMATIC STATUS SYNC
 * Height: Section Header ~44px, Cards 82px–88px.
 * White cards with 28x28 soft icon container and semantic dot/value highlights.
 */
export function PeakerrStatusSyncCard({
  enabled,
  loading,
  metrics,
  onRunSync,
  error,
  targetQueueAutoReleaseEnabled,
}: PeakerrStatusSyncCardProps) {
  const syncItems = [
    {
      label: "Last Run",
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
      label: "Queue Released",
      value: metrics?.queueReleaseSuccess !== undefined ? String(metrics.queueReleaseSuccess) : "—",
      icon: CheckCheck,
      iconBg: "bg-[#EAF6F5] text-[#0F8F8A]",
      valueColor: (metrics?.queueReleaseSuccess ?? 0) > 0 ? "text-[#0F8F8A]" : "text-[#142126]",
    },
    {
      label: "Queue Blocked",
      value: metrics?.queueReleaseBlocked !== undefined ? String(metrics.queueReleaseBlocked) : "—",
      icon: ShieldAlert,
      iconBg: "bg-[#FEF3C7] text-[#D97706]",
      valueColor: (metrics?.queueReleaseBlocked ?? 0) > 0 ? "text-[#D97706]" : "text-[#142126]",
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
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126] flex items-center gap-2">
              AUTOMATIC STATUS SYNC
              <span className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded ${enabled ? "bg-[#E8F8F2] text-[#16B77A] border border-[#B6ECD7]" : "bg-[#F1F5F5] text-[#65737A] border border-[#D9E2E3]"}`}>
                {enabled ? "ENABLED" : "DISABLED"}
              </span>
            </h3>
            <span className="text-[#8F9B9F]">•</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#65737A] flex items-center gap-1.5">
              TARGET QUEUE AUTO RELEASE:
              <span className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded ${targetQueueAutoReleaseEnabled ? "bg-[#E8F8F2] text-[#16B77A] border border-[#B6ECD7]" : "bg-[#F1F5F5] text-[#65737A] border border-[#D9E2E3]"}`}>
                {targetQueueAutoReleaseEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </span>
          </div>
          <p className="text-[12px] text-[#65737A] mt-0.5">
            {enabled 
              ? "Provider status synchronization may run automatically when an authorized scheduler/trigger invokes the sync endpoint."
              : "Provider status updates require manual Sync Now or another authorized trigger."
            }
          </p>
          <div className="text-[11px] text-[#8F9B9F] mt-1 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="font-semibold">Trigger Mode:</span>
              <span>GITHUB ACTIONS SCHEDULE / EXTERNAL</span>
            </div>
            {targetQueueAutoReleaseEnabled && (
              <span className="text-[#D97706] font-medium">
                (Note: Sync Now may release the next queued order)
              </span>
            )}
          </div>
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
