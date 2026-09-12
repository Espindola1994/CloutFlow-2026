import React from "react";
import { Package, Award, Trophy, Zap } from "lucide-react";
import { AnalyticsTopPlan, AnalyticsRankingSummary } from "@/types/admin-analytics";

interface TopPlansCardProps {
  plans: AnalyticsTopPlan[];
  rankings: AnalyticsRankingSummary;
}

export function TopPlansCard({ plans, rankings }: TopPlansCardProps) {
  return (
    <div className="space-y-4">
      {/* 1. Rankings Highlight Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* #1 Plan */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 flex items-center gap-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A] border border-[#0F8F8A]/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
              #1 Best Selling Plan
            </div>
            <div className="text-[15px] font-bold text-[#142126] truncate mt-0.5">
              {rankings.bestSellingPlan
                ? `${rankings.bestSellingPlan.name} (${rankings.bestSellingPlan.network})`
                : "No sales recorded"}
            </div>
            {rankings.bestSellingPlan && (
              <div className="text-[12px] text-[#0F8F8A] font-medium mt-0.5">
                ${rankings.bestSellingPlan.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} (
                {rankings.bestSellingPlan.paidOrders} orders)
              </div>
            )}
          </div>
        </div>

        {/* #1 Network */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 flex items-center gap-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
              #1 Network by Revenue
            </div>
            <div className="text-[15px] font-bold text-[#142126] truncate mt-0.5">
              {rankings.topNetwork ? rankings.topNetwork.network : "No network data"}
            </div>
            {rankings.topNetwork && (
              <div className="text-[12px] text-[#0F8F8A] font-medium mt-0.5">
                ${rankings.topNetwork.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({rankings.topNetwork.share}% share)
              </div>
            )}
          </div>
        </div>

        {/* #1 Service */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 flex items-center gap-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
              #1 Service by Revenue
            </div>
            <div className="text-[15px] font-bold text-[#142126] truncate mt-0.5">
              {rankings.topService ? rankings.topService.service : "No service data"}
            </div>
            {rankings.topService && (
              <div className="text-[12px] text-[#0F8F8A] font-medium mt-0.5">
                ${rankings.topService.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({rankings.topService.share}% share)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Plans Table */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
        <div className="pb-4 border-b border-[#EEF2F3]">
          <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">Top Plans & Packages</h2>
          <p className="text-[12px] text-[#65737A]">
            Canonical package rankings based on verified paid orders and revenue
          </p>
        </div>

        <div className="overflow-x-auto mt-4">
          {plans.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#8A979D]">
              No paid plan orders recorded for this period
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EEF2F3] text-[11px] font-bold uppercase tracking-wider text-[#65737A]">
                  <th className="pb-2.5 pl-2">Rank</th>
                  <th className="pb-2.5">Plan / Package</th>
                  <th className="pb-2.5">Network</th>
                  <th className="pb-2.5">Service</th>
                  <th className="pb-2.5 text-right">Quantity</th>
                  <th className="pb-2.5 text-right">Paid Orders</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                  <th className="pb-2.5 text-right">Share</th>
                  <th className="pb-2.5 text-right pr-2">AOV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F5] text-[13px]">
                {plans.map((p, idx) => {
                  return (
                    <tr key={`${p.planId}-${idx}`} className="hover:bg-[#F9FBFC] transition-colors">
                      <td className="py-3 pl-2 font-bold text-[#65737A]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 font-semibold text-[#142126] flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-[#0F8F8A] shrink-0" />
                        <span>{p.planName}</span>
                      </td>
                      <td className="py-3 text-[#142126] font-medium">
                        {p.network}
                      </td>
                      <td className="py-3 text-[#65737A]">
                        {p.service}
                      </td>
                      <td className="py-3 text-right text-[#65737A]">
                        {p.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-medium text-[#142126]">
                        {p.paidOrders.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-semibold text-[#0F8F8A]">
                        ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-medium text-[#142126]">
                          {p.revenueShare}%
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2 font-medium text-[#142126]">
                        ${p.aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
