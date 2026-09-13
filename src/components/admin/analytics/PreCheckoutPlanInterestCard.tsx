import React from "react";
import { PreCheckoutPlanInterest } from "@/types/admin-analytics";
import { Layers } from "lucide-react";

interface PreCheckoutPlanInterestCardProps {
  plans: PreCheckoutPlanInterest[];
}

export function PreCheckoutPlanInterestCard({ plans }: PreCheckoutPlanInterestCardProps) {
  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
        <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-[#142126]">Plan Interest & Drop-Off</h3>
          <p className="text-[11px] sm:text-[12px] text-[#65737A]">Card views, selections, CTA clicks, checkouts, and paid orders per package</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3">Plan / Package</th>
              <th className="py-2.5 px-3">Network</th>
              <th className="py-2.5 px-3 text-right">Viewed</th>
              <th className="py-2.5 px-3 text-right">Selected</th>
              <th className="py-2.5 px-3 text-right">CTA Clicked</th>
              <th className="py-2.5 px-3 text-right">Checkouts</th>
              <th className="py-2.5 px-3 text-right">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F5]">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-[#94A3B8] italic text-[12px]">
                  No plan tracking events recorded in this date range yet
                </td>
              </tr>
            ) : (
              plans.slice(0, 10).map((p) => (
                <tr key={p.planId} className="hover:bg-[#F8FAFB] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#142126]">{p.planName}</td>
                  <td className="py-2.5 px-3 text-[#65737A]">{p.network}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{p.viewedSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{p.selectedSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#0F8F8A]">{p.ctaClickedSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{p.checkoutSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#142126]">{p.paidOrders.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards Breakdown */}
      <div data-testid="precheckout-plan-mobile" className="md:hidden space-y-2">
        {plans.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#8A979D]">No plan tracking events recorded yet</div>
        ) : (
          plans.slice(0, 10).map((p) => (
            <div key={p.planId} className="bg-[#FAFCFC] border border-[#E3E8EA] rounded-[8px] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#142126] truncate max-w-[200px]">{p.planName}</span>
                <span className="text-[11px] font-semibold text-[#65737A]">{p.network}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[10.5px] pt-1 border-t border-[#EEF2F3]">
                <div>
                  <span className="text-[#8A979D] uppercase text-[9px] block">Views</span>
                  <span className="font-medium text-[#65737A]">{p.viewedSessions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] uppercase text-[9px] block">CTA</span>
                  <span className="font-medium text-[#0F8F8A]">{p.ctaClickedSessions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] uppercase text-[9px] block">Checkouts</span>
                  <span className="font-medium text-[#65737A]">{p.checkoutSessions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#8A979D] uppercase text-[9px] block">Paid</span>
                  <span className="font-bold text-[#142126]">{p.paidOrders.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
