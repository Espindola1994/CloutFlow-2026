"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Trash2, 
  ShieldBan, 
  AlertTriangle,
  UserX,
  MailX,
  Globe
} from "lucide-react";
import { BlacklistEntry } from "../types";

interface BlacklistModuleProps {
  entries: BlacklistEntry[];
}

export function BlacklistModule({ entries }: BlacklistModuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || entry.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldBan className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Anti-Fraud Blacklist</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Prevent abusive checkouts, chargebacks and banned profile handles</p>
        </div>

        <button
          type="button"
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Block Identifier
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#12161f] border border-neutral-800/80 rounded-2xl p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search blacklisted handle, email or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 transition-colors"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="username">Usernames</option>
          <option value="email">Emails</option>
          <option value="ip">IP Addresses</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
            <ShieldBan className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-300">Blacklist is currently clean</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Any identifiers added here will be blocked automatically during step verification and checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Blocked Value</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Added Date</th>
                  <th className="pb-3 font-semibold">Added By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3.5 uppercase font-bold text-[11px] text-neutral-400">{entry.type}</td>
                    <td className="py-3.5 font-bold text-white">{entry.value}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 uppercase">
                        {entry.reason.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 text-neutral-500">{entry.createdAt}</td>
                    <td className="py-3.5 text-neutral-400">{entry.addedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
