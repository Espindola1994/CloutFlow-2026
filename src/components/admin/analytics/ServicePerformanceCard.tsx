import React from "react";
import { Users, Heart, Eye } from "lucide-react";
import { AnalyticsServicePerformance } from "@/types/admin-analytics";

interface ServicePerformanceCardProps {
  services: AnalyticsServicePerformance[];
}

export function ServicePerformanceCard({ services }: ServicePerformanceCardProps) {
  const getServiceIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case "followers":
        return <Users className="w-4 h-4 text-[#0F8F8A]" />;
      case "likes":
        return <Heart className="w-4 h-4 text-[#EC4899]" />;
      case "views":
        return <Eye className="w-4 h-4 text-[#3B82F6]" />;
      default:
        return <Users className="w-4 h-4 text-[#65737A]" />;
    }
  };

  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
      <div className="pb-3 sm:pb-4 border-b border-[#EEF2F3]">
        <h2 className="text-[15px] sm:text-[16px] font-bold text-[#142126] tracking-tight">Performance by Service</h2>
        <p className="text-[11px] sm:text-[12px] text-[#65737A]">
          Commercial breakdown by category (Followers, Likes, and Views)
        </p>
      </div>

      {/* 1. Desktop Table View (>=901px / md:block) */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EEF2F3] text-[11px] font-bold uppercase tracking-wider text-[#65737A]">
              <th className="pb-2.5 pl-2">Service</th>
              <th className="pb-2.5 text-right">Paid Orders</th>
              <th className="pb-2.5 text-right">Units Delivered</th>
              <th className="pb-2.5 text-right">Revenue</th>
              <th className="pb-2.5 text-right">Revenue Share</th>
              <th className="pb-2.5 text-right pr-2">AOV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F5] text-[13px]">
            {services.map((serv) => {
              return (
                <tr key={serv.serviceKey} className="hover:bg-[#F9FBFC] transition-colors">
                  <td className="py-3 pl-2 flex items-center gap-2.5 font-medium text-[#142126]">
                    <div className="p-1.5 rounded-[6px] bg-[#F1F5F5]">
                      {getServiceIcon(serv.serviceKey)}
                    </div>
                    <span>{serv.service}</span>
                  </td>
                  <td className="py-3 text-right font-medium text-[#142126]">
                    {serv.paidOrders.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-[#65737A]">
                    {serv.quantitySold.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-semibold text-[#0F8F8A]">
                    ${serv.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-[#EEF2F3] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#0F8F8A] h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, serv.revenueShare))}%` }}
                        />
                      </div>
                      <span className="font-medium text-[#142126] w-9 text-right">
                        {serv.revenueShare}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right pr-2 font-medium text-[#142126]">
                    ${serv.aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Cards Breakdown (<=900px / md:hidden) */}
      <div data-testid="service-performance-mobile" className="md:hidden space-y-2.5 mt-3">
        {services.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8A979D]">No service data recorded</div>
        ) : (
          services.map((serv) => (
            <div
              key={serv.serviceKey}
              className="bg-[#FAFCFC] border border-[#E3E8EA] rounded-[9px] p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-[6px] bg-[#F1F5F5]">
                    {getServiceIcon(serv.serviceKey)}
                  </div>
                  <span className="font-bold text-[13px] text-[#142126]">{serv.service}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold text-[#0F8F8A] font-mono">
                    ${serv.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#0F8F8A]/10 text-[#0F8F8A] font-bold text-[10px]">
                    {serv.revenueShare}%
                  </span>
                </div>
              </div>

              {/* Share bar */}
              <div className="w-full bg-[#EEF2F3] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#0F8F8A] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, serv.revenueShare))}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#EEF2F3] text-center text-[11px]">
                <div>
                  <span className="text-[#8A979D] uppercase text-[9.5px] font-semibold block">Paid Orders</span>
                  <span className="font-bold text-[#142126] mt-0.5 block">{serv.paidOrders.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] uppercase text-[9.5px] font-semibold block">Units Sold</span>
                  <span className="font-medium text-[#65737A] mt-0.5 block">{serv.quantitySold.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] uppercase text-[9.5px] font-semibold block">AOV</span>
                  <span className="font-bold text-[#142126] mt-0.5 block">${serv.aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
