"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

import { AdminSidebar, AdminTab } from "./AdminSidebar";
import { AdminMobileHeader, AdminBottomNavigation, AdminMobileMoreSheet } from "./mobile";
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { AnalyticsModule } from "./analytics/AnalyticsModule";
import { LiveWorldModule } from "./live-world/LiveWorldModule";
import { OrdersModule } from "./orders/OrdersModule";
import { SupplierRoutingControlCenter } from "./supplier-routing/SupplierRoutingControlCenter";
import { DropShieldModule } from "./dropshield/DropShieldModule";
import { PeakerrChainsModule } from "./fulfillment/PeakerrChainsModule";
import { GrowthModule } from "./growth/GrowthModule";
import { CrmModule } from "./crm/CrmModule";
import { BlacklistModule } from "./blacklist/BlacklistModule";
import { InfrastructureModule } from "./infrastructure/InfrastructureModule";
import { SettingsModule } from "./settings/SettingsModule";
import { AdminOfflineBanner } from "./mobile/AdminOfflineBanner";
import { AdminThemeProvider } from "./ui";


import { 
  MonitoredProfile, 
  EmailWorkflow, 
  InboxMessage, 
  OrderBumpOffer, 
  UpsellOffer, 
  Coupon, 
  AbTest, 
  AbandonedLead, 
  BlacklistEntry,
  IntegrationStatus,
  SmmProvider,
  WebhookLog
} from "./types";

const VALID_TABS: AdminTab[] = [
  "dashboard",
  "analytics",
  "live-world",
  "orders",
  "supplier-routing",
  "dropshield",
  "fulfillment",
  "growth",
  "crm",
  "blacklist",
  "infra",
  "settings"
];

function AdminShellContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive active tab directly from URL search params (?tab=...)
  const tabParam = searchParams.get("tab") as AdminTab | null;
  const activeTab: AdminTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "dashboard";

  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Tab change handler that updates URL with router.push (SPA navigation, no reload)
  const handleSelectTab = useCallback((tab: AdminTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    
    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(targetUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  // States without mocks
  const [monitoredProfiles] = useState<MonitoredProfile[]>([]);
  const [emailWorkflows] = useState<EmailWorkflow[]>([]);
  const [inboxMessages] = useState<InboxMessage[]>([]);
  const [orderBumps] = useState<OrderBumpOffer[]>([]);
  const [upsells] = useState<UpsellOffer[]>([]);
  const [coupons] = useState<Coupon[]>([]);
  const [abTests] = useState<AbTest[]>([]);
  const [leads] = useState<AbandonedLead[]>([]);
  const [blacklist] = useState<BlacklistEntry[]>([]);
  const [integrations] = useState<IntegrationStatus[]>([]);
  const [providers] = useState<SmmProvider[]>([]);
  const [webhooks] = useState<WebhookLog[]>([]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out securely");
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  const renderModule = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview 
            onNavigateToOrders={() => handleSelectTab("orders")} 
            onNavigateToTab={handleSelectTab}
          />
        );
      case "analytics":
        return (
          <AnalyticsModule 
            onNavigateToAttribution={() => handleSelectTab("orders")} 
            onNavigateToLiveWorld={() => handleSelectTab("live-world")}
          />
        );
      case "live-world":
        return <LiveWorldModule />;
      case "orders":
        return <OrdersModule />;
      case "supplier-routing":
        return <SupplierRoutingControlCenter />;
      case "dropshield":
        return <DropShieldModule monitoredProfiles={monitoredProfiles} />;
      case "fulfillment":
        return <PeakerrChainsModule />;
      case "growth":
        return (
          <GrowthModule 
            bumps={orderBumps} 
            upsells={upsells} 
            coupons={coupons} 
            abTests={abTests} 
          />
        );
      case "crm":
        return <CrmModule leads={leads} workflows={emailWorkflows} messages={inboxMessages} />;
      case "blacklist":
        return <BlacklistModule entries={blacklist} />;
      case "infra":
        return <InfrastructureModule integrations={integrations} providers={providers} webhooks={webhooks} />;
      case "settings":
        return <SettingsModule onLogout={handleLogout} onNavigateToTab={handleSelectTab} />;
      default:
        return (
          <DashboardOverview 
            onNavigateToOrders={() => handleSelectTab("orders")} 
            onNavigateToTab={handleSelectTab}
          />
        );
    }
  };

  return (
    <AdminThemeProvider>
      <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] font-sans antialiased flex flex-col md:flex-row relative">
        
        {/* Background subtle radial gradient */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle at 100% 0%, rgba(20,184,166,0.05), transparent 36%)"
          }}
        />

        {/* Mobile Header (<= 900px) */}
        <AdminMobileHeader activeTab={activeTab} />

        {/* Online / Offline Connectivity Status Banner (<= 900px priority) */}
        <div className="md:hidden">
          <AdminOfflineBanner />
        </div>

        {/* Desktop Sidebar (>= 901px) */}
        <AdminSidebar 
          activeTab={activeTab} 
          onSelectTab={handleSelectTab} 
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 md:ml-[248px] relative z-10 min-h-screen pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-0">
          
          {/* Scrollable Content View with Safe Areas */}
          <main className="flex-1 p-4 md:p-[24px_32px_36px] overflow-y-auto pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
            <div className="w-full max-w-[1720px] mr-auto">
              {renderModule()}
            </div>
          </main>
          
        </div>

        {/* Mobile Bottom Navigation (<= 900px) */}
        <AdminBottomNavigation 
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenMore={() => setIsMoreSheetOpen(true)}
          isMoreOpen={isMoreSheetOpen}
        />

        {/* Mobile More Sheet Drawer (<= 900px) */}
        <AdminMobileMoreSheet
          isOpen={isMoreSheetOpen}
          onClose={() => setIsMoreSheetOpen(false)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onLogout={handleLogout}
        />
      </div>
    </AdminThemeProvider>
  );
}

export function AdminShell() {
  return (
    <Suspense fallback={
      <div className="cloutflow-admin min-h-screen bg-[#F1F5F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F8F8A] border-t-transparent animate-spin" />
      </div>
    }>
      <AdminShellContent />
    </Suspense>
  );
}
