"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  User,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/email/sanitize";

interface ThreadSummary {
  id: string;
  customerEmail: string;
  customerId: string | null;
  customerName: string | null;
  status: "NEEDS_REPLY" | "WAITING_CUSTOMER" | "RESOLVED";
  subject: string;
  unreadCount: number;
  latestMessageAt: string;
  snippet: string;
  latestMessageDirection: "INBOUND" | "OUTBOUND";
  relatedOrder: {
    id: string;
    publicId: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    targetHandle?: string | null;
    platform?: string | null;
    service?: string | null;
  } | null;
}

interface ThreadDetail {
  thread: {
    id: string;
    customerEmail: string;
    customerId: string | null;
    status: "NEEDS_REPLY" | "WAITING_CUSTOMER" | "RESOLVED";
    subject: string;
    relatedOrderId: string | null;
    latestMessageAt: string;
    unreadCount: number;
  };
  customer: {
    id?: string;
    name?: string;
    email: string;
  };
  orders: Array<{
    id: string;
    publicId: string;
    platform: string;
    service: string;
    quantity: number;
    amountCents: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    targetHandle?: string | null;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    provider: string;
    fromEmail: string;
    toEmail: string;
    subject: string;
    textBody?: string | null;
    sanitizedHtmlBody?: string | null;
    receivedAt?: string | null;
    sentAt?: string | null;
    createdAt: string;
  }>;
}

export function SmartInboxTab() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0, needsReply: 0, waitingCustomer: 0, resolved: 0, unread: 0 });

  // Fetch thread list
  const fetchThreads = useCallback(async () => {
    try {
      setLoadingList(true);
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/inbox/threads?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setThreads(data.data.threads);
        setCounts(data.data.counts);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setLoadingList(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch thread detail when selected
  const fetchThreadDetail = useCallback(async (id: string) => {
    try {
      setLoadingDetail(true);
      setReplyError(null);
      const res = await fetch(`/api/admin/inbox/threads/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setThreadDetail(data.data);
      }
    } catch (err) {
      console.error("Failed to load thread detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetail(selectedThreadId);
    } else {
      setThreadDetail(null);
    }
  }, [selectedThreadId, fetchThreadDetail]);

  // Send Reply inside CloutFlow
  const handleSendReply = async () => {
    if (!selectedThreadId || !replyText.trim()) return;

    try {
      setReplySending(true);
      setReplyError(null);

      const res = await fetch(`/api/admin/inbox/threads/${selectedThreadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textBody: replyText.trim(),
          status: "WAITING_CUSTOMER",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReplyText("");
        // Refresh detail & list
        await fetchThreadDetail(selectedThreadId);
        fetchThreads();
      } else {
        setReplyError(data.error || "Failed to dispatch reply");
      }
    } catch (err: any) {
      setReplyError(err?.message || "Failed to send reply");
    } finally {
      setReplySending(false);
    }
  };

  // Change thread status
  const handleUpdateStatus = async (newStatus: "NEEDS_REPLY" | "WAITING_CUSTOMER" | "RESOLVED") => {
    if (!selectedThreadId) return;
    try {
      await fetch(`/api/admin/inbox/threads/${selectedThreadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (threadDetail) {
        setThreadDetail({
          ...threadDetail,
          thread: { ...threadDetail.thread, status: newStatus },
        });
      }
      fetchThreads();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[780px] bg-[#0c1220] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* 1. Left Sidebar: Conversation List */}
      <div className={`w-full lg:w-96 flex flex-col border-r border-neutral-800 bg-[#090d16] ${selectedThreadId ? "hidden lg:flex" : "flex"}`}>
        {/* Header & Filter Controls */}
        <div className="p-4 border-b border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">Smart Support Inbox</h3>
            </div>
            <button
              onClick={() => fetchThreads()}
              className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search email, @handle, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-neutral-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {[
              { id: "ALL", label: `All (${counts.total})` },
              { id: "NEEDS_REPLY", label: `Needs Reply (${counts.needsReply})` },
              { id: "WAITING_CUSTOMER", label: `Waiting (${counts.waitingCustomer})` },
              { id: "RESOLVED", label: `Resolved (${counts.resolved})` },
              { id: "UNREAD", label: `Unread (${counts.unread})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterStatus === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40">
          {loadingList && threads.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              <span>Loading conversations...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              No conversations found matching this filter.
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = t.id === selectedThreadId;
              const statusColor =
                t.status === "NEEDS_REPLY"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : t.status === "WAITING_CUSTOMER"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-3.5 cursor-pointer transition-colors relative ${
                    isSelected ? "bg-neutral-800/90" : "hover:bg-neutral-800/40 bg-[#090d16]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-neutral-200 truncate">
                      {t.customerEmail}
                    </span>
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">
                      {new Date(t.latestMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-white line-clamp-1 mb-1">
                    {t.subject}
                  </div>

                  <div className="text-[11px] text-neutral-400 line-clamp-1 mb-2">
                    {t.snippet}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                      {t.status.replace("_", " ")}
                    </span>

                    {t.relatedOrder && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 truncate max-w-[140px]">
                        Order #{t.relatedOrder.publicId.slice(-6)}
                      </span>
                    )}

                    {t.unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Pane: Customer 360 Context + Thread Messages + Reply Box */}
      <div className={`flex-1 flex flex-col bg-[#0b0f19] ${selectedThreadId ? "flex" : "hidden lg:flex"}`}>
        {selectedThreadId && threadDetail ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 border-b border-neutral-800 bg-[#0e1422] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedThreadId(null)}
                  className="lg:hidden p-1 text-neutral-400 hover:text-white"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white line-clamp-1">
                    {threadDetail.thread.subject}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    With <span className="text-neutral-200">{threadDetail.customer.email}</span>
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-semibold">Status:</span>
                <select
                  value={threadDetail.thread.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as any)}
                  className="bg-[#111827] border border-neutral-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="NEEDS_REPLY">NEEDS REPLY</option>
                  <option value="WAITING_CUSTOMER">WAITING CUSTOMER</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            {/* Customer 360 Strip (Top Context Banner) */}
            <div className="bg-[#131b2e] px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Customer</span>
                  <span className="font-semibold text-white">{threadDetail.customer.name || threadDetail.customer.email.split("@")[0]}</span>
                </div>

                {threadDetail.orders.length > 0 && (
                  <>
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Latest Order</span>
                      <span className="font-semibold text-white">
                        #{threadDetail.orders[0].publicId.slice(-8)} ({threadDetail.orders[0].service})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Target @</span>
                      <span className="font-semibold text-blue-400">
                        {threadDetail.orders[0].targetHandle ? `@${threadDetail.orders[0].targetHandle}` : "N/A"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Payment</span>
                      <span className={`font-semibold ${threadDetail.orders[0].paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                        {threadDetail.orders[0].paymentStatus.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Fulfillment</span>
                      <span className="font-semibold text-neutral-200">
                        {threadDetail.orders[0].fulfillmentStatus.toUpperCase()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {threadDetail.messages.map((m) => {
                const isOutbound = m.direction === "OUTBOUND";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl p-4 shadow-md ${
                        isOutbound
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-neutral-800 text-neutral-100 rounded-bl-none border border-neutral-700/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] opacity-80">
                        <span className="font-bold">
                          {isOutbound ? "CloutFlow Support" : m.fromEmail}
                        </span>
                        <span>
                          {new Date(m.sentAt || m.receivedAt || m.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {m.sanitizedHtmlBody ? (
                        <div
                          className="prose prose-invert text-xs leading-relaxed max-w-none break-words"
                          dangerouslySetInnerHTML={{ __html: m.sanitizedHtmlBody }}
                        />
                      ) : (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {m.textBody || m.subject}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer Box */}
            <div className="p-4 border-t border-neutral-800 bg-[#0e1422] space-y-3">
              {replyError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{replyError}</span>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${threadDetail.customer.email} using Gmail Support...`}
                  className="w-full bg-[#111827] border border-neutral-700/80 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Sent via authenticated Support Gmail · In-Reply-To preserved
                </span>

                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replySending || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{replySending ? "Sending..." : "Send Reply"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-600 mb-3" />
            <h4 className="text-sm font-bold text-neutral-300 mb-1">No Conversation Selected</h4>
            <p className="text-xs text-neutral-400 max-w-sm">
              Select a conversation thread from the left to view customer order context, conversation history, and dispatch Gmail replies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
