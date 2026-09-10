import React from "react";
import { PlatformIcon } from "../ui";
import { AnalyticsNetworkPerformance } from "@/types/admin-analytics";
import { Platform } from "../types";

interface NetworkPerformanceCardProps {
  networks: AnalyticsNetworkPerformance[];
}

export function NetworkPerformanceCard({ networks }: NetworkPerformanceCardProps) {
  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
      <div className="pb-4 border-b border-[#EEF2F3]">
        <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">Performance by Network</h2>
        <p className="text-[12px] text-[#65737A]">
          Commercial breakdown by social platform (revenue, share, orders, and AOV)
        </p>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EEF2F3] text-[11px] font-bold uppercase tracking-wider text-[#65737A]">
              <th className="pb-2.5 pl-2">Platform</th>
              <th className="pb-2.5 text-right">Paid Orders</th>
              <th className="pb-2.5 text-right">Units Sold</th>
              <th className="pb-2.5 text-right">Revenue</th>
              <th className="pb-2.5 text-right">Revenue Share</th>
              <th className="pb-2.5 text-right pr-2">AOV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F5] text-[13px]">
            {networks.map((net) => {
              return (
                <tr key={net.platformKey} className="hover:bg-[#F9FBFC] transition-colors">
                  <td className="py-3 pl-2 flex items-center gap-2.5 font-medium text-[#142126]">
                    <PlatformIcon platform={net.platformKey as Platform} size={16} />
                    <span>{net.network}</span>
                  </td>
                  <td className="py-3 text-right font-medium text-[#142126]">
                    {net.paidOrders.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-[#65737A]">
                    {net.quantitySold.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-semibold text-[#0F8F8A]">
                    ${net.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-[#EEF2F3] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#0F8F8A] h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, net.revenueShare))}%` }}
                        />
                      </div>
                      <span className="font-medium text-[#142126] w-9 text-right">
                        {net.revenueShare}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right pr-2 font-medium text-[#142126]">
                    ${net.aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
