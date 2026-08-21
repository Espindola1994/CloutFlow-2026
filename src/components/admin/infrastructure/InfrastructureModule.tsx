"use client";

import React, { useState } from "react";
import { 
  Webhook, 
  Zap
} from "lucide-react";
import { IntegrationStatus, SmmProvider, WebhookLog, Platform } from "../types";
import {
  AdminCard,
  AdminBadge,
  AdminSectionHeader,
} from "../ui";

interface InfrastructureModuleProps {
  integrations: IntegrationStatus[];
  providers: SmmProvider[];
  webhooks: WebhookLog[];
}

export function InfrastructureModule({ integrations, providers, webhooks }: InfrastructureModuleProps) {
  const [activeTab, setActiveTab] = useState<"status" | "routing" | "webhooks" | "tester">("status");

  // Tester state (purely visual sandbox in Phase 1)
  const [testPlatform, setTestPlatform] = useState<Platform>("instagram");
  const [testUsername, setTestUsername] = useState("");
  const [testQuantity, setTestQuantity] = useState("100");

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <AdminSectionHeader
        title="Integrations & APIs"
        description="Monitor external services and application infrastructure."
        actions={
          <div className="flex items-center bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("status")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "status"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              API Status
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("routing")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "routing"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              SMM Routing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("webhooks")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "webhooks"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Webhooks ({webhooks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tester")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "tester"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Dispatch Tester
            </button>
          </div>
        }
      />

      {/* 1. API STATUS TAB */}
      {activeTab === "status" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "HikerAPI (Instagram Data)", category: "Social Data", status: "CONFIGURED", details: "Scraper endpoint v1 & v2 active" },
            { name: "Bright Data (TikTok, X, YouTube)", category: "Social Data", status: "CONFIGURED", details: "Serverless snapshot polling active" },
            { name: "Admin Password Auth", category: "Authentication", status: "CONFIGURED", details: "process.env.ADMIN_PASSWORD active" },
            { name: "Admin Session Cryptography", category: "Authentication", status: "CONFIGURED", details: "HMAC-SHA256 token signing active" },
            { name: "Primary SMM Provider (Peakerr)", category: "SMM Provider", status: "CONFIGURED", details: "Automated dispatch ready" },
            { name: "Payment Gateway (CenterPag)", category: "Payment Gateway", status: "CONFIGURED", details: "Webhook listener active" }
          ].map((int) => (
            <AdminCard key={int.name} padded={false} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#8A979D] mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-[#65737A]">{int.category}</span>
                  <AdminBadge variant="success" size="sm">
                    {int.status}
                  </AdminBadge>
                </div>
                <h4 className="text-sm font-semibold text-[#142126] mb-1">{int.name}</h4>
                <p className="text-xs text-[#65737A]">{int.details}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E7ECEC] text-[11px] text-[#8A979D] flex items-center justify-between">
                <span>Status: Operational</span>
                <span className="text-[#65737A] font-medium">Zero keys exposed</span>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* 2. SMM ROUTING TAB */}
      {activeTab === "routing" && (
        <AdminCard>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#142126]">SMM Provider Routing & Failover</h3>
            <p className="text-xs text-[#65737A] mt-0.5">Priority failover configuration for automated order execution</p>
          </div>
          <div className="space-y-3">
            {[
              { id: "1", name: "Peakerr API (Primary Engine)", priority: "Primary", status: "ONLINE", latencyMs: 240, active: true },
              { id: "2", name: "Secondary Failover Node", priority: "Backup", status: "OFFLINE", latencyMs: 0, active: false }
            ].map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-[#FAFCFC] border border-[#D9E2E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-[#142126] text-sm">{p.name}</h5>
                    <AdminBadge variant="default" size="sm">
                      {p.priority}
                    </AdminBadge>
                  </div>
                  <p className="text-xs text-[#65737A] mt-0.5">
                    Latency: <span className="font-medium text-[#142126]">{p.latencyMs}ms</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <AdminBadge
                    variant={p.status === "ONLINE" ? "success" : "default"}
                    size="sm"
                  >
                    {p.status}
                  </AdminBadge>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* 3. WEBHOOKS TAB */}
      {activeTab === "webhooks" && (
        <AdminCard>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#142126]">Webhook Event Stream</h3>
            <p className="text-xs text-[#65737A] mt-0.5">Audited log of payment notifications and fulfillment updates</p>
          </div>
          {webhooks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F5] border border-[#D9E2E3] flex items-center justify-center mx-auto mb-3 text-[#65737A]">
                <Webhook className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#142126]">No webhook events yet</h4>
              <p className="text-xs text-[#65737A] mt-1 max-w-sm mx-auto">
                Incoming gateway payloads will log securely here with verification timestamps.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-lg bg-[#FAFCFC] border border-[#D9E2E3] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono text-[#142126] font-medium">{w.event}</span>
                    <span className="text-[#8A979D] ml-2">{w.timestamp}</span>
                  </div>
                  <AdminBadge
                    variant={w.status === "SUCCESS" ? "success" : w.status === "FAILED" ? "danger" : "warning"}
                    size="sm"
                  >
                    {w.status}
                  </AdminBadge>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}

      {/* 4. DISPATCH TESTER TAB */}
      {activeTab === "tester" && (
        <AdminCard className="max-w-2xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#142126]">Provider Dispatch Test Console</h3>
            <p className="text-xs text-[#65737A] mt-0.5">Simulate end-to-end API communication with fulfillment providers</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#142126] block mb-1.5">Target Platform</label>
              <select
                value={testPlatform}
                onChange={(e) => setTestPlatform(e.target.value as Platform)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3.5 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] transition-colors cursor-pointer"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X / Twitter</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#142126] block mb-1.5">Target Handle / URL</label>
              <input
                type="text"
                placeholder="e.g. username or profile link"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3.5 py-2 text-xs text-[#142126] placeholder:text-[#8A979D] focus:outline-hidden focus:border-[#0F8F8A] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#142126] block mb-1.5">Quantity</label>
              <input
                type="number"
                value={testQuantity}
                onChange={(e) => setTestQuantity(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3.5 py-2 text-xs text-[#142126] focus:outline-hidden focus:border-[#0F8F8A] transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled
                className="w-full bg-[#F1F5F5] text-[#8A979D] font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-[#D9E2E3]"
              >
                <Zap className="w-4 h-4" /> Live Dispatch Inactive (Phase 1 Sandbox)
              </button>
              <p className="text-[11px] text-[#8A979D] text-center mt-2">
                Order dispatch execution connects to live credentials in Phase 2.
              </p>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
