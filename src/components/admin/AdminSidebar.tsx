"use client";

import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  ShieldBan, 
  Server, 
  LogOut,
  X,
  PackageOpen,
  Radio,
  Sliders,
  BarChart3,
  Globe2
} from "lucide-react";
import { BUILD_INFO } from "@/lib/build-info";
import { AdminNeonIcon, AdminNeonColor } from "./ui";

export type AdminTab = "dashboard" | "analytics" | "live-world" | "orders" | "supplier-routing" | "dropshield" | "fulfillment" | "growth" | "crm" | "blacklist" | "infra";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const menuItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; color: AdminNeonColor }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "teal" },
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "violet" },
    { id: "live-world", label: "Live World", icon: Globe2, color: "cyan" },
    { id: "orders", label: "Orders & Margins", icon: ShoppingBag, color: "blue" },
    { id: "supplier-routing", label: "Supplier Routing", icon: Sliders, color: "cyan" },
    { id: "dropshield", label: "Drop Shield 24/7", icon: ShieldCheck, color: "green" },
    { id: "fulfillment", label: "Fulfillment & Providers", icon: PackageOpen, color: "teal" },
    { id: "growth", label: "Growth / Offers", icon: Sparkles, color: "magenta" },
    { id: "crm", label: "CRM & Communication", icon: Users, color: "cyan" },
    { id: "blacklist", label: "Anti-Fraud Blacklist", icon: ShieldBan, color: "red" },
    { id: "infra", label: "Integrations & APIs", icon: Server, color: "purple" },
  ];

  const sidebarContent = (
    <aside className="w-[248px] h-full bg-[#FFFFFF] border-r border-[#E3E8EA] flex flex-col justify-between text-[#65737A] select-none shadow-[1px_0_4px_rgba(10,35,42,0.02)]">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E3E8EA] shrink-0 bg-[#FFFFFF]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-[20px] font-bold tracking-tight text-[#142126] flex items-center gap-1.5">
              <span>Clout</span>
              <span className="text-[#0F8F8A]">Flow</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[#0F8F8A]/10 text-[#0F8F8A] border border-[#0F8F8A]/25 ml-1">
                Admin
              </span>
            </span>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-[#65737A] hover:text-[#142126] p-1 rounded hover:bg-[#F1F5F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`relative w-full min-h-[42px] flex items-center gap-3 px-3.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E7F5F4] text-[#0F8F8A] font-semibold shadow-xs"
                    : "text-[#65737A] hover:text-[#142126] hover:bg-[#F7F9FA]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#0F8F8A] rounded-r-full" />
                )}
                <AdminNeonIcon
                  color={item.color}
                  icon={Icon}
                  className={`w-[18px] h-[18px] ${isActive ? "opacity-100" : "opacity-75"}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Connection & Footer Area */}
      <div className="p-4 border-t border-[#E3E8EA] bg-[#FAFCFC] space-y-3 shrink-0">
        <div className="bg-[#FFFFFF] border border-[#E3E8EA] rounded-[8px] p-2.5 space-y-1.5 shadow-[0_1px_2px_rgba(10,35,42,0.02)]">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#65737A] uppercase tracking-wider">
            <span>Connection</span>
            <div className="flex items-center gap-1 text-[#16B77A]">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
          <div className="text-[11px] text-[#65737A] flex items-center justify-between">
            <span>Peakerr Provider</span>
            <span className="text-[#142126] font-semibold">Ready</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-medium text-[#EF4444] hover:bg-[#FEECEB] hover:text-[#DC2626] transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>

        <div className="text-[10px] font-mono text-[#8A979D] text-center select-none pt-0.5">
          Build: <span className="text-[#65737A] font-semibold">{BUILD_INFO.shortSha}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-[248px] shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 w-[248px] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
