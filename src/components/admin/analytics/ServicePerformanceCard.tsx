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
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
      <div className="pb-4 border-b border-[#EEF2F3]">
        <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">Performance by Service</h2>
        <p className="text-[12px] text-[#65737A]">
          Commercial breakdown by category (Followers, Likes, and Views)
        </p>
      </div>

      <div className="overflow-x-auto mt-4">
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
    </div>
  );
}
