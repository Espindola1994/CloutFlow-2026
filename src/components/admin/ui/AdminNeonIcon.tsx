import React from "react";
import { cn } from "@/lib/utils";

export type AdminNeonColor =
  | "violet"
  | "purple"
  | "green"
  | "emerald"
  | "blue"
  | "cyan"
  | "teal"
  | "pink"
  | "magenta"
  | "amber"
  | "red"
  | "current";

export interface AdminNeonIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: AdminNeonColor;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  children?: React.ReactNode;
  strokeWidth?: number | string;
}

const COLOR_CLASSES: Record<AdminNeonColor, string> = {
  violet: "admin-neon-violet",
  purple: "admin-neon-purple",
  green: "admin-neon-green",
  emerald: "admin-neon-emerald",
  blue: "admin-neon-blue",
  cyan: "admin-neon-cyan",
  teal: "admin-neon-teal",
  pink: "admin-neon-pink",
  magenta: "admin-neon-magenta",
  amber: "admin-neon-amber",
  red: "admin-neon-red",
  current: "",
};

export function AdminNeonIcon({
  color = "current",
  icon: Icon,
  children,
  className,
  strokeWidth = 1.75,
  ...props
}: AdminNeonIconProps) {
  const colorClass = COLOR_CLASSES[color] || "";

  return (
    <span
      className={cn("admin-neon-icon inline-flex items-center justify-center shrink-0", colorClass, className)}
      {...props}
    >
      {Icon ? <Icon className="w-full h-full" strokeWidth={strokeWidth} /> : children}
    </span>
  );
}
