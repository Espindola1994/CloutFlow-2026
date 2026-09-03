"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Menu } from "lucide-react";

import { AdminSidebar, AdminTab } from "./AdminSidebar";
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { OrdersModule } from "./orders/OrdersModule";
import { SupplierRoutingControlCenter } from "./supplier-routing/SupplierRoutingControlCenter";
import { DropShieldModule } from "./dropshield/DropShieldModule";
import { GrowthModule } from "./growth/GrowthModule";
import { PeakerrChainsModule } from "./fulfillment/PeakerrChainsModule";
import { CrmModule } from "./crm/CrmModule";
import { BlacklistModule } from "./blacklist/BlacklistModule";
import { InfrastructureModule } from "./infrastructure/InfrastructureModule";

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
  "orders",
  "supplier-routing",
  "dropshield",
  "fulfillment",
  "growth",
  "crm",
  "blacklist",
  "infra"
];

function AdminShellContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive active tab directly from URL search params (?tab=...)
  const tabParam = searchParams.get("tab") as AdminTab | null;
  const activeTab: AdminTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "dashboard";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  const renderModule = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview onNavigateToOrders={() => handleSelectTab("orders")} />;
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
      default:
        return <DashboardOverview onNavigateToOrders={() => handleSelectTab("orders")} />;
    }
  };

  return (
    <div className="cloutflow-admin min-h-screen bg-[#F1F5F5] text-[#142126] font-sans antialiased flex flex-col md:flex-row relative">
      
      {/* Background subtle radial gradient */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 100% 0%, rgba(15,143,138,0.045), transparent 32%)"
        }}
      />

      <AdminSidebar 
        activeTab={activeTab} 
        onSelectTab={handleSelectTab} 
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[248px] relative z-10 min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-[#071D26] border-b border-[#11313B] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
              <span>Clout</span>
              <span className="text-[#0F8F8A]">Flow</span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-[#0F8F8A]/20 text-[#0F8F8A] border border-[#0F8F8A]/30 ml-1">
                Admin
              </span>
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-[#8A979D] hover:text-white p-2 rounded-lg hover:bg-[#0A2630] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content View */}
        <main className="flex-1 p-4 md:p-[24px_32px_36px] overflow-y-auto">
          <div className="w-full max-w-[1720px] mr-auto">
            {renderModule()}
          </div>
        </main>
        
      </div>
    </div>
  );
}

export function AdminShell() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F1F5F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F8F8A] border-t-transparent animate-spin" />
      </div>
    }>
      <AdminShellContent />
    </Suspense>
  );
}
