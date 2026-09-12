import React from "react";
import { CheckCircle2, XCircle, ArrowRight, CornerDownRight } from "lucide-react";
import { AnalyticsFunnel } from "@/types/admin-analytics";

interface CheckoutFunnelCardProps {
  funnel: AnalyticsFunnel;
}

export function CheckoutFunnelCard({ funnel }: CheckoutFunnelCardProps) {
  const started = funnel.started;
  const paidCount = funnel.converted.count;
  const paidRate = funnel.converted.rate;
  const abandonedCount = funnel.abandoned.count;
  const abandonedRate = funnel.abandoned.rate;

  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EEF2F3] gap-2">
        <div>
          <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">Checkout Funnel</h2>
          <p className="text-[12px] text-[#65737A]">
            Canonical checkout initiation branching into converted sales vs lost abandonments
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0F8F8A] bg-[#0F8F8A]/10 px-3 py-1 rounded-full w-fit">
          <span>{started.toLocaleString()} Total Initiations</span>
        </div>
      </div>

      {/* Visual Funnel Representation */}
      <div className="pt-6 pb-2 space-y-6">
        {/* Top Node: Checkout Started */}
        <div className="max-w-md mx-auto">
          <div className="bg-[#FFFFFF] text-[#142126] rounded-[8px] p-4 shadow-xs border border-[#D9E2E3]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold tracking-wider uppercase text-[#65737A]">
                Stage 1 — Checkout Started
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E7F5F4] text-[#0F8F8A] border border-[#BFE5E2]">
                100% Baseline
              </span>
            </div>
            <div className="text-[26px] font-bold tracking-tight text-[#142126] mt-1">
              {started.toLocaleString()}{" "}
              <span className="text-[13px] font-normal text-[#65737A]">journeys</span>
            </div>
          </div>
        </div>

        {/* Branching indicator */}
        <div className="flex justify-center items-center text-[#8A979D]">
          <div className="w-px h-6 bg-[#D9E2E3]" />
        </div>

        {/* Split Nodes: Converted vs Lost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Node A: Converted / Paid */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#065F46]">
                    Converted → Paid
                  </span>
                </div>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-[#059669] text-white">
                  {paidRate}%
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#065F46]">
                {paidCount.toLocaleString()}{" "}
                <span className="text-[12px] font-medium text-[#047857]">orders</span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-[#D1FAE5] rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-[#059669] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, paidRate))}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#047857] mt-2 block">
              Conversion rate relative to checkouts started
            </span>
          </div>

          {/* Node B: Lost / Abandoned */}
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-[#DC2626]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#991B1B]">
                    Lost → Abandoned
                  </span>
                </div>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-[#DC2626] text-white">
                  {abandonedRate}%
                </span>
              </div>
              <div className="text-[24px] font-bold text-[#991B1B]">
                {abandonedCount.toLocaleString()}{" "}
                <span className="text-[12px] font-medium text-[#B91C1C]">sessions</span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-[#FEE2E2] rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-[#DC2626] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, abandonedRate))}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#B91C1C] mt-2 block">
              Abandonment rate relative to checkouts started
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
