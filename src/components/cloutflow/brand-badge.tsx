import type { ReactNode } from "react";

export function BrandBadge({ children }: { children: ReactNode }) {
  return <div className="cf-brand-badge">{children}</div>;
}
