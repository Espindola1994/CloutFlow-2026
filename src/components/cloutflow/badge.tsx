import type { ReactNode } from "react";

export function CloutFlowBadge({ children }: { children: ReactNode }) {
  return <div className="cf-brand-badge">{children}</div>;
}
