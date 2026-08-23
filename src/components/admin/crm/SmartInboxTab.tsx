"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Inbox,
  Send,
  Search,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface SyncStatus {
  lastSyncAt: string | null;
  isLocked: boolean;
  isError: boolean;
}

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0, needsReply: 0, waitingCustomer: 0, resolved: 0, unread: 0 });
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Helper: check if scrolled near bottom
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      setHasNewMessage(false);
    }
  }, []);

  // Fetch thread detail when selected
  const fetchThreadDetail = useCallback(async (id: string, isBackground = false) => {
    try {
      if (!isBackground) {
        setReplyError(null);
        setRefreshError(null);
      }
      const res = await fetch(`/api/admin/inbox/threads/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRefreshError(null);
        setThreadDetail(prev => {
          if (prev && prev.thread.id === id) {
            const existingMessageIds = new Set(prev.messages.map(m => m.id));
            const newMessages = data.data.messages.filter((m: {id: string}) => !existingMessageIds.has(m.id));
            
            if (newMessages.length > 0) {
              // Handle scrolling or unread badge
              setTimeout(() => {
                if (isNearBottom()) {
                  scrollToBottom(true);
                } else {
                  setHasNewMessage(true);
                }
              }, 50);

              return {
                ...data.data,
                messages: [...prev.messages, ...newMessages]
              };
            }
            return {
              ...data.data,
              messages: prev.messages
            };
          }
          
          // Initial thread load
          setTimeout(() => {
            scrollToBottom(false);
          }, 50);

          return data.data;
        });
      } else {
        if (isBackground) {
          setRefreshError("Não foi possível atualizar novas mensagens em segundo plano.");
        }
      }
    } catch (err) {
      console.error("Failed to load thread detail:", err);
      if (isBackground) {
        setRefreshError("Erro de conexão ao atualizar conversa.");
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [isNearBottom, scrollToBottom]);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inbox/sync");
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to load sync status:", err);
    }
  }, []);

  // Fetch thread list
  const fetchThreads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/inbox/threads?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        if (Array.isArray(data.data.threads)) setThreads(data.data.threads);
        if (data.data.counts) setCounts(data.data.counts);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setLoadingList(false);
    }
  }, [filterStatus, searchQuery]);

  // Trigger manual sync
  const handleSyncNow = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setIsSyncing(true);
        setSyncBanner(null);
      }
      const res = await fetch("/api/admin/inbox/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        const { syncedCount, duplicateCount, ignoredCount } = data.data;
        if (!isBackground) {
          const msg = syncedCount > 0
            ? `Synced • ${syncedCount} new message(s) ingested (Duplicates: ${duplicateCount}, Ignored: ${ignoredCount})`
            : `Synced • Inbox is up to date (Duplicates: ${duplicateCount}, Ignored: ${ignoredCount})`;
          setSyncBanner({ type: 'success', message: msg });
        }
        await fetchThreads();
        await fetchSyncStatus();
        
        // REFRESH OPEN THREAD IF APPLICABLE
        if (selectedThreadId) {
          await fetchThreadDetail(selectedThreadId, true);
        }
      } else {
        if (!isBackground) setSyncBanner({ type: 'error', message: `Sync failed: ${data.error || "Unknown server error"}` });
      }
    } catch (err) {
      console.error("Failed to sync inbox:", err);
      if (!isBackground) setSyncBanner({ type: 'error', message: "Sync failed: Network or communication error" });
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  }, [fetchThreads, fetchSyncStatus, selectedThreadId, fetchThreadDetail]);

  useEffect(() => {
    let isCancelled = false;
    let syncInterval: NodeJS.Timeout | null = null;
    let syncTimeout: NodeJS.Timeout | null = null;
    let isSyncInProgress = false;

    // We do NOT want to sync if document is hidden to save bandwidth/API quotas.
    const pollSync = async () => {
      // Respect visibility, cancel flag, and lock to prevent overlapping calls
      if (isCancelled || isSyncInProgress) return;
      if (document.hidden) return;

      try {
        isSyncInProgress = true;
        await handleSyncNow(true); // background sync
      } catch (err) {
        console.error("Auto-sync interval failed:", err);
      } finally {
        isSyncInProgress = false;
      }
    };

    // When visibility changes to visible, do an immediate sync, then restart interval
    const handleVisibilityChange = () => {
      if (!document.hidden && !isCancelled) {
        // Clear existing scheduled stuff
        if (syncInterval) clearInterval(syncInterval);
        if (syncTimeout) clearTimeout(syncTimeout);

        // Wait a tiny bit then sync immediately on tab focus
        syncTimeout = setTimeout(() => {
          pollSync();
          syncInterval = setInterval(pollSync, 60000);
        }, 500);
      } else {
        // Stop polling when hidden
        if (syncInterval) clearInterval(syncInterval);
        if (syncTimeout) clearTimeout(syncTimeout);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial behavior when component mounts:
    // Sync immediately if visible, then start 60s interval
    if (!document.hidden) {
      pollSync();
      syncInterval = setInterval(pollSync, 60000);
    }

    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (syncInterval) clearInterval(syncInterval);
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [handleSyncNow]);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      if (!isCancelled) {
        await fetchThreads();
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [fetchThreads]);

  useEffect(() => {
    let isCancelled = false;
    
    if (selectedThreadId) {
      (async () => {
        if (!isCancelled) {
          await fetchThreadDetail(selectedThreadId);
        }
      })();
    } else {
      setTimeout(() => {
        if (!isCancelled) {
          setThreadDetail(null);
        }
      }, 0);
    }
    
    return () => {
      isCancelled = true;
    };
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send reply";
      setReplyError(errorMsg);
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
              <div className="flex flex-col">
                <h3 className="font-bold text-white text-base leading-tight">Smart Support Inbox</h3>
                {syncStatus && (
                  <div className="flex items-center gap-1.5 text-[9px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.isError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      Gmail {syncStatus.isError ? 'Error' : 'Connected'}
                    </span>
                    <span>•</span>
                    <span>
                      {syncStatus.lastSyncAt 
                        ? `Last sync ${new Date(syncStatus.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                        : 'Never synced'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleSyncNow()}
              disabled={isSyncing}
              className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 disabled:opacity-50"
              title="Sync Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || loadingList ? "animate-spin text-blue-400" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
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

          {/* Sync Status Banner */}
          {syncBanner && (
            <div className={`p-2.5 rounded-lg text-[11px] flex items-center justify-between gap-2 ${
              syncBanner.type === 'error'
                ? 'bg-red-950/50 border border-red-800/60 text-red-300'
                : 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
            }`}>
              <div className="flex items-center gap-1.5 leading-tight">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{syncBanner.message}</span>
              </div>
              <button
                onClick={() => setSyncBanner(null)}
                className="text-neutral-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

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

              {/* Status Selector & Refresh Error Indicator */}
              <div className="flex items-center gap-2">
                {refreshError && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    {refreshError}
                  </span>
                )}
                <span className="text-xs text-neutral-400 font-semibold">Status:</span>
                <select
                  value={threadDetail.thread.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as "NEEDS_REPLY" | "WAITING_CUSTOMER" | "RESOLVED")}
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
            <div
              ref={messagesContainerRef}
              onScroll={() => {
                if (isNearBottom()) {
                  setHasNewMessage(false);
                }
              }}
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
            >
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
                          className="prose prose-invert text-xs leading-relaxed max-w-none break-words [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-600 [&_blockquote]:pl-3 [&_blockquote]:opacity-80"
                          dangerouslySetInnerHTML={{ __html: m.sanitizedHtmlBody }}
                        />
                      ) : (
                        <div className="text-xs leading-relaxed break-words">
                          {m.textBody && m.textBody.includes('Content-Type: ') ? (
                             <pre className="whitespace-pre-wrap font-mono text-[10px] overflow-x-auto bg-neutral-900/50 p-2 rounded border border-neutral-700/50">{m.textBody}</pre>
                          ) : (
                             <p className="whitespace-pre-wrap">{m.textBody || m.subject}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating New Message Indicator */}
            {hasNewMessage && (
              <div className="relative">
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={() => scrollToBottom(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all animate-bounce"
                  >
                    <span>1 nova mensagem</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

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
