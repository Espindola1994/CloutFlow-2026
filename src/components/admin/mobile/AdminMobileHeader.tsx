import React from "react";
import { AdminTab } from "../AdminSidebar";
import { AdminThemeToggle } from "../theme/AdminThemeToggle";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  ShieldBan, 
  Server, 
  PackageOpen, 
  Sliders, 
  BarChart3, 
  Globe2 
} from "lucide-react";
import { AdminNeonIcon, AdminNeonColor } from "../ui/AdminNeonIcon";

export interface AdminMobileHeaderProps {
  activeTab: AdminTab;
}

const TAB_METADATA: Record<AdminTab, { label: string; icon: React.ComponentType<{ className?: string }>; color: AdminNeonColor }> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard, color: "teal" },
  analytics: { label: "Analytics", icon: BarChart3, color: "violet" },
  "live-world": { label: "Live World", icon: Globe2, color: "cyan" },
  orders: { label: "Orders & Margins", icon: ShoppingBag, color: "blue" },
  "supplier-routing": { label: "Supplier Routing", icon: Sliders, color: "cyan" },
  dropshield: { label: "Drop Shield 24/7", icon: ShieldCheck, color: "green" },
  fulfillment: { label: "Fulfillment & Providers", icon: PackageOpen, color: "teal" },
  growth: { label: "Growth / Offers", icon: Sparkles, color: "magenta" },
  crm: { label: "CRM & Communication", icon: Users, color: "cyan" },
  blacklist: { label: "Anti-Fraud Blacklist", icon: ShieldBan, color: "red" },
  infra: { label: "Integrations & APIs", icon: Server, color: "purple" },
};

export function AdminMobileHeader({ activeTab }: AdminMobileHeaderProps) {
  const current = TAB_METADATA[activeTab] || TAB_METADATA.dashboard;
  const CurrentIcon = current.icon;

  return (
    <header
      data-testid="admin-mobile-header"
      className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 min-h-[56px] px-4 bg-[var(--admin-sidebar)] border-b border-[var(--admin-sidebar-border)] shadow-xs pt-[env(safe-area-inset-top,0px)]"
      style={{
        paddingTop: "max(0px, env(safe-area-inset-top, 0px))",
      }}
    >
      {/* Left: Active Section Context & Icon */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-[8px] bg-[var(--admin-primary-soft)] border border-[var(--admin-primary-border)] flex items-center justify-center shrink-0">
          <AdminNeonIcon
            color={current.color}
            icon={CurrentIcon}
            className="w-4 h-4"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 
              data-testid="admin-mobile-header-title"
              className="text-[15px] font-bold text-[var(--admin-text)] tracking-tight truncate leading-tight"
            >
              {current.label}
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[var(--admin-primary)]/10 text-[var(--admin-primary)] border border-[var(--admin-primary)]/25 shrink-0">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions (Theme Toggle & touch targets >= 44px) */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center min-h-[44px] min-w-[44px] justify-center">
          <AdminThemeToggle className="h-[36px]" />
        </div>
      </div>
    </header>
  );
}
