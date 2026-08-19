"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu } from "lucide-react";

import { AdminSidebar, AdminTab } from "./AdminSidebar";
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { OrdersModule } from "./orders/OrdersModule";
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

export function AdminShell() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        return <DashboardOverview onNavigateToOrders={() => setActiveTab("orders")} />;
      case "orders":
        return <OrdersModule />;
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
        return <DashboardOverview onNavigateToOrders={() => setActiveTab("orders")} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#070a10] text-neutral-300 font-sans font-inter antialiased overflow-hidden">
      
      <AdminSidebar 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-[#0d1017] border-b border-neutral-800/80">
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
            <span>Clout</span>
            <b className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Flow</b>
          </span>
          <button 
            type="button" 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-neutral-400 hover:text-white p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-[1400px]">
            {renderModule()}
          </div>
        </main>
        
      </div>
    </div>
  );
}
