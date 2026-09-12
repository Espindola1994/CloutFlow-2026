import React from "react";
import { FullFunnelData } from "@/types/admin-analytics";
import { Filter, TrendingDown, Info, ArrowDown } from "lucide-react";
import { AdminTooltip } from "../ui";

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
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF2F3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[15px] font-bold text-[#142126] tracking-tight">Full Funnel (Pre-Checkout & Conversion)</h3>
              <AdminTooltip content="End-to-end multi-stage funnel tracing customer journey from visitor discovery, identifier resolution, analysis, package choices to paid order." />
            </div>
            <p className="text-[12px] text-[#65737A]">Complete 12-stage journey from anonymous visitor interaction to paid order</p>
          </div>
        </div>

        {biggestDropOff && biggestDropOff.lostSessions > 0 && (
          <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FFEDD5] px-3.5 py-1.5 rounded-[8px] text-[#C2410C] text-[12px] self-start sm:self-auto shadow-xs">
            <TrendingDown className="w-4 h-4 shrink-0 text-[#EA580C]" />
            <span>
              <strong className="font-semibold text-[#9A3412]">Biggest Drop-off:</strong> {biggestDropOff.fromStage} → {biggestDropOff.toStage} (
              <strong>{biggestDropOff.lostSessions.toLocaleString()}</strong> lost, <span className="font-bold">{biggestDropOff.dropOffRate}%</span>)
            </span>
          </div>
        )}
      </div>

      {hasHistoricalWarning && (
        <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#DCFCE7] p-2.5 rounded-[8px] text-[#166534] text-[12px]">
          <Info className="w-4 h-4 shrink-0" />
          <span>Pre-checkout tracking activated on <strong>{formattedActivation}</strong>. Dates prior reflect server-side checkouts and orders.</span>
        </div>
      )}

      {/* 1. Desktop & Tablet Horizontal / Structured Funnel Cards */}
      <div className="hidden lg:block space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#65737A] mb-2 flex items-center justify-between">
          <span>Stage Progression Flow</span>
          <span className="text-[11px] font-normal text-[#8A979D]">12 Standard Pipeline Milestones</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {steps.map((s, idx) => {
            const isFirst = idx === 0;
            const isBiggestDrop = biggestDropOff && (biggestDropOff.fromStage === s.label || biggestDropOff.toStage === s.label);

            return (
              <div
                key={s.stage}
                className={`relative rounded-[8px] p-3.5 border transition-all flex flex-col justify-between ${
                  isBiggestDrop
                    ? "bg-[#FFFDFB] border-[#FDBA74] shadow-[0_2px_8px_rgba(234,88,12,0.06)]"
                    : "bg-[#FAFCFC] border-[#E2E8E9] hover:border-[#CBD6D8]"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#E7F5F4] text-[#0F8F8A] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[12px] font-bold text-[#142126] truncate" title={s.label}>
                      {s.label}
                    </span>
                  </div>
                  {isBiggestDrop && (
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#FFEDD5] text-[#C2410C] shrink-0">
                      Major Drop
                    </span>
                  )}
                </div>

                <div className="my-1">
                  <div className="text-[20px] font-bold text-[#142126] tracking-tight font-mono">
                    {s.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#65737A] flex items-center justify-between mt-1">
                    <span>From Prev: <strong className="text-[#0F8F8A]">{s.conversionFromPrevious}%</strong></span>
                    <span>From Top: <span className="font-semibold text-[#142126]">{s.conversionFromVisitor}%</span></span>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-[#EDF1F2] flex items-center justify-between text-[11px]">
                  <span className="text-[#8A979D]">Drop-off:</span>
                  {s.lostSessions > 0 ? (
                    <span className="text-[#DC2626] font-semibold">
                      -{s.lostSessions.toLocaleString()} ({s.dropOffRate}%)
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Desktop Full Table View (Detailed Scanability) */}
      <div className="hidden md:block overflow-x-auto rounded-[8px] border border-[#E3E8EA]">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="bg-[#F7F9FA] border-b border-[#E3E8EA] text-[#65737A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Stage</th>
              <th className="py-2.5 px-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <span>Sessions</span>
                  <AdminTooltip content="Unique anonymous sessions or customers recorded at this milestone during the selected period." />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <span>From Previous</span>
                  <AdminTooltip content="Percentage of sessions that progressed from the immediately previous funnel stage." />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <span>From Visitor</span>
                  <AdminTooltip content="Percentage of original visitors that reached this stage." />
                </div>
              </th>
              <th className="py-2.5 px-3.5 text-right">
                <div className="inline-flex items-center gap-1">
                  <span>Drop-off</span>
                  <AdminTooltip content="Sessions that reached the previous stage but did not continue to this stage." />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF1F2]">
            {steps.map((s, idx) => (
              <tr key={s.stage} className="hover:bg-[#F8FAFB] transition-colors">
                <td className="py-2.5 px-3.5 font-semibold text-[#142126] flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#E5ECEC] text-[#3D4C53] flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold">{s.label}</span>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-[#142126] font-mono">
                  {s.count.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#0F8F8A] font-mono">
                  {s.conversionFromPrevious}%
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-[#65737A] font-mono">
                  {s.conversionFromVisitor}%
                </td>
                <td className="py-2.5 px-3.5 text-right">
                  {s.lostSessions > 0 ? (
                    <span className="text-[#DC2626] font-medium font-mono text-[12px]">
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

      {/* 3. Mobile Vertical Journey (Zero Horizontal Overflow, Touch Friendly) */}
      <div className="md:hidden space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#65737A] mb-1">
          Vertical Funnel Journey
        </div>

        {steps.map((s, idx) => {
          const isLast = idx === steps.length - 1;
          const isBiggestDrop = biggestDropOff && biggestDropOff.toStage === s.label;

          return (
            <React.Fragment key={s.stage}>
              <div
                className={`p-3.5 rounded-[9px] border ${
                  isBiggestDrop
                    ? "bg-[#FFFDFB] border-[#FDBA74] shadow-xs"
                    : "bg-[#FFFFFF] border-[#E3E8EA]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0F8F8A]/10 text-[#0F8F8A] text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[13px] text-[#142126]">{s.label}</span>
                  </div>
                  <span className="font-mono text-[14px] font-bold text-[#142126]">
                    {s.count.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F1F5F5] text-[11px]">
                  <div>
                    <span className="text-[#8A979D] block text-[10px] uppercase">Prev Conv</span>
                    <span className="font-semibold text-[#0F8F8A]">{s.conversionFromPrevious}%</span>
                  </div>
                  <div>
                    <span className="text-[#8A979D] block text-[10px] uppercase">From Visitor</span>
                    <span className="font-semibold text-[#142126]">{s.conversionFromVisitor}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8A979D] block text-[10px] uppercase">Drop-off</span>
                    {s.lostSessions > 0 ? (
                      <span className="font-semibold text-[#DC2626]">
                        -{s.lostSessions.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="flex justify-center items-center text-[#8A979D] py-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-[#0F8F8A]" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
