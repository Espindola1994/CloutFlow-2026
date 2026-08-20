import React from "react";
import { cn } from "@/lib/utils";

export interface AdminBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
}

export function AdminBadge({
  children,
  className,
  variant = "default",
  size = "sm",
  ...props
}: AdminBadgeProps) {
  const variantStyles = {
    default: "bg-[#F7F9FA] text-[#65737A] border-[#E3E8EA]",
    primary: "bg-[#E7F5F4] text-[#0F8F8A] border-[#BFE5E2]",
    secondary: "bg-[#0A2630] text-[#E7F5F4] border-[#11313B]",
    success: "bg-[#E8F8F2] text-[#16B77A] border-[#B6ECD7]",
    warning: "bg-[#FEF6E7] text-[#D97706] border-[#FDE68A]",
    danger: "bg-[#FEECEB] text-[#EF4444] border-[#FCA5A5]",
    info: "bg-[#E8F5FB] text-[#169BD5] border-[#BAE6FD]",
    outline: "bg-transparent text-[#65737A] border-[#E3E8EA]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium leading-tight",
    md: "px-2.5 py-1 text-[12px] font-semibold leading-tight",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AdminStatusBadgeProps {
  status: "active" | "pending" | "completed" | "failed" | "canceled" | "processing" | "in_progress" | "disabled" | string;
  label?: string;
  className?: string;
}

export function AdminStatusBadge({
  status,
  label,
  className,
}: AdminStatusBadgeProps) {
  const normalized = status.toLowerCase();
  
  let variant: AdminBadgeProps["variant"] = "default";
  let dotColor = "bg-[#8A979D]";

  if (["active", "completed", "success", "resolved", "connected"].includes(normalized)) {
    variant = "success";
    dotColor = "bg-[#16B77A]";
  } else if (["pending", "waiting", "in_review", "paused"].includes(normalized)) {
    variant = "warning";
    dotColor = "bg-[#F59E0B]";
  } else if (["failed", "error", "canceled", "rejected", "blocked", "disconnected"].includes(normalized)) {
    variant = "danger";
    dotColor = "bg-[#EF4444]";
  } else if (["processing", "in_progress", "syncing", "dispatched"].includes(normalized)) {
    variant = "primary";
    dotColor = "bg-[#0F8F8A]";
  } else if (["info"].includes(normalized)) {
    variant = "info";
    dotColor = "bg-[#169BD5]";
  }

  const displayLabel = label || status.replace(/_/g, " ");

  return (
    <AdminBadge variant={variant} className={cn("capitalize", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
      <span>{displayLabel}</span>
    </AdminBadge>
  );
}
