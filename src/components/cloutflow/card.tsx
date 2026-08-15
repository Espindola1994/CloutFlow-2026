import type { ReactNode } from "react";

export function CloutFlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`cf-brand-card ${className}`}>{children}</div>;
}
