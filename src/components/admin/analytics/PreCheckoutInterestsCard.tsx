import React from "react";
import { PreCheckoutNetworkInterest, PreCheckoutServiceInterest } from "@/types/admin-analytics";
import { Compass, Sparkles } from "lucide-react";

interface PreCheckoutInterestsCardProps {
  networks: PreCheckoutNetworkInterest[];
  services: PreCheckoutServiceInterest[];
}

export function PreCheckoutInterestsCard({ networks, services }: PreCheckoutInterestsCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Network Interest Card */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#142126]">Network Interest vs Conversion</h3>
            <p className="text-[11px] sm:text-[12px] text-[#65737A]">Sessions selected pre-checkout compared to checkout and paid</p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Network</th>
                <th className="py-2.5 px-3 text-right">Selected</th>
                <th className="py-2.5 px-3 text-right">Checkouts</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Conv. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F5]">
              {networks.map((n) => (
                <tr key={n.platformKey} className="hover:bg-[#F8FAFB] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#142126]">{n.network}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{n.selectedSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{n.checkoutSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#142126]">{n.paidOrders.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#0F8F8A]">{n.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Breakdown */}
        <div data-testid="precheckout-network-mobile" className="md:hidden space-y-2">
          {networks.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#8A979D]">No network interest data</div>
          ) : (
            networks.map((n) => (
              <div key={n.platformKey} className="bg-[#FAFCFC] border border-[#E3E8EA] rounded-[8px] p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#142126]">{n.network}</span>
                  <span className="font-bold text-xs text-[#0F8F8A]">{n.conversionRate}% conv</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-[#EEF2F3]">
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9px] block">Selected</span>
                    <span className="font-medium text-[#65737A]">{n.selectedSessions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9px] block">Checkouts</span>
                    <span className="font-medium text-[#65737A]">{n.checkoutSessions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9px] block">Paid</span>
                    <span className="font-bold text-[#142126]">{n.paidOrders.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Service Interest Card */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#142126]">Service Interest (Funnel Steps)</h3>
            <p className="text-[11px] sm:text-[12px] text-[#65737A]">Selected, analyzed, checkouts, and paid orders per service</p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3 text-right">Selected</th>
                <th className="py-2.5 px-3 text-right">Analyzed</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Conv. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F5]">
              {services.map((s) => (
                <tr key={s.serviceKey} className="hover:bg-[#F8FAFB] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#142126]">{s.service}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{s.selectedSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{s.analyzedSessions.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#142126]">{s.paidOrders.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#0F8F8A]">{s.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Breakdown */}
        <div data-testid="precheckout-service-mobile" className="md:hidden space-y-2">
          {services.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#8A979D]">No service interest data</div>
          ) : (
            services.map((s) => (
              <div key={s.serviceKey} className="bg-[#FAFCFC] border border-[#E3E8EA] rounded-[8px] p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#142126]">{s.service}</span>
                  <span className="font-bold text-xs text-[#0F8F8A]">{s.conversionRate}% conv</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-[#EEF2F3]">
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9px] block">Selected</span>
                    <span className="font-medium text-[#65737A]">{s.selectedSessions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9px] block">Analyzed</span>
                    <span className="font-medium text-[#65737A]">{s.analyzedSessions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] uppercase text-[9px] block">Paid</span>
                    <span className="font-bold text-[#142126]">{s.paidOrders.toLocaleString()}</span>
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
