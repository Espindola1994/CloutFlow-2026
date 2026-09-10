import React from "react";
import { 
  ShoppingCart, 
  XCircle, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Coins 
} from "lucide-react";
import { AnalyticsKpiSummary } from "@/types/admin-analytics";

interface AnalyticsKpisProps {
  kpis: AnalyticsKpiSummary;
}

export function AnalyticsKpis({ kpis }: AnalyticsKpisProps) {
  const cards = [
    {
      title: "CHECKOUTS STARTED",
      value: kpis.checkoutsStarted.toLocaleString(),
      subtitle: "Unique initiated journeys",
      icon: ShoppingCart,
      color: "text-[#142126]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
    },
    {
      title: "CHECKOUTS ABANDONED",
      value: kpis.checkoutsAbandoned.toLocaleString(),
      subtitle: `${kpis.abandonmentRate}% abandonment rate`,
      icon: XCircle,
      color: "text-[#DE3E44]",
      iconBg: "bg-[#DE3E44]/10 text-[#DE3E44]",
    },
    {
      title: "PAID ORDERS",
      value: kpis.paidOrders.toLocaleString(),
      subtitle: "Verified approved orders",
      icon: CheckCircle2,
      color: "text-[#0F8F8A]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
    },
    {
      title: "CHECKOUT CONVERSION RATE",
      value: `${kpis.checkoutConversionRate}%`,
      subtitle: "Paid / checkouts started",
      icon: Percent,
      color: "text-[#142126]",
      iconBg: "bg-[#071D26]/10 text-[#071D26]",
    },
    {
      title: "REVENUE",
      value: `$${kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Total net revenue USD",
      icon: DollarSign,
      color: "text-[#0F8F8A]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
    },
    {
      title: "AVERAGE ORDER VALUE",
      value: `$${kpis.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Revenue per paid order",
      icon: Coins,
      color: "text-[#142126]",
      iconBg: "bg-[#0F8F8A]/10 text-[#0F8F8A]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 flex flex-col justify-between shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] transition-shadow hover:shadow-[0_2px_8px_rgba(10,35,42,0.06)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#65737A] tracking-wider uppercase">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-[6px] ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={`text-[24px] font-bold tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <div className="text-[11px] font-medium text-[#8A979D] mt-0.5 truncate">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
