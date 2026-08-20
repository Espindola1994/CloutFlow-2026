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
        "bg-white border border-[#E3E8EA] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-[#142126] transition-all",
        hover && "hover:bg-[#FBFCFC] hover:border-[#D1D9DC] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)]",
        padded && "p-4 md:p-5",
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
    <AdminCard className={cn("flex flex-col justify-between", className)}>
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-semibold text-[#65737A] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#E7F5F4] text-[#0F8F8A]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[22px] font-bold text-[#142126] tracking-tight">
          {value}
        </div>
        {(subValue || change) && (
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            {change && (
              <span
                className={cn(
                  "font-medium",
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
