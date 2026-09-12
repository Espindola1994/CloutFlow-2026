import React from "react";
import { cn } from "@/lib/utils";
import { PlatformIcon, PlatformType } from "./PlatformIcon";

export interface MobileDataCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  platform?: PlatformType;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  metrics?: Array<{ label: string; value: React.ReactNode }>;
}

export function MobileDataCard({
  platform,
  title,
  subtitle,
  status,
  actions,
  metrics,
  className,
  ...props
}: MobileDataCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-[10px] p-4 flex flex-col gap-3 shadow-xs text-[var(--admin-text)]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {platform && (
            <div className="shrink-0 mt-0.5">
              <PlatformIcon platform={platform} size={28} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-[14px] text-[var(--admin-text)] truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-[12px] text-[var(--admin-text-secondary)] mt-0.5 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {status && <div className="shrink-0">{status}</div>}
      </div>

      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 py-2 border-y border-[var(--admin-divider)] mt-1">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[10px] font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">
                {m.label}
              </span>
              <span className="text-[13px] font-semibold text-[var(--admin-text)] mt-0.5">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="flex items-center justify-end gap-2 mt-1">
          {actions}
        </div>
      )}
    </div>
  );
}
