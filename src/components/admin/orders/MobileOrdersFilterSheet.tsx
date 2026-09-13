"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import { AdminButton } from "../ui/AdminButton";
import { AdminNeonIcon } from "../ui/AdminNeonIcon";

export interface MobileOrdersFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  status: string;
  onApply: (platform: string, status: string) => void;
  onReset: () => void;
  totalResults?: number;
}

export function MobileOrdersFilterSheet({
  isOpen,
  onClose,
  platform,
  status,
  onApply,
  onReset,
  totalResults,
}: MobileOrdersFilterSheetProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(platform);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync internal state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedPlatform(platform);
      setSelectedStatus(status);
    }
  }, [isOpen, platform, status]);

  // Handle ESC key to close
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

  // Auto focus on close button
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const platforms = [
    { value: "all", label: "All Platforms" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "twitter", label: "X (Twitter)" },
    { value: "youtube", label: "YouTube" },
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "paid", label: "Paid" },
    { value: "delivered", label: "Delivered" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  const handleApply = () => {
    onApply(selectedPlatform, selectedStatus);
    onClose();
  };

  const handleReset = () => {
    setSelectedPlatform("all");
    setSelectedStatus("all");
    onReset();
    onClose();
  };

  const hasActiveFilters = selectedPlatform !== "all" || selectedStatus !== "all";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter Orders"
      data-testid="mobile-orders-filter-sheet"
      className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        data-testid="filter-sheet-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Bottom Sheet Container */}
      <div
        ref={sheetRef}
        data-testid="filter-sheet-content"
        className="relative z-10 w-full bg-[var(--admin-sidebar,#FFFFFF)] border-t border-[var(--admin-sidebar-border,#D9E2E3)] rounded-t-[20px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 text-[var(--admin-text,#142126)]"
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
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--admin-primary,#0F8F8A)]" />
            <span className="text-[16px] font-bold tracking-tight">
              Filter Orders
            </span>
            {totalResults !== undefined && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--admin-primary-soft,#E7F5F4)] text-[var(--admin-primary,#0F8F8A)] border border-[var(--admin-primary-border,#BFE5E2)]">
                {totalResults} total
              </span>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            data-testid="filter-sheet-close-btn"
            onClick={onClose}
            aria-label="Close Filter Sheet"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-[var(--admin-text-secondary,#65737A)] hover:text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Platform Filter */}
          <div className="space-y-2">
            <label 
              htmlFor="mobile-filter-platform" 
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary,#65737A)] block"
            >
              Social Platform
            </label>
            <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Platform selection">
              {platforms.map((p) => {
                const isSelected = selectedPlatform === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`filter-platform-option-${p.value}`}
                    onClick={() => setSelectedPlatform(p.value)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-[8px] border text-[13px] font-medium transition-all min-h-[44px] cursor-pointer ${
                      isSelected
                        ? "bg-[var(--admin-primary-soft,#E7F5F4)] border-[var(--admin-primary,#0F8F8A)] text-[var(--admin-primary,#0F8F8A)] font-semibold shadow-xs"
                        : "bg-[var(--admin-card,#FFFFFF)] border-[var(--admin-border,#D9E2E3)] text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)]"
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-[var(--admin-primary,#0F8F8A)]" : "border-[var(--admin-border,#D9E2E3)]"
                    }`}>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[var(--admin-primary,#0F8F8A)]" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label 
              htmlFor="mobile-filter-status" 
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary,#65737A)] block"
            >
              Order Status
            </label>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Status selection">
              {statuses.map((s) => {
                const isSelected = selectedStatus === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`filter-status-option-${s.value}`}
                    onClick={() => setSelectedStatus(s.value)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] border text-[12px] font-medium transition-all min-h-[44px] cursor-pointer ${
                      isSelected
                        ? "bg-[var(--admin-primary-soft,#E7F5F4)] border-[var(--admin-primary,#0F8F8A)] text-[var(--admin-primary,#0F8F8A)] font-semibold shadow-xs"
                        : "bg-[var(--admin-card,#FFFFFF)] border-[var(--admin-border,#D9E2E3)] text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)]"
                    }`}
                  >
                    <span className="capitalize">{s.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-[var(--admin-primary,#0F8F8A)]" : "border-[var(--admin-border,#D9E2E3)]"
                    }`}>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--admin-primary,#0F8F8A)]" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--admin-sidebar-border,#D9E2E3)] bg-[var(--admin-card,#FFFFFF)] flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-testid="filter-sheet-reset-btn"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="px-4 py-2.5 rounded-[8px] border border-[var(--admin-border,#D9E2E3)] text-[12px] font-medium text-[var(--admin-text-secondary,#65737A)] hover:text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)] disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>

          <AdminButton
            data-testid="filter-sheet-apply-btn"
            onClick={handleApply}
            className="flex-1 min-h-[44px] text-[13px] font-semibold justify-center shadow-sm"
          >
            Apply Filters
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
