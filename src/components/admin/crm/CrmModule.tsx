"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, 
  Inbox, 
  Search, 
  Filter, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  RefreshCw,
  Tag,
  ArrowUpDown,
  Loader2,
  Sparkles,
  History,
  Workflow
} from "lucide-react";
import { AbandonedLead, EmailWorkflow, InboxMessage } from "../types";
import { CrmContactSummary } from "@/services/crm/crm.service";
import {
  AdminCard,
  AdminBadge,
  AdminSearchInput,
  AdminSectionHeader,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  PlatformIcon,
  MobileDataCard,
} from "../ui";
import { Customer360Modal } from "./Customer360Modal";
import { ManualEmailModal } from "./ManualEmailModal";
import { SmartInboxTab } from "./SmartInboxTab";
import { SentEmailHistoryTab } from "./SentEmailHistoryTab";
import { AutomationsTab } from "./AutomationsTab";
import { useAdminAutoRefresh } from "@/hooks/useAdminAutoRefresh";

interface CrmModuleProps {
  leads?: AbandonedLead[];
  workflows?: EmailWorkflow[];
  messages?: InboxMessage[];
}

export function CrmModule({ leads = [], workflows = [], messages = [] }: CrmModuleProps) {
  const [activeTab, setActiveTab] = useState<"contacts" | "inbox" | "history" | "automations">("contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [contacts, setContacts] = useState<CrmContactSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);
  const [isCustomer360Open, setIsCustomer360Open] = useState(false);

  // Standalone manual email state
  const [manualEmailRecipient, setManualEmailRecipient] = useState<CrmContactSummary | null>(null);
  const [isManualEmailOpen, setIsManualEmailOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/contacts", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setContacts(json.data.contacts);
        }
      }
    } catch (err) {
      console.error("Error fetching CRM contacts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Realtime hook
  useAdminAutoRefresh({
    entities: ["orders", "payments", "lifecycle"],
    supabaseTables: ["orders", "payment_leads", "lifecycle_events", "lifecycle_automations", "email_logs"],
    onRevalidate: fetchContacts
  });

  // Filtered contacts calculation
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        c.email.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.target && c.target.toLowerCase().includes(q)) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "LEADS") return c.customerType === "LEAD";
      if (statusFilter === "CHECKOUT STARTED") return c.latestLifecycleState === "CHECKOUT_STARTED";
      if (statusFilter === "ABANDONED") return c.latestLifecycleState === "CHECKOUT_ABANDONED" || c.derivedStatus === "ABANDONED";
      if (statusFilter === "WAITING PAYMENT") return c.latestOrderStatus === "pending" || c.derivedStatus === "WAITING PAYMENT";
      if (statusFilter === "PAID") return c.latestOrderStatus === "paid";
      if (statusFilter === "FULFILLING") return c.derivedStatus === "FULFILLING";
      if (statusFilter === "COMPLETED") return c.derivedStatus === "COMPLETED";
      if (statusFilter === "FAILED") return c.latestOrderStatus === "failed" || c.derivedStatus === "NEEDS CUSTOMER ACTION";
      if (statusFilter === "REFUNDED") return c.latestOrderStatus === "refunded";
      if (statusFilter === "REPEAT BUYERS") return c.customerType === "REPEAT BUYER";
      if (statusFilter === "SUPPRESSED") return c.suppressed;
      if (statusFilter === "MISSING TARGET") return c.derivedStatus === "MISSING TARGET";
      if (statusFilter === "MISSING POST LINK") return c.derivedStatus === "MISSING POST LINK";
      if (statusFilter === "NEEDS CUSTOMER ACTION") return c.derivedStatus === "NEEDS CUSTOMER ACTION";

      return true;
    });
  }, [contacts, searchQuery, statusFilter]);

  // Operational metrics
  const counts = useMemo(() => {
    return {
      total: contacts.length,
      leads: contacts.filter(c => c.customerType === "LEAD").length,
      customers: contacts.filter(c => c.customerType === "CUSTOMER" || c.customerType === "REPEAT BUYER").length,
      abandoned: contacts.filter(c => c.latestLifecycleState === "CHECKOUT_ABANDONED" || c.derivedStatus === "ABANDONED").length,
      suppressed: contacts.filter(c => c.suppressed).length
    };
  }, [contacts]);

  const handleOpen360 = (email: string) => {
    setSelectedCustomerEmail(email);
    setIsCustomer360Open(true);
  };

  const handleOpenManualEmail = (c: CrmContactSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setManualEmailRecipient(c);
    setIsManualEmailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminSectionHeader
        title="CRM & Communication"
        description="Unified customer relationship manager, Smart Gmail Inbox, sent email history, and lifecycle automations."
        actions={
          <div className="flex items-center bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg p-1 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("contacts")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "contacts"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              CONTACTS ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inbox")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "inbox"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              INBOX
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              SENT / EMAIL HISTORY
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("automations")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "automations"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              AUTOMATIONS
            </button>
          </div>
        }
      />

      {/* 1. CONTACTS CRM TAB */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {/* Summary counters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E2E3]">
              <span className="text-[11px] font-semibold text-[#8A979D] uppercase block">Total Contacts</span>
              <span className="text-base font-bold text-[#142126] mt-0.5 block">{counts.total}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E2E3]">
              <span className="text-[11px] font-semibold text-[#8A979D] uppercase block">Active Leads</span>
              <span className="text-base font-bold text-[#142126] mt-0.5 block">{counts.leads}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E2E3]">
              <span className="text-[11px] font-semibold text-[#8A979D] uppercase block">Buyers</span>
              <span className="text-base font-bold text-[#0F8F8A] mt-0.5 block">{counts.customers}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E2E3]">
              <span className="text-[11px] font-semibold text-[#8A979D] uppercase block">Abandoned</span>
              <span className="text-base font-bold text-[#F04438] mt-0.5 block">{counts.abandoned}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#D9E2E3]">
              <span className="text-[11px] font-semibold text-[#8A979D] uppercase block">Suppressed</span>
              <span className="text-base font-bold text-[#65737A] mt-0.5 block">{counts.suppressed}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <AdminCard padded={false} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <AdminSearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contact by email, @target, name or order ID..."
                  onClear={() => setSearchQuery("")}
                />
              </div>

              <div className="flex items-center gap-3 overflow-x-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-semibold focus:outline-hidden focus:border-[#0F8F8A] transition-colors cursor-pointer"
                >
                  <option value="ALL">All Contact States</option>
                  <option value="LEADS">Leads Only</option>
                  <option value="CHECKOUT STARTED">Checkout Started</option>
                  <option value="ABANDONED">Abandoned Cart</option>
                  <option value="WAITING PAYMENT">Waiting Payment</option>
                  <option value="PAID">Paid Orders</option>
                  <option value="FULFILLING">Fulfilling / In Delivery</option>
                  <option value="COMPLETED">Delivery Completed</option>
                  <option value="FAILED">Failed / Needs Action</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="REPEAT BUYERS">Repeat Buyers</option>
                  <option value="SUPPRESSED">Suppressed (Unsubscribed)</option>
                  <option value="MISSING TARGET">Attention: Missing Target</option>
                  <option value="MISSING POST LINK">Attention: Missing Post Link</option>
                  <option value="NEEDS CUSTOMER ACTION">Attention: Needs Customer Action</option>
                </select>
              </div>
            </div>
          </AdminCard>

          {loading ? (
            <AdminCard padded={false} className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F8F8A] mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#65737A]">Loading CRM contacts...</p>
            </AdminCard>
          ) : filteredContacts.length === 0 ? (
            <AdminCard padded={false} className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F5] border border-[#D9E2E3] flex items-center justify-center mx-auto mb-3 text-[#65737A]">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#142126]">No contacts match your filter</h4>
              <p className="text-xs text-[#65737A] mt-1 max-w-sm mx-auto">
                Try resetting your search query or selecting a different funnel state.
              </p>
            </AdminCard>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableRow>
                      <AdminTableHead>Customer Identity</AdminTableHead>
                      <AdminTableHead>Target & Platform</AdminTableHead>
                      <AdminTableHead>Customer Type</AdminTableHead>
                      <AdminTableHead>Operational State</AdminTableHead>
                      <AdminTableHead>Orders</AdminTableHead>
                      <AdminTableHead>Gross Value</AdminTableHead>
                      <AdminTableHead>Last Activity</AdminTableHead>
                      <AdminTableHead className="text-right">Actions</AdminTableHead>
                    </AdminTableRow>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {filteredContacts.map((c) => (
                      <AdminTableRow 
                        key={c.email}
                        onClick={() => handleOpen360(c.email)}
                        className="cursor-pointer hover:bg-[#F8FAFA] transition-colors"
                      >
                        <AdminTableCell>
                          <div>
                            <span className="font-semibold text-xs text-[#142126] block">
                              {c.email}
                            </span>
                            {c.name && (
                              <span className="text-[11px] text-[#8A979D]">{c.name}</span>
                            )}
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          {c.target ? (
                            <div className="flex items-center gap-1.5">
                              <PlatformIcon platform={c.platform || "instagram"} size={14} />
                              <span className="text-xs text-[#142126] font-medium">{c.target}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#8A979D]">—</span>
                          )}
                        </AdminTableCell>

                        <AdminTableCell>
                          <AdminBadge
                            variant={
                              c.customerType === "REPEAT BUYER" ? "success" :
                              c.customerType === "CUSTOMER" ? "info" : "default"
                            }
                            size="sm"
                          >
                            {c.customerType}
                          </AdminBadge>
                        </AdminTableCell>

                        <AdminTableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AdminBadge
                              variant={
                                c.derivedStatus === "COMPLETED" ? "success" :
                                c.derivedStatus === "PAID" || c.derivedStatus === "FULFILLING" ? "info" :
                                c.derivedStatus === "ABANDONED" || c.derivedStatus === "NEEDS CUSTOMER ACTION" ? "danger" :
                                c.derivedStatus === "WAITING PAYMENT" ? "warning" : "default"
                              }
                              size="sm"
                            >
                              {c.derivedStatus}
                            </AdminBadge>
                            {c.suppressed && (
                              <AdminBadge variant="danger" size="sm">
                                SUPPRESSED
                              </AdminBadge>
                            )}
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="text-xs font-semibold text-[#142126]">{c.ordersCount}</span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="text-xs font-bold text-[#0F8F8A]">
                            ${(c.totalSpentCents / 100).toFixed(2)}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="text-xs text-[#8A979D]">
                            {new Date(c.lastActivity).toLocaleDateString()}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenManualEmail(c, e)}
                              title="Send Manual Email"
                              className="p-1.5 rounded-lg text-[#65737A] hover:text-[#0F8F8A] hover:bg-[#0F8F8A]/10 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpen360(c.email)}
                              className="p-1.5 rounded-lg text-[#65737A] hover:text-[#142126] hover:bg-[#D9E2E3]/40 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </AdminTableCell>
                      </AdminTableRow>
                    ))}
                  </AdminTableBody>
                </AdminTable>
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredContacts.map((c) => (
                  <div
                    key={c.email}
                    onClick={() => handleOpen360(c.email)}
                    className="p-4 rounded-xl bg-white border border-[#D9E2E3] space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-[#142126] block">{c.email}</span>
                        {c.name && <span className="text-[11px] text-[#8A979D]">{c.name}</span>}
                      </div>
                      <AdminBadge
                        variant={c.customerType === "REPEAT BUYER" ? "success" : c.customerType === "CUSTOMER" ? "info" : "default"}
                        size="sm"
                      >
                        {c.customerType}
                      </AdminBadge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#8A979D] block text-[11px]">Target</span>
                        <span className="font-semibold text-[#142126]">{c.target || "None"}</span>
                      </div>
                      <div>
                        <span className="text-[#8A979D] block text-[11px]">State</span>
                        <span className="font-semibold text-[#142126]">{c.derivedStatus}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F5] text-xs">
                      <span className="font-bold text-[#0F8F8A]">
                        ${(c.totalSpentCents / 100).toFixed(2)} ({c.ordersCount} orders)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenManualEmail(c, e)}
                        className="flex items-center gap-1 text-[#0F8F8A] font-bold"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. SMART SUPPORT INBOX TAB */}
      {activeTab === "inbox" && (
        <SmartInboxTab />
      )}

      {/* 3. SENT / EMAIL HISTORY TAB */}
      {activeTab === "history" && (
        <SentEmailHistoryTab />
      )}

      {/* 4. AUTOMATIONS TAB */}
      {activeTab === "automations" && (
        <AutomationsTab />
      )}

      {/* Customer 360 Drawer */}
      {selectedCustomerEmail && (
        <Customer360Modal
          email={selectedCustomerEmail}
          isOpen={isCustomer360Open}
          onClose={() => {
            setIsCustomer360Open(false);
            setSelectedCustomerEmail(null);
          }}
          onRefreshParent={fetchContacts}
        />
      )}

      {/* Standalone Manual Email Modal */}
      {manualEmailRecipient && (
        <ManualEmailModal
          isOpen={isManualEmailOpen}
          onClose={() => {
            setIsManualEmailOpen(false);
            setManualEmailRecipient(null);
          }}
          recipientEmail={manualEmailRecipient.email}
          recipientName={manualEmailRecipient.name}
          target={manualEmailRecipient.target}
          platform={manualEmailRecipient.platform}
          isSuppressed={manualEmailRecipient.suppressed}
          onSuccess={fetchContacts}
        />
      )}
    </div>
  );
}
