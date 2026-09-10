import React from "react";
import { FullFunnelData } from "@/types/admin-analytics";
import { Filter, TrendingDown, Info } from "lucide-react";

interface FullFunnelCardProps {
  fullFunnel: FullFunnelData;
}

export function FullFunnelCard({ fullFunnel }: FullFunnelCardProps) {
  const { steps, biggestDropOff, hasHistoricalWarning, activationDate } = fullFunnel;

  const formattedActivation = new Date(activationDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF2F3] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#142126]">Full Funnel (Pre-Checkout & Conversion)</h3>
            <p className="text-[12px] text-[#65737A]">Complete journey from visitor interaction to paid order</p>
          </div>
        </div>

        {biggestDropOff && biggestDropOff.lostSessions > 0 && (
          <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FFEDD5] px-3 py-1.5 rounded-[6px] text-[#C2410C] text-[12px] self-start sm:self-auto">
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Biggest Drop-off:</strong> {biggestDropOff.fromStage} → {biggestDropOff.toStage} (
              {biggestDropOff.lostSessions.toLocaleString()} sessions lost, {biggestDropOff.dropOffRate}%)
            </span>
          </div>
        )}
      </div>

      {hasHistoricalWarning && (
        <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#DCFCE7] p-2.5 rounded-[6px] text-[#166534] text-[12px]">
          <Info className="w-4 h-4 shrink-0" />
          <span>Pre-checkout tracking activated on <strong>{formattedActivation}</strong>. Dates prior reflect server-side checkouts and orders.</span>
        </div>
      )}

      {/* Table / Step Breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3 text-right">Unique Sessions</th>
              <th className="py-2.5 px-3 text-right">From Previous</th>
              <th className="py-2.5 px-3 text-right">From Visitor</th>
              <th className="py-2.5 px-3 text-right">Drop-off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F5]">
            {steps.map((s, idx) => (
              <tr key={s.stage} className="hover:bg-[#F8FAFB] transition-colors">
                <td className="py-2.5 px-3 font-semibold text-[#142126] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E5ECEC] text-[#3D4C53] flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{s.label}</span>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-[#142126]">
                  {s.count.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#0F8F8A]">
                  {s.conversionFromPrevious}%
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-[#65737A]">
                  {s.conversionFromVisitor}%
                </td>
                <td className="py-2.5 px-3 text-right">
                  {s.lostSessions > 0 ? (
                    <span className="text-[#DC2626] font-medium">
                      -{s.lostSessions.toLocaleString()} ({s.dropOffRate}%)
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
