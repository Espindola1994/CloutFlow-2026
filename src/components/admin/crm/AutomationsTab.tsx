"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
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

function formatLiveSince(isoString: string | null | undefined): { dateStr: string; tzStr: string } {
  if (!isoString) {
    return { dateStr: 'NOT CONFIGURED', tzStr: '' };
  }

  // Parse ISO string with offset e.g. 2026-08-23T00:30:00-03:00 or standard ISO
  const isoMatch = isoString.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:([+-]\d{2}:?\d{2})|Z)?$/);
  
  if (isoMatch) {
    const [, year, month, day, hours, minutes, , tz] = isoMatch;
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    let formattedTz = '';
    if (tz) {
      if (tz === 'Z') {
        formattedTz = 'UTC';
      } else {
        // e.g. -03:00 -> UTC-03:00
        formattedTz = `UTC${tz.includes(':') ? tz : tz.slice(0, 3) + ':' + tz.slice(3)}`;
      }
    }
    return { dateStr: formattedDate, tzStr: formattedTz };
  }

  // Fallback if standard Date parsing works
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return { dateStr: 'NOT CONFIGURED', tzStr: '' };
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return { dateStr: `${day}/${month}/${year} ${hours}:${minutes}`, tzStr: '' };
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
  const [envInfo, setEnvInfo] = useState<{ isLive: boolean; liveFrom: string | null } | null>(null);
  const [lifecycleStatus, setLifecycleStatus] = useState<{
    marketingAutomation: 'LIVE' | 'OFF';
    lifecycleWorker: 'ACTIVE' | 'ERROR';
    resend: 'CONFIGURED' | 'CONFIG ERROR';
    liveSince: string | null;
    lifecycleEmailsEnabled: boolean;
    liveFromConfigured: boolean;
  } | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setStatusError(false);
      const res = await fetch('/api/admin/crm/automations/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLifecycleStatus(data.data);
          setLastChecked(new Date().toLocaleTimeString());
        } else {
          setStatusError(true);
        }
      } else {
        setStatusError(true);
      }
    } catch (err) {
      console.error("Failed to load status:", err);
      setStatusError(true);
    }
  }, []);

  const fetchAutomations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/crm/automations?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.data.items);
        setCounts(data.data.counts);
        setEnvInfo({
          isLive: data.data.isLive ?? false,
          liveFrom: data.data.liveFrom ?? null
        });
      }
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      if (!isCancelled) {
        await Promise.all([fetchAutomations(), fetchStatus()]);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [fetchAutomations, fetchStatus]);

  return (
    <div className="space-y-4">
      {/* Section Header & Email & Lifecycle Health */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            EMAIL &amp; LIFECYCLE HEALTH
          </h3>
          {lastChecked && (
            <span className="text-[11px] text-neutral-400">
              Last checked: <span className="text-neutral-300 font-mono">{lastChecked}</span>
            </span>
          )}
        </div>

        {/* 4 Primary Operational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Card 1: Marketing Automation */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                MARKETING AUTOMATION
              </span>
              <div className="flex items-center gap-2 mt-1">
                {statusError ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                    <span className="text-sm font-black text-neutral-400">STATUS UNAVAILABLE</span>
                  </>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 animate-pulse" />
                    <span className="text-sm font-black text-neutral-400">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full ${lifecycleStatus.marketingAutomation === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className={`text-sm font-black ${lifecycleStatus.marketingAutomation === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {lifecycleStatus.marketingAutomation}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Automated lifecycle marketing emails
            </p>
          </div>

          {/* Card 2: Lifecycle Worker */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                LIFECYCLE WORKER
              </span>
              <div className="flex items-center gap-2 mt-1">
                {statusError ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                    <span className="text-sm font-black text-neutral-400">STATUS UNAVAILABLE</span>
                  </>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 animate-pulse" />
                    <span className="text-sm font-black text-neutral-400">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full ${lifecycleStatus.lifecycleWorker === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`text-sm font-black ${lifecycleStatus.lifecycleWorker === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {lifecycleStatus.lifecycleWorker}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Processes scheduled lifecycle automations
            </p>
          </div>

          {/* Card 3: Resend Configuration */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                RESEND
              </span>
              <div className="flex items-center gap-2 mt-1">
                {statusError ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                    <span className="text-sm font-black text-neutral-400">STATUS UNAVAILABLE</span>
                  </>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 animate-pulse" />
                    <span className="text-sm font-black text-neutral-400">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full ${lifecycleStatus.resend === 'CONFIGURED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`text-sm font-black ${lifecycleStatus.resend === 'CONFIGURED' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {lifecycleStatus.resend}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Outbound marketing email provider
            </p>
          </div>

          {/* Card 4: Live Since */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                LIVE SINCE
              </span>
              <div className="mt-1">
                {statusError ? (
                  <span className="text-sm font-black text-neutral-400">STATUS UNAVAILABLE</span>
                ) : !lifecycleStatus ? (
                  <span className="text-sm font-black text-neutral-400">LOADING...</span>
                ) : (
                  (() => {
                    const formatted = formatLiveSince(lifecycleStatus.liveSince);
                    const isConfigured = lifecycleStatus.liveFromConfigured && formatted.dateStr !== 'NOT CONFIGURED';
                    return (
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-sm font-black ${isConfigured ? 'text-white' : 'text-amber-400'}`}>
                          {formatted.dateStr}
                        </span>
                        {isConfigured && formatted.tzStr && (
                          <span className="text-[10px] font-semibold text-neutral-400">
                            {formatted.tzStr}
                          </span>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Historical backlog protection boundary
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0e1422] border border-neutral-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block">
              Marketing
            </span>
            {statusError ? (
              <span className="text-[10px] font-bold text-neutral-400 uppercase">UNAVAILABLE</span>
            ) : (
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                lifecycleStatus?.marketingAutomation === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {lifecycleStatus?.marketingAutomation || (envInfo?.isLive ? 'LIVE' : 'OFF')}
              </span>
            )}
          </div>
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
            onClick={() => { fetchAutomations(); fetchStatus(); }}
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
                    !auto.status
                      ? "bg-neutral-700/30 text-neutral-400 border-neutral-700"
                      : auto.status === "COMPLETED"
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
                        {auto.scheduledFor ? new Date(auto.scheduledFor).toLocaleString() : "—"}
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
