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
  Trash2,
  MoreVertical,
  Volume2,
  VolumeX,
  User,
  Copy,
  RotateCcw,
  CheckSquare,
  Square,
  FileText,
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
  const [internalNoteText, setInternalNoteText] = useState("");
  const [internalNoteSending, setInternalNoteSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0, needsReply: 0, waitingCustomer: 0, resolved: 0, unread: 0 });
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTrashConfirm, setShowTrashConfirm] = useState<{ id: string } | null>(null);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState<{ action: string } | null>(null);
  const [isCustomerContextOpen, setIsCustomerContextOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    // Update CRM document title with unread count
    if (counts.unread > 0) {
      document.title = `(${counts.unread}) CloutFlow Admin`;
    } else {
      document.title = 'CloutFlow Admin';
    }
    
    // Also notify parent CRM if possible, via an event
    window.dispatchEvent(new CustomEvent('crm-inbox-unread', { detail: { count: counts.unread } }));
  }, [counts.unread]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/notification.mp3'); // Assuming standard notification sound exists or browser defaults
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      console.log('Audio init failed', e);
    }
  }, [soundEnabled]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

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

  // Handle selecting thread with draft preservation
  const handleSelectThread = (threadId: string) => {
    if (selectedThreadId) {
      setDrafts(prev => ({ ...prev, [selectedThreadId]: replyText }));
    }
    setSelectedThreadId(threadId);
    setReplyText(drafts[threadId] || "");
  };
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
              const inboundNew = newMessages.filter((m: {direction: string}) => m.direction === 'INBOUND');
              if (inboundNew.length > 0 && isBackground) {
                playNotificationSound();
                showToast(`New message from ${inboundNew[0].fromEmail}`);
              }
              
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
        setThreads(prevThreads => {
           // Compare to detect new unread inbound messages for toast/sound
           if (prevThreads.length > 0) {
             const prevIds = new Set(prevThreads.map(t => t.id));
             const newInboundThreads = data.data.threads.filter((t: any) => 
               !prevIds.has(t.id) && t.unreadCount > 0 && t.latestMessageDirection === 'INBOUND'
             );
             if (newInboundThreads.length > 0) {
                playNotificationSound();
                showToast(`New message from ${newInboundThreads[0].customerEmail}`);
             }
           }
           return Array.isArray(data.data.threads) ? data.data.threads : [];
        });
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

  // Bulk Operations
  const handleBulkAction = async (action: string) => {
    if (selectedThreadIds.size === 0) return;
    try {
      const res = await fetch("/api/admin/inbox/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadIds: Array.from(selectedThreadIds),
          action,
        }),
      });
      if (res.ok) {
        setSelectedThreadIds(new Set());
        setShowBulkActionConfirm(null);
        await fetchThreads();
        if (selectedThreadId && selectedThreadIds.has(selectedThreadId) && (action === 'TRASH' || action === 'DELETE_PERMANENT')) {
          setSelectedThreadId(null);
        }
      }
    } catch (e) {
      console.error("Bulk action failed:", e);
    }
  };

  // Clear Resolved
  const handleClearResolved = async () => {
    try {
      const res = await fetch("/api/admin/inbox/clear-resolved", { method: "POST" });
      if (res.ok) {
        await fetchThreads();
      }
    } catch (e) {
      console.error("Clear resolved failed:", e);
    }
  };

  // Single Delete / Restore
  const handleDeleteThread = async (id: string, permanent = false) => {
    try {
      const res = await fetch(`/api/admin/inbox/threads/${id}?permanent=${permanent}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowTrashConfirm(null);
        if (selectedThreadId === id) setSelectedThreadId(null);
        await fetchThreads();
      }
    } catch (e) {
      console.error("Delete thread failed:", e);
    }
  };

  const handleRestoreThread = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inbox/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedAt: null }),
      });
      if (res.ok) {
        await fetchThreads();
      }
    } catch (e) {
      console.error("Restore thread failed:", e);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      await fetch(`/api/admin/inbox/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unreadCount: 1 }),
      });
      await fetchThreads();
    } catch (e) {
      console.error("Mark unread failed:", e);
    }
  };
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
        setDrafts(prev => ({ ...prev, [selectedThreadId]: "" }));
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

  // Internal Note Creation
  const handleAddInternalNote = async () => {
    if (!selectedThreadId || !internalNoteText.trim() || !threadDetail) return;
    try {
      setInternalNoteSending(true);
      const res = await fetch("/api/admin/crm/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: threadDetail.thread.customerId,
          email: threadDetail.customer.email,
          content: internalNoteText.trim(),
          source: 'INBOX'
        }),
      });
      if (res.ok) {
        setInternalNoteText("");
        // A note is just added to customer CRM, optionally we could show it in inbox UI,
        // but for now we just show a toast and clear it
        showToast("Internal note added");
      } else {
        setReplyError("Failed to add internal note");
      }
    } catch (e) {
      console.error(e);
      setReplyError("Failed to add internal note");
    } finally {
      setInternalNoteSending(false);
    }
  };
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
    <div className="flex flex-col lg:flex-row h-[780px] bg-white border border-[#D9E2E3] rounded-[10px] overflow-hidden shadow-sm">
      {/* 1. Left Sidebar: Conversation List */}
      <div className={`w-full lg:w-[350px] flex flex-col border-r border-[#D9E2E3] bg-[#FAFCFC] ${selectedThreadId ? "hidden lg:flex" : "flex"}`}>
        {/* Header & Filter Controls */}
        <div className="p-3 border-b border-[#D9E2E3] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#142126]" />
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#142126] text-xs leading-tight">Smart Support Inbox</h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSyncNow()}
                disabled={isSyncing}
                className="px-2 py-1.5 flex items-center gap-1 text-[10px] uppercase font-bold text-[#65737A] hover:text-[#0F8F8A] bg-white hover:bg-[#F8FAFA] rounded-md transition-colors border border-[#D9E2E3] disabled:opacity-50"
                title="Sync Now"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing || loadingList ? "animate-spin text-[#0F8F8A]" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>
          
          {syncStatus && (
             <div className="flex items-center gap-1.5 text-[10px] text-[#65737A] bg-white border border-[#E3E8EA] px-2 py-1 rounded-md">
               <span className="flex items-center gap-1 font-semibold text-[#142126]">
                 <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.isError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                 Gmail Connected
               </span>
               <span>·</span>
               <span>
                 {syncStatus.lastSyncAt 
                   ? `Last sync ${new Date(syncStatus.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                   : 'Never synced'}
               </span>
             </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1 text-[10px] font-semibold pt-1">
            {[
              { id: "ALL", label: `All` },
              { id: "NEEDS_REPLY", label: `Needs Reply` },
              { id: "WAITING_CUSTOMER", label: `Waiting` },
              { id: "RESOLVED", label: `Resolved` },
              { id: "UNREAD", label: `Unread` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterStatus === tab.id
                    ? "bg-[#0F8F8A] text-white"
                    : "bg-white text-[#65737A] hover:text-[#142126] border border-[#D9E2E3]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
               <button onClick={() => {
                 if (selectedThreadIds.size === threads.length) setSelectedThreadIds(new Set());
                 else setSelectedThreadIds(new Set(threads.map(t => t.id)));
               }} className="p-1 hover:bg-[#F8FAFA] rounded-md">
                 {selectedThreadIds.size === threads.length && threads.length > 0 ? <CheckSquare className="w-4 h-4 text-[#0F8F8A]" /> : <Square className="w-4 h-4 text-[#8A979D]" />}
               </button>
               {selectedThreadIds.size > 0 && (
                 <span className="text-[10px] text-[#65737A] font-semibold uppercase">{selectedThreadIds.size} selected</span>
               )}
            </div>
            {selectedThreadIds.size > 0 && (
              <div className="flex items-center gap-1">
                 {filterStatus !== 'TRASH' && (
                   <>
                     <button onClick={() => setShowBulkActionConfirm({ action: 'RESOLVE' })} className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-[#F8FAFA] text-[#65737A] hover:text-[#142126] rounded-md border border-[#D9E2E3]">Resolve</button>
                     <button onClick={() => setShowBulkActionConfirm({ action: 'MARK_UNREAD' })} className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-[#F8FAFA] text-[#65737A] hover:text-[#142126] rounded-md border border-[#D9E2E3]">Unread</button>
                     <button onClick={() => setShowBulkActionConfirm({ action: 'TRASH' })} className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-[#F8FAFA] text-[#F04438] hover:text-[#B91C1C] rounded-md border border-[#D9E2E3]">Trash</button>
                   </>
                 )}
                 {filterStatus === 'TRASH' && (
                   <>
                     <button onClick={() => setShowBulkActionConfirm({ action: 'RESTORE' })} className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-[#F8FAFA] text-[#65737A] hover:text-[#142126] rounded-md border border-[#D9E2E3]">Restore</button>
                     <button onClick={() => setShowBulkActionConfirm({ action: 'DELETE_PERMANENT' })} className="px-2 py-1 text-[10px] font-semibold bg-[#FEE4E2] hover:bg-[#FCA5A5] text-[#F04438] rounded-md border border-[#FCA5A5]">Delete</button>
                   </>
                 )}
              </div>
            )}
            {selectedThreadIds.size === 0 && filterStatus === 'RESOLVED' && counts.resolved > 0 && (
              <button onClick={() => setShowBulkActionConfirm({ action: 'CLEAR_RESOLVED' })} className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-[#F8FAFA] text-[#65737A] hover:text-[#142126] rounded-md border border-[#D9E2E3]">
                Clear Resolved
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#D9E2E3]">
          {loadingList && threads.length === 0 ? (
            <div className="p-8 text-center text-[#65737A] text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#0F8F8A]" />
              <span>Loading conversations...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-[#65737A] text-xs">
              No conversations found matching this filter.
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = t.id === selectedThreadId;
              const isChecked = selectedThreadIds.has(t.id);
              const statusColor =
                t.status === "NEEDS_REPLY"
                  ? "bg-[#FFF4E5] text-[#D97706] border-[#FFB020]"
                  : t.status === "WAITING_CUSTOMER"
                  ? "bg-[#E7F5F4] text-[#0F8F8A] border-[#0F8F8A]/30"
                  : "bg-[#E6F4EA] text-[#059669] border-[#059669]/30";
              
              const isUnread = t.unreadCount > 0;
              const isNew = isUnread && t.latestMessageDirection === 'INBOUND';

              return (
                <div
                  key={t.id}
                  className={`p-2.5 flex gap-2.5 cursor-pointer transition-colors relative border-l-2 ${
                    isSelected ? "bg-[#FBFCFC] border-[#0F8F8A]" : isUnread ? "bg-white hover:bg-[#F8FAFA] border-[#0F8F8A]/50" : "hover:bg-[#F8FAFA] bg-white border-transparent"
                  }`}
                >
                  <div className="pt-0.5" onClick={(e) => {
                    e.stopPropagation();
                    const newSet = new Set(selectedThreadIds);
                    if (newSet.has(t.id)) newSet.delete(t.id);
                    else newSet.add(t.id);
                    setSelectedThreadIds(newSet);
                  }}>
                    {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-[#0F8F8A]" /> : <Square className="w-3.5 h-3.5 text-[#8A979D]" />}
                  </div>
                  
                  <div className="flex-1 min-w-0" onClick={() => handleSelectThread(t.id)}>
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                         <span className={`font-semibold text-xs truncate ${isUnread ? "text-[#142126]" : "text-[#142126]/80"}`}>
                           {t.customerEmail}
                         </span>
                         {isNew && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#0F8F8A] text-white shrink-0 uppercase tracking-widest leading-none">New</span>}
                      </div>
                      <span className={`text-[10px] flex-shrink-0 ${isUnread ? "text-[#0F8F8A] font-medium" : "text-[#8A979D]"}`}>
                        {new Date(t.latestMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className={`text-xs line-clamp-1 mb-0.5 ${isUnread ? "font-semibold text-[#142126]" : "font-medium text-[#65737A]"}`}>
                      {t.subject}
                    </div>

                    <div className={`text-[11px] line-clamp-1 mb-1.5 ${isUnread ? "text-[#65737A]" : "text-[#8A979D]"}`}>
                      {t.snippet}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold border ${statusColor} uppercase leading-none`}>
                        {t.status.replace("_", " ")}
                      </span>

                      {t.relatedOrder && (
                        <span className="text-[9px] font-bold text-[#0F8F8A] bg-white px-1.5 py-0.5 rounded-sm border border-[#D9E2E3] truncate max-w-[120px] uppercase leading-none">
                          Order #{t.relatedOrder.publicId.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Pane: Customer 360 Context + Thread Messages + Reply Box */}
      <div className={`flex-1 flex flex-col bg-white ${selectedThreadId ? "flex" : "hidden lg:flex"}`}>
        {selectedThreadId && threadDetail ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Thread Header */}
            <div className="p-3 border-b border-[#D9E2E3] bg-[#FAFCFC] flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    if (selectedThreadId) {
                      setDrafts(prev => ({ ...prev, [selectedThreadId]: replyText }));
                    }
                    setSelectedThreadId(null);
                  }}
                  className="lg:hidden p-1.5 text-[#65737A] hover:text-[#142126] bg-white border border-[#D9E2E3] rounded-md"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-sm font-bold text-[#142126] line-clamp-1">
                    {threadDetail.thread.subject}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <button 
                      onClick={() => setIsCustomerContextOpen(!isCustomerContextOpen)}
                      className="text-xs text-[#0F8F8A] hover:text-[#0a6662] font-semibold flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      {threadDetail.customer.email}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Selector & Refresh Error Indicator */}
              <div className="flex items-center gap-2">
                {refreshError && (
                  <span className="text-[10px] text-[#D97706] bg-[#FFF4E5] border border-[#FFB020] px-2 py-0.5 rounded-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-[#D97706]" />
                    {refreshError}
                  </span>
                )}
                
                <button 
                  onClick={() => handleUpdateStatus("RESOLVED")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                    threadDetail.thread.status === "RESOLVED" 
                      ? "bg-[#E6F4EA] text-[#059669] border-[#059669]/30"
                      : "bg-white text-[#65737A] border-[#D9E2E3] hover:text-[#142126] hover:bg-[#F8FAFA]"
                  }`}
                >
                  Resolve
                </button>

                <div className="relative group">
                  <button className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#131b2e] border border-neutral-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                    <button onClick={() => handleMarkAsUnread(threadDetail.thread.id)} className="w-full text-left px-4 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 border-b border-neutral-800/50">Mark as unread</button>
                    <button onClick={() => { navigator.clipboard.writeText(threadDetail.customer.email); showToast('Email copied'); }} className="w-full text-left px-4 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 border-b border-neutral-800/50 flex items-center gap-2"><Copy className="w-3 h-3" /> Copy customer email</button>
                    <button onClick={() => setShowTrashConfirm({ id: threadDetail.thread.id })} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/30 flex items-center gap-2"><Trash2 className="w-3 h-3" /> Delete conversation</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Context Side Drawer / Panel (Expandable) */}
            {isCustomerContextOpen && (
              <div className="bg-[#FAFCFC] border-b border-[#D9E2E3] p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xs font-bold text-[#142126] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0F8F8A]" /> Customer Context
                  </h3>
                  <button onClick={() => setIsCustomerContextOpen(false)} className="text-[#8A979D] hover:text-[#142126] text-xs">✕ Close</button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Email</span>
                    <span className="font-semibold text-[#142126]">{threadDetail.customer.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Name</span>
                    <span className="font-semibold text-[#142126]">{threadDetail.customer.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Total Orders</span>
                    <span className="font-semibold text-[#0F8F8A]">{threadDetail.orders.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Lifetime Value</span>
                    <span className="font-semibold text-[#0F8F8A]">
                      ${(threadDetail.orders.reduce((sum, o) => sum + o.amountCents, 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {threadDetail.orders.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#D9E2E3] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Latest Order</span>
                      <span className="font-semibold text-[#142126]">#{threadDetail.orders[0].publicId.slice(-8)} ({threadDetail.orders[0].service})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Target @</span>
                      <span className="font-semibold text-[#0F8F8A]">{threadDetail.orders[0].targetHandle ? `@${threadDetail.orders[0].targetHandle}` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Payment</span>
                      <span className={`font-semibold ${threadDetail.orders[0].paymentStatus === "paid" ? "text-[#059669]" : "text-[#D97706]"}`}>
                        {threadDetail.orders[0].paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A979D] uppercase font-semibold block mb-0.5">Fulfillment</span>
                      <span className="font-semibold text-[#142126]">{threadDetail.orders[0].fulfillmentStatus.toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              onScroll={() => {
                if (isNearBottom()) {
                  setHasNewMessage(false);
                }
              }}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 relative bg-[#FAFCFC]"
            >
              {threadDetail.messages.map((m) => {
                const isOutbound = m.direction === "OUTBOUND";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-2xl rounded-[10px] p-3.5 ${
                        isOutbound
                          ? "bg-[#0F8F8A] text-white"
                          : "bg-white text-[#142126] border border-[#D9E2E3]"
                      }`}
                    >
                      <div className={`flex items-center justify-between gap-4 mb-2 pb-1 border-b text-[11px] ${isOutbound ? "border-white/20 opacity-90" : "border-[#E3E8EA] text-[#8A979D]"}`}>
                        <span className="font-semibold">
                          {isOutbound ? "CloutFlow Support" : m.fromEmail}
                        </span>
                        <span>
                          {new Date(m.sentAt || m.receivedAt || m.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {m.sanitizedHtmlBody ? (
                        <div
                          className={`prose text-xs leading-relaxed max-w-none break-words ${isOutbound ? "prose-invert" : ""}`}
                          dangerouslySetInnerHTML={{ __html: m.sanitizedHtmlBody }}
                        />
                      ) : (
                        <div className="text-xs leading-relaxed break-words">
                          {m.textBody && m.textBody.includes('Content-Type: ') ? (
                             <pre className={`whitespace-pre-wrap font-mono text-[10px] overflow-x-auto p-2 rounded border ${isOutbound ? "bg-white/10 border-white/20" : "bg-[#F8FAFA] border-[#D9E2E3]"}`}>{m.textBody}</pre>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F8F8A] hover:bg-[#0a6662] text-white text-xs font-semibold shadow-lg shadow-[#0F8F8A]/30 transition-all animate-bounce"
                  >
                    <span>1 nova mensagem</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Reply / Internal Note Composer Box */}
            <div className="p-3 border-t border-[#D9E2E3] bg-white space-y-2.5">
              {replyError && (
                <div className="p-2.5 rounded-md bg-[#FFF4E5] border border-[#FFB020] text-xs text-[#D97706] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{replyError}</span>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => {
                     setReplyText(e.target.value);
                     if (selectedThreadId) {
                        setDrafts(prev => ({ ...prev, [selectedThreadId]: e.target.value }));
                     }
                  }}
                  placeholder={`Reply to ${threadDetail.customer.email} using Gmail Support...`}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[10px] p-2.5 text-xs text-[#142126] placeholder-[#8A979D] focus:outline-none focus:border-[#0F8F8A] transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-[#65737A] flex items-center gap-1.5 hidden sm:flex font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#0F8F8A]" />
                    Sent via authenticated Support Gmail
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!replyText.trim()) return;
                      // Move text to internal note and clear reply draft
                      setInternalNoteText(replyText);
                      setReplyText("");
                      if (selectedThreadId) setDrafts(prev => ({ ...prev, [selectedThreadId]: "" }));
                      setTimeout(() => handleAddInternalNote(), 50);
                    }}
                    disabled={internalNoteSending || !replyText.trim()}
                    className="px-3 py-1.5 bg-white hover:bg-[#F8FAFA] disabled:opacity-50 text-[#65737A] hover:text-[#142126] text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer border border-[#D9E2E3]"
                    title="Save text as an internal note (not sent to customer)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Internal Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={replySending || !replyText.trim()}
                    className="px-3 py-1.5 bg-[#0F8F8A] hover:bg-[#0a6662] disabled:opacity-50 text-white text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{replySending ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#65737A] text-center">
            <MessageSquare className="w-10 h-10 text-[#8A979D] mb-2" />
            <h4 className="text-sm font-bold text-[#142126] mb-1">No Conversation Selected</h4>
            <p className="text-xs max-w-sm">
              Select a conversation thread from the left to view customer order context, conversation history, and dispatch Gmail replies.
            </p>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showTrashConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="text-base font-bold text-[#142126]">Delete this conversation?</h3>
            <p className="text-xs text-[#65737A] leading-relaxed">
              This removes the conversation from the Smart Inbox. Customer orders, lifecycle history, CRM history and sent email audit records will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowTrashConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-[#65737A] hover:text-[#142126] bg-[#F1F5F5] hover:bg-[#E3E8EA] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteThread(showTrashConfirm.id, filterStatus === 'TRASH')}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F04438] hover:bg-[#B91C1C] rounded-md transition-colors"
              >
                {filterStatus === 'TRASH' ? 'Delete Permanently' : 'Delete Conversation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="text-base font-bold text-[#142126]">
              {showBulkActionConfirm.action === 'CLEAR_RESOLVED' 
                ? 'Move all resolved conversations to Trash?' 
                : `Apply ${showBulkActionConfirm.action} to ${selectedThreadIds.size} conversations?`}
            </h3>
            <p className="text-xs text-[#65737A] leading-relaxed">
              {showBulkActionConfirm.action === 'CLEAR_RESOLVED'
                ? `This will move ${counts.resolved} resolved conversation(s) to Trash. They can be restored at any time.`
                : `This action will be applied to the selected conversation(s).`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBulkActionConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-[#65737A] hover:text-[#142126] bg-[#F1F5F5] hover:bg-[#E3E8EA] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showBulkActionConfirm.action === 'CLEAR_RESOLVED') {
                    handleClearResolved();
                    setShowBulkActionConfirm(null);
                  } else {
                    handleBulkAction(showBulkActionConfirm.action);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#111827] border border-blue-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white text-xs ml-2">✕</button>
        </div>
      )}
    </div>
  );
}