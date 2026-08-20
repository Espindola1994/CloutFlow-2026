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
  Send,
  RefreshCw,
  X,
  Server,
  Settings2,
} from "lucide-react";
import { PeakerrStatusSyncCard, StatusSyncMetrics } from "./PeakerrStatusSyncCard";
import { PeakerrAutoDispatchCard } from "./PeakerrAutoDispatchCard";
import { Platform } from "../types";
import {
  AdminCard,
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
  const [autoSyncResult, setAutoSyncResult] = useState<StatusSyncMetrics | null>(null);

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

      // SYNC/REFETCH: if status check succeeds, refresh the inspection state
      if (data.success) {
        // Run a background refetch of the preview to update the top UI with DB state
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
    <div className="space-y-6">
      {/* 1. Page Header & Platform Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E8EA] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[23px] font-[650] text-[#142126] tracking-tight">Fulfillment & Providers</h2>
            <AdminBadge variant="primary" size="sm">
              DRY RUN & SIMULATION
            </AdminBadge>
          </div>
          <p className="text-[13px] text-[#65737A] mt-1">
            Configure delivery routing, provider fallbacks and fulfillment health.
          </p>
        </div>

        {/* Platform Indicators (42px-46px container buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          {(["instagram", "tiktok", "twitter", "youtube"] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlatform(p)}
              className={`flex items-center justify-center w-[44px] h-[44px] rounded-[8px] bg-white border transition-all cursor-pointer ${
                selectedPlatform === p
                  ? "border-[#0F8F8A] shadow-sm ring-1 ring-[#0F8F8A]/20"
                  : "border-[#E3E8EA] hover:bg-[#F7F9FA] hover:border-[#D1D9DC]"
              }`}
            >
              <PlatformIcon platform={p === "twitter" ? "x" : p} size={22} showBackground={false} />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Provider Status Strip */}
      <AdminCard padded className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 !p-[16px_18px] border-[#E3E8EA]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shrink-0 ${connectionInfo?.connected ? "bg-[#16B77A] animate-pulse" : "bg-[#EF4444]"}`} />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-bold text-[#142126] uppercase tracking-wider">PEAKERR PROVIDER:</span>
              <span className={`text-[12px] font-bold ${connectionInfo?.connected ? "text-[#16B77A]" : "text-[#EF4444]"}`}>
                {inspectLoading ? "Inspecting..." : connectionInfo?.connected ? "Connected" : "Not Connected / Error"}
              </span>
              <AdminBadge variant={runtimeFlags.liveFulfillment ? "warning" : "default"} size="sm" className="ml-1">
                KILL SWITCH: {runtimeFlags.liveFulfillment ? "ACTIVE" : "DISABLED"}
              </AdminBadge>
            </div>
            {connectionInfo?.error && (
              <p className="text-[11px] text-[#EF4444]">{connectionInfo.error}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
            <span className="text-[#65737A] mr-1.5">Balance:</span>
            <strong className="text-[#142126]">
              {connectionInfo?.balance !== null && connectionInfo?.balance !== undefined
                ? `${connectionInfo.currency} ${connectionInfo.balance}`
                : "—"}
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
            <span className="text-[#65737A] mr-1.5">Services:</span>
            <strong className="text-[#142126]">{connectionInfo?.servicesCount ?? 0}</strong>
          </div>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={fetchPeakerrInspection}
            disabled={inspectLoading}
          >
            {inspectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Refresh</span>
          </AdminButton>
        </div>
      </AdminCard>

      {/* 3. Automatic Status Sync Panel */}
      <PeakerrStatusSyncCard
        enabled={autoSyncEnabled}
        loading={autoSyncLoading}
        metrics={autoSyncResult}
        onRunSync={handleRunStatusSyncNow}
        error={errorMessage}
      />

      {/* 4. Main Grid: Fulfillment Overview + Auto Dispatch */}
      <PeakerrAutoDispatchCard />

      {savedStatus && (
        <div className="p-3.5 rounded-[8px] bg-[#E8F8F2] border border-[#B6ECD7] text-[#16B77A] text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5. Provider Chains & Fallbacks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-[#142126] tracking-tight">
              PROVIDER CHAINS & FALLBACKS
            </h3>
            <p className="text-[12px] text-[#65737A]">
              Configure multi-tier fallback chains per platform and service.
            </p>
          </div>
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Platform</AdminTableHead>
                <AdminTableHead>Service</AdminTableHead>
                <AdminTableHead>Chain Order</AdminTableHead>
                <AdminTableHead>Providers</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead className="text-right">Actions</AdminTableHead>
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

                const tierCount = [chain.primaryServiceId, chain.fallback1Id, chain.fallback2Id].filter(Boolean).length;

                return (
                  <AdminTableRow key={svc}>
                    <AdminTableCell>
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={selectedPlatform === "twitter" ? "x" : selectedPlatform} size={20} showBackground={false} />
                        <span className="capitalize font-semibold text-[#142126]">{selectedPlatform === "twitter" ? "X" : selectedPlatform}</span>
                      </div>
                    </AdminTableCell>

                    <AdminTableCell>
                      <span className="capitalize font-medium text-[#142126]">{svc}</span>
                    </AdminTableCell>

                    <AdminTableCell>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-5 h-5 rounded-full bg-[#0F8F8A] text-white flex items-center justify-center font-bold">1</span>
                        <span className="text-[#142126] font-semibold">{chain.primaryServiceId || "—"}</span>
                        {chain.fallback1Id && (
                          <>
                            <span className="text-[#8A979D]">→</span>
                            <span className="w-5 h-5 rounded-full bg-[#E3E8EA] text-[#65737A] flex items-center justify-center font-bold">2</span>
                            <span className="text-[#65737A]">{chain.fallback1Id}</span>
                          </>
                        )}
                        {chain.fallback2Id && (
                          <>
                            <span className="text-[#8A979D]">→</span>
                            <span className="w-5 h-5 rounded-full bg-[#E3E8EA] text-[#65737A] flex items-center justify-center font-bold">3</span>
                            <span className="text-[#65737A]">{chain.fallback2Id}</span>
                          </>
                        )}
                      </div>
                    </AdminTableCell>

                    <AdminTableCell>
                      <div className="flex items-center gap-1.5 text-xs text-[#65737A]">
                        <Server className="w-3.5 h-3.5 text-[#0F8F8A]" />
                        <span>Peakerr ({tierCount} {tierCount === 1 ? "tier" : "tiers"})</span>
                      </div>
                    </AdminTableCell>

                    <AdminTableCell>
                      <AdminBadge variant={chain.autoFallback ? "success" : "warning"}>
                        {chain.autoFallback ? "Auto Fallback" : "Single Tier"}
                      </AdminBadge>
                    </AdminTableCell>

                    <AdminTableCell className="text-right">
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingService(svc)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Configure</span>
                      </AdminButton>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        </div>

        {/* Mobile View: MobileDataCard list */}
        <div className="block md:hidden space-y-3">
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
                    <PlatformIcon platform={selectedPlatform === "twitter" ? "x" : selectedPlatform} size={18} showBackground={false} />
                    <span className="capitalize font-bold text-[#142126]">{selectedPlatform} {svc}</span>
                  </div>
                }
                status={
                  <AdminBadge variant={chain.autoFallback ? "success" : "warning"}>
                    {chain.autoFallback ? "Auto Fallback" : "Single Tier"}
                  </AdminBadge>
                }
                metrics={[
                  {
                    label: "Primary Service",
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
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setEditingService(svc)}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configure Chain</span>
                  </AdminButton>
                }
              />
            );
          })}
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
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA]">
                <div>
                  <span className="font-bold text-[#142126]">{chain.name}</span>
                  <span className="text-[11px] text-[#65737A] block">Variant: {chain.variant}</span>
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
                <label className="text-[11px] font-bold text-[#0F8F8A] uppercase tracking-wider block mb-1">
                  Primary Peakerr Service ID (Priority 1) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 31714"
                  value={chain.primaryServiceId}
                  onChange={(e) => handleUpdate(editingService, "primaryServiceId", e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block mb-1">
                  Fallback 1 Peakerr Service ID (Priority 2)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 31849"
                  value={chain.fallback1Id}
                  onChange={(e) => handleUpdate(editingService, "fallback1Id", e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#169BD5] uppercase tracking-wider block mb-1">
                  Fallback 2 Peakerr Service ID (Priority 3)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 31850"
                  value={chain.fallback2Id}
                  onChange={(e) => handleUpdate(editingService, "fallback2Id", e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDF1F2]">
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

      {/* 6. SIMULATOR SECTION (Manual Simulation + Existing Order Dry Run) */}
      <AdminCard className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E8EA] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-[14px] font-bold text-[#142126] uppercase tracking-wider">
                Fulfillment Simulator & Live Dispatch
              </h3>
            </div>
            <p className="text-[12px] text-[#65737A]">
              Safe Dry Run engine and controlled live order submission. Resolves chains, validates targets, and prepares Peakerr payloads.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#F7F9FA] border border-[#E3E8EA] rounded-[8px] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSimulatorMode("manual")}
              className={`px-3 py-1.5 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                simulatorMode === "manual"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Manual Simulation</span>
            </button>
            <button
              type="button"
              onClick={() => setSimulatorMode("existing")}
              className={`px-3 py-1.5 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                simulatorMode === "existing"
                  ? "bg-[#0F8F8A] text-white shadow-xs"
                  : "text-[#65737A] hover:text-[#142126]"
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
                  className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-medium focus:outline-none focus:border-[#0F8F8A]"
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
                  className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-medium focus:outline-none focus:border-[#0F8F8A] capitalize"
                >
                  <option value="followers">Followers</option>
                  <option value="likes">Likes</option>
                  <option value="views">Views</option>
                  <option value="comments">Comments</option>
                </select>
              </div>

              <div>
                <label className="text-[#142126] font-semibold block mb-1">Quantity (Exact Order Qty)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 2000"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(e.target.value)}
                  className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-mono focus:outline-none focus:border-[#0F8F8A]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[#142126] font-semibold block mb-1">
                Target ({manualService === "followers" ? "Username or Profile URL" : "Direct Content URL"})
              </label>
              <input
                type="text"
                placeholder={manualService === "followers" ? "anaclaramaderite or https://instagram.com/anaclaramaderite" : "https://instagram.com/p/..."}
                value={manualTarget}
                onChange={(e) => setManualTarget(e.target.value)}
                className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#0F8F8A]"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#65737A] font-mono">
                Variant: standard • Source: Database Chains
              </span>
              <AdminButton
                type="submit"
                disabled={manualLoading}
                isLoading={manualLoading}
                variant="primary"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Generate Dry Run</span>
              </AdminButton>
            </div>
          </form>
        )}

        {/* --- MODE B: EXISTING ORDER FORM --- */}
        {simulatorMode === "existing" && (
          <form onSubmit={handleDryRunExistingOrder} className="space-y-3">
            <label className="text-xs text-[#142126] font-semibold block">
              Enter Existing Order UUID / Public ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. 5ac16615-57f1-4b41-ae69-426a14c6c68d"
                value={dryRunOrderId}
                onChange={(e) => setDryRunOrderId(e.target.value)}
                className="flex-1 bg-white border border-[#D1D9DC] rounded-[8px] px-3.5 py-2 text-xs text-[#142126] font-mono placeholder:text-[#8A979D] focus:outline-none focus:border-[#0F8F8A]"
              />
              <AdminButton
                type="submit"
                disabled={dryRunLoading}
                isLoading={dryRunLoading}
                variant="primary"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Preview Order</span>
              </AdminButton>
            </div>
          </form>
        )}

        {/* Live Submission Status Messages */}
        {submitLiveResult && (
          <div className={`p-4 rounded-[8px] border text-xs font-mono space-y-1 ${submitLiveResult.success ? "bg-[#E8F8F2] border-[#B6ECD7] text-[#16B77A]" : "bg-[#FEECEB] border-[#FCA5A5] text-[#EF4444]"}`}>
            <p className="font-bold">{submitLiveResult.success ? "✓ PEAKERR ORDER SUBMITTED" : "✗ LIVE SUBMISSION FAILED"}</p>
            <p>{submitLiveResult.data?.message || submitLiveResult.error?.message || JSON.stringify(submitLiveResult)}</p>
          </div>
        )}

        {statusCheckResult && (
          <div className={`p-4 rounded-[8px] border text-xs font-mono space-y-1 ${statusCheckResult.success ? "bg-[#E8F5FB] border-[#BAE6FD] text-[#169BD5]" : "bg-[#FEECEB] border-[#FCA5A5] text-[#EF4444]"}`}>
            <p className="font-bold">PEAKERR LIVE STATUS RESULT:</p>
            <pre className="text-[11px] overflow-x-auto text-[#142126]">
              {JSON.stringify(statusCheckResult.data || statusCheckResult.error, null, 2)}
            </pre>
          </div>
        )}

        {/* --- SIMULATION RESULT PRESENTATION --- */}
        {(() => {
          const activeResult = simulatorMode === "manual" ? manualResult : dryRunResult;
          if (!activeResult) return null;

          if (!activeResult.success) {
            return (
              <div className="p-4 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>SIMULATION BLOCKED — {activeResult.error?.code || "ERROR"}</span>
                </div>
                <p className="text-xs text-[#142126]">{activeResult.error?.message || "Failed to resolve chain."}</p>
              </div>
            );
          }

          const data = activeResult.data || activeResult;
          const evaluationList = Array.isArray(data.chainServicesEvaluation) ? data.chainServicesEvaluation : [];

          return (
            <div className="p-5 rounded-[10px] bg-[#F7F9FA] border border-[#E3E8EA] space-y-4 text-xs">
              {/* Header Status & Platform/Service Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3E8EA]">
                <div className="flex items-center gap-2">
                  <AdminBadge variant={data.alreadyDispatched ? "info" : "success"}>
                    {data.action || (data.alreadyDispatched ? "INSPECTION_MODE" : "DRY_RUN_READY")}
                  </AdminBadge>
                  <span className="text-[#142126] font-semibold">
                    {data.platform?.toUpperCase()} • {data.service?.toUpperCase()} ({data.variant})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#D97706] font-semibold">
                  {data.alreadyDispatched ? "ALREADY DISPATCHED • READ-ONLY" : "SIMULATION ONLY • NO REQUEST SENT"}
                </span>
              </div>

              {/* Already Dispatched Banner / Provider Order Info */}
              {data.alreadyDispatched && (
                <div className="p-4 rounded-[8px] bg-white border border-[#BAE6FD] text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${data.fulfillmentStatus === "COMPLETED" ? "text-[#16B77A]" : "text-[#169BD5]"}`}>
                      ✓ {data.fulfillmentStatus === "COMPLETED" ? "COMPLETED" : "ALREADY DISPATCHED"} — Provider Order #{data.latestFulfillment?.externalOrderId || "Registered"}
                    </span>
                    <span className="text-[#65737A] text-[11px]">
                      Provider: {data.latestFulfillment?.provider || "Peakerr"} • Status: <strong className="text-[#142126]">{data.fulfillmentStatus || data.latestFulfillment?.status || "PROCESSING"}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#65737A] pt-1 border-t border-[#EDF1F2]">
                    <div>
                      <span className="text-[#8A979D] block">Provider Order ID:</span>
                      <strong className="text-[#142126]">{data.latestFulfillment?.externalOrderId || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[#8A979D] block">Provider Service ID:</span>
                      <strong className="text-[#0F8F8A]">{data.latestFulfillment?.externalServiceId || data.primaryServiceId}</strong>
                    </div>
                    <div>
                      <span className="text-[#8A979D] block">Submitted At:</span>
                      <span className="text-[#142126]">{data.latestFulfillment?.submittedAt ? new Date(data.latestFulfillment.submittedAt).toLocaleString() : "Recently"}</span>
                    </div>
                    <div>
                      <span className="text-[#8A979D] block">Fulfillment State:</span>
                      <strong className="text-[#169BD5]">{data.fulfillmentStatus || "PROCESSING"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-[8px] bg-white border border-[#E3E8EA]">
                  <span className="text-[10px] text-[#65737A] uppercase font-bold block mb-0.5">Order Quantity</span>
                  <span className="text-[14px] font-bold text-[#142126] font-mono">{data.quantity?.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-[8px] bg-white border border-[#E3E8EA]">
                  <span className="text-[10px] text-[#65737A] uppercase font-bold block mb-0.5">Resolved Target</span>
                  <span className="text-xs font-bold text-[#142126] truncate block font-mono" title={data.target}>
                    {data.target}
                  </span>
                </div>
                <div className="p-3 rounded-[8px] bg-white border border-[#E3E8EA]">
                  <span className="text-[10px] text-[#65737A] uppercase font-bold block mb-0.5">Resolved Chain</span>
                  <span className="text-xs font-bold text-[#142126] truncate block">{data.chain?.name}</span>
                </div>
                <div className="p-3 rounded-[8px] bg-white border border-[#E3E8EA]">
                  <span className="text-[10px] text-[#65737A] uppercase font-bold block mb-0.5">Auto Fallback</span>
                  <span className={`text-xs font-bold ${data.chain?.autoFallback ? "text-[#16B77A]" : "text-[#D97706]"}`}>
                    {data.chain?.autoFallback ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
              </div>

              {/* Chain Slots Evaluation Breakdown */}
              {evaluationList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider block">
                    Chain Services Evaluation
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {evaluationList.map((slot: any) => (
                      <div
                        key={slot.priority}
                        className={`p-3 rounded-[8px] border ${
                          slot.eligible
                            ? slot.serviceId === data.primaryServiceId
                              ? "bg-[#E8F8F2] border-[#B6ECD7] text-[#16B77A]"
                              : "bg-white border-[#E3E8EA] text-[#142126]"
                            : "bg-[#FEECEB] border-[#FCA5A5] text-[#EF4444]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{slot.priorityLabel}</span>
                          <AdminBadge variant={slot.eligible ? "success" : "danger"} size="sm">
                            {slot.eligible ? "ELIGIBLE" : "INELIGIBLE"}
                          </AdminBadge>
                        </div>
                        <p className="font-mono text-xs font-bold text-[#142126]">ID: {slot.serviceId}</p>
                        <p className="text-[10px] text-[#65737A] mt-0.5 font-mono">
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
                  <span className="text-[11px] font-bold text-[#65737A] uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#0F8F8A]" />
                    <span>Peakerr Request Payload Preview (Simulated)</span>
                  </span>
                  <span className="text-[10px] text-[#8A979D] font-mono">Zero HTTP requests executed</span>
                </div>
                <pre className="p-3.5 rounded-[8px] bg-white border border-[#E3E8EA] text-[#0F8F8A] font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(
                    data.peakerrRequestPayload || {
                      provider: "peakerr",
                      service: data.primaryServiceId,
                      link: data.target,
                      quantity: data.quantity,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* CONTROLLED LIVE SUBMIT BUTTON & STATUS CHECK (Existing Order Mode Only) */}
              {simulatorMode === "existing" && (
                <div className="pt-3 border-t border-[#EDF1F2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      onClick={handleCheckLiveStatus}
                      disabled={statusCheckLoading || (!data.latestFulfillment?.externalOrderId && data.fulfillmentStatus === "NOT_DISPATCHED")}
                    >
                      {statusCheckLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Check Peakerr Status</span>
                    </AdminButton>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {data.alreadyDispatched ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#E8F8F2] border border-[#B6ECD7] text-[#16B77A] text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#16B77A] shrink-0" />
                        <span>
                          {data.fulfillmentStatus === "COMPLETED" ? "COMPLETED" : "ALREADY DISPATCHED"} — Provider Order #{data.latestFulfillment?.externalOrderId || "Active"}
                        </span>
                      </div>
                    ) : !runtimeFlags.liveFulfillment ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#FEF6E7] border border-[#FDE68A] text-[#D97706] text-xs font-semibold">
                        <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
                        <span>LIVE FULFILLMENT DISABLED (Kill Switch Active)</span>
                      </div>
                    ) : (
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => setIsSubmitModalOpen(true)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit to Peakerr (Primary Only)</span>
                      </AdminButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </AdminCard>

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
          <div className="p-3 rounded-[8px] bg-[#F7F9FA] border border-[#E3E8EA] font-mono space-y-1 text-[#142126]">
            <p>Order ID: <strong className="text-[#142126]">{dryRunOrderId}</strong></p>
            <p>Primary Service ID: <strong className="text-[#0F8F8A]">{dryRunResult?.primaryServiceId || dryRunResult?.data?.primaryServiceId}</strong></p>
            <p>Quantity: <strong className="text-[#142126]">{dryRunResult?.quantity || dryRunResult?.data?.quantity}</strong></p>
            <p>Target: <strong className="text-[#142126]">{dryRunResult?.target || dryRunResult?.data?.target}</strong></p>
          </div>
          <p className="text-[#D97706] font-medium">
            ⚠️ This action will consume live Peakerr balance and execute fulfillment.
          </p>
          <div className="pt-2 space-y-1.5">
            <label className="block text-[#65737A] font-bold">
              Type <span className="text-[#142126] font-mono bg-[#F7F9FA] px-1.5 py-0.5 rounded border border-[#E3E8EA]">SUBMIT</span> to confirm:
            </label>
            <input
              type="text"
              placeholder="SUBMIT"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full bg-white border border-[#D1D9DC] rounded-[8px] p-2.5 text-[#142126] font-mono text-xs focus:outline-none focus:border-[#EF4444] uppercase"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#EDF1F2]">
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
