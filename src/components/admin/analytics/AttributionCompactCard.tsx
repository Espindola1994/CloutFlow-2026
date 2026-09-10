import React from "react";
import { Compass, ExternalLink } from "lucide-react";
import { AnalyticsAttributionSummary } from "@/types/admin-analytics";

interface AttributionCompactCardProps {
  attribution: AnalyticsAttributionSummary;
  onNavigateToAttribution: () => void;
}

export function AttributionCompactCard({ attribution, onNavigateToAttribution }: AttributionCompactCardProps) {
  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF2F3]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#0F8F8A]" />
            <h2 className="text-[15px] font-bold text-[#142126] tracking-tight">Attribution Summary</h2>
          </div>
          <button
            type="button"
            onClick={onNavigateToAttribution}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F8F8A] hover:text-[#0D7A76] cursor-pointer transition-colors"
          >
            <span>View Full Attribution</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-[#F8FAFB] border border-[#EEF2F3] rounded-[6px] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              Top Traffic Source
            </span>
            <span className="text-[14px] font-bold text-[#142126] mt-0.5 block truncate">
              {attribution.topSource}
            </span>
          </div>

          <div className="bg-[#F8FAFB] border border-[#EEF2F3] rounded-[6px] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              Top Campaign
            </span>
            <span className="text-[14px] font-bold text-[#142126] mt-0.5 block truncate">
              {attribution.topCampaign}
            </span>
          </div>

          <div className="bg-[#F8FAFB] border border-[#EEF2F3] rounded-[6px] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              Attributed Orders
            </span>
            <span className="text-[14px] font-bold text-[#142126] mt-0.5 block">
              {attribution.attributedPaidOrders.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F8FAFB] border border-[#EEF2F3] rounded-[6px] p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              Attributed Revenue
            </span>
            <span className="text-[14px] font-bold text-[#0F8F8A] mt-0.5 block">
              ${attribution.attributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#EEF2F3] mt-3">
        <span className="text-[11px] text-[#8A979D]">
          Reuses existing canonical attribution data from Orders & Margins → Attribution.
        </span>
      </div>
    </div>
  );
}
