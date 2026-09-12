import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AnalyticsTimeSeriesPoint } from "@/types/admin-analytics";

interface PerformanceTimeSeriesChartProps {
  data: AnalyticsTimeSeriesPoint[];
}

export function PerformanceTimeSeriesChart({ data }: PerformanceTimeSeriesChartProps) {
  // Format short date for X-axis (e.g. "Sep 10")
  const formattedData = data.map((d) => {
    try {
      const parts = d.date.split("-");
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return { ...d, label };
      }
    } catch {
      // Fallback
    }
    return { ...d, label: d.date };
  });

  return (
    <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EEF2F3] gap-2">
        <div>
          <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">Checkout Performance</h2>
          <p className="text-[12px] text-[#65737A]">
            Daily distribution of Checkouts Started, Paid Orders, and Abandoned Checkouts
          </p>
        </div>
      </div>

      <div className="h-[320px] w-full mt-4">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[13px] text-[#8A979D]">
            No temporal data available for this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F5" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#D9E2E3" }}
                tick={{ fill: "#65737A", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#65737A", fontSize: 11 }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D9E2E3",
                  borderRadius: "8px",
                  color: "#142126",
                  fontSize: "12px",
                  boxShadow: "0 4px 16px rgba(10,35,42,0.08)",
                }}
                labelStyle={{ color: "#65737A", fontWeight: "bold", marginBottom: "4px" }}
                itemStyle={{ padding: "2px 0" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "14px", fontSize: "12px" }}
                iconType="circle"
              />
              <Bar
                name="Checkouts Started"
                dataKey="started"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Paid Orders"
                dataKey="paid"
                fill="#0F8F8A"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Abandoned Checkouts"
                dataKey="abandoned"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
