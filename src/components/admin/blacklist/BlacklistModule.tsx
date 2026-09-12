"use client";

import React, { useState, useMemo } from "react";
import { 
  ShieldBan,
  ShieldCheck,
  Ban,
  AlertTriangle
} from "lucide-react";
import { BlacklistEntry } from "../types";
import {
  AdminCard,
  AdminBadge,
  AdminSearchInput,
  AdminSectionHeader,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  MobileDataCard,
  AdminTooltip,
} from "../ui";

interface BlacklistModuleProps {
  entries: BlacklistEntry[];
}

export function BlacklistModule({ entries }: BlacklistModuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = entry.value.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || entry.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [entries, searchQuery, typeFilter]);

  const counts = useMemo(() => {
    return {
      total: entries.length,
      usernames: entries.filter((e) => e.type === "username").length,
      emails: entries.filter((e) => e.type === "email").length,
      ips: entries.filter((e) => e.type === "ip").length,
    };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminSectionHeader
        title="Anti-Fraud & Deny List"
        description="Operational deny list enforcement, blocked handles, fraudulent emails, and network restrictions."
      />

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[74px] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
              Blocked Identifiers
            </span>
            <AdminTooltip content="Total active deny-list entries permanently blocked from checkout and delivery." />
          </div>
          <span className="text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.total}</span>
        </div>

        <div className="p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[74px] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
              Blocked Handles
            </span>
            <AdminTooltip content="Social network handles restricted from automated fulfillment." />
          </div>
          <span className="text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.usernames}</span>
        </div>

        <div className="p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[74px] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
              Blocked Emails
            </span>
            <AdminTooltip content="Email addresses identified in fraud or chargeback histories." />
          </div>
          <span className="text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.emails}</span>
        </div>

        <div className="p-3.5 rounded-[10px] bg-white border border-[#D9E2E3] flex flex-col justify-between min-h-[74px] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A979D] uppercase tracking-wider block">
              Blocked IPs
            </span>
            <AdminTooltip content="Network IP addresses flagged for abuse or automated bot attempts." />
          </div>
          <span className="text-[22px] font-bold text-[#142126] block leading-none mt-1">{counts.ips}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <AdminCard padded={false} className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <AdminSearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blacklisted handle, email or IP..."
              onClear={() => setSearchQuery("")}
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] transition-colors cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="username">Usernames</option>
              <option value="email">Emails</option>
              <option value="ip">IP Addresses</option>
            </select>
          </div>
        </div>
      </AdminCard>

      {/* Table / Empty State */}
      {filteredEntries.length === 0 ? (
        <AdminCard padded={false} className="p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F1F5F5] border border-[#D9E2E3] flex items-center justify-center mx-auto mb-3 text-[#65737A]">
            <ShieldBan className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#142126]">Blacklist is currently clean</h4>
          <p className="text-xs text-[#65737A] mt-1 max-w-sm mx-auto">
            Any identifiers added here will be blocked automatically during step verification and checkout.
          </p>
        </AdminCard>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>
                    <div className="flex items-center gap-1">
                      <span>Type</span>
                      <AdminTooltip content="Type of blocked entity: handle, email address, or IP." />
                    </div>
                  </AdminTableHead>
                  <AdminTableHead>
                    <div className="flex items-center gap-1">
                      <span>Blocked Value</span>
                      <AdminTooltip content="Target identifier rejected by payment gates and fulfillment engines." />
                    </div>
                  </AdminTableHead>
                  <AdminTableHead>
                    <div className="flex items-center gap-1">
                      <span>Reason</span>
                      <AdminTooltip content="Operational or fraud rule that triggered this entry." />
                    </div>
                  </AdminTableHead>
                  <AdminTableHead>Added Date</AdminTableHead>
                  <AdminTableHead>Added By</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredEntries.map((entry) => (
                  <AdminTableRow key={entry.id}>
                    <AdminTableCell>
                      <span className="uppercase font-semibold text-[11px] text-[#65737A]">
                        {entry.type}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="font-semibold text-[#142126]">{entry.value}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge variant="danger" size="sm">
                        {entry.reason.replace("_", " ").toUpperCase()}
                      </AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-xs text-[#8A979D]">{entry.createdAt}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-xs text-[#65737A]">{entry.addedBy}</span>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredEntries.map((entry) => (
              <MobileDataCard
                key={entry.id}
                title={entry.value}
                subtitle={`Type: ${entry.type.toUpperCase()}`}
                status={
                  <AdminBadge variant="danger" size="sm">
                    {entry.reason.replace("_", " ").toUpperCase()}
                  </AdminBadge>
                }
                metrics={[
                  {
                    label: "Added Date",
                    value: entry.createdAt,
                  },
                  {
                    label: "Added By",
                    value: entry.addedBy,
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
