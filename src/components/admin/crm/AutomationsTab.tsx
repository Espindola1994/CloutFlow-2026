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
    <div className="space-y-3.5">
      {/* Section Header & Email & Lifecycle Health */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider">
            EMAIL &amp; LIFECYCLE HEALTH
          </h3>
          {lastChecked && (
            <span className="text-[10px] text-[#8A979D]">
              Last checked: <span className="text-[#142126] font-mono">{lastChecked}</span>
            </span>
          )}
        </div>

        {/* 4 Primary Operational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Card 1: Marketing Automation */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                MARKETING AUTOMATION
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {statusError ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
                  </>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
                    <span className="text-xs font-bold text-[#8A979D]">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${lifecycleStatus.marketingAutomation === 'LIVE' ? 'bg-[#059669]' : 'bg-[#D97706]'}`} />
                    <span className={`text-xs font-bold ${lifecycleStatus.marketingAutomation === 'LIVE' ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                      {lifecycleStatus.marketingAutomation}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8A979D] mt-1">
              Automated lifecycle marketing emails
            </p>
          </div>

          {/* Card 2: Lifecycle Worker */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                LIFECYCLE WORKER
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {statusError ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
                  </>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
                    <span className="text-xs font-bold text-[#8A979D]">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${lifecycleStatus.lifecycleWorker === 'ACTIVE' ? 'bg-[#059669]' : 'bg-[#F04438]'}`} />
                    <span className={`text-xs font-bold ${lifecycleStatus.lifecycleWorker === 'ACTIVE' ? 'text-[#059669]' : 'text-[#F04438]'}`}>
                      {lifecycleStatus.lifecycleWorker}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8A979D] mt-1">
              Processes scheduled lifecycle automations
            </p>
          </div>

          {/* Card 3: Resend Configuration */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                RESEND
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {statusError ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
                  </>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
                    <span className="text-xs font-bold text-[#8A979D]">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${lifecycleStatus.resend === 'CONFIGURED' ? 'bg-[#059669]' : 'bg-[#F04438]'}`} />
                    <span className={`text-xs font-bold ${lifecycleStatus.resend === 'CONFIGURED' ? 'text-[#059669]' : 'text-[#F04438]'}`}>
                      {lifecycleStatus.resend}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8A979D] mt-1">
              Outbound marketing email provider
            </p>
          </div>

          {/* Card 4: Live Since */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                LIVE SINCE
              </span>
              <div className="mt-0.5">
                {statusError ? (
                  <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
                ) : !lifecycleStatus ? (
                  <span className="text-xs font-bold text-[#8A979D]">LOADING...</span>
                ) : (
                  (() => {
                    const formatted = formatLiveSince(lifecycleStatus.liveSince);
                    const isConfigured = lifecycleStatus.liveFromConfigured && formatted.dateStr !== 'NOT CONFIGURED';
                    return (
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${isConfigured ? 'text-[#142126]' : 'text-[#D97706]'}`}>
                          {formatted.dateStr}
                        </span>
                        {isConfigured && formatted.tzStr && (
                          <span className="text-[9px] font-semibold text-[#8A979D]">
                            {formatted.tzStr}
                          </span>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8A979D] mt-1">
              Historical backlog boundary
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
              Total Scheduled Jobs
            </span>
            {statusError ? (
              <span className="text-[9px] font-bold text-[#8A979D] uppercase">UNAVAILABLE</span>
            ) : (
              <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${
                lifecycleStatus?.marketingAutomation === 'LIVE' ? 'bg-[#E6F4EA] text-[#059669]' : 'bg-[#FFF4E5] text-[#D97706]'
              }`}>
                {lifecycleStatus?.marketingAutomation || (envInfo?.isLive ? 'LIVE' : 'OFF')}
              </span>
            )}
          </div>
          <span className="text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.total}</span>
        </div>
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
            Pending Execution
          </span>
          <span className="text-[22px] font-bold text-[#D97706] block leading-none mt-1">{counts.pending}</span>
        </div>
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
            Completed / Sent
          </span>
          <span className="text-[22px] font-bold text-[#059669] block leading-none mt-1">{counts.completed}</span>
        </div>
        <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[72px]">
          <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
            Converted / Suppressed
          </span>
          <span className="text-[22px] font-bold text-[#0F8F8A] block leading-none mt-1">{counts.suppressed}</span>
        </div>
      </div>

      {/* Filter Header */}
      <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A979D]" />
          <input
            type="text"
            placeholder="Search by customer email or sequence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[10px] px-3 h-10 text-xs text-[#142126] placeholder-[#8A979D] focus:outline-none focus:border-[#0F8F8A]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#65737A]">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-md px-2 h-9 text-xs text-[#142126] font-semibold focus:outline-none focus:border-[#0F8F8A] cursor-pointer"
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
            className="p-2 text-[#65737A] hover:text-[#142126] bg-[#FAFCFC] hover:bg-[#F1F5F5] rounded-md border border-[#D9E2E3] transition-colors"
            title="Refresh Automations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0F8F8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Automations Table */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#142126]">
            <thead className="bg-[#F7F9FA] text-[10px] font-semibold text-[#65737A] uppercase tracking-wider border-b border-[#E3E8EA]">
              <tr>
                <th className="py-2.5 px-3">Recipient & @Handle</th>
                <th className="py-2.5 px-3">Sequence & Step</th>
                <th className="py-2.5 px-3">Scheduled For</th>
                <th className="py-2.5 px-3">Execution Status</th>
                <th className="py-2.5 px-3">Email Log Status</th>
                <th className="py-2.5 px-3">Attempts / Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F2]">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#65737A]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F8F8A] mb-2" />
                    Loading automation queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#65737A]">
                    No scheduled automations in queue.
                  </td>
                </tr>
              ) : (
                items.map((auto) => {
                  const statusColor =
                    !auto.status
                      ? "bg-[#F1F5F5] text-[#65737A] border-[#D9E2E3]"
                      : auto.status === "COMPLETED"
                      ? "bg-[#E6F4EA] text-[#059669] border-[#059669]/30"
                      : auto.status === "PENDING"
                      ? "bg-[#FFF4E5] text-[#D97706] border-[#FFB020]"
                      : auto.status === "SUPPRESSED_CONVERTED"
                      ? "bg-[#E7F5F4] text-[#0F8F8A] border-[#0F8F8A]/30"
                      : auto.status.startsWith("BLOCKED")
                      ? "bg-[#F1F5F5] text-[#65737A] border-[#D9E2E3]"
                      : "bg-[#FEE4E2] text-[#F04438] border-[#F04438]/30";

                  return (
                    <tr key={auto.id} className="hover:bg-[#F8FAFA] transition-colors h-[54px]">
                      <td className="py-2 px-3 font-semibold text-[#142126]">
                        <div>{auto.customerEmail}</div>
                        {auto.targetHandle && (
                          <div className="text-[11px] text-[#0F8F8A] font-medium">
                            @{auto.targetHandle}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-[#142126]">
                          {auto.actionType}
                        </div>
                        <div className="text-[11px] text-[#8A979D]">
                          Step {auto.stepNumber} ({auto.automationId})
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#65737A]">
                        {auto.scheduledFor ? new Date(auto.scheduledFor).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${statusColor}`}>
                          {auto.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[11px] font-mono text-[#65737A]">
                          {auto.emailLogStatus || "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#8A979D] text-[11px]">
                        <div>Attempts: {auto.attempts}</div>
                        {auto.lastError && (
                          <div className="text-[10px] text-[#F04438] truncate max-w-xs" title={auto.lastError}>
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
