"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAutoRefresh } from "@/hooks/useAdminAutoRefresh";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Loader2,
  Sliders,
  FileCheck2,
  Terminal,
  Send,
  RefreshCw,
  Server,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PeakerrStatusSyncCard, StatusSyncMetrics } from "./PeakerrStatusSyncCard";
import { PeakerrAutoDispatchCard } from "./PeakerrAutoDispatchCard";
import { Platform } from "../types";
import {
  AdminBadge,
  AdminButton,
  AdminModal,
  PlatformIcon,
  MobileDataCard,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
} from "../ui";

interface ChainConfig {
  platform: Platform;
  service: string;
  variant: string;
  name: string;
  primaryServiceId: string;
  fallback1Id: string;
  fallback2Id: string;
  autoFallback: boolean;
}

const DEFAULT_CHAINS: Record<string, ChainConfig> = {
  "instagram:followers": {
    platform: "instagram",
    service: "followers",
    variant: "standard",
    name: "Instagram Followers (Standard)",
    primaryServiceId: "31714",
    fallback1Id: "31849",
    fallback2Id: "31850",
    autoFallback: true,
  },
  "instagram:likes": {
    platform: "instagram",
    service: "likes",
    variant: "standard",
    name: "Instagram Likes (Standard)",
    primaryServiceId: "31783",
    fallback1Id: "31784",
    fallback2Id: "31785",
    autoFallback: true,
  },
  "instagram:views": {
    platform: "instagram",
    service: "views",
    variant: "standard",
    name: "Instagram Views (Standard)",
    primaryServiceId: "26641",
    fallback1Id: "16453",
    fallback2Id: "14863",
    autoFallback: true,
  },
  "tiktok:followers": {
    platform: "tiktok",
    service: "followers",
    variant: "standard",
    name: "TikTok Followers (Standard)",
    primaryServiceId: "30159",
    fallback1Id: "32771",
    fallback2Id: "33105",
    autoFallback: true,
  },
  "tiktok:likes": {
    platform: "tiktok",
    service: "likes",
    variant: "standard",
    name: "TikTok Likes (Standard)",
    primaryServiceId: "31040",
    fallback1Id: "30163",
    fallback2Id: "31264",
    autoFallback: true,
  },
  "tiktok:views": {
    platform: "tiktok",
    service: "views",
    variant: "standard",
    name: "TikTok Views (Standard)",
    primaryServiceId: "32011",
    fallback1Id: "29890",
    fallback2Id: "31761",
    autoFallback: true,
  },
  "twitter:followers": {
    platform: "twitter",
    service: "followers",
    variant: "standard",
    name: "X Followers (Standard)",
    primaryServiceId: "33882",
    fallback1Id: "33608",
    fallback2Id: "33883",
    autoFallback: true,
  },
  "twitter:likes": {
    platform: "twitter",
    service: "likes",
    variant: "standard",
    name: "X Likes (Standard)",
    primaryServiceId: "33478",
    fallback1Id: "33696",
    fallback2Id: "",
    autoFallback: true,
  },
  "twitter:views": {
    platform: "twitter",
    service: "views",
    variant: "standard",
    name: "X Views (Standard)",
    primaryServiceId: "29863",
    fallback1Id: "29859",
    fallback2Id: "9276",
    autoFallback: true,
  },
  "youtube:likes": {
    platform: "youtube",
    service: "likes",
    variant: "standard",
    name: "YouTube Likes (Standard)",
    primaryServiceId: "33471",
    fallback1Id: "33528",
    fallback2Id: "33529",
    autoFallback: true,
  },
  "youtube:views": {
    platform: "youtube",
    service: "views",
    variant: "standard",
    name: "YouTube Views (Standard)",
    primaryServiceId: "33451",
    fallback1Id: "30202",
    fallback2Id: "30751",
    autoFallback: true,
  },
};

export function PeakerrChainsModule() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [chains, setChains] = useState<Record<string, ChainConfig>>(DEFAULT_CHAINS);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Chain Modal State
  const [editingService, setEditingService] = useState<string | null>(null);

  // Peakerr Connection & Runtime Inspection State
  const [connectionInfo, setConnectionInfo] = useState<{
    connected: boolean;
    balance: string | number | null;
    currency: string;
    servicesCount: number;
    lastCheckedAt: string | null;
    error?: string | null;
  } | null>(null);
  const [runtimeFlags, setRuntimeFlags] = useState<{
    apiKeyPresent: boolean;
    liveFulfillment: boolean;
    webhookVerified: boolean;
    targetQueueAutoReleaseEnabled?: boolean;
  }>({
    apiKeyPresent: false,
    liveFulfillment: false,
    webhookVerified: false,
    targetQueueAutoReleaseEnabled: false,
  });
  const [inspectLoading, setInspectLoading] = useState(false);

  // Simulator accordion toggle (collapsed by default)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Simulation Mode state: "manual" | "existing"
  const [simulatorMode, setSimulatorMode] = useState<"manual" | "existing">("manual");

  // Existing Order Dry Run State
  const [dryRunOrderId, setDryRunOrderId] = useState("");
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);

  // Live Order Manual Submission State & Confirmation Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isSubmittingLive, setIsSubmittingLive] = useState(false);
  const [submitLiveResult, setSubmitLiveResult] = useState<any>(null);

  // Live Status Check State
  const [statusCheckResult, setStatusCheckResult] = useState<any>(null);
  const [statusCheckLoading, setStatusCheckLoading] = useState(false);

  // Automatic Status Sync Area State
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [autoSyncResult, setAutoSyncResult] = useState<StatusSyncMetrics | null>(null);

  // Manual Simulation State
  const [manualPlatform, setManualPlatform] = useState<Platform>("instagram");
  const [manualService, setManualService] = useState<string>("followers");
  const [manualVariant] = useState<string>("standard");
  const [manualQuantity, setManualQuantity] = useState<string>("2000");
  const [manualTarget, setManualTarget] = useState<string>("https://instagram.com/anaclaramaderite");
  const [manualResult, setManualResult] = useState<any>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const services = ["followers", "likes", "views", "comments"];

  const fetchPeakerrInspection = useCallback(async () => {
    try {
      setInspectLoading(true);
      const res = await fetch("/api/admin/fulfillment/peakerr/inspect", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setConnectionInfo(json.connection);
        setRuntimeFlags(json.runtime || { apiKeyPresent: true, liveFulfillment: false, webhookVerified: false });
      } else {
        setConnectionInfo({
          connected: false,
          balance: null,
          currency: "USD",
          servicesCount: 0,
          lastCheckedAt: new Date().toISOString(),
          error: json.error?.message || "Failed to inspect Peakerr connection.",
        });
      }
    } catch {
      setConnectionInfo({
        connected: false,
        balance: null,
        currency: "USD",
        servicesCount: 0,
        lastCheckedAt: new Date().toISOString(),
        error: "Network error inspecting Peakerr.",
      });
    } finally {
      setInspectLoading(false);
    }
  }, []);

  const fetchAutoSyncState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fulfillment/peakerr/sync");
      const json = await res.json();
      if (res.ok && json.success) {
        setAutoSyncEnabled(json.enabled);
        if (json.targetQueueAutoReleaseEnabled !== undefined) {
          setRuntimeFlags((prev) => ({
            ...prev,
            targetQueueAutoReleaseEnabled: json.targetQueueAutoReleaseEnabled,
          }));
        }
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    fetchPeakerrInspection();
    fetchAutoSyncState();
  }, [fetchPeakerrInspection, fetchAutoSyncState]);

  // Realtime & Auto-refresh for chains and peakerr inspection
  useAdminAutoRefresh({
    entities: ["chains", "fulfillment"],
    supabaseTables: ["fulfillment_chains", "fulfillment_chain_services"],
    pollInterval: 30000, // 30s background provider sync
    onRevalidate: () => {
      fetchPeakerrInspection();
      loadChainsFromDb();
    },
  });

  // Fetch real persistent chains from Supabase database
  const loadChainsFromDb = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fulfillment/chains");
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data?.items)) {
        const dbItems = json.data.items;
        if (dbItems.length > 0) {
          setChains((prev) => {
            const next = { ...prev };
            dbItems.forEach((c: any) => {
              const key = `${c.platform}:${c.service}`;
              const srvs = Array.isArray(c.services) ? c.services : [];
              const primary = srvs.find((s: any) => s.priority === 1)?.providerServiceId || "";
              const fb1 = srvs.find((s: any) => s.priority === 2)?.providerServiceId || "";
              const fb2 = srvs.find((s: any) => s.priority === 3)?.providerServiceId || "";

              next[key] = {
                platform: c.platform,
                service: c.service,
                variant: c.variant || "standard",
                name: c.name || `${c.platform.toUpperCase()} ${c.service.toUpperCase()}`,
                primaryServiceId: primary,
                fallback1Id: fb1,
                fallback2Id: fb2,
                autoFallback: c.autoFallback ?? true,
              };
            });
            return next;
          });
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    loadChainsFromDb();
  }, [loadChainsFromDb]);

  const handleUpdate = (service: string, field: keyof ChainConfig, value: any) => {
    const key = `${selectedPlatform}:${service}`;
    setChains((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSave = async (service: string) => {
    const key = `${selectedPlatform}:${service}`;
    const chain = chains[key];
    if (!chain) return;

    setSavingKey(key);
    setSavedStatus(null);
    setErrorMessage(null);

    const serviceList = [];
    if (chain.primaryServiceId.trim()) {
      serviceList.push({
        provider: "peakerr",
        providerServiceId: chain.primaryServiceId.trim(),
        priority: 1,
        minQuantity: 10,
        maxQuantity: 1000000,
        active: true,
      });
    }

    if (chain.fallback1Id.trim()) {
      serviceList.push({
        provider: "peakerr",
        providerServiceId: chain.fallback1Id.trim(),
        priority: 2,
        minQuantity: 10,
        maxQuantity: 1000000,
        active: true,
      });
    }

    if (chain.fallback2Id.trim()) {
      serviceList.push({
        provider: "peakerr",
        providerServiceId: chain.fallback2Id.trim(),
        priority: 3,
        minQuantity: 10,
        maxQuantity: 1000000,
        active: true,
      });
    }

    if (serviceList.length === 0) {
      setErrorMessage("Primary Peakerr Service ID is required to save a fulfillment chain.");
      setSavingKey(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/fulfillment/chains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: chain.platform,
          service: chain.service,
          variant: chain.variant || "standard",
          name: chain.name,
          active: true,
          autoFallback: chain.autoFallback,
          services: serviceList,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSavedStatus(`Chain for ${chain.name} persisted successfully in Supabase.`);
        await loadChainsFromDb();
        setEditingService(null);
        setTimeout(() => setSavedStatus(null), 4000);
      } else {
        setErrorMessage(json.error?.message || "Failed to persist chain to database.");
      }
    } catch {
      setErrorMessage("Network error connecting to fulfillment chains API.");
    } finally {
      setSavingKey(null);
    }
  };

  // Existing Order Dry Run Execution
  const handleDryRunExistingOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dryRunOrderId.trim()) return;

    setDryRunLoading(true);
    setDryRunResult(null);
    setSubmitLiveResult(null);
    setStatusCheckResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${dryRunOrderId.trim()}/fulfillment-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: "standard" }),
      });
      const data = await res.json();
      setDryRunResult(data);
    } catch {
      setDryRunResult({ success: false, error: { message: "Failed to connect to dry run endpoint." } });
    } finally {
      setDryRunLoading(false);
    }
  };

  // Manual Simulation Execution
  const handleManualSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTarget.trim() || !manualQuantity) return;

    setManualLoading(true);
    setManualResult(null);

    try {
      const res = await fetch("/api/admin/fulfillment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: manualPlatform,
          service: manualService,
          variant: manualVariant,
          quantity: parseInt(manualQuantity, 10),
          target: manualTarget.trim(),
        }),
      });
      const data = await res.json();
      setManualResult(data);
    } catch {
      setManualResult({
        success: false,
        error: { message: "Failed to connect to fulfillment simulator API." },
      });
    } finally {
      setManualLoading(false);
    }
  };

  // Live Manual Submit Order (Requires Flag + Confirmation 'SUBMIT')
  const handleConfirmLiveSubmit = async () => {
    if (confirmInput.trim() !== "SUBMIT" || !dryRunOrderId.trim()) return;

    setIsSubmittingLive(true);
    setSubmitLiveResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${dryRunOrderId.trim()}/fulfillment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "SUBMIT" }),
      });
      const data = await res.json();
      setSubmitLiveResult(data);
      setIsSubmitModalOpen(false);
      setConfirmInput("");
    } catch {
      setSubmitLiveResult({
        success: false,
        error: { message: "Network error during live submission." },
      });
    } finally {
      setIsSubmittingLive(false);
    }
  };

  // Manual Live Status Check
  const handleCheckLiveStatus = async () => {
    if (!dryRunOrderId.trim()) return;

    setStatusCheckLoading(true);
    setStatusCheckResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${dryRunOrderId.trim()}/fulfillment/status`);
      const data = await res.json();
      setStatusCheckResult(data);

      if (data.success) {
        fetch(`/api/admin/orders/${dryRunOrderId.trim()}/fulfillment-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variant: "standard" }),
        })
          .then((res) => res.json())
          .then((refetchData) => {
            if (refetchData.success) {
              setDryRunResult(refetchData);
            }
          })
          .catch(console.error);
      }
    } catch {
      setStatusCheckResult({
        success: false,
        error: { message: "Failed to check order status." },
      });
    } finally {
      setStatusCheckLoading(false);
    }
  };

  // Manual Trigger for Central Status Sync
  const handleRunStatusSyncNow = async () => {
    setAutoSyncLoading(true);
    try {
      const res = await fetch("/api/admin/fulfillment/peakerr/sync", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setAutoSyncResult({
          ...json.data,
          lastRun: new Date().toLocaleTimeString(),
        });
        setAutoSyncEnabled(json.enabled);

        if (dryRunOrderId.trim()) {
          fetch(`/api/admin/orders/${dryRunOrderId.trim()}/fulfillment-preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variant: "standard" }),
          })
            .then((r) => r.json())
            .then((refetchData) => {
              if (refetchData.success) {
                setDryRunResult(refetchData);
              }
            })
            .catch(console.error);
        }
      } else {
        setErrorMessage(json.error?.message || "Failed to execute status sync.");
      }
    } catch {
      setErrorMessage("Network error executing status sync.");
    } finally {
      setAutoSyncLoading(false);
    }
  };

  return (
    <div className="space-y-[22px] md:space-y-[24px]">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[68px]">
        <div>
          <h2 className="text-[26px] font-[650] text-[#142126] tracking-tight leading-[32px]">
            Fulfillment & Providers
          </h2>
          <p className="text-[13px] text-[#65737A] mt-[5px]">
            Manage provider routing, delivery automation and fulfillment health.
          </p>
        </div>

        {/* Platform Controls (48px x 48px, gap 8px, white bg, border, radius 8px) */}
        <div className="flex items-center gap-[8px] shrink-0">
          {(["instagram", "tiktok", "twitter", "youtube"] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlatform(p)}
              className={`w-[48px] h-[48px] rounded-[8px] border flex items-center justify-center transition-colors cursor-pointer ${
                selectedPlatform === p
                  ? "border-[#0F8F8A] bg-[#FFFFFF] text-[#0F8F8A] shadow-[0_1px_4px_rgba(15,143,138,0.2)] ring-1 ring-[#0F8F8A]"
                  : "bg-[#FFFFFF] border-[#D9E2E3] text-[#65737A] hover:border-[#CBD6D8] hover:bg-[#F8FAFA]"
              }`}
            >
              <PlatformIcon platform={p === "twitter" ? "x" : p} size={22} showBackground={false} />
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROVIDER STATUS — MASTER STRIP (Single large horizontal card, height ~82px–92px, border #D9E2E3, radius 8px–10px) */}
      <div className="min-h-[84px] bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(10,35,42,0.02)]">
        <div className="flex flex-wrap items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E7ECEC]">
          {/* Item 1: Provider Name & Routing */}
          <div className="flex items-center gap-3 pr-4">
            <div className="w-[34px] h-[34px] rounded-[7px] bg-[#E7F5F4] text-[#0F8F8A] flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#65737A] block">
                PEAKERR PROVIDER
              </span>
              <span className="text-[14px] font-[650] text-[#142126] leading-tight block mt-0.5">
                Provider Routing
              </span>
            </div>
          </div>

          {/* Item 2: Connection */}
          <div className="pt-3 md:pt-0 md:pl-6 min-h-[36px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              CONNECTION
            </span>
            <span
              className={`text-[14px] font-semibold mt-0.5 flex items-center gap-1.5 ${
                connectionInfo?.connected ? "text-[#16B77A]" : "text-[#EF4444]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connectionInfo?.connected ? "bg-[#16B77A]" : "bg-[#EF4444]"}`} />
              <span>{inspectLoading ? "Connecting..." : connectionInfo?.connected ? "Connected" : "Disconnected"}</span>
            </span>
          </div>

          {/* Item 3: Live Fulfillment */}
          <div className="pt-3 md:pt-0 md:pl-6 min-h-[36px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              LIVE FULFILLMENT
            </span>
            <span
              className={`text-[14px] font-semibold mt-0.5 flex items-center gap-1.5 ${
                runtimeFlags.liveFulfillment ? "text-[#16B77A]" : "text-[#F59E0B]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${runtimeFlags.liveFulfillment ? "bg-[#16B77A]" : "bg-[#F59E0B]"}`} />
              <span>{runtimeFlags.liveFulfillment ? "Active" : "Inactive"}</span>
            </span>
          </div>

          {/* Item 4: Balance */}
          <div className="pt-3 md:pt-0 md:pl-6 min-h-[36px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              BALANCE
            </span>
            <span className="text-[17px] font-[650] font-mono text-[#142126] mt-0.5">
              {connectionInfo?.balance !== null && connectionInfo?.balance !== undefined
                ? `$${Number(connectionInfo.balance).toFixed(2)}`
                : "—"}
            </span>
          </div>

          {/* Item 5: Services Loaded */}
          <div className="pt-3 md:pt-0 md:pl-6 min-h-[36px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] block">
              SERVICES
            </span>
            <span className="text-[17px] font-[650] font-mono text-[#142126] mt-0.5">
              {connectionInfo?.servicesCount ? Number(connectionInfo.servicesCount).toLocaleString() : "0"}
            </span>
          </div>
        </div>

        {/* Refresh Button on the right (Height 34px-36px) */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={fetchPeakerrInspection}
            disabled={inspectLoading}
            className="h-[34px] inline-flex items-center gap-2 px-3.5 text-[12px] font-semibold text-[#142126] bg-[#FFFFFF] border border-[#D9E2E3] rounded-[7px] hover:bg-[#F8FAFA] transition-colors cursor-pointer disabled:opacity-50 shadow-[0_1px_2px_rgba(10,35,42,0.02)]"
          >
            {inspectLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 text-[#0F8F8A]" />
            )}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. AUTOMATIC STATUS SYNC */}
      <PeakerrStatusSyncCard
        enabled={autoSyncEnabled}
        loading={autoSyncLoading}
        metrics={autoSyncResult}
        onRunSync={handleRunStatusSyncNow}
        error={errorMessage}
        targetQueueAutoReleaseEnabled={runtimeFlags.targetQueueAutoReleaseEnabled}
      />

      {/* 4. MAIN GRID (FULFILLMENT OVERVIEW + AUTO DISPATCH) */}
      <PeakerrAutoDispatchCard />

      {savedStatus && (
        <div className="p-3 rounded-[6px] bg-[#E8F8F2] border border-[#B6ECD7] text-[#16B77A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-[6px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5. PROVIDER CHAINS & FALLBACKS + SIMULATOR SIDE CARD (75% / 25% on desktop large) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[16px] items-start">
        {/* PROVIDER CHAINS CARD (lg:col-span-8 or lg:col-span-9, approx 72%-75%) */}
        <div className={`${isSimulatorOpen ? "lg:col-span-12" : "lg:col-span-9"} bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] shadow-[0_1px_2px_rgba(10,35,42,0.02)] overflow-hidden transition-all`}>
          <div className="h-[58px] px-[20px] flex items-center border-b border-[#E7ECEC]">
            <div className="flex items-center gap-2.5">
              <div className="w-[32px] h-[32px] rounded-[7px] bg-[#E7F5F4] text-[#0F8F8A] flex items-center justify-center shrink-0">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-[650] uppercase tracking-wider text-[#142126]">
                  PROVIDER CHAINS & FALLBACKS
                </h3>
                <p className="text-[12px] text-[#65737A]">
                  Configure multi-tier fallback chains per platform and service.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow className="bg-[#F8FAFA] h-[40px] border-b border-[#E7ECEC]">
                  <AdminTableHead className="text-[11px] font-semibold text-[#65737A] uppercase py-2">
                    Platform
                  </AdminTableHead>
                  <AdminTableHead className="text-[11px] font-semibold text-[#65737A] uppercase py-2">
                    Service
                  </AdminTableHead>
                  <AdminTableHead className="text-[11px] font-semibold text-[#65737A] uppercase py-2">
                    Chain Order
                  </AdminTableHead>
                  <AdminTableHead className="text-[11px] font-semibold text-[#65737A] uppercase py-2">
                    Providers
                  </AdminTableHead>
                  <AdminTableHead className="text-[11px] font-semibold text-[#65737A] uppercase py-2">
                    Status
                  </AdminTableHead>
                  <AdminTableHead className="text-[11px] font-semibold text-[#65737A] uppercase py-2 text-right">
                    Actions
                  </AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {services.map((svc) => {
                  const key = `${selectedPlatform}:${svc}`;
                  const chain = chains[key] || {
                    platform: selectedPlatform,
                    service: svc,
                    variant: "standard",
                    name: `${selectedPlatform.toUpperCase()} ${svc.toUpperCase()}`,
                    primaryServiceId: "",
                    fallback1Id: "",
                    fallback2Id: "",
                    autoFallback: true,
                  };

                  return (
                    <AdminTableRow key={svc} className="h-[46px] border-b border-[#EAEFEF]">
                      <AdminTableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <PlatformIcon
                            platform={selectedPlatform === "twitter" ? "x" : selectedPlatform}
                            size={18}
                            showBackground={false}
                          />
                          <span className="capitalize font-[600] text-[#142126] text-[13px]">
                            {selectedPlatform === "twitter" ? "X" : selectedPlatform}
                          </span>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell className="py-2.5">
                        <span className="capitalize font-[600] text-[#142126] text-[13px]">{svc}</span>
                      </AdminTableCell>

                      <AdminTableCell className="py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#142126]">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0F8F8A] text-white text-[11px] font-bold">
                              1
                            </span>
                            <span className="text-[#8A979D] text-[11px]">───</span>
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${chain.fallback1Id ? "bg-[#D9E2E3] text-[#142126]" : "bg-[#F1F5F5] text-[#8A979D]"}`}>
                              2
                            </span>
                            <span className="text-[#8A979D] text-[11px]">───</span>
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${chain.fallback2Id ? "bg-[#D9E2E3] text-[#142126]" : "bg-[#F1F5F5] text-[#8A979D]"}`}>
                              3
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#65737A]">
                            <span className="text-[#0F8F8A] font-semibold">{chain.primaryServiceId || "—"}</span>
                            {chain.fallback1Id && <span>/ {chain.fallback1Id}</span>}
                            {chain.fallback2Id && <span>/ {chain.fallback2Id}</span>}
                          </div>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell className="py-2.5">
                        <div className="flex items-center gap-1.5 text-[12px] text-[#65737A]">
                          <Server className="w-3.5 h-3.5 text-[#0F8F8A]" />
                          <span>Peakerr</span>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell className="py-2.5">
                        <AdminBadge variant={chain.autoFallback ? "success" : "warning"} size="sm">
                          {chain.autoFallback ? "Auto Fallback" : "Single Tier"}
                        </AdminBadge>
                      </AdminTableCell>

                      <AdminTableCell className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingService(svc)}
                          className="h-[30px] inline-flex items-center gap-1.5 px-2.5 text-[12px] font-semibold text-[#142126] bg-[#FFFFFF] border border-[#D9E2E3] rounded-[6px] hover:bg-[#F8FAFA] transition-colors cursor-pointer shadow-[0_1px_2px_rgba(10,35,42,0.02)]"
                        >
                          <Settings2 className="w-[13px] h-[13px] text-[#0F8F8A]" />
                          <span>Configure</span>
                        </button>
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })}
              </AdminTableBody>
            </AdminTable>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden p-4 space-y-3">
            {services.map((svc) => {
              const key = `${selectedPlatform}:${svc}`;
              const chain = chains[key] || {
                platform: selectedPlatform,
                service: svc,
                variant: "standard",
                name: `${selectedPlatform.toUpperCase()} ${svc.toUpperCase()}`,
                primaryServiceId: "",
                fallback1Id: "",
                fallback2Id: "",
                autoFallback: true,
              };

              return (
                <MobileDataCard
                  key={svc}
                  title={
                    <div className="flex items-center gap-2">
                      <PlatformIcon
                        platform={selectedPlatform === "twitter" ? "x" : selectedPlatform}
                        size={18}
                        showBackground={false}
                      />
                      <span className="capitalize font-bold text-[#142126] text-[13px]">
                        {selectedPlatform} {svc}
                      </span>
                    </div>
                  }
                  status={
                    <AdminBadge variant={chain.autoFallback ? "success" : "warning"} size="sm">
                      {chain.autoFallback ? "Auto Fallback" : "Single"}
                    </AdminBadge>
                  }
                  metrics={[
                    {
                      label: "Primary",
                      value: <span className="font-mono font-bold text-[#0F8F8A]">{chain.primaryServiceId || "—"}</span>,
                    },
                    {
                      label: "Fallback 1",
                      value: <span className="font-mono text-[#65737A]">{chain.fallback1Id || "—"}</span>,
                    },
                    {
                      label: "Fallback 2",
                      value: <span className="font-mono text-[#65737A]">{chain.fallback2Id || "—"}</span>,
                    },
                  ]}
                  actions={
                    <button
                      type="button"
                      onClick={() => setEditingService(svc)}
                      className="w-full h-[34px] text-[13px] font-semibold text-[#142126] bg-[#FFFFFF] border border-[#D9E2E3] rounded-[7px] hover:bg-[#F8FAFA] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-[#0F8F8A]" />
                      <span>Configure</span>
                    </button>
                  }
                />
              );
            })}
          </div>
        </div>

        {/* 6. SIMULATOR SIDE CARD (lg:col-span-3, approx 25%-28% when closed, expandable) */}
        <div className={`${isSimulatorOpen ? "lg:col-span-12" : "lg:col-span-3"} bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] shadow-[0_1px_2px_rgba(10,35,42,0.02)] overflow-hidden transition-all`}>
          <div className="p-4 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-[30px] h-[30px] rounded-[6px] bg-[#E7F5F4] text-[#0F8F8A] flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-[13px] font-[650] text-[#142126] tracking-tight">
                  Simulator & Dry Run
                </h3>
              </div>
              <p className="text-[11px] text-[#65737A] mt-2 leading-relaxed">
                Safely test provider routing without submitting a real order.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
                className="h-[32px] px-3 inline-flex items-center gap-1.5 rounded-[6px] border border-[#D9E2E3] bg-[#FFFFFF] hover:bg-[#F8FAFA] text-[12px] font-semibold text-[#142126] transition-colors cursor-pointer shadow-[0_1px_2px_rgba(10,35,42,0.02)]"
              >
                <span>{isSimulatorOpen ? "Collapse ↑" : "Expand ↓"}</span>
                {isSimulatorOpen ? <ChevronUp className="w-3 h-3 text-[#0F8F8A]" /> : <ChevronDown className="w-3 h-3 text-[#0F8F8A]" />}
              </button>
            </div>
          </div>

          {isSimulatorOpen && (
            <div className="p-5 border-t border-[#E7ECEC] space-y-4 bg-[#F8FAFA]/50">
              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2 pb-2 border-b border-[#EDF1F2]">
                <button
                  type="button"
                  onClick={() => setSimulatorMode("manual")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    simulatorMode === "manual"
                      ? "bg-[#0F8F8A] text-white"
                      : "bg-[#FFFFFF] border border-[#D9E2E3] text-[#65737A] hover:text-[#142126]"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Manual Simulation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatorMode("existing")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    simulatorMode === "existing"
                      ? "bg-[#0F8F8A] text-white"
                      : "bg-[#FFFFFF] border border-[#D9E2E3] text-[#65737A] hover:text-[#142126]"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Existing Order</span>
                </button>
              </div>

              {/* Mode A: Manual Simulation */}
              {simulatorMode === "manual" && (
                <form onSubmit={handleManualSimulation} className="space-y-3 text-xs bg-white p-4 rounded-[8px] border border-[#D9E2E3]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[#142126] font-semibold block mb-1">Platform</label>
                      <select
                        value={manualPlatform}
                        onChange={(e) => {
                          const p = e.target.value as Platform;
                          setManualPlatform(p);
                          if (manualService === "followers") {
                            setManualTarget(`https://${p === "twitter" ? "x.com" : `${p}.com`}/anaclaramaderite`);
                          }
                        }}
                        className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-medium focus:outline-none focus:border-[#0F8F8A]"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="twitter">X / Twitter</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#142126] font-semibold block mb-1">Service</label>
                      <select
                        value={manualService}
                        onChange={(e) => {
                          const s = e.target.value;
                          setManualService(s);
                          if (s === "followers") {
                            setManualTarget(`https://${manualPlatform === "twitter" ? "x.com" : `${manualPlatform}.com`}/anaclaramaderite`);
                          } else if (s === "likes" || s === "views" || s === "comments") {
                            setManualTarget(
                              manualPlatform === "instagram"
                                ? "https://instagram.com/p/DFzL123456"
                                : manualPlatform === "tiktok"
                                ? "https://tiktok.com/@user/video/7182938492"
                                : manualPlatform === "youtube"
                                ? "https://youtube.com/watch?v=dQw4w9WgXcQ"
                                : "https://x.com/user/status/17892348923"
                            );
                          }
                        }}
                        className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-medium focus:outline-none focus:border-[#0F8F8A] capitalize"
                      >
                        <option value="followers">Followers</option>
                        <option value="likes">Likes</option>
                        <option value="views">Views</option>
                        <option value="comments">Comments</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#142126] font-semibold block mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. 2000"
                        value={manualQuantity}
                        onChange={(e) => setManualQuantity(e.target.value)}
                        className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-mono focus:outline-none focus:border-[#0F8F8A]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#142126] font-semibold block mb-1">Target URL / Identifier</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/..."
                      value={manualTarget}
                      onChange={(e) => setManualTarget(e.target.value)}
                      className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      disabled={manualLoading}
                      className="px-3 py-2 rounded-[6px] bg-[#0F8F8A] hover:bg-[#0B7A76] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {manualLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>Run Dry Run</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Mode B: Existing Order */}
              {simulatorMode === "existing" && (
                <form onSubmit={handleDryRunExistingOrder} className="space-y-3 text-xs bg-white p-4 rounded-[8px] border border-[#D9E2E3]">
                  <div>
                    <label className="text-[#142126] font-semibold block mb-1">Order UUID or Public ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 5ac16615-57f1-4b41-ae69-426a14c6c68d"
                        value={dryRunOrderId}
                        onChange={(e) => setDryRunOrderId(e.target.value)}
                        className="flex-1 bg-white border border-[#D1D9DC] rounded-[6px] px-3 py-2 text-xs text-[#142126] font-mono focus:outline-none focus:border-[#0F8F8A]"
                      />
                      <button
                        type="submit"
                        disabled={dryRunLoading}
                        className="px-3 py-2 rounded-[6px] bg-[#0F8F8A] hover:bg-[#0B7A76] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {dryRunLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Preview Order</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Simulation Results Display */}
              {(() => {
                const activeResult = simulatorMode === "manual" ? manualResult : dryRunResult;
                if (!activeResult) return null;

                if (!activeResult.success) {
                  return (
                    <div className="p-3 rounded-[6px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-xs">
                      <strong>SIMULATION ERROR:</strong> {activeResult.error?.message || "Failed to resolve chain."}
                    </div>
                  );
                }

                const data = activeResult.data || activeResult;

                return (
                  <div className="p-3.5 rounded-[8px] bg-white border border-[#D9E2E3] space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E3E8EA]">
                      <span className="font-mono font-bold text-[#142126]">
                        {data.platform?.toUpperCase()} / {data.service?.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[#65737A] font-mono">
                        {data.alreadyDispatched ? "ALREADY DISPATCHED" : "SIMULATION ONLY"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded-[6px] bg-[#FAFCFC] border border-[#E3E8EA]">
                        <span className="text-[9px] text-[#65737A] block">Quantity</span>
                        <strong className="text-[#142126] font-mono">{data.quantity}</strong>
                      </div>
                      <div className="p-2 rounded-[6px] bg-[#FAFCFC] border border-[#E3E8EA]">
                        <span className="text-[9px] text-[#65737A] block">Primary Service ID</span>
                        <strong className="text-[#0F8F8A] font-mono">{data.primaryServiceId || data.serviceId}</strong>
                      </div>
                      <div className="p-2 rounded-[6px] bg-[#FAFCFC] border border-[#E3E8EA] col-span-2">
                        <span className="text-[9px] text-[#65737A] block">Target</span>
                        <strong className="text-[#142126] font-mono truncate block" title={data.target}>
                          {data.target}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#65737A] flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-[#0F8F8A]" />
                        <span>Simulated Payload</span>
                      </span>
                      <pre className="p-2.5 rounded-[6px] bg-[#FAFCFC] border border-[#E3E8EA] text-[#0F8F8A] font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(
                          data.peakerrRequestPayload || {
                            provider: "peakerr",
                            service: data.primaryServiceId || data.serviceId,
                            link: data.target,
                            quantity: data.quantity,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>

                    {simulatorMode === "existing" && (
                      <div className="pt-2 flex items-center justify-between border-t border-[#EDF1F2]">
                        <button
                          type="button"
                          onClick={handleCheckLiveStatus}
                          disabled={statusCheckLoading}
                          className="px-2.5 py-1.5 text-xs font-semibold text-[#142126] bg-white border border-[#E3E8EA] rounded-[6px] hover:bg-[#F7F9FA] transition-colors cursor-pointer"
                        >
                          {statusCheckLoading ? "Checking..." : "Check Status"}
                        </button>

                        {data.alreadyDispatched ? (
                          <span className="text-[#16B77A] font-semibold text-xs">
                            Dispatched #{data.latestFulfillment?.externalOrderId}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsSubmitModalOpen(true)}
                            className="px-3 py-1.5 rounded-[6px] bg-[#EF4444] text-white text-xs font-semibold hover:bg-[#DC2626] transition-colors cursor-pointer"
                          >
                            Submit to Peakerr
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EDIT CHAIN CONFIGURATION */}
      <AdminModal
        open={Boolean(editingService)}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
        title={`Configure Chain: ${selectedPlatform.toUpperCase()} ${editingService?.toUpperCase()}`}
        description="Set up primary Peakerr service and optional multi-tier fallback services."
      >
        {editingService && (() => {
          const key = `${selectedPlatform}:${editingService}`;
          const chain = chains[key] || {
            platform: selectedPlatform,
            service: editingService,
            variant: "standard",
            name: `${selectedPlatform.toUpperCase()} ${editingService.toUpperCase()}`,
            primaryServiceId: "",
            fallback1Id: "",
            fallback2Id: "",
            autoFallback: true,
          };
          const isSaving = savingKey === key;

          return (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#F7F9FA] border border-[#E3E8EA]">
                <div>
                  <span className="font-bold text-[#142126]">{chain.name}</span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-[#142126] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chain.autoFallback}
                    onChange={(e) => handleUpdate(editingService, "autoFallback", e.target.checked)}
                    className="rounded text-[#0F8F8A] focus:ring-[#0F8F8A]"
                  />
                  <span>Auto Fallback</span>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#0F8F8A] uppercase tracking-wider block mb-1">
                  Primary Peakerr Service ID (Priority 1) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 31714"
                  value={chain.primaryServiceId}
                  onChange={(e) => handleUpdate(editingService, "primaryServiceId", e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block mb-1">
                  Fallback 1 Peakerr Service ID (Priority 2)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 31849"
                  value={chain.fallback1Id}
                  onChange={(e) => handleUpdate(editingService, "fallback1Id", e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#169BD5] uppercase tracking-wider block mb-1">
                  Fallback 2 Peakerr Service ID (Priority 3)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 31850"
                  value={chain.fallback2Id}
                  onChange={(e) => handleUpdate(editingService, "fallback2Id", e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EDF1F2]">
                <AdminButton variant="secondary" onClick={() => setEditingService(null)}>
                  Cancel
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() => handleSave(editingService)}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Chain</span>
                </AdminButton>
              </div>
            </div>
          );
        })()}
      </AdminModal>

      {/* STRONG CONFIRMATION MODAL FOR LIVE SUBMISSION */}
      <AdminModal
        open={isSubmitModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSubmitModalOpen(false);
            setConfirmInput("");
          }
        }}
        title="CONFIRM REAL ORDER SUBMISSION"
        description="You are about to submit a REAL order to Peakerr provider."
      >
        <div className="space-y-3 text-xs">
          <div className="p-2.5 rounded-[6px] bg-[#F7F9FA] border border-[#E3E8EA] font-mono space-y-1 text-[#142126]">
            <p>Order ID: <strong>{dryRunOrderId}</strong></p>
            <p>Primary Service ID: <strong className="text-[#0F8F8A]">{dryRunResult?.primaryServiceId || dryRunResult?.data?.primaryServiceId}</strong></p>
            <p>Quantity: <strong>{dryRunResult?.quantity || dryRunResult?.data?.quantity}</strong></p>
            <p>Target: <strong>{dryRunResult?.target || dryRunResult?.data?.target}</strong></p>
          </div>
          <p className="text-[#D97706] font-medium">
            ⚠️ This action will consume live Peakerr balance and execute fulfillment.
          </p>
          <div className="pt-1 space-y-1">
            <label className="block text-[#65737A] font-bold">
              Type <span className="text-[#142126] font-mono bg-[#F7F9FA] px-1 py-0.5 rounded border border-[#E3E8EA]">SUBMIT</span> to confirm:
            </label>
            <input
              type="text"
              placeholder="SUBMIT"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full bg-white border border-[#D1D9DC] rounded-[6px] p-2 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#EF4444] uppercase"
            />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDF1F2]">
          <AdminButton
            variant="secondary"
            onClick={() => {
              setIsSubmitModalOpen(false);
              setConfirmInput("");
            }}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="danger"
            onClick={handleConfirmLiveSubmit}
            disabled={confirmInput.trim() !== "SUBMIT" || isSubmittingLive}
            isLoading={isSubmittingLive}
          >
            <Send className="w-3.5 h-3.5" />
            <span>CONFIRM & SUBMIT LIVE</span>
          </AdminButton>
        </div>
      </AdminModal>
    </div>
  );
}
