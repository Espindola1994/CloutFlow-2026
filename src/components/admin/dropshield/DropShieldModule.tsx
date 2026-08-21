"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  Activity
} from "lucide-react";
import { MonitoredProfile } from "../types";
import {
  AdminCard,
  AdminStatCard,
  AdminBadge,
  AdminSearchInput,
  AdminSectionHeader,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  PlatformIcon,
  MobileDataCard,
} from "../ui";

interface DropShieldModuleProps {
  monitoredProfiles: MonitoredProfile[];
}

export function DropShieldModule({ monitoredProfiles }: DropShieldModuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProfiles = monitoredProfiles.filter((profile) => {
    const matchesSearch = profile.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === "all" || profile.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || profile.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const protectedCount = monitoredProfiles.filter((p) => p.status === "PROTECTED").length;
  const refilledCount = monitoredProfiles.filter((p) => p.status === "REFILLED").length;
  const attentionCount = monitoredProfiles.filter((p) => p.status === "ATTENTION").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminSectionHeader
        title="Drop Shield 24/7"
        description="Monitor retention protection and automatic refill safeguards."
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E7F5F4] border border-[#0F8F8A]/20 text-xs font-semibold text-[#0F8F8A]">
            <span className="w-2 h-2 rounded-full bg-[#0F8F8A] animate-pulse" />
            <span>Autonomous Engine: Active</span>
          </div>
        }
      />

      {/* Summary / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Monitored Profiles"
          value={monitoredProfiles.length > 0 ? monitoredProfiles.length : "—"}
          subValue="Active customer warranties"
          icon={Activity}
        />
        <AdminStatCard
          title="Protected (Stable)"
          value={monitoredProfiles.length > 0 ? protectedCount : "—"}
          subValue="Counts above delivery threshold"
          icon={ShieldCheck}
          change={monitoredProfiles.length > 0 ? { value: `${protectedCount} active`, isPositive: true } : undefined}
        />
        <AdminStatCard
          title="Auto Refilled"
          value={monitoredProfiles.length > 0 ? refilledCount : "—"}
          subValue="Compensated by provider"
          icon={RefreshCw}
        />
        <AdminStatCard
          title="Requires Attention"
          value={monitoredProfiles.length > 0 ? attentionCount : "—"}
          subValue="High drop detected"
          icon={AlertTriangle}
          change={attentionCount > 0 ? { value: `${attentionCount} alerts`, isPositive: false } : undefined}
        />
      </div>

      {/* Search & Filters */}
      <AdminCard padded={false} className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <AdminSearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by profile handle @username..."
              onClear={() => setSearchQuery("")}
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] transition-colors cursor-pointer"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X / Twitter</option>
              <option value="youtube">YouTube</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PROTECTED">Protected</option>
              <option value="REFILLED">Refilled</option>
              <option value="ATTENTION">Attention</option>
            </select>
          </div>
        </div>
      </AdminCard>

      {/* Profiles Content: Table on Desktop, Cards on Mobile */}
      {filteredProfiles.length === 0 ? (
        <AdminCard padded={false} className="p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F1F5F5] border border-[#D9E2E3] flex items-center justify-center mx-auto mb-3 text-[#65737A]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#142126]">No monitored profiles yet</h4>
          <p className="text-xs text-[#65737A] mt-1 max-w-sm mx-auto">
            Profiles with active Drop Shield warranty will be continuously audited every 6 hours.
          </p>
        </AdminCard>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Target Profile</AdminTableHead>
                  <AdminTableHead>Platform</AdminTableHead>
                  <AdminTableHead>Initial Count</AdminTableHead>
                  <AdminTableHead>Current Count</AdminTableHead>
                  <AdminTableHead>Delivered</AdminTableHead>
                  <AdminTableHead>Detected Drop</AdminTableHead>
                  <AdminTableHead>Auto Refill</AdminTableHead>
                  <AdminTableHead>Status</AdminTableHead>
                  <AdminTableHead>Last Checked</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredProfiles.map((p) => (
                  <AdminTableRow key={p.id}>
                    <AdminTableCell>
                      <span className="font-semibold text-[#142126]">@{p.username}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={p.platform} size={16} />
                        <span className="capitalize text-xs text-[#65737A]">{p.platform}</span>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>{p.startCount.toLocaleString()}</AdminTableCell>
                    <AdminTableCell>{p.currentCount.toLocaleString()}</AdminTableCell>
                    <AdminTableCell>
                      <span className="text-[#0F8F8A] font-semibold">+{p.deliveredQty.toLocaleString()}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-[#EF4444] font-semibold">-{p.dropQty.toLocaleString()}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge
                        variant={p.autoRefillEnabled ? "success" : "default"}
                        size="sm"
                      >
                        {p.autoRefillEnabled ? "ENABLED" : "OFF"}
                      </AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge
                        variant={
                          p.status === "PROTECTED" ? "success" :
                          p.status === "REFILLED" ? "info" :
                          "warning"
                        }
                        size="sm"
                      >
                        {p.status}
                      </AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-[#8A979D] text-xs">{p.lastCheck}</span>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProfiles.map((p) => (
              <MobileDataCard
                key={p.id}
                platform={p.platform}
                title={`@${p.username}`}
                subtitle={`Initial: ${p.startCount.toLocaleString()} · Current: ${p.currentCount.toLocaleString()}`}
                status={
                  <AdminBadge
                    variant={
                      p.status === "PROTECTED" ? "success" :
                      p.status === "REFILLED" ? "info" :
                      "warning"
                    }
                    size="sm"
                  >
                    {p.status}
                  </AdminBadge>
                }
                metrics={[
                  {
                    label: "Delivered",
                    value: <span className="text-[#0F8F8A]">+{p.deliveredQty.toLocaleString()}</span>,
                  },
                  {
                    label: "Detected Drop",
                    value: <span className="text-[#EF4444]">-{p.dropQty.toLocaleString()}</span>,
                  },
                  {
                    label: "Auto Refill",
                    value: p.autoRefillEnabled ? "Enabled" : "Off",
                  },
                  {
                    label: "Last Checked",
                    value: p.lastCheck,
                  },
                ]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
