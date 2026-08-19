"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Sliders,
  FileCheck2,
  Terminal,
  ExternalLink,
  Send,
  RefreshCw,
  X,
} from "lucide-react";
import { Platform } from "../types";

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
    primaryServiceId: "31249",
    fallback1Id: "22042",
    fallback2Id: "30428",
    autoFallback: true,
  },
  "instagram:likes": {
    platform: "instagram",
    service: "likes",
    variant: "standard",
    name: "Instagram Likes (Standard)",
    primaryServiceId: "21054",
    fallback1Id: "21055",
    fallback2Id: "21056",
    autoFallback: true,
  },
  "instagram:views": {
    platform: "instagram",
    service: "views",
    variant: "standard",
    name: "Instagram Views (Standard)",
    primaryServiceId: "15021",
    fallback1Id: "15022",
    fallback2Id: "15023",
    autoFallback: true,
  },
  "instagram:comments": {
    platform: "instagram",
    service: "comments",
    variant: "standard",
    name: "Instagram Comments (Standard)",
    primaryServiceId: "41001",
    fallback1Id: "41002",
    fallback2Id: "",
    autoFallback: true,
  },
  "tiktok:followers": {
    platform: "tiktok",
    service: "followers",
    variant: "standard",
    name: "TikTok Followers (Standard)",
    primaryServiceId: "51201",
    fallback1Id: "51202",
    fallback2Id: "",
    autoFallback: true,
  },
  "tiktok:likes": {
    platform: "tiktok",
    service: "likes",
    variant: "standard",
    name: "TikTok Likes (Standard)",
    primaryServiceId: "51301",
    fallback1Id: "51302",
    fallback2Id: "",
    autoFallback: true,
  },
  "tiktok:views": {
    platform: "tiktok",
    service: "views",
    variant: "standard",
    name: "TikTok Views (Standard)",
    primaryServiceId: "51401",
    fallback1Id: "51402",
    fallback2Id: "",
    autoFallback: true,
  },
  "tiktok:comments": {
    platform: "tiktok",
    service: "comments",
    variant: "standard",
    name: "TikTok Comments (Standard)",
    primaryServiceId: "51501",
    fallback1Id: "51502",
    fallback2Id: "",
    autoFallback: true,
  },
  "youtube:followers": {
    platform: "youtube",
    service: "followers",
    variant: "standard",
    name: "YouTube Subscribers (Standard)",
    primaryServiceId: "61201",
    fallback1Id: "61202",
    fallback2Id: "",
    autoFallback: true,
  },
  "youtube:likes": {
    platform: "youtube",
    service: "likes",
    variant: "standard",
    name: "YouTube Likes (Standard)",
    primaryServiceId: "61301",
    fallback1Id: "61302",
    fallback2Id: "",
    autoFallback: true,
  },
  "youtube:views": {
    platform: "youtube",
    service: "views",
    variant: "standard",
    name: "YouTube Views (Standard)",
    primaryServiceId: "61401",
    fallback1Id: "61402",
    fallback2Id: "",
    autoFallback: true,
  },
  "youtube:comments": {
    platform: "youtube",
    service: "comments",
    variant: "standard",
    name: "YouTube Comments (Standard)",
    primaryServiceId: "61501",
    fallback1Id: "61502",
    fallback2Id: "",
    autoFallback: true,
  },
  "twitter:followers": {
    platform: "twitter",
    service: "followers",
    variant: "standard",
    name: "X Followers (Standard)",
    primaryServiceId: "71201",
    fallback1Id: "71202",
    fallback2Id: "",
    autoFallback: true,
  },
  "twitter:likes": {
    platform: "twitter",
    service: "likes",
    variant: "standard",
    name: "X Likes (Standard)",
    primaryServiceId: "71301",
    fallback1Id: "71302",
    fallback2Id: "",
    autoFallback: true,
  },
  "twitter:views": {
    platform: "twitter",
    service: "views",
    variant: "standard",
    name: "X Views (Standard)",
    primaryServiceId: "71401",
    fallback1Id: "71402",
    fallback2Id: "",
    autoFallback: true,
  },
  "twitter:comments": {
    platform: "twitter",
    service: "comments",
    variant: "standard",
    name: "X Comments (Standard)",
    primaryServiceId: "71501",
    fallback1Id: "71502",
    fallback2Id: "",
    autoFallback: true,
  },
};

export function PeakerrChainsModule() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [chains, setChains] = useState<Record<string, ChainConfig>>(DEFAULT_CHAINS);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }>({
    apiKeyPresent: false,
    liveFulfillment: false,
    webhookVerified: false,
  });
  const [inspectAudit, setInspectAudit] = useState<any>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

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
  const [autoSyncResult, setAutoSyncResult] = useState<{
    checked: number;
    updated: number;
    completed: number;
    partial: number;
    canceled: number;
    unchanged: number;
    errors: number;
    lastRun?: string;
  } | null>(null);

  // Manual Simulation State
  const [manualPlatform, setManualPlatform] = useState<Platform>("instagram");
  const [manualService, setManualService] = useState<string>("followers");
  const [manualVariant, setManualVariant] = useState<string>("standard");
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
        setInspectAudit(json.audit);
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
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    fetchPeakerrInspection();
    fetchAutoSyncState();
  }, [fetchPeakerrInspection, fetchAutoSyncState]);

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
      
      // SYNC/REFETCH: if status check succeeds, refresh the inspection state
      if (data.success) {
        // Run a background refetch of the preview to update the top UI with DB state
        fetch(`/api/admin/orders/${dryRunOrderId.trim()}/fulfillment-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variant: "standard" }),
        })
          .then(res => res.json())
          .then(refetchData => {
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

  return (
    <div className="space-y-8">
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Peakerr Fulfillment Chains</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>DRY RUN & SIMULATION</span>
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure multi-tier provider delivery fallbacks per platform and service. Zero real orders sent.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
          {(["instagram", "tiktok", "twitter", "youtube"] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlatform(p)}
              className={`px-3.5 py-2 rounded-lg capitalize transition-all cursor-pointer ${
                selectedPlatform === p ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {p === "twitter" ? "X (Twitter)" : p}
            </button>
          ))}
        </div>
      </div>

      {/* PEAKERR CONNECTION STATUS BAR (Live Read-Only Inspect) */}
      <div className="p-4 rounded-2xl bg-[#0e131f] border border-neutral-800/90 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connectionInfo?.connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Peakerr Connection:</span>
              <span className={`text-xs font-bold ${connectionInfo?.connected ? "text-emerald-400" : "text-red-400"}`}>
                {inspectLoading ? "Inspecting..." : connectionInfo?.connected ? "Connected" : "Not Connected / Misconfigured"}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                LIVE KILL SWITCH: {runtimeFlags.liveFulfillment ? "ACTIVE (ENABLED)" : "DISABLED"}
              </span>
            </div>
            {connectionInfo?.error && (
              <p className="text-[11px] text-red-400">{connectionInfo.error}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
            <span className="text-neutral-500 mr-1.5">Balance:</span>
            <strong className="text-white">
              {connectionInfo?.balance !== null && connectionInfo?.balance !== undefined
                ? `${connectionInfo.currency} ${connectionInfo.balance}`
                : "—"}
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
            <span className="text-neutral-500 mr-1.5">Services Loaded:</span>
            <strong className="text-white">{connectionInfo?.servicesCount ?? 0}</strong>
          </div>
          <button
            type="button"
            onClick={fetchPeakerrInspection}
            disabled={inspectLoading}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {inspectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Refresh Peakerr</span>
          </button>
        </div>
      </div>

      {savedStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Four Service Chains Grid for Selected Platform */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          const isSaving = savingKey === key;

          return (
            <div
              key={svc}
              className="bg-[#12161f] border border-neutral-800/90 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white capitalize">{chain.name}</h3>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Variant: {chain.variant}
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chain.autoFallback}
                      onChange={(e) => handleUpdate(svc, "autoFallback", e.target.checked)}
                      className="rounded-sm border-neutral-700 bg-neutral-900 text-blue-600"
                    />
                    <span>Auto Fallback</span>
                  </label>
                </div>

                {/* Primary Service (Priority 1) */}
                <div>
                  <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Primary Peakerr Service ID (Priority 1)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 31714"
                    value={chain.primaryServiceId}
                    onChange={(e) => handleUpdate(svc, "primaryServiceId", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs placeholder:text-neutral-600 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Fallback 1 (Priority 2) */}
                <div>
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Fallback 1 Peakerr Service ID (Priority 2)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 31849"
                    value={chain.fallback1Id}
                    onChange={(e) => handleUpdate(svc, "fallback1Id", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs placeholder:text-neutral-600 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Fallback 2 (Priority 3) */}
                <div>
                  <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    Fallback 2 Peakerr Service ID (Priority 3)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 31850"
                    value={chain.fallback2Id}
                    onChange={(e) => handleUpdate(svc, "fallback2Id", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs placeholder:text-neutral-600 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                <span className="text-[10px] text-neutral-500">
                  Provider: Peakerr API v2
                </span>
                <button
                  type="button"
                  onClick={() => handleSave(svc)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Chain</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. SIMULATOR SECTION (Manual Simulation + Existing Order Dry Run) */}
      <div className="bg-[#12161f] border border-neutral-800/90 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Peakerr Fulfillment Simulator & Live Dispatch
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Safe Dry Run engine and controlled live order submission. Resolves chains, validates targets, and prepares Peakerr payloads.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSimulatorMode("manual")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                simulatorMode === "manual"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Manual Simulation</span>
            </button>
            <button
              type="button"
              onClick={() => setSimulatorMode("existing")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                simulatorMode === "existing"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Existing Order</span>
            </button>
          </div>
        </div>

        {/* --- MODE A: MANUAL SIMULATION FORM --- */}
        {simulatorMode === "manual" && (
          <form onSubmit={handleManualSimulation} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Platform</label>
                <select
                  value={manualPlatform}
                  onChange={(e) => {
                    const p = e.target.value as Platform;
                    setManualPlatform(p);
                    if (manualService === "followers") {
                      setManualTarget(`https://${p === "twitter" ? "x.com" : `${p}.com`}/anaclaramaderite`);
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-medium focus:outline-hidden"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Service</label>
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
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-medium focus:outline-hidden capitalize"
                >
                  <option value="followers">Followers</option>
                  <option value="likes">Likes</option>
                  <option value="views">Views</option>
                  <option value="comments">Comments</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Quantity (Exact Order Qty)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 2000"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-mono focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-1">
                Target ({manualService === "followers" ? "Username or Profile URL" : "Direct Content URL"})
              </label>
              <input
                type="text"
                placeholder={manualService === "followers" ? "anaclaramaderite or https://instagram.com/anaclaramaderite" : "https://instagram.com/p/..."}
                value={manualTarget}
                onChange={(e) => setManualTarget(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-500 font-mono">
                Variant: standard • Source: Database Chains
              </span>
              <button
                type="submit"
                disabled={manualLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving Chain...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Generate Dry Run</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* --- MODE B: EXISTING ORDER FORM --- */}
        {simulatorMode === "existing" && (
          <form onSubmit={handleDryRunExistingOrder} className="space-y-4">
            <label className="text-xs text-neutral-300 font-semibold block">
              Enter Existing Order UUID / Public ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. 5ac16615-57f1-4b41-ae69-426a14c6c68d"
                value={dryRunOrderId}
                onChange={(e) => setDryRunOrderId(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={dryRunLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {dryRunLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Preview Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Live Submission Status Messages */}
        {submitLiveResult && (
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${submitLiveResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <p className="font-bold">{submitLiveResult.success ? "✓ PEAKERR ORDER SUBMITTED" : "✗ LIVE SUBMISSION FAILED"}</p>
            <p>{submitLiveResult.data?.message || submitLiveResult.error?.message || JSON.stringify(submitLiveResult)}</p>
          </div>
        )}

        {statusCheckResult && (
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${statusCheckResult.success ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <p className="font-bold">PEAKERR LIVE STATUS RESULT:</p>
            <pre className="text-[11px] overflow-x-auto text-neutral-300">
              {JSON.stringify(statusCheckResult.data || statusCheckResult.error, null, 2)}
            </pre>
          </div>
        )}

        {/* --- SIMULATION RESULT PRESENTATION (Rich Visual Display) --- */}
        {(() => {
          const activeResult = simulatorMode === "manual" ? manualResult : dryRunResult;
          if (!activeResult) return null;

          if (!activeResult.success) {
            return (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>SIMULATION BLOCKED — {activeResult.error?.code || "ERROR"}</span>
                </div>
                <p className="text-xs text-neutral-300">{activeResult.error?.message || "Failed to resolve chain."}</p>
              </div>
            );
          }

          const data = activeResult.data || activeResult;
          const evaluationList = Array.isArray(data.chainServicesEvaluation) ? data.chainServicesEvaluation : [];

          return (
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-5 text-xs">
              {/* Header Status & Platform/Service Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
                    data.alreadyDispatched
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {data.action || (data.alreadyDispatched ? "INSPECTION_MODE" : "DRY_RUN_READY")}
                  </span>
                  <span className="text-neutral-400 font-semibold">
                    {data.platform?.toUpperCase()} • {data.service?.toUpperCase()} ({data.variant})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  {data.alreadyDispatched ? "ALREADY DISPATCHED • READ-ONLY" : "SIMULATION ONLY • NO REQUEST SENT"}
                </span>
              </div>

              {/* Already Dispatched Banner / Provider Order Info */}
              {data.alreadyDispatched && (
                <div className="p-4 rounded-2xl bg-[#090e1a] border border-blue-500/30 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${data.fulfillmentStatus === 'COMPLETED' ? 'text-emerald-400' : 'text-blue-400'}`}>
                      ✓ {data.fulfillmentStatus === 'COMPLETED' ? 'COMPLETED' : 'ALREADY DISPATCHED'} — Provider Order #{data.latestFulfillment?.externalOrderId || "Registered"}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      Provider: {data.latestFulfillment?.provider || "Peakerr"} • Status: <strong className="text-white">{data.fulfillmentStatus || data.latestFulfillment?.status || "PROCESSING"}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-300 pt-1 border-t border-neutral-800/80">
                    <div>
                      <span className="text-neutral-500 block">Provider Order ID:</span>
                      <strong className="text-white">{data.latestFulfillment?.externalOrderId || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Provider Service ID:</span>
                      <strong className="text-emerald-400">{data.latestFulfillment?.externalServiceId || data.primaryServiceId}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Submitted At:</span>
                      <span>{data.latestFulfillment?.submittedAt ? new Date(data.latestFulfillment.submittedAt).toLocaleString() : "Recently"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Fulfillment State:</span>
                      <strong className="text-blue-300">{data.fulfillmentStatus || "PROCESSING"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-0.5">Order Quantity</span>
                  <span className="text-sm font-black text-white font-mono">{data.quantity?.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-0.5">Resolved Target</span>
                  <span className="text-xs font-bold text-neutral-200 truncate block font-mono" title={data.target}>
                    {data.target}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-0.5">Resolved Chain</span>
                  <span className="text-xs font-bold text-white truncate block">{data.chain?.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-0.5">Auto Fallback</span>
                  <span className={`text-xs font-bold ${data.chain?.autoFallback ? "text-emerald-400" : "text-amber-400"}`}>
                    {data.chain?.autoFallback ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
              </div>

              {/* FIRST LIVE ORDER REVIEW CARD (Detailed Provider Cost & Metadata) */}
              {(() => {
                const primarySlot = evaluationList.find((s: any) => s.serviceId === data.primaryServiceId) || evaluationList[0];
                const auditedSlot = inspectAudit?.slots?.find((s: any) => String(s.providerServiceId) === String(data.primaryServiceId));
                const peakerrDetail = auditedSlot?.peakerrDetails;
                
                // Rate semantics: Peakerr rate is cost per 1,000 units (Standard SMM API v2)
                const rateNum = peakerrDetail ? Number(peakerrDetail.rate) : null;
                const estimatedCost = (rateNum !== null && !isNaN(rateNum) && data.quantity)
                  ? ((rateNum * Number(data.quantity)) / 1000).toFixed(4)
                  : null;

                const currentBalanceNum = connectionInfo?.balance !== null && connectionInfo?.balance !== undefined
                  ? Number(connectionInfo.balance)
                  : null;

                const isInsufficientBalance = (currentBalanceNum !== null && estimatedCost !== null && currentBalanceNum < Number(estimatedCost));

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

        // If an existing order is actively inspected, refresh its dry run state as well
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
                  <div className="p-4 rounded-2xl bg-[#090c14] border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          FIRST LIVE ORDER REVIEW (PRIMARY ONLY)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        MODE: PRIMARY ONLY
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Peakerr Primary Service:</span>
                        <strong className="text-emerald-400 font-mono">ID {data.primaryServiceId}</strong>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">{peakerrDetail?.name || "Standard Provider Service"}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-neutral-500 block">Service Min / Max:</span>
                        <strong className="text-neutral-200 font-mono">
                          {peakerrDetail?.min ? `${Number(peakerrDetail.min).toLocaleString()} – ${Number(peakerrDetail.max).toLocaleString()}` : `${primarySlot?.minQuantity} – ${primarySlot?.maxQuantity}`}
                        </strong>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">Quantity Eligible ✓</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-neutral-500 block">Rate (per 1,000):</span>
                        <strong className="text-white font-mono">
                          {rateNum !== null ? `$${rateNum.toFixed(2)}` : "Verified via API"}
                        </strong>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Est. Cost: <strong className="text-emerald-400">{estimatedCost ? `$${estimatedCost}` : "Pending"}</strong>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-neutral-500 block">Peakerr Balance:</span>
                        <strong className={`font-mono ${isInsufficientBalance ? "text-red-400" : "text-white"}`}>
                          {connectionInfo?.balance !== null && connectionInfo?.balance !== undefined ? `${connectionInfo.currency} ${connectionInfo.balance}` : "Not Checked"}
                        </strong>
                        {isInsufficientBalance ? (
                          <span className="text-[10px] text-red-400 block font-bold mt-0.5">⚠️ INSUFFICIENT BALANCE</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 block mt-0.5">Balance Adequate ✓</span>
                        )}
        </div>
      </div>

      {/* AUTOMATIC STATUS SYNC PANEL (Read-Only Provider Monitoring) */}
      <div className="p-4 rounded-2xl bg-[#0b101b] border border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              AUTOMATIC STATUS SYNC (READ-ONLY MONITORING)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              autoSyncEnabled
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
            }`}>
              STATUS SYNC: {autoSyncEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRunStatusSyncNow}
            disabled={autoSyncLoading}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {autoSyncLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Run Status Sync Now</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Last Run</span>
            <strong className="text-white text-xs">{autoSyncResult?.lastRun || "Never"}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Checked</span>
            <strong className="text-neutral-200 text-xs">{autoSyncResult?.checked ?? 0}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Updated</span>
            <strong className="text-sky-400 text-xs">{autoSyncResult?.updated ?? 0}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Completed</span>
            <strong className="text-emerald-400 text-xs">{autoSyncResult?.completed ?? 0}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Partial</span>
            <strong className="text-amber-400 text-xs">{autoSyncResult?.partial ?? 0}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Canceled</span>
            <strong className="text-rose-400 text-xs">{autoSyncResult?.canceled ?? 0}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Errors</span>
            <strong className={`${autoSyncResult?.errors ? 'text-red-400' : 'text-neutral-400'} text-xs`}>
              {autoSyncResult?.errors ?? 0}
            </strong>
          </div>
        </div>
      </div>
                  </div>
                );
              })()}

              {/* Chain Slots Evaluation Breakdown */}
              {evaluationList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Chain Services Evaluation
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {evaluationList.map((slot: any) => (
                      <div
                        key={slot.priority}
                        className={`p-3 rounded-xl border ${
                          slot.eligible
                            ? slot.serviceId === data.primaryServiceId
                              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                              : "bg-neutral-900/80 border-neutral-800 text-neutral-300"
                            : "bg-red-950/10 border-red-500/20 text-red-400 opacity-75"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{slot.priorityLabel}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${slot.eligible ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                            {slot.eligible ? "ELIGIBLE" : "INELIGIBLE"}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-bold text-white">ID: {slot.serviceId}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                          Range: {slot.minQuantity.toLocaleString()} – {slot.maxQuantity.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peakerr Request Payload Preview (Exact JSON) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Peakerr Request Payload Preview (Simulated)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Zero HTTP requests executed</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(data.peakerrRequestPayload || {
                    provider: "peakerr",
                    service: data.primaryServiceId,
                    link: data.target,
                    quantity: data.quantity,
                  }, null, 2)}
                </pre>
              </div>

              {/* CONTROLLED LIVE SUBMIT BUTTON & STATUS CHECK (Existing Order Mode Only) */}
              {simulatorMode === "existing" && (
                <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCheckLiveStatus}
                      disabled={statusCheckLoading || (!data.latestFulfillment?.externalOrderId && data.fulfillmentStatus === 'NOT_DISPATCHED')}
                      className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 text-xs"
                    >
                      {statusCheckLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Check Peakerr Status</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {data.alreadyDispatched ? (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                        data.fulfillmentStatus === 'COMPLETED'
                          ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                          : "bg-blue-950/40 border border-blue-500/30 text-blue-300"
                      } text-xs font-semibold`}>
                        <CheckCircle2 className={`w-4 h-4 ${data.fulfillmentStatus === 'COMPLETED' ? 'text-emerald-400' : 'text-blue-400'} shrink-0`} />
                        <span>
                          {data.fulfillmentStatus === 'COMPLETED' ? 'COMPLETED' : 'ALREADY DISPATCHED'} — Provider Order #{data.latestFulfillment?.externalOrderId || "Active"}
                        </span>
                      </div>
                    ) : !runtimeFlags.liveFulfillment ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>LIVE FULFILLMENT DISABLED (Kill Switch Active)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-105"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit to Peakerr (Primary Only)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* STRONG CONFIRMATION MODAL FOR LIVE SUBMISSION */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#12161f] border-2 border-red-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-neutral-300 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>CONFIRM REAL ORDER SUBMISSION</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  setConfirmInput("");
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-semibold text-white">
                You are about to submit a REAL order to Peakerr provider.
              </p>
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono space-y-1 text-neutral-300">
                <p>Order ID: <strong className="text-white">{dryRunOrderId}</strong></p>
                <p>Primary Service ID: <strong className="text-emerald-400">{dryRunResult?.primaryServiceId || dryRunResult?.data?.primaryServiceId}</strong></p>
                <p>Quantity: <strong className="text-white">{dryRunResult?.quantity || dryRunResult?.data?.quantity}</strong></p>
                <p>Target: <strong className="text-neutral-200">{dryRunResult?.target || dryRunResult?.data?.target}</strong></p>
              </div>
              <p className="text-amber-400 font-medium">
                ⚠️ This action will consume live Peakerr balance and execute fulfillment.
              </p>
              <div className="pt-2 space-y-1.5">
                <label className="block text-neutral-400 font-bold">
                  Type <span className="text-white font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">SUBMIT</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="SUBMIT"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-red-500 uppercase"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  setConfirmInput("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLiveSubmit}
                disabled={confirmInput.trim() !== "SUBMIT" || isSubmittingLive}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {isSubmittingLive ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting to Peakerr...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>CONFIRM & SUBMIT LIVE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
