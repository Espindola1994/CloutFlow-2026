import React from "react";
import { ShoppingCart, XCircle, CheckCircle2, Percent, DollarSign, Coins } from "lucide-react";
import { AnalyticsKpiSummary } from "@/types/admin-analytics";
import { AdminTooltip } from "../ui";

interface AnalyticsKpisProps {
  kpis: AnalyticsKpiSummary;
}

export function AnalyticsKpis({ kpis }: AnalyticsKpisProps) {
  const cards = [
    {
      title: "CHECKOUTS STARTED",
      mobileTitle: "Started",
      value: kpis.checkoutsStarted.toLocaleString(),
      subtitle: "Unique initiated journeys",
      icon: ShoppingCart,
      color: "text-[#142126]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
      tooltip: "Total unique sessions that advanced into checkout and viewed the payment step.",
    },
    {
      title: "CHECKOUTS ABANDONED",
      mobileTitle: "Abandoned",
      value: kpis.checkoutsAbandoned.toLocaleString(),
      subtitle: `${kpis.abandonmentRate}% abandonment rate`,
      icon: XCircle,
      color: "text-[#DE3E44]",
      iconBg: "bg-[#DE3E44]/10 text-[#DE3E44]",
      tooltip: "Sessions that started checkout but did not complete a verified payment.",
    },
    {
      title: "PAID ORDERS",
      mobileTitle: "Paid Orders",
      value: kpis.paidOrders.toLocaleString(),
      subtitle: "Verified approved orders",
      icon: CheckCircle2,
      color: "text-[#0F8F8A]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
      tooltip: "Confirmed paid transactions successfully verified by payment gateway webhooks.",
    },
    {
      title: "CHECKOUT CONVERSION RATE",
      mobileTitle: "Conv. Rate",
      value: `${kpis.checkoutConversionRate}%`,
      subtitle: "Paid / checkouts started",
      icon: Percent,
      color: "text-[#142126]",
      iconBg: "bg-[#071D26]/10 text-[#071D26]",
      tooltip: "Percentage of checkouts started that resulted in a completed payment.",
    },
    {
      title: "REVENUE",
      mobileTitle: "Revenue",
      value: `$${kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Total net revenue USD",
      icon: DollarSign,
      color: "text-[#0F8F8A]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
      tooltip: "Gross revenue captured before fees, provider costs and adjustments in USD.",
    },
    {
      title: "AVERAGE ORDER VALUE",
      mobileTitle: "Avg Order Value",
      value: `$${kpis.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Revenue per paid order",
      icon: Coins,
      color: "text-[#142126]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
      tooltip: "Average gross dollar amount generated per completed paid order.",
    },
  ];

  return (
    <div 
      data-testid="analytics-kpis-grid"
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5"
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            data-testid={`analytics-kpi-card-${idx}`}
            className="bg-white border border-[#D9E2E3] rounded-[10px] p-3 sm:p-4 flex flex-col justify-between shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] transition-shadow hover:shadow-[0_2px_8px_rgba(10,35,42,0.06)] min-w-0"
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
              <div className="flex items-center gap-1 min-w-0">
                {/* Full label on desktop >=901px, concise on mobile <=900px */}
                <span className="hidden md:inline text-[11px] font-bold text-[#65737A] tracking-wider uppercase truncate">
                  {card.title}
                </span>
                <span className="md:hidden text-[11px] font-bold text-[#65737A] tracking-wider uppercase truncate">
                  {card.mobileTitle}
                </span>
                <AdminTooltip content={card.tooltip} />
              </div>
              <div className={`p-1 sm:p-1.5 rounded-[6px] shrink-0 ${card.iconBg}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="min-w-0">
              <div className={`text-[18px] sm:text-[24px] font-bold tracking-tight font-mono truncate ${card.color}`}>
                {card.value}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[#8A979D] mt-0.5 truncate">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
