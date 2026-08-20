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
  Radio
} from "lucide-react";
import { BUILD_INFO } from "@/lib/build-info";

export type AdminTab = "dashboard" | "orders" | "dropshield" | "fulfillment" | "growth" | "crm" | "blacklist" | "infra";

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
  const menuItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "orders" as const, label: "Orders & Margins", icon: ShoppingBag },
    { id: "dropshield" as const, label: "Drop Shield 24/7", icon: ShieldCheck },
    { id: "fulfillment" as const, label: "Fulfillment & Peakerr", icon: PackageOpen },
    { id: "growth" as const, label: "Growth / Offers", icon: Sparkles },
    { id: "crm" as const, label: "CRM & Communication", icon: Users },
    { id: "blacklist" as const, label: "Anti-Fraud Blacklist", icon: ShieldBan },
    { id: "infra" as const, label: "Integrations & APIs", icon: Server },
  ];

  const sidebarContent = (
    <aside className="w-[260px] h-full bg-[#071D26] border-r border-[#11313B] flex flex-col justify-between text-[#8A979D] select-none">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#11313B] shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Clout</span>
              <span className="text-[#0F8F8A]">Flow</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[#0F8F8A]/20 text-[#0F8F8A] border border-[#0F8F8A]/30 ml-1">
                Admin
              </span>
            </span>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-[#8A979D] hover:text-white p-1 rounded hover:bg-[#0A2630]"
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
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[rgba(15,143,138,0.16)] text-white font-semibold"
                    : "text-[#8A979D] hover:text-white hover:bg-[#0A2630]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#0F8F8A] rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0F8F8A]" : "text-[#8A979D]"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Connection & Footer Area */}
      <div className="p-4 border-t border-[#11313B] bg-[#071D26] space-y-3 shrink-0">
        <div className="bg-[#0A2630] border border-[#11313B] rounded-[8px] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#65737A] uppercase tracking-wider">
            <span>Connection</span>
            <div className="flex items-center gap-1 text-[#16B77A]">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
          <div className="text-[11px] text-[#8A979D] flex items-center justify-between">
            <span>Peakerr Provider</span>
            <span className="text-white font-medium">Ready</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>

        <div className="text-[10px] font-mono text-[#65737A] text-center select-none pt-0.5">
          Build: <span className="text-[#8A979D] font-semibold">{BUILD_INFO.shortSha}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-[260px] shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 w-[260px] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
