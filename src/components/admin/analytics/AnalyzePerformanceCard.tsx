import React from "react";
import { AnalyzePerformanceSummary } from "@/types/admin-analytics";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

interface AnalyzePerformanceCardProps {
  performance: AnalyzePerformanceSummary;
}

export function AnalyzePerformanceCard({ performance }: AnalyzePerformanceCardProps) {
  const { totalAttempts, successful, failed, successRate, byNetwork } = performance;

  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF2F3] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[6px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#142126]">Analyze Resolution Performance</h3>
            <p className="text-[12px] text-[#65737A]">Reliability and success rate of public profile lookups</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[#059669]">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successful.toLocaleString()} Success</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#DC2626]">
            <XCircle className="w-4 h-4" />
            <span>{failed.toLocaleString()} Failed</span>
          </div>
          <div className="px-2.5 py-1 rounded-[6px] bg-[#F1F5F5] font-bold text-[12px] text-[#142126]">
            {successRate}% Rate
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3">Network</th>
              <th className="py-2.5 px-3 text-right">Attempts</th>
              <th className="py-2.5 px-3 text-right">Successful</th>
              <th className="py-2.5 px-3 text-right">Failed</th>
              <th className="py-2.5 px-3 text-right">Success Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F5]">
            {byNetwork.map((net) => (
              <tr key={net.platformKey} className="hover:bg-[#F8FAFB] transition-colors">
                <td className="py-2.5 px-3 font-semibold text-[#142126]">{net.network}</td>
                <td className="py-2.5 px-3 text-right text-[#65737A] font-medium">{net.attempts.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-[#059669] font-medium">{net.successful.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-[#DC2626] font-medium">{net.failed.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#142126]">{net.successRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
