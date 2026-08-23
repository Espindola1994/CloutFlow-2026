import React from "react";
import { cn } from "@/lib/utils";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
}

export function AdminCard({
  children,
  className,
  hover = false,
  padded = true,
  ...props
}: AdminCardProps) {
  return (
    <div
      className={cn(
        "bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)] text-[#142126] transition-all",
        hover && "hover:bg-[#FBFCFC] hover:border-[#CBD6D8] hover:shadow-[0_2px_8px_rgba(10,35,42,0.06)]",
        padded && "p-5 md:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  subValue,
  change,
  icon: Icon,
  className,
}: AdminStatCardProps) {
  return (
    <AdminCard className={cn("flex flex-col justify-between p-3.5", className)} padded={false}>
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-[#E7F5F4] text-[#0F8F8A]">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="text-[22px] md:text-[24px] font-bold text-[#142126] tracking-tight">
          {value}
        </div>
        {(subValue || change) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            {change && (
              <span
                className={cn(
                  "font-semibold",
                  change.isPositive ? "text-[#16B77A]" : "text-[#EF4444]"
                )}
              >
                {change.isPositive ? "+" : ""}
                {change.value}
              </span>
            )}
            {subValue && <span className="text-[#8A979D]">{subValue}</span>}
          </div>
        )}
      </div>
    </AdminCard>
  );
}
