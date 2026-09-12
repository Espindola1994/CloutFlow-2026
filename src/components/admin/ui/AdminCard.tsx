import React from "react";
import { cn } from "@/lib/utils";
import { AdminNeonIcon, type AdminNeonColor } from "./AdminNeonIcon";

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
        "bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] text-[var(--admin-text)] transition-all",
        hover && "hover:bg-[var(--admin-card-hover)] hover:border-[var(--admin-primary-border)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
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
  iconColor?: AdminNeonColor;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  subValue,
  change,
  icon: Icon,
  iconColor = "teal",
  className,
}: AdminStatCardProps) {
  return (
    <AdminCard className={cn("flex flex-col justify-between p-3.5", className)} padded={false}>
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider block">
          {title}
        </span>
        {Icon && (
          <div className="p-1 rounded-lg bg-transparent">
            <AdminNeonIcon color={iconColor} icon={Icon} className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="text-[22px] md:text-[24px] font-bold text-[var(--admin-text)] tracking-tight">
          {value}
        </div>
        {(subValue || change) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            {change && (
              <span
                className={cn(
                  "font-semibold",
                  change.isPositive ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"
                )}
              >
                {change.isPositive ? "+" : ""}
                {change.value}
              </span>
            )}
            {subValue && <span className="text-[var(--admin-text-muted)]">{subValue}</span>}
          </div>
        )}
      </div>
    </AdminCard>
  );
}
