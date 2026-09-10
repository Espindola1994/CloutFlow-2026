import React from "react";
import { PreCheckoutNetworkInterest, PreCheckoutServiceInterest } from "@/types/admin-analytics";
import { Compass, Sparkles } from "lucide-react";

interface PreCheckoutInterestsCardProps {
  networks: PreCheckoutNetworkInterest[];
  services: PreCheckoutServiceInterest[];
}

export function PreCheckoutInterestsCard({ networks, services }: PreCheckoutInterestsCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Network Interest Card */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#142126]">Network Interest vs Conversion</h3>
            <p className="text-[12px] text-[#65737A]">Sessions selected pre-checkout compared to checkout and paid</p>
          </div>
        </div>

        <div className="overflow-x-auto">
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
      </div>

      {/* Service Interest Card */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EEF2F3] pb-3">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#142126]">Service Interest (Funnel Steps)</h3>
            <p className="text-[12px] text-[#65737A]">Selected, analyzed, checkouts, and paid orders per service</p>
          </div>
        </div>

        <div className="overflow-x-auto">
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
      </div>
    </div>
  );
}
