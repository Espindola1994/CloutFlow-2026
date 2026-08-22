"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Mail, 
  Send, 
  ShoppingCart, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ShieldAlert, 
  Plus, 
  ExternalLink,
  UserCheck,
  Tag,
  Loader2,
  RefreshCw,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { CrmContactDetail } from "@/services/crm/crm.service";
import { AdminBadge, PlatformIcon } from "../ui";
import { ManualEmailModal } from "./ManualEmailModal";
import { useAdminAutoRefresh } from "@/hooks/useAdminAutoRefresh";

interface Customer360ModalProps {
  email: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshParent?: () => void;
}

export function Customer360Modal({
  email,
  isOpen,
  onClose,
  onRefreshParent
}: Customer360ModalProps) {
  const [contact, setContact] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "lifecycle" | "emails" | "automations" | "notes">("overview");
  
  // Note creation
  const [newNoteText, setNewNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Manual Email Modal state
  const [isManualEmailOpen, setIsManualEmailOpen] = useState(false);

  // Load Customer 360 data
  const loadCustomer = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/admin/crm/contacts/${encodeURIComponent(email)}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setContact(json.data.contact);
        }
      } else {
        toast.error("Failed to load customer details.");
      }
    } catch (err: any) {
      console.error("Error loading customer 360:", err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (isOpen && email) {
      setLoading(true);
      loadCustomer();
    }
  }, [isOpen, email, loadCustomer]);

  // Realtime hook for refreshing modal without closing
  useAdminAutoRefresh({
    entities: ["orders", "payments", "lifecycle"],
    supabaseTables: ["orders", "payment_leads", "lifecycle_events", "lifecycle_automations", "email_logs"],
    enabled: isOpen && Boolean(email),
    onRevalidate: loadCustomer
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !email) return;

    setSubmittingNote(true);
    try {
      const res = await fetch("/api/admin/crm/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email,
          adminName: "Admin",
          text: newNoteText.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Internal note added");
        setNewNoteText("");
        loadCustomer();
      } else {
        toast.error(data.error?.message || "Failed to add note");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!isOpen || !email) return null;

  const latestOrder = contact?.orders?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border-l border-[#D9E2E3] w-full max-w-4xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9E2E3] bg-[#FAFCFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0F8F8A]/10 border border-[#0F8F8A]/20 flex items-center justify-center text-[#0F8F8A] font-bold text-lg">
              {contact?.name ? contact.name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#142126]">
                  {contact?.name || email}
                </h2>
                {contact && (
                  <AdminBadge 
                    variant={
                      contact.customerType === "REPEAT BUYER" ? "success" :
                      contact.customerType === "CUSTOMER" ? "info" : "default"
                    }
                    size="sm"
                  >
                    {contact.customerType}
                  </AdminBadge>
                )}
                {contact?.suppressed && (
                  <AdminBadge variant="danger" size="sm">
                    SUPPRESSED
                  </AdminBadge>
                )}
              </div>
              <p className="text-xs text-[#65737A] mt-0.5">
                {email} · Last Activity: <span className="font-semibold text-[#142126]">{contact ? new Date(contact.lastActivity).toLocaleString() : "..."}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualEmailOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F8F8A] hover:bg-[#0D7A76] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send Email
            </button>
            <button
              onClick={onClose}
              className="text-[#8A979D] hover:text-[#142126] p-2 rounded-lg hover:bg-[#F1F5F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#D9E2E3] bg-[#FAFCFC] flex items-center gap-2 overflow-x-auto text-xs font-bold">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "orders", label: `Orders (${contact?.orders?.length || 0})`, icon: ShoppingCart },
            { id: "lifecycle", label: `Lifecycle (${contact?.lifecycleTimeline?.length || 0})`, icon: Clock },
            { id: "emails", label: `Emails (${contact?.emails?.length || 0})`, icon: Mail },
            { id: "automations", label: `Automations (${contact?.automations?.length || 0})`, icon: RefreshCw },
            { id: "notes", label: `Internal Notes (${contact?.notes?.length || 0})`, icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#0F8F8A] text-[#0F8F8A]"
                    : "border-transparent text-[#65737A] hover:text-[#142126]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-[#65737A]">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F8F8A]" />
              <p className="text-xs font-semibold">Aggregating customer 360 data...</p>
            </div>
          ) : !contact ? (
            <div className="p-8 text-center text-[#65737A]">
              Customer record not found.
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3]">
                      <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">Customer Type</span>
                      <span className="text-sm font-bold text-[#142126] mt-1 block">{contact.customerType}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3]">
                      <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">Total Orders</span>
                      <span className="text-sm font-bold text-[#142126] mt-1 block">{contact.ordersCount} ({contact.completedOrdersCount} done)</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3]">
                      <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">Gross Value</span>
                      <span className="text-sm font-bold text-[#0F8F8A] mt-1 block">
                        ${(contact.totalSpentCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3]">
                      <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">Derived Status</span>
                      <span className="text-sm font-bold text-[#142126] mt-1 block">
                        <AdminBadge variant="info" size="sm">{contact.derivedStatus}</AdminBadge>
                      </span>
                    </div>
                  </div>

                  {/* Profile & Target details */}
                  <div className="p-5 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] space-y-3">
                    <h4 className="text-xs font-bold text-[#142126] uppercase tracking-wider">Social Target Profiles</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      {contact.target ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#D9E2E3] text-xs font-semibold text-[#142126]">
                          <PlatformIcon platform={contact.platform || "instagram"} size={16} />
                          <span>{contact.target}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8A979D]">No target profile identified yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity Snapshot */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#142126] uppercase tracking-wider">Recent Lifecycle Milestone</h4>
                    <div className="p-4 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#142126]">{contact.latestLifecycleState}</div>
                        <div className="text-[11px] text-[#65737A] mt-0.5">Recorded at {new Date(contact.lastActivity).toLocaleString()}</div>
                      </div>
                      <AdminBadge variant="default" size="sm">CANONICAL</AdminBadge>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ORDERS TAB */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {contact.orders.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[#D9E2E3] rounded-xl text-xs text-[#65737A]">
                      No purchases on record for this contact.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contact.orders.map((order) => (
                        <div key={order.id} className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <PlatformIcon platform={order.platform} size={16} />
                              <span className="font-bold text-xs text-[#142126]">Order #{order.publicId}</span>
                              <AdminBadge variant={order.paymentStatus === "paid" ? "success" : "warning"} size="sm">
                                {order.paymentStatus.toUpperCase()}
                              </AdminBadge>
                              <AdminBadge variant={order.fulfillmentStatus === "completed" ? "success" : "info"} size="sm">
                                {order.fulfillmentStatus.toUpperCase()}
                              </AdminBadge>
                            </div>
                            <p className="text-xs text-[#65737A]">
                              {order.quantity} {order.service} for <span className="font-semibold text-[#142126]">{order.targetHandle || order.targetUrl || "Target"}</span>
                            </p>
                            <span className="text-[11px] text-[#8A979D] block">{new Date(order.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-[#0F8F8A] block">
                              ${(order.amountCents / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. LIFECYCLE TIMELINE TAB */}
              {activeTab === "lifecycle" && (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9E2E3]">
                  {contact.lifecycleTimeline.length === 0 ? (
                    <div className="text-xs text-[#65737A]">No lifecycle events recorded.</div>
                  ) : (
                    contact.lifecycleTimeline.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#0F8F8A] border-2 border-white ring-2 ring-[#0F8F8A]/20" />
                        <div className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#142126]">{item.title}</span>
                            <span className="text-[11px] text-[#8A979D]">{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-[#65737A] mt-1">{item.description}</p>
                          <span className="text-[10px] font-mono text-[#8A979D] mt-2 block uppercase">EVENT_CODE: {item.eventType}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. EMAILS TAB */}
              {activeTab === "emails" && (
                <div className="space-y-4">
                  {contact.emails.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[#D9E2E3] rounded-xl text-xs text-[#65737A]">
                      No email communication logs registered.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contact.emails.map((em) => (
                        <div key={em.id} className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#142126]">{em.subject}</span>
                              <AdminBadge variant={em.sendOrigin === "MANUAL" ? "info" : "default"} size="sm">
                                {em.sendOrigin}
                              </AdminBadge>
                              <AdminBadge 
                                variant={
                                  em.status === "SENT" ? "success" : 
                                  em.status === "SUPPRESSED" || em.status.includes("BLOCKED") ? "warning" : "danger"
                                } 
                                size="sm"
                              >
                                {em.status}
                              </AdminBadge>
                            </div>
                            <p className="text-xs text-[#65737A] mt-1">
                              Category: <span className="font-semibold text-[#142126]">{em.category}</span>
                              {em.templateId ? ` · Template: ${em.templateId}` : ""}
                              {em.stepNumber ? ` · Step ${em.stepNumber}` : ""}
                            </p>
                            <span className="text-[11px] text-[#8A979D] block mt-1">
                              Sent At: {em.sentAt ? new Date(em.sentAt).toLocaleString() : new Date(em.createdAt).toLocaleString()} via {em.provider}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. AUTOMATIONS TAB */}
              {activeTab === "automations" && (
                <div className="space-y-4">
                  {contact.automations.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[#D9E2E3] rounded-xl text-xs text-[#65737A]">
                      No automated email sequences scheduled or active.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contact.automations.map((auto) => (
                        <div key={auto.id} className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#142126]">{auto.automationId}</span>
                              <AdminBadge 
                                variant={
                                  auto.status === "COMPLETED" ? "success" :
                                  auto.status === "PENDING" ? "warning" :
                                  auto.status === "SUPPRESSED" ? "default" : "danger"
                                }
                                size="sm"
                              >
                                {auto.status}
                              </AdminBadge>
                            </div>
                            <p className="text-xs text-[#65737A] mt-1">
                              Action: <span className="font-semibold text-[#142126]">{auto.actionType}</span> · Scheduled: {new Date(auto.scheduledFor).toLocaleString()}
                            </p>
                            <span className="text-[11px] text-[#8A979D] block mt-0.5">
                              Attempts: {auto.attempts}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. NOTES TAB */}
              {activeTab === "notes" && (
                <div className="space-y-5">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <label className="block text-xs font-bold text-[#142126]">
                      Add Internal Admin Note (Not visible to customer)
                    </label>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      rows={3}
                      placeholder="e.g. Customer contacted via WhatsApp to verify profile change..."
                      className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-xl p-3 text-xs text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingNote || !newNoteText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F8F8A] hover:bg-[#0D7A76] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Save Note
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 pt-3 border-t border-[#D9E2E3]">
                    {contact.notes.length === 0 ? (
                      <div className="text-xs text-[#65737A] text-center py-4">
                        No internal notes recorded yet.
                      </div>
                    ) : (
                      contact.notes.map((note) => (
                        <div key={note.id} className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#142126]">{note.adminName}</span>
                            <span className="text-[11px] text-[#8A979D]">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-[#4A555B] whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Manual Email Modal */}
      {isManualEmailOpen && (
        <ManualEmailModal
          isOpen={isManualEmailOpen}
          onClose={() => setIsManualEmailOpen(false)}
          recipientEmail={email}
          recipientName={contact?.name}
          target={contact?.target}
          platform={contact?.platform}
          orderId={latestOrder?.publicId}
          quantity={latestOrder?.quantity}
          service={latestOrder?.service}
          isSuppressed={contact?.suppressed}
          onSuccess={() => {
            loadCustomer();
            onRefreshParent?.();
          }}
        />
      )}
    </div>
  );
}
