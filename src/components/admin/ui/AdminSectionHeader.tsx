import React from "react";
import { cn } from "@/lib/utils";

export interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminSectionHeader({
  title,
  description,
  badge,
  actions,
  className,
}: AdminSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8EA]",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[23px] font-bold text-[#142126] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-[13px] text-[#65737A] max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
