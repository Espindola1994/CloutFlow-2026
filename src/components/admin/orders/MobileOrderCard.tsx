"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Order } from "../types";
import { AdminStatusBadge } from "../ui/AdminBadge";
import { PlatformIcon } from "../ui/PlatformIcon";
import { AdminButton } from "../ui/AdminButton";

export interface MobileOrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export function MobileOrderCard({ order, onViewDetails }: MobileOrderCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const orderPublicId = order.publicId || order.id.slice(0, 8);
  const gross = order.grossAmount ?? order.amount ?? 0;
  const ppFee = order.perfectPayFee ?? ((gross * 0.089) + 1.00);
  const cost = order.providerCost ?? 0;
  const profit = order.netProfit ?? (order.status === "paid" ? (gross - ppFee - cost) : -(ppFee + cost));
  const targetUsername = order.target || order.username || "";
  const fulfillmentText = order.fulfillmentStatus || order.providerStatus || "PENDING";

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    }
  };

  return (
    <article
      data-testid={`mobile-order-card-${order.id}`}
      className="bg-[var(--admin-card,#FFFFFF)] border border-[var(--admin-border,#D9E2E3)] rounded-[12px] p-4 shadow-xs space-y-3.5 text-[var(--admin-text,#142126)] transition-all hover:border-[var(--admin-primary-border,#BFE5E2)]"
    >
      {/* TOPO: [Platform icon] #ORDER_ID + [STATUS BADGE] */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--admin-card-hover,#FBFCFC)] border border-[var(--admin-border,#D9E2E3)] flex items-center justify-center shrink-0">
            <PlatformIcon platform={order.platform} size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[14px] text-[var(--admin-text,#142126)] tracking-tight">
                #{orderPublicId}
              </span>
              <button
                type="button"
                aria-label={`Copy order ID ${orderPublicId}`}
                onClick={() => handleCopy(orderPublicId, "id")}
                className="p-1 rounded text-[var(--admin-text-muted,#8A979D)] hover:text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)] transition-colors cursor-pointer"
                title="Copy order ID"
              >
                {copiedField === "id" ? (
                  <Check className="w-3.5 h-3.5 text-[var(--admin-success,#16B77A)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[12px] font-semibold text-[var(--admin-text-secondary,#65737A)] truncate">
                @{targetUsername}
              </span>
              {targetUsername && (
                <button
                  type="button"
                  aria-label={`Copy target username ${targetUsername}`}
                  onClick={() => handleCopy(targetUsername, "target")}
                  className="p-0.5 rounded text-[var(--admin-text-muted,#8A979D)] hover:text-[var(--admin-text,#142126)] hover:bg-[var(--admin-card-hover,#FBFCFC)] transition-colors cursor-pointer"
                  title="Copy username"
                >
                  {copiedField === "target" ? (
                    <Check className="w-3 h-3 text-[var(--admin-success,#16B77A)]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          <AdminStatusBadge status={order.status} />
        </div>
      </div>

      {/* Target / Service / Plan banner */}
      <div className="text-[12px] text-[var(--admin-text-secondary,#65737A)] bg-[var(--admin-card-hover,#FBFCFC)] p-2.5 rounded-[8px] border border-[var(--admin-border,#D9E2E3)] flex flex-col gap-0.5">
        <span className="font-semibold text-[var(--admin-text,#142126)] truncate">
          {order.product || `${order.service} • ${order.plan}`}
        </span>
        {order.email && (
          <span className="text-[11px] text-[var(--admin-text-muted,#8A979D)] truncate">
            {order.email}
          </span>
        )}
      </div>

      {/* CORPO: Gross Sales, Net Profit, Fulfillment, Provider */}
      <div className="grid grid-cols-2 gap-2.5 text-[12px] py-2 border-y border-[var(--admin-divider,#EDF1F2)]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider">
            Gross Sales
          </span>
          <span className="font-bold font-mono text-[14px] text-[var(--admin-text,#142126)] mt-0.5">
            ${gross.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider">
            Net Profit
          </span>
          <span
            className={`font-bold font-mono text-[14px] mt-0.5 ${
              profit >= 0 ? "text-[var(--admin-success,#16B77A)]" : "text-[var(--admin-danger,#EF4444)]"
            }`}
          >
            {profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `$${profit.toFixed(2)}`}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider">
            Fulfillment
          </span>
          <span className="font-mono text-[11px] text-[var(--admin-text-secondary,#65737A)] mt-0.5 truncate uppercase">
            {fulfillmentText}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[var(--admin-text-muted,#8A979D)] tracking-wider">
            Provider
          </span>
          <span className="text-[11px] font-medium text-[var(--admin-text-secondary,#65737A)] mt-0.5 truncate">
            {order.gateway || "PerfectPay"}
          </span>
        </div>
      </div>

      {/* RODAPÉ: Date/Time + [ View Details ] */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-[11px] text-[var(--admin-text-muted,#8A979D)] truncate">
          {order.date}
        </span>

        <AdminButton
          size="sm"
          variant="outline"
          data-testid={`btn-view-details-${order.id}`}
          onClick={() => onViewDetails(order)}
          className="min-h-[44px] px-3.5 text-[12px] font-semibold flex items-center gap-1.5 justify-center cursor-pointer border-[var(--admin-border,#D9E2E3)] hover:border-[var(--admin-primary,#0F8F8A)] hover:text-[var(--admin-primary,#0F8F8A)]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Details</span>
        </AdminButton>
      </div>
    </article>
  );
}
