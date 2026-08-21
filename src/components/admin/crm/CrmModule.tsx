"use client";

import React, { useState } from "react";
import { 
  Users, 
  Inbox
} from "lucide-react";
import { AbandonedLead, EmailWorkflow, InboxMessage } from "../types";
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

interface CrmModuleProps {
  leads: AbandonedLead[];
  workflows: EmailWorkflow[];
  messages: InboxMessage[];
}

export function CrmModule({ leads, workflows, messages }: CrmModuleProps) {
  const [activeTab, setActiveTab] = useState<"leads" | "workflows" | "inbox">("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScore = scoreFilter === "all" || lead.score === scoreFilter;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminSectionHeader
        title="CRM & Communication"
        description="Manage customer relationships, abandoned checkouts and support activity."
        actions={
          <div className="flex items-center bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "leads"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Leads & Drops ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("workflows")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "workflows"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Email Automations ({workflows.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inbox")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "inbox"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Support Inbox ({messages.length})
            </button>
          </div>
        }
      />

      {/* 1. LEADS TAB */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <AdminCard padded={false} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <AdminSearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lead by @username or email address..."
                  onClear={() => setSearchQuery("")}
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] transition-colors cursor-pointer"
                >
                  <option value="all">All Temperatures</option>
                  <option value="hot">Hot Leads</option>
                  <option value="warm">Warm Leads</option>
                  <option value="cold">Cold Leads</option>
                </select>
              </div>
            </div>
          </AdminCard>

          {filteredLeads.length === 0 ? (
            <AdminCard padded={false} className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F5] border border-[#D9E2E3] flex items-center justify-center mx-auto mb-3 text-[#65737A]">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#142126]">No abandoned leads registered</h4>
              <p className="text-xs text-[#65737A] mt-1 max-w-sm mx-auto">
                When potential customers initiate verification and abandon before checkout, their session maps here.
              </p>
            </AdminCard>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableRow>
                      <AdminTableHead>User & Lead</AdminTableHead>
                      <AdminTableHead>Platform</AdminTableHead>
                      <AdminTableHead>Score</AdminTableHead>
                      <AdminTableHead>Drop-off Point</AdminTableHead>
                      <AdminTableHead>Intent Package</AdminTableHead>
                      <AdminTableHead>Date</AdminTableHead>
                    </AdminTableRow>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {filteredLeads.map((l) => (
                      <AdminTableRow key={l.id}>
                        <AdminTableCell>
                          <div>
                            <span className="font-semibold text-[#142126] block">@{l.username}</span>
                            <span className="text-xs text-[#8A979D]">{l.email}</span>
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          <div className="flex items-center gap-1.5">
                            <PlatformIcon platform={l.platform} size={16} />
                            <span className="capitalize text-xs text-[#65737A]">{l.platform}</span>
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          <AdminBadge
                            variant={
                              l.score === "hot" ? "danger" :
                              l.score === "warm" ? "warning" :
                              "info"
                            }
                            size="sm"
                          >
                            {l.score.toUpperCase()}
                          </AdminBadge>
                        </AdminTableCell>
                        <AdminTableCell>
                          <span className="text-xs text-[#65737A]">{l.step}</span>
                        </AdminTableCell>
                        <AdminTableCell>
                          <span className="font-semibold text-[#142126] text-xs">{l.selectedPlan || "None"}</span>
                        </AdminTableCell>
                        <AdminTableCell>
                          <span className="text-xs text-[#8A979D]">{l.date}</span>
                        </AdminTableCell>
                      </AdminTableRow>
                    ))}
                  </AdminTableBody>
                </AdminTable>
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredLeads.map((l) => (
                  <MobileDataCard
                    key={l.id}
                    platform={l.platform}
                    title={`@${l.username}`}
                    subtitle={l.email}
                    status={
                      <AdminBadge
                        variant={
                          l.score === "hot" ? "danger" :
                          l.score === "warm" ? "warning" :
                          "info"
                        }
                        size="sm"
                      >
                        {l.score.toUpperCase()}
                      </AdminBadge>
                    }
                    metrics={[
                      {
                        label: "Drop-off Point",
                        value: l.step,
                      },
                      {
                        label: "Intent Package",
                        value: l.selectedPlan || "None",
                      },
                      {
                        label: "Date",
                        value: l.date,
                      },
                    ]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. EMAIL WORKFLOWS */}
      {activeTab === "workflows" && (
        <AdminCard>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#142126]">Automated Email Sequences</h3>
            <p className="text-xs text-[#65737A] mt-0.5">Triggered transactional and recovery messages</p>
          </div>
          <div className="space-y-3">
            {[
              { id: "1", name: "Payment Approved & Instant Delivery", trigger: "Order Completed", subject: "Your CloutFlow order is active!", active: true, sentCount: 0, openRate: "0.0%" },
              { id: "2", name: "Abandoned Funnel Recovery (15 Min)", trigger: "Lead Drop-off", subject: "Complete your profile growth with 10% OFF", active: true, sentCount: 0, openRate: "0.0%" },
              { id: "3", name: "Drop Shield Auto-Refill Notification", trigger: "Refill Executed", subject: "Drop Shield protected your followers", active: true, sentCount: 0, openRate: "0.0%" }
            ].map((wf) => (
              <div
                key={wf.id}
                className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-semibold text-[#142126]">{wf.name}</h4>
                  <p className="text-xs text-[#65737A] mt-0.5">
                    Trigger: <span className="font-medium text-[#142126]">{wf.trigger}</span> · Subject: &quot;{wf.subject}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold self-start sm:self-auto">
                  <span className="text-[#8A979D]">{wf.sentCount} sent</span>
                  <AdminBadge variant="success" size="sm">
                    ACTIVE
                  </AdminBadge>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* 3. INBOX TAB */}
      {activeTab === "inbox" && (
        <AdminCard>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#142126]">Customer Messages</h3>
            <p className="text-xs text-[#65737A] mt-0.5">Inquiries from contact forms and order status tracking</p>
          </div>
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F5] border border-[#D9E2E3] flex items-center justify-center mx-auto mb-3 text-[#65737A]">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#142126]">Support inbox is empty</h4>
              <p className="text-xs text-[#65737A] mt-1 max-w-sm mx-auto">
                Customer support requests and contact submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <h5 className="font-semibold text-sm text-[#142126]">{m.customer} <span className="text-xs font-normal text-[#8A979D]">({m.email})</span></h5>
                    <p className="text-xs text-[#0F8F8A] font-medium mt-0.5">{m.subject}</p>
                    <p className="text-xs text-[#65737A] mt-1 line-clamp-1">{m.message}</p>
                  </div>
                  <span className="text-xs text-[#8A979D] shrink-0 self-start sm:self-auto">{m.date}</span>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
}
