import React, { useEffect, useRef } from "react";
import { AdminTab } from "../AdminSidebar";
import { 
  Globe2, 
  Sliders, 
  ShieldCheck, 
  PackageOpen, 
  Sparkles, 
  ShieldBan, 
  Server,
  LogOut,
  X,
  Radio,
  Settings,
  Download
} from "lucide-react";
import { AdminNeonIcon, AdminNeonColor } from "../ui/AdminNeonIcon";
import { BUILD_INFO } from "@/lib/build-info";
import { usePwaInstall } from "./usePwaInstall";

export interface AdminMobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
}

interface MoreMenuItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: AdminNeonColor;
  description: string;
}

const MORE_ITEMS: MoreMenuItem[] = [
  { 
    id: "live-world", 
    label: "Live World", 
    icon: Globe2, 
    color: "cyan",
    description: "Real-time global telemetry & 3D map" 
  },
  { 
    id: "supplier-routing", 
    label: "Supplier Routing", 
    icon: Sliders, 
    color: "cyan",
    description: "Provider routing & failover rules" 
  },
  { 
    id: "dropshield", 
    label: "Drop Shield 24/7", 
    icon: ShieldCheck, 
    color: "green",
    description: "Automated follower refill & refill guard" 
  },
  { 
    id: "fulfillment", 
    label: "Fulfillment & Providers", 
    icon: PackageOpen, 
    color: "teal",
    description: "Peakerr chains & provider queue" 
  },
  { 
    id: "growth", 
    label: "Growth / Offers", 
    icon: Sparkles, 
    color: "magenta",
    description: "Bumps, upsells, coupons & A/B testing" 
  },
  { 
    id: "blacklist", 
    label: "Anti-Fraud Blacklist", 
    icon: ShieldBan, 
    color: "red",
    description: "IP, email, and handle fraud prevention" 
  },
  { 
    id: "infra", 
    label: "Integrations & APIs", 
    icon: Server, 
    color: "purple",
    description: "Webhooks, API keys & infrastructure logs" 
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings, 
    color: "teal",
    description: "Profile, 2FA, appearance & system preferences" 
  },
];

export function AdminMobileMoreSheet({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onLogout,
}: AdminMobileMoreSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { isInstallable, promptInstall } = usePwaInstall();

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus trap / auto-focus on open
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Navigation Menu"
      data-testid="admin-mobile-more-sheet"
      className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        data-testid="admin-more-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Bottom Sheet Drawer */}
      <div
        ref={sheetRef}
        data-testid="admin-more-drawer-content"
        className="relative z-10 w-full bg-[var(--admin-sidebar)] border-t border-[var(--admin-sidebar-border)] rounded-t-[20px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        style={{
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Drag Handle Indicator */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--admin-border)]" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--admin-sidebar-border)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[var(--admin-text)] tracking-tight">
              More Modules
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] border border-[var(--admin-primary)]/25">
              Admin
            </span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            data-testid="admin-more-close-btn"
            onClick={onClose}
            aria-label="Close Menu"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules List - Natural vertical scroll without body shift */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                data-testid={`admin-more-item-${item.id}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px] text-left transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[var(--admin-primary-soft)] border-[var(--admin-primary-border)] text-[var(--admin-primary)] font-semibold shadow-xs"
                    : "bg-transparent border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-[var(--admin-primary)]/15"
                      : "bg-[var(--admin-card)] border border-[var(--admin-border)]"
                  }`}
                >
                  <AdminNeonIcon
                    color={item.color}
                    icon={Icon}
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] font-semibold tracking-tight text-[var(--admin-text)] truncate">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-[var(--admin-text-muted)] truncate">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info & Sign Out */}
        <div className="p-4 border-t border-[var(--admin-sidebar-border)] bg-[var(--admin-sidebar-secondary)] space-y-3 shrink-0">
          {/* PWA Native Install Button when available */}
          {isInstallable && (
            <button
              type="button"
              data-testid="admin-more-install-app-btn"
              onClick={async () => {
                const outcome = await promptInstall();
                if (outcome === "accepted") {
                  onClose();
                }
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold text-white bg-[var(--admin-primary)] hover:opacity-95 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Install CloutFlow App</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-[var(--admin-text-secondary)]">
            <div className="flex items-center gap-1.5 text-[var(--admin-success)] font-semibold">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Peakerr Live</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--admin-text-muted)]">
              Build: {BUILD_INFO.shortSha}
            </span>
          </div>

          <button
            type="button"
            data-testid="admin-more-logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-[var(--admin-danger)] bg-[var(--admin-danger)]/10 hover:bg-[var(--admin-danger)]/20 transition-colors cursor-pointer border border-[var(--admin-danger)]/25"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
