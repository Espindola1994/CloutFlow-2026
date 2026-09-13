"use client";

import React from "react";

export interface MobileOrdersSkeletonProps {
  count?: number;
}

export function MobileOrdersSkeleton({ count = 3 }: MobileOrdersSkeletonProps) {
  return (
    <div data-testid="mobile-orders-skeleton" className="space-y-3 md:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--admin-card,#FFFFFF)] border border-[var(--admin-border,#D9E2E3)] rounded-[12px] p-4 shadow-xs space-y-3.5 animate-pulse"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)]" />
              <div className="space-y-1.5">
                <div className="w-20 h-4 rounded bg-[var(--admin-border,#D9E2E3)]/60" />
                <div className="w-28 h-3 rounded bg-[var(--admin-border,#D9E2E3)]/40" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-full bg-[var(--admin-border,#D9E2E3)]/50" />
          </div>

          {/* Product banner */}
          <div className="h-10 rounded-[8px] bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)]" />

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3 py-2 border-y border-[var(--admin-divider,#EDF1F2)]">
            <div className="space-y-1">
              <div className="w-14 h-2.5 rounded bg-[var(--admin-border,#D9E2E3)]/40" />
              <div className="w-20 h-4 rounded bg-[var(--admin-border,#D9E2E3)]/60" />
            </div>
            <div className="space-y-1">
              <div className="w-16 h-2.5 rounded bg-[var(--admin-border,#D9E2E3)]/40" />
              <div className="w-20 h-4 rounded bg-[var(--admin-border,#D9E2E3)]/60" />
            </div>
            <div className="space-y-1">
              <div className="w-16 h-2.5 rounded bg-[var(--admin-border,#D9E2E3)]/40" />
              <div className="w-24 h-3 rounded bg-[var(--admin-border,#D9E2E3)]/50" />
            </div>
            <div className="space-y-1">
              <div className="w-14 h-2.5 rounded bg-[var(--admin-border,#D9E2E3)]/40" />
              <div className="w-20 h-3 rounded bg-[var(--admin-border,#D9E2E3)]/50" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="w-24 h-3 rounded bg-[var(--admin-border,#D9E2E3)]/40" />
            <div className="w-28 h-9 rounded bg-[var(--admin-border,#D9E2E3)]/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
