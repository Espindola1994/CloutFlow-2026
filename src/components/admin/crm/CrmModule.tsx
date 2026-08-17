"use client";

import React, { useState } from "react";
import { 
  Users, 
  Mail, 
  Inbox, 
  Search, 
  Flame, 
  Send, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Tag
} from "lucide-react";
import { AbandonedLead, EmailWorkflow, InboxMessage, Platform } from "../types";

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
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">CRM & Communication</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Recover abandoned funnel checkouts and manage customer touchpoints</p>
        </div>

        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "leads" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Leads & Drops ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workflows")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "workflows" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Email Automations ({workflows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "inbox" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Support Inbox ({messages.length})
          </button>
        </div>
      </div>

      {/* 1. LEADS TAB */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#12161f] border border-neutral-800/80 rounded-2xl p-4 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search lead by @username or email address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Temperatures</option>
                <option value="hot">Hot Leads</option>
                <option value="warm">Warm Leads</option>
                <option value="cold">Cold Leads</option>
              </select>
            </div>
          </div>

          <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
            {filteredLeads.length === 0 ? (
              <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
                <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-neutral-300">No abandoned leads registered</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  When potential customers initiate verification and abandon before checkout, their session maps here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="pb-3 font-semibold">User & Lead</th>
                      <th className="pb-3 font-semibold">Platform</th>
                      <th className="pb-3 font-semibold">Score</th>
                      <th className="pb-3 font-semibold">Drop-off Point</th>
                      <th className="pb-3 font-semibold">Intent Package</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                    {filteredLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3.5">
                          <span className="font-bold text-white block">@{l.username}</span>
                          <span className="text-[11px] text-neutral-500">{l.email}</span>
                        </td>
                        <td className="py-3.5 capitalize">{l.platform}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.score === "hot" ? "bg-red-500/10 text-red-400" :
                            l.score === "warm" ? "bg-amber-500/10 text-amber-400" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>
                            {l.score.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5">{l.step}</td>
                        <td className="py-3.5 font-semibold text-white">{l.selectedPlan || "None"}</td>
                        <td className="py-3.5 text-neutral-500">{l.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. EMAIL WORKFLOWS */}
      {activeTab === "workflows" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Automated Email Sequences</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Triggered transactional and recovery messages</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: "1", name: "Payment Approved & Instant Delivery", trigger: "Order Completed", subject: "Your CloutFlow order is active!", active: true, sentCount: 0, openRate: "0.0%" },
              { id: "2", name: "Abandoned Funnel Recovery (15 Min)", trigger: "Lead Drop-off", subject: "Complete your profile growth with 10% OFF", active: true, sentCount: 0, openRate: "0.0%" },
              { id: "3", name: "Drop Shield Auto-Refill Notification", trigger: "Refill Executed", subject: "Drop Shield protected your followers", active: true, sentCount: 0, openRate: "0.0%" }
            ].map((wf) => (
              <div key={wf.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{wf.name}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Trigger: <b className="text-neutral-300">{wf.trigger}</b> · Subject: &quot;{wf.subject}&quot;</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-neutral-400">{wf.sentCount} sent</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. INBOX TAB */}
      {activeTab === "inbox" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Customer Messages</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Inquiries from contact forms and order status tracking</p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
              <Inbox className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-300">Support inbox is empty</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Customer support requests and contact submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white">{m.customer} ({m.email})</h5>
                    <p className="text-xs text-neutral-300 font-semibold mt-0.5">{m.subject}</p>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{m.message}</p>
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0">{m.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
