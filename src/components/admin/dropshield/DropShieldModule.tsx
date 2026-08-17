"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  Clock, 
  CheckCircle2, 
  Activity,
  Sliders,
  Play
} from "lucide-react";
import { MonitoredProfile, Platform } from "../types";

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
      {/* Header & Global Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Drop Shield 24/7</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Automated follower retention monitoring and autonomous refill daemon</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Autonomous Engine: <b>Active</b></span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Monitored Profiles</span>
          <div className="text-2xl font-bold text-white">{monitoredProfiles.length}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Active customer waranties</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Protected (Stable)</span>
          <div className="text-2xl font-bold text-emerald-400">{protectedCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Counts above delivery threshold</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Auto Refilled</span>
          <div className="text-2xl font-bold text-blue-400">{refilledCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Compensated by provider</p>
        </div>

        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Requires Attention</span>
          <div className="text-2xl font-bold text-amber-400">{attentionCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">High drop detected</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#12161f] border border-neutral-800/80 rounded-2xl p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by profile handle @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
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
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="PROTECTED">Protected</option>
            <option value="REFILLED">Refilled</option>
            <option value="ATTENTION">Attention</option>
          </select>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
        {filteredProfiles.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
            <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-300">No monitored profiles yet</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Profiles with active Drop Shield warranty will be continuously audited every 6 hours.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="pb-3 font-semibold">Target Profile</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold">Initial Count</th>
                  <th className="pb-3 font-semibold">Current Count</th>
                  <th className="pb-3 font-semibold">Delivered</th>
                  <th className="pb-3 font-semibold">Detected Drop</th>
                  <th className="pb-3 font-semibold">Auto Refill</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3.5 font-bold text-white">@{p.username}</td>
                    <td className="py-3.5 capitalize">{p.platform}</td>
                    <td className="py-3.5">{p.startCount.toLocaleString()}</td>
                    <td className="py-3.5">{p.currentCount.toLocaleString()}</td>
                    <td className="py-3.5 text-emerald-400">+{p.deliveredQty.toLocaleString()}</td>
                    <td className="py-3.5 text-red-400">-{p.dropQty.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.autoRefillEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-400"
                      }`}>
                        {p.autoRefillEnabled ? "ENABLED" : "OFF"}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "PROTECTED" ? "bg-emerald-500/10 text-emerald-400" :
                        p.status === "REFILLED" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-neutral-500">{p.lastCheck}</td>
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
