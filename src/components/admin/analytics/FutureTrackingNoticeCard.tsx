import React from "react";
import { Info, Lock } from "lucide-react";

export function FutureTrackingNoticeCard() {
  return (
    <div className="bg-[#FAFBFB] border border-[#E2E8E9] rounded-[10px] p-4 flex items-start gap-3 text-[#65737A]">
      <div className="p-1.5 rounded-[6px] bg-[#E2E8E9] text-[#485358] shrink-0 mt-0.5">
        <Lock className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[13px] font-bold text-[#142126] flex items-center gap-2">
          <span>Funnel Tracking (Phase B)</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E2E8E9] text-[#485358]">
            Upcoming
          </span>
        </div>
        <p className="text-[12px] text-[#65737A] mt-0.5 leading-relaxed">
          Pre-checkout behavioral tracking (page views, session IDs, heatmaps, scroll depth, and builder instrumentation) is not enabled yet. Phase A analytics operates strictly on existing verified commerce data.
        </p>
      </div>
    </div>
  );
}
