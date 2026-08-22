"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Tag,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface EmailHistoryItem {
  id: string;
  recipient: string;
  subject: string;
  origin: "AUTOMATION" | "MANUAL";
  category: "transactional" | "support" | "marketing";
  template: string;
  provider: string;
  providerMessageId?: string | null;
  status: string;
  stepNumber?: number | null;
  sentAt?: string | null;
  createdAt: string;
  relatedOrder?: {
    id: string;
    publicId: string;
    platform: string;
    service: string;
    targetHandle?: string | null;
    paymentStatus: string;
    fulfillmentStatus: string;
  } | null;
}

export function SentEmailHistoryTab() {
  const [items, setItems] = useState<EmailHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterOrigin, setFilterOrigin] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({ total: 0, sent: 0, failed: 0, suppressed: 0 });

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== "ALL") params.set("category", filterCategory);
      if (filterOrigin !== "ALL") params.set("origin", filterOrigin);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/crm/email-history?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.data.items);
        setCounts(data.data.counts);
      }
    } catch (err) {
      console.error("Failed to load email history:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterOrigin, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
            Total Dispatched
          </span>
          <span className="text-2xl font-black text-white">{counts.total}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Successfully Sent
          </span>
          <span className="text-2xl font-black text-emerald-400">{counts.sent}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider block mb-1">
            Failed Sends
          </span>
          <span className="text-2xl font-black text-red-400">{counts.failed}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Suppressed / Blocked
          </span>
          <span className="text-2xl font-black text-amber-400">{counts.suppressed}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-xl bg-[#0c1220] border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by recipient email, subject, or order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#111827] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="ALL">All Categories</option>
              <option value="transactional">Transactional</option>
              <option value="support">Support</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400">Origin:</span>
            <select
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="bg-[#111827] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="ALL">All Origins</option>
              <option value="AUTOMATION">Automation</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          <button
            onClick={() => fetchHistory()}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-[#0c1220] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#090d16] text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3.5">Recipient & @Handle</th>
                <th className="p-3.5">Subject & Template</th>
                <th className="p-3.5">Origin & Category</th>
                <th className="p-3.5">Provider</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Sent Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
                    Loading email logs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No email audit records found.
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const statusColor =
                    log.status === "SENT"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : log.status.startsWith("SUPPRESSED")
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20";

                  return (
                    <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="p-3.5 font-medium text-white">
                        <div>{log.recipient}</div>
                        {log.relatedOrder?.targetHandle && (
                          <div className="text-[11px] text-blue-400">
                            @{log.relatedOrder.targetHandle}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-neutral-200 line-clamp-1">{log.subject}</div>
                        <div className="text-[10px] text-neutral-400">Template: {log.template}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 mr-1.5 border border-neutral-700">
                          {log.origin}
                        </span>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                          {log.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-neutral-300">
                        {log.provider}
                        {log.providerMessageId && (
                          <div className="text-[9px] text-neutral-500 truncate max-w-[120px]">
                            {log.providerMessageId}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400 text-[11px]">
                        {new Date(log.sentAt || log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
