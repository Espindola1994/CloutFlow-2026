"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Copy, Check, DollarSign, Layers, ShieldCheck, Tag, Calendar, ExternalLink } from "lucide-react";
import { Order } from "../types";
import { AdminStatusBadge } from "../ui/AdminBadge";
import { PlatformIcon } from "../ui/PlatformIcon";
import { AdminButton } from "../ui/AdminButton";

export interface MobileOrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileOrderDetailsSheet({
  order,
  isOpen,
  onClose,
}: MobileOrderDetailsSheetProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const orderPublicId = order.publicId || order.id.slice(0, 8);
  const gross = order.grossAmount ?? order.amount ?? 0;
  const ppFee = order.perfectPayFee ?? ((gross * 0.089) + 1.00);
  const cost = order.providerCost ?? 0;
  const profit = order.netProfit ?? (order.status === "paid" ? (gross - ppFee - cost) : -(ppFee + cost));
  const targetUsername = order.target || order.username || "";
  const fulfillmentStatus = order.fulfillmentStatus || order.providerStatus || "NOT_DISPATCHED";

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Order #${orderPublicId} Details`}
      data-testid="mobile-order-details-sheet"
      className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        data-testid="order-details-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={sheetRef}
        data-testid="order-details-content"
        className="relative z-10 w-full bg-[var(--admin-sidebar,#FFFFFF)] border-t border-[var(--admin-sidebar-border,#D9E2E3)] rounded-t-[20px] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 text-[var(--admin-text,#142126)]"
        style={{
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Drag Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--admin-border,#D9E2E3)]" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--admin-sidebar-border,#D9E2E3)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <PlatformIcon platform={order.platform} size={22} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[16px] font-bold tracking-tight truncate">
                  #{orderPublicId}
                </h2>
                <button
                  type="button"
                  aria-label="Copy order public ID"
                  onClick={() => handleCopy(orderPublicId, "header-id")}
                  className="p-1 text-[var(--admin-text-muted,#8A979D)] hover:text-[var(--admin-text,#142126)] rounded transition-colors cursor-pointer"
                >
                  {copiedKey === "header-id" ? (
                    <Check className="w-3.5 h-3.5 text-[var(--admin-success,#16B77A)]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <span className="text-[11px] text-[var(--admin-text-secondary,#65737A)] capitalize block truncate">
                {order.platform} Transaction
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AdminStatusBadge status={order.status} />
            <button
              ref={closeBtnRef}
              type="button"
              data-testid="order-details-close-btn"
              onClick={onClose}
              aria-label="Close details"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-[var(--admin-text-secondary,#65737A)] hover:text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Structured Body (Natural vertical scroll, ordered per UI 5.3 specifications) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. Target & Package Information */}
          <div className="p-3.5 rounded-[10px] bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider">
              <span>Target & Package</span>
              <span className="capitalize">{order.platform}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-bold text-[var(--admin-text,#142126)]">
                @{targetUsername}
              </span>
              {targetUsername && (
                <button
                  type="button"
                  aria-label="Copy username"
                  onClick={() => handleCopy(targetUsername, "target")}
                  className="px-2 py-1 rounded-[6px] text-[11px] border border-[var(--admin-border,#D9E2E3)] bg-[var(--admin-card,#FFFFFF)] text-[var(--admin-text-secondary,#65737A)] hover:text-[var(--admin-text,#142126)] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "target" ? (
                    <>
                      <Check className="w-3 h-3 text-[var(--admin-success,#16B77A)]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="text-[12px] text-[var(--admin-text,#142126)] font-medium bg-[var(--admin-card,#FFFFFF)] p-2.5 rounded-[7px] border border-[var(--admin-border,#D9E2E3)]">
              {order.product || `${order.service} • ${order.plan}`}
            </div>

            {order.email && (
              <div className="flex items-center justify-between text-[12px] text-[var(--admin-text-secondary,#65737A)] pt-1">
                <span className="text-[11px] text-[var(--admin-text-muted,#8A979D)]">Email:</span>
                <span className="font-mono text-[11px] text-[var(--admin-text,#142126)] truncate max-w-[200px]">
                  {order.email}
                </span>
              </div>
            )}
          </div>

          {/* 2. Financial Breakdown (USD Only — EXACT values, no recalculations) */}
          <div className="p-3.5 rounded-[10px] bg-[var(--admin-card,#FFFFFF)] border border-[var(--admin-border,#D9E2E3)] space-y-2.5 shadow-xs">
            <span className="text-[11px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider block">
              Financial Breakdown (USD)
            </span>

            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-text-secondary,#65737A)]">Customer Paid (Gross):</span>
                <span className="font-bold font-mono text-[var(--admin-text,#142126)]">
                  ${gross.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-text-secondary,#65737A)]">PerfectPay Fee (8.9% + $1.00):</span>
                <span className="font-mono text-[var(--admin-warning,#F59E0B)]">
                  -${ppFee.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-text-secondary,#65737A)]">Provider Cost:</span>
                <span className="font-mono text-[var(--admin-text-secondary,#65737A)]">
                  {order.providerCost !== null && order.providerCost !== undefined
                    ? `-$${order.providerCost.toFixed(2)}`
                    : order.providerCostSource === "UNKNOWN"
                    ? "—"
                    : `-$${cost.toFixed(2)}`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--admin-divider,#EDF1F2)] font-bold">
                <span className="text-[var(--admin-text,#142126)]">Net Profit:</span>
                <span
                  className={`font-mono text-[14px] ${
                    profit >= 0 ? "text-[var(--admin-success,#16B77A)]" : "text-[var(--admin-danger,#EF4444)]"
                  }`}
                >
                  {profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `$${profit.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Provider & Fulfillment Delivery */}
          <div className="grid grid-cols-2 gap-2.5 text-[12px]">
            <div className="p-3 rounded-[9px] bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)]">
              <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider block">
                Fulfillment Status
              </span>
              <span className="font-bold font-mono text-[12px] text-[var(--admin-text,#142126)] block mt-1 uppercase truncate">
                {fulfillmentStatus}
              </span>
            </div>

            <div className="p-3 rounded-[9px] bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)]">
              <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider block">
                Payment Gateway
              </span>
              <span className="font-semibold text-[12px] text-[var(--admin-text,#142126)] block mt-1 truncate">
                {order.gateway || "PerfectPay"}
              </span>
            </div>
          </div>

          {/* 4. Marketing Attribution (if captured) */}
          {(order.utmSource || order.utmCampaign || order.utmMedium) && (
            <div className="p-3.5 rounded-[10px] bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)] text-[12px] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider block">
                Marketing Attribution
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-[var(--admin-text-muted,#8A979D)] block">Source:</span>
                  <span className="font-semibold text-[var(--admin-text,#142126)] truncate block">
                    {order.utmSource || "direct"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--admin-text-muted,#8A979D)] block">Campaign:</span>
                  <span className="font-semibold text-[var(--admin-text,#142126)] truncate block">
                    {order.utmCampaign || "none"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--admin-text-muted,#8A979D)] block">Medium:</span>
                  <span className="font-semibold text-[var(--admin-text,#142126)] truncate block">
                    {order.utmMedium || "none"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Timestamps & Meta */}
          <div className="pt-2 text-[11px] text-[var(--admin-text-muted,#8A979D)] flex items-center justify-between border-t border-[var(--admin-divider,#EDF1F2)]">
            <span>Transaction Recorded</span>
            <span className="font-mono text-[var(--admin-text-secondary,#65737A)]">{order.date}</span>
          </div>
        </div>

        {/* Footer Close Action */}
        <div className="p-4 border-t border-[var(--admin-sidebar-border,#D9E2E3)] bg-[var(--admin-card,#FFFFFF)] flex justify-end shrink-0">
          <AdminButton
            variant="outline"
            onClick={onClose}
            className="w-full min-h-[44px] justify-center text-[13px] font-semibold cursor-pointer"
          >
            Close Details
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
