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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* #1 Plan */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-3.5 sm:p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A] border border-[#0F8F8A]/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
              #1 Best Selling Plan
            </div>
            <div className="text-[14px] sm:text-[15px] font-bold text-[#142126] truncate mt-0.5">
              {rankings.bestSellingPlan
                ? `${rankings.bestSellingPlan.name} (${rankings.bestSellingPlan.network})`
                : "No sales recorded"}
            </div>
            {rankings.bestSellingPlan && (
              <div className="text-[11px] sm:text-[12px] text-[#0F8F8A] font-medium mt-0.5">
                ${rankings.bestSellingPlan.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} (
                {rankings.bestSellingPlan.paidOrders} orders)
              </div>
            )}
          </div>
        </div>

        {/* #1 Network */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-3.5 sm:p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
              #1 Network by Revenue
            </div>
            <div className="text-[14px] sm:text-[15px] font-bold text-[#142126] truncate mt-0.5">
              {rankings.topNetwork ? rankings.topNetwork.network : "No network data"}
            </div>
            {rankings.topNetwork && (
              <div className="text-[11px] sm:text-[12px] text-[#0F8F8A] font-medium mt-0.5">
                ${rankings.topNetwork.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({rankings.topNetwork.share}% share)
              </div>
            )}
          </div>
        </div>

        {/* #1 Service */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-3.5 sm:p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
              #1 Service by Revenue
            </div>
            <div className="text-[14px] sm:text-[15px] font-bold text-[#142126] truncate mt-0.5">
              {rankings.topService ? rankings.topService.service : "No service data"}
            </div>
            {rankings.topService && (
              <div className="text-[11px] sm:text-[12px] text-[#0F8F8A] font-medium mt-0.5">
                ${rankings.topService.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({rankings.topService.share}% share)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Plans Card & Table/Mobile rows */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
        <div className="pb-3 sm:pb-4 border-b border-[#EEF2F3]">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-[#142126] tracking-tight">Top Plans & Packages</h2>
          <p className="text-[11px] sm:text-[12px] text-[#65737A]">
            Canonical package rankings based on verified paid orders and revenue
          </p>
        </div>

        {/* Desktop Table View (>=901px / md:block) */}
        <div className="hidden md:block overflow-x-auto mt-4">
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

        {/* Mobile View: High Density Cards (<=900px / md:hidden) */}
        <div data-testid="top-plans-mobile" className="md:hidden space-y-2.5 mt-3">
          {plans.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8A979D]">
              No paid plan orders recorded for this period
            </div>
          ) : (
            plans.map((p, idx) => (
              <div
                key={`${p.planId}-${idx}`}
                className="bg-[#FAFCFC] border border-[#E3E8EA] rounded-[9px] p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#E7F5F4] text-[#0F8F8A] font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-[13px] text-[#142126] truncate">
                      {p.planName}
                    </span>
                  </div>
                  <span className="text-[14px] font-bold text-[#0F8F8A] font-mono shrink-0">
                    ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#65737A]">
                  <span>{p.network} • {p.service}</span>
                  <span className="font-semibold text-[#0F8F8A]">{p.revenueShare}% share</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#EEF2F3] text-center text-[11px]">
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9.5px] font-semibold block">Orders</span>
                    <span className="font-bold text-[#142126] mt-0.5 block">{p.paidOrders.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9.5px] font-semibold block">Units</span>
                    <span className="font-medium text-[#65737A] mt-0.5 block">{p.quantity.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9.5px] font-semibold block">AOV</span>
                    <span className="font-bold text-[#142126] mt-0.5 block">${p.aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
