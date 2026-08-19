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
  PackageOpen
} from "lucide-react";

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
    <aside className="w-64 h-full bg-[#0d1017] border-r border-neutral-800/80 flex flex-col justify-between text-neutral-300 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800/80">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Clout</span>
              <b className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Flow</b>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-1">
                Admin
              </span>
            </span>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-neutral-400 hover:text-white p-1"
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action Footer */}
      <div className="p-4 border-t border-neutral-800/80">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
