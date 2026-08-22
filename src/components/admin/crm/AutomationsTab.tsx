"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Zap,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface AutomationItem {
  id: string;
  automationId: string;
  actionType: string;
  customerEmail: string;
  scheduledFor: string;
  status: string;
  attempts: number;
  lastAttemptAt?: string | null;
  createdAt: string;
  stepNumber: number;
  targetHandle?: string | null;
  platform?: string | null;
  service?: string | null;
  emailLogStatus?: string | null;
  lastError?: string | null;
}

export function AutomationsTab() {
  const [items, setItems] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    suppressed: 0,
    failed: 0,
    blocked: 0,
  });

  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/crm/automations?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.data.items);
        setCounts(data.data.counts);
      }
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
            Total Scheduled Jobs
          </span>
          <span className="text-2xl font-black text-white">{counts.total}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Pending Execution
          </span>
          <span className="text-2xl font-black text-amber-400">{counts.pending}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Completed / Sent
          </span>
          <span className="text-2xl font-black text-emerald-400">{counts.completed}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block mb-1">
            Converted / Suppressed
          </span>
          <span className="text-2xl font-black text-blue-400">{counts.suppressed}</span>
        </div>
      </div>

      {/* Filter Header */}
      <div className="p-4 rounded-xl bg-[#0c1220] border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by customer email or sequence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#111827] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUPPRESSED_CONVERTED">Suppressed Converted</option>
              <option value="BLOCKED_SEND_DISABLED">Send Disabled (Safe)</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <button
            onClick={() => fetchAutomations()}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg"
            title="Refresh Automations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Automations Table */}
      <div className="bg-[#0c1220] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#090d16] text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3.5">Recipient & @Handle</th>
                <th className="p-3.5">Sequence & Step</th>
                <th className="p-3.5">Scheduled For</th>
                <th className="p-3.5">Execution Status</th>
                <th className="p-3.5">Email Log Status</th>
                <th className="p-3.5">Attempts / Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
                    Loading automation queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No scheduled automations in queue.
                  </td>
                </tr>
              ) : (
                items.map((auto) => {
                  const statusColor =
                    auto.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : auto.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : auto.status === "SUPPRESSED_CONVERTED"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : auto.status.startsWith("BLOCKED")
                      ? "bg-neutral-700/30 text-neutral-400 border-neutral-700"
                      : "bg-red-500/10 text-red-400 border-red-500/20";

                  return (
                    <tr key={auto.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="p-3.5 font-medium text-white">
                        <div>{auto.customerEmail}</div>
                        {auto.targetHandle && (
                          <div className="text-[11px] text-blue-400">
                            @{auto.targetHandle}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-neutral-200">
                          {auto.actionType}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Step {auto.stepNumber} ({auto.automationId})
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-300">
                        {new Date(auto.scheduledFor).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                          {auto.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] font-mono text-neutral-400">
                          {auto.emailLogStatus || "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400 text-[11px]">
                        <div>Attempts: {auto.attempts}</div>
                        {auto.lastError && (
                          <div className="text-[10px] text-red-400 truncate max-w-xs" title={auto.lastError}>
                            {auto.lastError}
                          </div>
                        )}
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
