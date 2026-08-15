"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  showMotto?: boolean;
  className?: string;
};

export function CloutFlowShell({
  children,
  backHref,
  backLabel = "Back",
  showMotto = true,
  className = "",
}: Props) {
  const router = useRouter();

  return (
    <main className={`cf-shell-root ${className}`}>
      <div className="cf-shell-bg cf-shell-bg-top" aria-hidden="true">
        <span className="cf-shell-chip">👥 +1K</span>
        <span className="cf-shell-heart">♥</span>
        <span className="cf-shell-arrow" />
        <span className="cf-shell-bars"><i/><i/><i/><i/></span>
        <span className="cf-shell-dots" />
      </div>

      <div className="cf-shell-bg cf-shell-bg-bottom" aria-hidden="true">
        <span className="cf-shell-social ig">◎</span>
        <span className="cf-shell-social fb">f</span>
        <span className="cf-shell-social x">X</span>
        <span className="cf-shell-path" />
        <span className="cf-shell-chip lower">👥 +2.5K</span>
      </div>

      <header className="cf-shell-header">
        <div>
          {backHref ? (
            <button type="button" className="cf-shell-back" onClick={() => router.push(backHref)}>
              <ArrowLeft /> <span>{backLabel}</span>
            </button>
          ) : null}
        </div>

        <button type="button" className="cf-shell-logo" onClick={() => router.push("/")}>
          <span>Clout</span><b>Flow</b><ArrowUpRight />
        </button>

        <div className="cf-shell-motto">
          {showMotto ? <><i>✦</i><span>Grow. Engage. Get Noticed.</span></> : null}
        </div>
      </header>

      <div className="cf-shell-content">{children}</div>
    </main>
  );
}
