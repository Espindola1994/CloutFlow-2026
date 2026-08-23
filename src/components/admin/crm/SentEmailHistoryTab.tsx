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
    <div className="space-y-3.5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
            Total Dispatched
          </span>
          <span className="text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.total}</span>
        </div>
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
            Successfully Sent
          </span>
          <span className="text-[22px] font-bold text-[#059669] block leading-none mt-1">{counts.sent}</span>
        </div>
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
            Failed Sends
          </span>
          <span className="text-[22px] font-bold text-[#F04438] block leading-none mt-1">{counts.failed}</span>
        </div>
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
            Suppressed / Blocked
          </span>
          <span className="text-[22px] font-bold text-[#D97706] block leading-none mt-1">{counts.suppressed}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A979D]" />
          <input
            type="text"
            placeholder="Search by recipient email, subject, or order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[10px] px-3 h-10 text-xs text-[#142126] placeholder-[#8A979D] focus:outline-none focus:border-[#0F8F8A]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#65737A]">
            <span>Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-md px-2 h-9 text-xs text-[#142126] font-semibold focus:outline-none focus:border-[#0F8F8A] cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="transactional">Transactional</option>
              <option value="support">Support</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#65737A]">
            <span>Origin:</span>
            <select
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-md px-2 h-9 text-xs text-[#142126] font-semibold focus:outline-none focus:border-[#0F8F8A] cursor-pointer"
            >
              <option value="ALL">All Origins</option>
              <option value="AUTOMATION">Automation</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          <button
            onClick={() => fetchHistory()}
            className="p-2 text-[#65737A] hover:text-[#142126] bg-[#FAFCFC] hover:bg-[#F1F5F5] rounded-md border border-[#D9E2E3] transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0F8F8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#142126]">
            <thead className="bg-[#F7F9FA] text-[10px] font-semibold text-[#65737A] uppercase tracking-wider border-b border-[#E3E8EA]">
              <tr>
                <th className="py-2.5 px-3">Recipient & @Handle</th>
                <th className="py-2.5 px-3">Subject & Template</th>
                <th className="py-2.5 px-3">Origin & Category</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sent Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F2]">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#65737A]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F8F8A] mb-2" />
                    Loading email logs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#65737A]">
                    No email audit records found.
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const statusColor =
                    log.status === "SENT"
                      ? "bg-[#E6F4EA] text-[#059669] border-[#059669]/30"
                      : log.status.startsWith("SUPPRESSED")
                      ? "bg-[#FFF4E5] text-[#D97706] border-[#FFB020]"
                      : "bg-[#FEE4E2] text-[#F04438] border-[#F04438]/30";

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFA] transition-colors h-[54px]">
                      <td className="py-2 px-3 font-semibold text-[#142126]">
                        <div>{log.recipient}</div>
                        {log.relatedOrder?.targetHandle && (
                          <div className="text-[11px] text-[#0F8F8A] font-medium">
                            @{log.relatedOrder.targetHandle}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-[#142126] line-clamp-1">{log.subject}</div>
                        <div className="text-[11px] text-[#8A979D]">Template: {log.template}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F5] text-[#65737A] mr-1.5 border border-[#D9E2E3]">
                          {log.origin}
                        </span>
                        <span className="text-[10px] text-[#8A979D] uppercase font-semibold">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#65737A]">
                        {log.provider}
                        {log.providerMessageId && (
                          <div className="text-[9px] text-[#8A979D] truncate max-w-[120px]">
                            {log.providerMessageId}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${statusColor}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#8A979D] text-[11px]">
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
