import React from "react";
import { AdminTab } from "../AdminSidebar";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  MoreHorizontal 
} from "lucide-react";
import { AdminNeonIcon, AdminNeonColor } from "../ui/AdminNeonIcon";

export interface AdminBottomNavigationProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

interface BottomNavItem {
  id: AdminTab | "more";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: AdminNeonColor;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "teal" },
  { id: "orders", label: "Orders", icon: ShoppingBag, color: "blue" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "violet" },
  { id: "crm", label: "CRM", icon: Users, color: "cyan" },
  { id: "more", label: "More", icon: MoreHorizontal, color: "magenta" },
];

export function AdminBottomNavigation({
  activeTab,
  onSelectTab,
  onOpenMore,
  isMoreOpen = false,
}: AdminBottomNavigationProps) {
  // A tab is considered in "more" if it is not one of the main 4 destinations
  const isMainTab = ["dashboard", "orders", "analytics", "crm"].includes(activeTab);
  const isMoreActive = isMoreOpen || !isMainTab;

  return (
    <nav
      data-testid="admin-bottom-navigation"
      aria-label="Admin Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--admin-sidebar)] border-t border-[var(--admin-sidebar-border)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="grid grid-cols-5 h-[58px] items-center px-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === "more" ? isMoreActive : activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`admin-bottom-nav-${item.id}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (item.id === "more") {
                  onOpenMore();
                } else {
                  onSelectTab(item.id as AdminTab);
                }
              }}
              className={`relative flex flex-col items-center justify-center min-h-[48px] h-full py-1 px-0.5 rounded-[8px] transition-all cursor-pointer select-none ${
                isActive
                  ? "text-[var(--admin-primary)] font-semibold"
                  : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
              }`}
            >
              {/* Active Indicator Bar on top of icon */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-[var(--admin-primary)] rounded-full" />
              )}

              <div
                className={`w-6 h-6 flex items-center justify-center transition-transform ${
                  isActive ? "scale-105" : "opacity-75"
                }`}
              >
                <AdminNeonIcon
                  color={item.color}
                  icon={Icon}
                  className="w-5 h-5"
                />
              </div>

              <span className="text-[10px] tracking-tight truncate max-w-[64px] mt-0.5 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
