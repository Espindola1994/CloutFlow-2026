import React from "react";
import { AlertCircle, RotateCcw, CheckCircle2, ShoppingCart } from "lucide-react";
import { AnalyticsAbandonmentMetrics } from "@/types/admin-analytics";

interface AbandonmentAnalyticsCardProps {
  abandonment: AnalyticsAbandonmentMetrics;
}

export function AbandonmentAnalyticsCard({ abandonment }: AbandonmentAnalyticsCardProps) {
  const cards = [
    {
      label: "Checkouts Started",
      value: abandonment.started.toLocaleString(),
      subtext: "Total checkout intents initiated",
    },
    {
      label: "Abandoned Checkouts",
      value: abandonment.abandoned.toLocaleString(),
      subtext: `${abandonment.abandonmentRate}% of started checkouts`,
    },
    {
      label: "Paid / Converted",
      value: abandonment.paid.toLocaleString(),
      subtext: `${abandonment.conversionRate}% conversion rate`,
    },
    {
      label: "Est. Abandoned Cart Value",
      value: abandonment.abandonedCartValueEstimated > 0
        ? `$${abandonment.abandonedCartValueEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00",
      subtext: "Aggregated potential value from captured leads",
    },
    {
      label: "Recovered Carts",
      value: abandonment.recoveredOrders.toLocaleString(),
      subtext: abandonment.recoveredOrders > 0
        ? "Correlated leads with converted orders"
        : "No direct lead recovery correlation in range",
    },
    {
      label: "Recovered Revenue",
      value: `$${abandonment.recoveredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: "Verified revenue from recovered journeys",
    },
  ];

  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
      <div className="pb-4 border-b border-[#EEF2F3]">
        <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">Checkout Abandonment</h2>
        <p className="text-[12px] text-[#65737A]">
          Abandonment analysis based on lifecycle events and lead recovery pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-[#F8FAFB] border border-[#EEF2F3] rounded-[8px] p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#65737A]">
              {c.label}
            </span>
            <div className="text-[22px] font-bold text-[#142126] mt-1">
              {c.value}
            </div>
            <span className="text-[11px] text-[#8A979D] mt-1">
              {c.subtext}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
