"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
} from "lucide-react";
import { AdminTooltip } from "../ui";

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
    marketingAutomation: 'LIVE' | 'PAUSED';
    cronTrigger: 'ACTIVE' | 'INACTIVE';
    resend: 'CONFIGURED' | 'MISSING_API_KEY';
    liveSince: string | null;
    liveFromConfigured: boolean;
  } | null>(null);
  const [statusError, setStatusError] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/lifecycle/status", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setLifecycleStatus(data.data);
        setStatusError(false);
      } else {
        setStatusError(true);
      }
    } catch {
      setStatusError(true);
    }
  }, []);

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
        setEnvInfo(data.data.env);
      }
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchStatus();
    fetchAutomations();
  }, [fetchStatus, fetchAutomations]);

  return (
    <div className="space-y-3.5">
      {/* Engine Status Grid */}
      <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-3 sm:p-4">
        <h3 className="text-xs font-bold text-[#142126] uppercase tracking-wider mb-2.5">
          Lifecycle Engine Operational Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Marketing Automation */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                  MARKETING AUTOMATION
                </span>
                <AdminTooltip content="Master switch controlling whether lifecycle drip cadences actively execute." />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {statusError ? (
                  <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
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
              Master lifecycle execution switch
            </p>
          </div>

          {/* Card 2: Cron Trigger */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                  CRON TRIGGER
                </span>
                <AdminTooltip content="Verification that the scheduled runner is active." />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {statusError ? (
                  <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
                ) : !lifecycleStatus ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
                    <span className="text-xs font-bold text-[#8A979D]">LOADING...</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${lifecycleStatus.cronTrigger === 'ACTIVE' ? 'bg-[#059669]' : 'bg-[#D97706]'}`} />
                    <span className={`text-xs font-bold ${lifecycleStatus.cronTrigger === 'ACTIVE' ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                      {lifecycleStatus.cronTrigger}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8A979D] mt-1">
              Hourly cadence dispatcher
            </p>
          </div>

          {/* Card 3: Resend Provider */}
          <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[76px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                  RESEND PROVIDER
                </span>
                <AdminTooltip content="Status of the authenticated email transport provider credentials." />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {statusError ? (
                  <span className="text-xs font-bold text-[#8A979D]">STATUS UNAVAILABLE</span>
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8A979D] font-semibold uppercase tracking-wider block">
                  LIVE SINCE
                </span>
                <AdminTooltip content="Timestamp from which automated lifecycle cadences became effective." />
              </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[70px] sm:min-h-[72px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] text-[#8A979D] font-semibold uppercase tracking-wider block">
              Total Jobs
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
          <span className="text-[20px] sm:text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.total}</span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[70px] sm:min-h-[72px]">
          <span className="text-[10px] sm:text-[11px] text-[#8A979D] font-semibold uppercase tracking-wider block">
            Pending
          </span>
          <span className="text-[20px] sm:text-[22px] font-bold text-[#D97706] block leading-none mt-1">{counts.pending}</span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[70px] sm:min-h-[72px]">
          <span className="text-[10px] sm:text-[11px] text-[#8A979D] font-semibold uppercase tracking-wider block">
            Completed / Sent
          </span>
          <span className="text-[20px] sm:text-[22px] font-bold text-[#059669] block leading-none mt-1">{counts.completed}</span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[70px] sm:min-h-[72px]">
          <span className="text-[10px] sm:text-[11px] text-[#8A979D] font-semibold uppercase tracking-wider block">
            Suppressed
          </span>
          <span className="text-[20px] sm:text-[22px] font-bold text-[#0F8F8A] block leading-none mt-1">{counts.suppressed}</span>
        </div>
      </div>

      {/* Filter Header */}
      <div className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#8A979D] shrink-0" />
          <input
            type="text"
            placeholder="Search by customer email or automation type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[10px] px-3 h-10 text-xs text-[#142126] placeholder-[#8A979D] focus:outline-none focus:border-[#0F8F8A]"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#65737A]">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-md px-2 h-9 text-xs text-[#142126] font-semibold focus:outline-none focus:border-[#0F8F8A] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="suppressed">Suppressed</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <button
            onClick={() => { fetchStatus(); fetchAutomations(); }}
            className="p-2 min-h-[36px] min-w-[36px] text-[#65737A] hover:text-[#142126] bg-[#FAFCFC] hover:bg-[#F1F5F5] rounded-md border border-[#D9E2E3] transition-colors shrink-0 flex items-center justify-center"
            title="Refresh Automations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0F8F8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 1. Desktop Automations Table (>=901px / md:block) */}
      <div className="hidden md:block bg-white border border-[#D9E2E3] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#142126]">
            <thead className="bg-[#F7F9FA] text-[10px] font-semibold text-[#65737A] uppercase tracking-wider border-b border-[#E3E8EA]">
              <tr>
                <th className="py-2.5 px-3">Recipient & @Handle</th>
                <th className="py-2.5 px-3">Action & Cadence</th>
                <th className="py-2.5 px-3">Scheduled For</th>
                <th className="py-2.5 px-3">Execution Status</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F2]">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#65737A]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F8F8A] mb-2" />
                    Loading automated jobs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#65737A]">
                    No automated lifecycle jobs found.
                  </td>
                </tr>
              ) : (
                items.map((job) => {
                  const statusColor =
                    job.status === "completed"
                      ? "bg-[#E6F4EA] text-[#059669] border-[#059669]/30"
                      : job.status === "pending"
                      ? "bg-[#FFF4E5] text-[#D97706] border-[#FFB020]"
                      : job.status === "suppressed"
                      ? "bg-[#E7F5F4] text-[#0F8F8A] border-[#0F8F8A]/30"
                      : "bg-[#FEE4E2] text-[#F04438] border-[#F04438]/30";

                  return (
                    <tr key={job.id} className="hover:bg-[#F8FAFA] transition-colors h-[54px]">
                      <td className="py-2 px-3 font-semibold text-[#142126]">
                        <div>{job.customerEmail}</div>
                        {job.targetHandle && (
                          <div className="text-[11px] text-[#0F8F8A] font-medium">
                            @{job.targetHandle}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-[#142126]">{job.actionType}</div>
                        <div className="text-[11px] text-[#8A979D]">Step #{job.stepNumber}</div>
                      </td>
                      <td className="py-2 px-3 text-[#65737A]">
                        {new Date(job.scheduledFor).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${statusColor} uppercase`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px]">
                        {job.attempts}
                      </td>
                      <td className="py-2 px-3 text-[#8A979D] text-[11px]">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Automations Cards (<=900px / md:hidden) */}
      <div data-testid="automations-mobile" className="md:hidden space-y-2.5">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-[#65737A] bg-white border border-[#D9E2E3] rounded-[10px]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F8F8A] mb-2" />
            <span className="text-xs">Loading automated jobs...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#65737A] bg-white border border-[#D9E2E3] rounded-[10px]">
            No automated lifecycle jobs found.
          </div>
        ) : (
          items.map((job) => {
            const statusColor =
              job.status === "completed"
                ? "bg-[#E6F4EA] text-[#059669] border-[#059669]/30"
                : job.status === "pending"
                ? "bg-[#FFF4E5] text-[#D97706] border-[#FFB020]"
                : job.status === "suppressed"
                ? "bg-[#E7F5F4] text-[#0F8F8A] border-[#0F8F8A]/30"
                : "bg-[#FEE4E2] text-[#F04438] border-[#F04438]/30";

            return (
              <div
                key={job.id}
                className="p-3 rounded-[10px] bg-white border border-[#D9E2E3] space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-[#142126] block truncate">{job.customerEmail}</span>
                    {job.targetHandle && (
                      <span className="text-[11px] text-[#0F8F8A] font-medium block">
                        @{job.targetHandle}
                      </span>
                    )}
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-sm text-[9.5px] font-bold border ${statusColor} shrink-0 uppercase`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#142126]">{job.actionType}</span>
                  <span className="text-[#8A979D] text-[11px]">Step #{job.stepNumber}</span>
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-[#8A979D] pt-1 border-t border-[#F1F5F5]">
                  <span>Scheduled: {new Date(job.scheduledFor).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>Attempts: {job.attempts}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
