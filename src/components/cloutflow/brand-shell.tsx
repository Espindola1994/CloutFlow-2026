"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BrandShell({
  children,
  backHref,
  backLabel = "Back",
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();

  return (
    <div className="cf-brand-shell">
      <header className="cf-brand-header">
        <div>
          {backHref ? (
            <button type="button" className="cf-brand-back" onClick={() => router.push(backHref)}>
              <ArrowLeft />
              <span>{backLabel}</span>
            </button>
          ) : null}
        </div>

        <button type="button" className="cf-brand-logo" onClick={() => router.push("/")}>
          <span>Clout</span><b>Flow</b><ArrowUpRight />
        </button>

        <div className="cf-brand-motto">
          <i>✦</i><span>Grow. Engage. Get Noticed.</span>
        </div>
      </header>

      {children}
    </div>
  );
}
