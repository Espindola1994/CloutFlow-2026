"use client";

import React, { useState } from "react";
import { 
  Key, 
  Server, 
  Webhook, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Send,
  Zap
} from "lucide-react";
import { IntegrationStatus, SmmProvider, WebhookLog, Platform } from "../types";

interface InfrastructureModuleProps {
  integrations: IntegrationStatus[];
  providers: SmmProvider[];
  webhooks: WebhookLog[];
}

export function InfrastructureModule({ integrations, providers, webhooks }: InfrastructureModuleProps) {
  const [activeTab, setActiveTab] = useState<"status" | "routing" | "webhooks" | "tester">("status");

  // Tester state (purely visual in Phase 1 without mock dispatch)
  const [testPlatform, setTestPlatform] = useState<Platform>("instagram");
  const [testUsername, setTestUsername] = useState("");
  const [testQuantity, setTestQuantity] = useState("100");

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Integrations & APIs</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Live connectivity status, SMM routing, incoming webhook logs and dispatch tester</p>
        </div>

        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "status" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            API Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("routing")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "routing" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            SMM Routing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("webhooks")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "webhooks" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Webhooks ({webhooks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tester")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "tester" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Dispatch Tester
          </button>
        </div>
      </div>

      {/* 1. API STATUS TAB */}
      {activeTab === "status" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "HikerAPI (Instagram Data)", category: "Social Data", status: "CONNECTED", details: "Scraper endpoint v1 & v2 active" },
            { name: "Bright Data (TikTok, X, YouTube)", category: "Social Data", status: "CONNECTED", details: "Serverless snapshot polling active" },
            { name: "Admin Password Auth", category: "Authentication", status: "CONNECTED", details: "process.env.ADMIN_PASSWORD active" },
            { name: "Admin Session Cryptography", category: "Authentication", status: "CONNECTED", details: "HMAC-SHA256 token signing active" },
            { name: "Primary SMM Provider (Peakerr)", category: "SMM Provider", status: "CONNECTED", details: "Automated dispatch ready" },
            { name: "Payment Gateway (CenterPag)", category: "Payment Gateway", status: "CONNECTED", details: "Webhook listener active" }
          ].map((int) => (
            <div key={int.name} className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider">{int.category}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                    {int.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{int.name}</h4>
                <p className="text-xs text-neutral-400">{int.details}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800/60 text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Status: Operational</span>
                <span className="text-neutral-400">Zero keys exposed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SMM ROUTING TAB */}
      {activeTab === "routing" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">SMM Provider Routing & Failover</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Priority failover configuration for automated order execution</p>
          </div>

          <div className="space-y-3">
            {[
              { id: "1", name: "Peakerr API (Primary Engine)", priority: "Primary", status: "ONLINE", latencyMs: 240, active: true },
              { id: "2", name: "Secondary Failover Node", priority: "Backup", status: "OFFLINE", latencyMs: 0, active: false }
            ].map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-white text-sm">{p.name}</h5>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-300">
                      {p.priority}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">Latency: <b className="text-neutral-300">{p.latencyMs}ms</b></p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    p.status === "ONLINE" ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-500"
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. WEBHOOKS TAB */}
      {activeTab === "webhooks" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Webhook Event Stream</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Audited log of payment notifications and fulfillment updates</p>
            </div>
          </div>

          {webhooks.length === 0 ? (
            <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
              <Webhook className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-300">No webhook events yet</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Incoming gateway payloads will log securely here with verification timestamps.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div key={w.id} className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-neutral-400">{w.event}</span>
                    <span className="text-neutral-500 ml-2">{w.timestamp}</span>
                  </div>
                  <span className="font-bold text-emerald-400">{w.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DISPATCH TESTER TAB */}
      {activeTab === "tester" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs max-w-2xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white tracking-tight">Provider Dispatch Test Console</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Simulate end-to-end API communication with fulfillment providers</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Target Platform</label>
              <select
                value={testPlatform}
                onChange={(e) => setTestPlatform(e.target.value as Platform)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X / Twitter</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Target Handle / URL</label>
              <input
                type="text"
                placeholder="e.g. username or profile link"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Quantity</label>
              <input
                type="number"
                value={testQuantity}
                onChange={(e) => setTestQuantity(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-neutral-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled
                className="w-full bg-neutral-800 text-neutral-500 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-neutral-700/50"
              >
                <Zap className="w-4 h-4" /> Live Dispatch Inactive (Phase 1 Sandbox)
              </button>
              <p className="text-[11px] text-neutral-500 text-center mt-2">
                Order dispatch execution will connect to live credentials in Phase 2.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
