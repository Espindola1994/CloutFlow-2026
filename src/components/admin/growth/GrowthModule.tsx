"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAdminAutoRefresh, useAdminRevalidate } from "@/hooks/useAdminAutoRefresh";
import { 
  Sparkles, 
  Tag, 
  Percent, 
  Split, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Edit3,
  Power,
  Trash2,
  Filter,
  Check,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame,
  Zap,
  Gem,
  Star
} from "lucide-react";
import { OrderBumpOffer, UpsellOffer, Coupon, AbTest } from "../types";
import { TestOffersTab } from "./TestOffersTab";
import {
  AdminButton,
  AdminIconButton,
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
import { 
  CANONICAL_PLANS, 
  PLATFORM_SERVICES, 
  CommercialPlatform, 
  CommercialService, 
  CommercialPlan, 
  getCanonicalCatalogPackage,
  evaluateCheckoutStatus,
  computeCommercialDiagnostics,
  validateCheckoutUrl
} from "@/services/commercial-offer.resolver";

interface GrowthModuleProps {
  bumps: OrderBumpOffer[];
  upsells: UpsellOffer[];
  coupons: Coupon[];
  abTests: AbTest[];
}

export interface OfferAdminItem {
  id: string;
  platform: CommercialPlatform;
  service: CommercialService;
  plan: CommercialPlan;
  name: string;
  slug: string;
  description?: string;
  quantity: number;
  bonus: number;
  price: number;
  priceCents: number;
  oldPrice?: number;
  oldPriceCents?: number;
  currency: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  deliveryText?: string;
  refillText?: string;
  qualityText?: string;
  popular?: boolean;
  checkoutUrl?: string;
  perfectpayProductId?: string;
  perfectpayPlanId?: string;
  syncHome: boolean;
  syncOfferStep3: boolean;
  active: boolean;
  sortOrder: number;
  benefits?: string[];
  ctaText?: string;
  updatedAt?: string;
}

export function GrowthModule({ bumps, upsells, coupons, abTests }: GrowthModuleProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "offers" | "coupons" | "ab" | "test_offers">("plans");
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [checkoutFilter, setCheckoutFilter] = useState<string>("all"); // 'all' | 'ready' | 'incomplete' | 'missing'
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'all' | 'active' | 'inactive'
  
  // Offers state
  const [offersList, setOffersList] = useState<OfferAdminItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [isRefreshingOffers, setIsRefreshingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const triggerRevalidate = useAdminRevalidate();

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<OfferAdminItem | null>(null);

  // Form Fields (Controlled & Auto-prefilled)
  const [formPlatform, setFormPlatform] = useState<CommercialPlatform>("instagram");
  const [formService, setFormService] = useState<CommercialService>("followers");
  const [formPlan, setFormPlan] = useState<CommercialPlan>("starter");
  const [formQuantity, setFormQuantity] = useState("2000");
  const [formBonus, setFormBonus] = useState("0");
  const [formPrice, setFormPrice] = useState("14.90");
  const [formOldPrice, setFormOldPrice] = useState("19.90");
  const [formBadge, setFormBadge] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDeliveryText, setFormDeliveryText] = useState("");
  const [formRefillText, setFormRefillText] = useState("");
  const [formQualityText, setFormQualityText] = useState("");
  const [formPopular, setFormPopular] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formBenefits, setFormBenefits] = useState("");
  const [formCtaText, setFormCtaText] = useState("");
  const [formCheckoutUrl, setFormCheckoutUrl] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formPlanId, setFormPlanId] = useState("");
  const [formSyncHome, setFormSyncHome] = useState(true);
  const [formSyncStep3, setFormSyncStep3] = useState(true);
  const [formActive, setFormActive] = useState(true);

  const fetchOffers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingOffers(true);
      else setIsRefreshingOffers(true);
      setOffersError(null);
      const res = await fetch("/api/admin/offers");
      const json = await res.json();
      if (res.ok && json.success) {
        setOffersList(json.data.items || []);
      } else {
        if (!silent) setOffersError(json.error?.message || "Failed to load offers");
      }
    } catch {
      if (!silent) setOffersError("Unable to connect to offers API");
    } finally {
      setLoadingOffers(false);
      setIsRefreshingOffers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "plans") {
      fetchOffers(false);
    }
  }, [activeTab, fetchOffers]);

  // Realtime subscription + event revalidation + window focus
  useAdminAutoRefresh({
    entities: ["offers"],
    supabaseTables: ["offers", "coupons"],
    pollInterval: 30000,
    enabled: activeTab === "plans",
    onRevalidate: () => fetchOffers(true),
  });

  // Intelligent selector prefill helper
  const handleIdentityChange = (
    nextPlat: CommercialPlatform,
    nextServ: CommercialService,
    nextPlan: CommercialPlan
  ) => {
    setFormPlatform(nextPlat);
    // Enforce valid service for platform
    const validServices = PLATFORM_SERVICES[nextPlat] || ['followers'];
    const safeServ = validServices.includes(nextServ) ? nextServ : validServices[0];
    setFormService(safeServ);
    setFormPlan(nextPlan);

    // Look for existing saved configuration
    const match = offersList.find(
      (o) => o.platform === nextPlat && o.service === safeServ && (o.plan === nextPlan || o.name.toLowerCase() === nextPlan)
    );

    if (match) {
      // Load saved data
      setFormQuantity(match.quantity.toString());
      setFormBonus(match.bonus ? match.bonus.toString() : "0");
      setFormPrice(match.price.toFixed(2));
      setFormOldPrice(match.oldPrice ? match.oldPrice.toFixed(2) : "");
      setFormBadge(match.badge || "");
      setFormTitle(match.title || "");
      setFormSubtitle(match.subtitle || "");
      setFormDeliveryText(match.deliveryText || "");
      setFormRefillText(match.refillText || "");
      setFormQualityText(match.qualityText || "");
      setFormPopular(Boolean(match.popular));
      setFormSortOrder(match.sortOrder.toString());
      setFormBenefits(Array.isArray(match.benefits) ? match.benefits.join("\n") : "");
      setFormCtaText(match.ctaText || "");
      setFormCheckoutUrl(match.checkoutUrl || "");
      setFormProductId(match.perfectpayProductId || "");
      setFormPlanId(match.perfectpayPlanId || "");
      setFormSyncHome(match.syncHome ?? true);
      setFormSyncStep3(match.syncOfferStep3 ?? true);
      setFormActive(match.active);
    } else {
      // Load canonical default
      const canonical = getCanonicalCatalogPackage(nextPlat, safeServ, nextPlan);
      if (canonical) {
        setFormQuantity(canonical.quantity.toString());
        setFormBonus("0");
        setFormPrice((canonical.priceCents / 100).toFixed(2));
        setFormOldPrice((canonical.compareAtPriceCents / 100).toFixed(2));
        setFormBadge(canonical.badge || "");
        setFormTitle("");
        setFormSubtitle("");
        setFormDeliveryText(canonical.deliveryText || "");
        setFormRefillText(canonical.refillText || "");
        setFormQualityText(canonical.qualityText || "");
        setFormPopular(false);
        setFormSortOrder("0");
        setFormBenefits(canonical.features.join("\n"));
        setFormCtaText("Get Started Now");
        setFormCheckoutUrl("");
        setFormProductId("");
        setFormPlanId("");
        setFormSyncHome(true);
        setFormSyncStep3(true);
        setFormActive(true);
      }
    }
  };

  const openCreateModal = () => {
    setEditingOfferId(null);
    handleIdentityChange("instagram", "followers", "starter");
    setIsModalOpen(true);
  };

  const openEditModal = (offer: OfferAdminItem) => {
    setEditingOfferId(offer.id);
    setFormPlatform(offer.platform);
    setFormService(offer.service);
    setFormPlan(offer.plan || "starter");
    setFormQuantity(offer.quantity.toString());
    setFormBonus(offer.bonus ? offer.bonus.toString() : "0");
    setFormPrice(offer.price.toFixed(2));
    setFormOldPrice(offer.oldPrice ? offer.oldPrice.toFixed(2) : "");
    setFormBadge(offer.badge || "");
    setFormTitle(offer.title || "");
    setFormSubtitle(offer.subtitle || "");
    setFormDeliveryText(offer.deliveryText || "");
    setFormRefillText(offer.refillText || "");
    setFormQualityText(offer.qualityText || "");
    setFormPopular(Boolean(offer.popular));
    setFormSortOrder(offer.sortOrder !== undefined ? offer.sortOrder.toString() : "0");
    setFormBenefits(Array.isArray(offer.benefits) ? offer.benefits.join("\n") : "");
    setFormCtaText(offer.ctaText || "");
    setFormCheckoutUrl(offer.checkoutUrl || "");
    setFormProductId(offer.perfectpayProductId || "");
    setFormPlanId(offer.perfectpayPlanId || "");
    setFormSyncHome(offer.syncHome ?? true);
    setFormSyncStep3(offer.syncOfferStep3 ?? true);
    setFormActive(offer.active);
    setIsModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuantity || !formPrice) return;

    setFormLoading(true);
    setOffersError(null);

    const priceCents = Math.round(parseFloat(formPrice) * 100);
    const oldPriceCents = formOldPrice ? Math.round(parseFloat(formOldPrice) * 100) : null;
    const planObj = CANONICAL_PLANS.find((p) => p.key === formPlan);
    const planDisplayName = planObj ? planObj.displayName : formPlan;

    const payload = {
      platform: formPlatform,
      service: formService,
      name: planDisplayName,
      slug: `${formPlatform}-${formService}-${formPlan}`,
      quantity: parseInt(formQuantity, 10),
      bonusQuantity: parseInt(formBonus || "0", 10),
      priceCents,
      oldPriceCents,
      currency: "USD",
      badge: formBadge ? formBadge.trim() : null,
      title: formTitle ? formTitle.trim() : null,
      subtitle: formSubtitle ? formSubtitle.trim() : null,
      deliveryText: formDeliveryText ? formDeliveryText.trim() : null,
      refillText: formRefillText ? formRefillText.trim() : null,
      qualityText: formQualityText ? formQualityText.trim() : null,
      isPopular: formPopular,
      sortOrder: parseInt(formSortOrder || "0", 10),
      benefits: formBenefits ? formBenefits.split("\n").map((b) => b.trim()).filter(Boolean) : null,
      ctaText: formCtaText ? formCtaText.trim() : null,
      externalCheckoutUrl: formCheckoutUrl ? formCheckoutUrl.trim() : null,
      perfectpayProductId: formProductId ? formProductId.trim() : null,
      perfectpayPlanId: formPlanId ? formPlanId.trim() : null,
      syncHome: formSyncHome,
      syncOfferStep3: formSyncStep3,
      active: formActive,
    };

    try {
      const url = editingOfferId ? `/api/admin/offers/${editingOfferId}` : "/api/admin/offers";
      const method = editingOfferId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchOffers(false);
        triggerRevalidate("offers", true);
      } else {
        setOffersError(json.error?.message || "Failed to save offer configuration");
      }
    } catch {
      setOffersError("Network connection error while saving offer");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (offer: OfferAdminItem) => {
    try {
      // Optimistic update
      setOffersList((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, active: !item.active } : item))
      );

      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !offer.active }),
      });

      if (res.ok) {
        fetchOffers(true);
        triggerRevalidate("offers", true);
      } else {
        fetchOffers(false);
      }
    } catch {
      fetchOffers(false);
    }
  };

  const confirmDeleteOffer = (offer: OfferAdminItem) => {
    setItemToDelete(offer);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteOffer = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/admin/offers/${itemToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        fetchOffers(false);
        triggerRevalidate("offers", true);
      } else {
        const json = await res.json();
        setOffersError(json.error?.message || "Failed to delete offer override");
      }
    } catch {
      setOffersError("Network error while deleting offer override");
    }
  };

  // Administrative diagnostics & progress calculation
  const diagnostics = useMemo(() => {
    return computeCommercialDiagnostics(offersList);
  }, [offersList]);

  // Filter computation
  const filteredPlans = useMemo(() => {
    return offersList.filter((p) => {
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (serviceFilter !== "all" && p.service !== serviceFilter) return false;
      if (planFilter !== "all" && (p.plan !== planFilter && p.name.toLowerCase() !== planFilter)) return false;
      
      const evalStatus = evaluateCheckoutStatus(p.perfectpayProductId, p.perfectpayPlanId, p.checkoutUrl);
      if (checkoutFilter === "ready" && evalStatus.status !== "READY") return false;
      if (checkoutFilter === "incomplete" && evalStatus.status !== "INCOMPLETE") return false;
      if (checkoutFilter === "missing" && evalStatus.status !== "MISSING") return false;

      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "inactive" && p.active) return false;

      return true;
    });
  }, [offersList, platformFilter, serviceFilter, planFilter, checkoutFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Module Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[650] text-[#142126] tracking-tight">
            Growth / Offers
          </h1>
          <p className="text-[13px] text-[#65737A] mt-0.5">
            Centralized commercial control & real-time sync for all 66 CloutFlow cards.
          </p>
        </div>

        <div className="flex items-center bg-[#FFFFFF] border border-[#D9E2E3] rounded-[8px] p-1 text-[12px] font-semibold shadow-[0_1px_2px_rgba(10,35,42,0.03)] self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "plans"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            Commercial Cards ({offersList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("offers")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "offers"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            Bumps & Upsells
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "coupons"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            Coupons ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ab")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "ab"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            A/B Tests ({abTests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("test_offers")}
            className={`px-3.5 py-1.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "test_offers"
                ? "bg-[#071D26] text-white shadow-xs font-semibold"
                : "text-[#65737A] hover:text-[#142126]"
            }`}
          >
            Test Offers
          </button>
        </div>
      </div>

      {/* 1. PLANS / OFFERS TAB */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          {/* Diagnostic Progress Summary for all 66 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-3 shadow-xs">
              <div className="text-[11px] font-medium text-[#65737A]">Total Cards</div>
              <div className="text-[18px] font-bold text-[#142126] mt-0.5">{diagnostics.counters.totalCards} / 66</div>
              <div className="text-[10px] text-[#0F8F8A] font-semibold mt-0.5">Commercial Catalog</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#B9E9D7] rounded-[9px] p-3 shadow-xs bg-[#E8F8F2]/30">
              <div className="text-[11px] font-medium text-[#16B77A] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16B77A]" />
                Checkout Ready
              </div>
              <div className="text-[18px] font-bold text-[#16B77A] mt-0.5">{diagnostics.counters.checkoutReady}</div>
              <div className="text-[10px] text-[#65737A] mt-0.5">Prod + Plan + URL</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#FED7AA] rounded-[9px] p-3 shadow-xs bg-[#FFFBEB]/50">
              <div className="text-[11px] font-medium text-[#D97706] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                Incomplete
              </div>
              <div className="text-[18px] font-bold text-[#D97706] mt-0.5">{diagnostics.counters.checkoutIncomplete}</div>
              <div className="text-[10px] text-[#65737A] mt-0.5">Partial config</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-3 shadow-xs bg-[#F8FAFC]">
              <div className="text-[11px] font-medium text-[#65737A] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8A979D]" />
                Missing
              </div>
              <div className="text-[18px] font-bold text-[#65737A] mt-0.5">{diagnostics.counters.checkoutMissing}</div>
              <div className="text-[10px] text-[#65737A] mt-0.5">Not configured</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-3 shadow-xs">
              <div className="text-[11px] font-medium text-[#65737A]">Product Codes</div>
              <div className="text-[18px] font-bold text-[#142126] mt-0.5">{diagnostics.counters.productCodeConfigured}</div>
              <div className="text-[10px] text-[#65737A] mt-0.5">PerfectPay Prod</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-3 shadow-xs">
              <div className="text-[11px] font-medium text-[#65737A]">Plan Codes</div>
              <div className="text-[18px] font-bold text-[#142126] mt-0.5">{diagnostics.counters.planCodeConfigured}</div>
              <div className="text-[10px] text-[#65737A] mt-0.5">PerfectPay Plan</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[9px] p-3 shadow-xs">
              <div className="text-[11px] font-medium text-[#65737A]">Checkout URLs</div>
              <div className="text-[18px] font-bold text-[#142126] mt-0.5">{diagnostics.counters.checkoutUrlConfigured}</div>
              <div className="text-[10px] text-[#65737A] mt-0.5">Centerpag HTTPS</div>
            </div>
          </div>

          {/* Duplicate Warnings Banner */}
          {diagnostics.duplicateWarnings.length > 0 && (
            <div className="p-3.5 rounded-[9px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[12px] space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
                <span>WARNING: DUPLICATE CHECKOUT METADATA DETECTED ({diagnostics.duplicateWarnings.length})</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                {diagnostics.duplicateWarnings.map((w, idx) => (
                  <li key={idx}>
                    <span className="font-semibold">{w.type === 'DUPLICATE_CHECKOUT_URL' ? 'Duplicate URL' : 'Duplicate Product+Plan'}:</span>{' '}
                    <code className="bg-[#FEF3C7] px-1 py-0.5 rounded text-[10px]">{w.value}</code> shared across{' '}
                    <span className="font-medium">
                      {w.identities.map((i) => `${i.platform} ${i.service} ${i.plan}`).join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-2.5 py-1.5 text-[11px] text-[#142126] font-semibold focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">Platform: All</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X (Twitter)</option>
                <option value="youtube">YouTube</option>
              </select>

              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-2.5 py-1.5 text-[11px] text-[#142126] font-semibold focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">Service: All</option>
                <option value="followers">Followers</option>
                <option value="likes">Likes</option>
                <option value="views">Views</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-2.5 py-1.5 text-[11px] text-[#142126] font-semibold focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">Plan: All</option>
                <option value="starter">Starter</option>
                <option value="boost">Boost</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
                <option value="elite">Elite</option>
                <option value="max">Max</option>
              </select>

              <select
                value={checkoutFilter}
                onChange={(e) => setCheckoutFilter(e.target.value)}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-2.5 py-1.5 text-[11px] text-[#142126] font-semibold focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">Checkout: All</option>
                <option value="ready">Ready ({diagnostics.counters.checkoutReady})</option>
                <option value="incomplete">Incomplete ({diagnostics.counters.checkoutIncomplete})</option>
                <option value="missing">Missing ({diagnostics.counters.checkoutMissing})</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-2.5 py-1.5 text-[11px] text-[#142126] font-semibold focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {isRefreshingOffers && (
                <span className="text-[11px] text-[#0F8F8A] font-medium animate-pulse flex items-center gap-1 bg-[#EAF6F5] px-2 py-0.5 rounded-full border border-[#0F8F8A]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8F8A] animate-ping" />
                  Updating...
                </span>
              )}
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => fetchOffers(false)}
                disabled={loadingOffers || isRefreshingOffers}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${(loadingOffers || isRefreshingOffers) ? "animate-spin" : ""}`} />
                Refresh
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={openCreateModal}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Configure Card
              </AdminButton>
            </div>
          </div>

          {offersError && (
            <div className="p-3.5 rounded-[8px] bg-[#FEECEB] border border-[#FCA5A5] text-[#EF4444] text-[12px] flex items-center justify-between">
              <span>{offersError}</span>
              <button
                type="button"
                onClick={() => fetchOffers(false)}
                className="flex items-center gap-1 font-semibold underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
            {filteredPlans.length === 0 ? (
              <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
                <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-[13px] font-semibold text-[#142126]">No commercial cards match the current filter</h4>
                <p className="text-[11px] text-[#65737A] mt-1 max-w-sm mx-auto">
                  Reset filters or configure a card using the button above.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <AdminTable>
                    <AdminTableHeader>
                      <AdminTableRow>
                        <AdminTableHead>Identity</AdminTableHead>
                        <AdminTableHead className="text-right">Quantity</AdminTableHead>
                        <AdminTableHead className="text-right">Price</AdminTableHead>
                        <AdminTableHead className="text-center">Sync Surfaces</AdminTableHead>
                        <AdminTableHead>Checkout & PerfectPay</AdminTableHead>
                        <AdminTableHead className="text-center">Status</AdminTableHead>
                        <AdminTableHead className="text-right">Actions</AdminTableHead>
                      </AdminTableRow>
                    </AdminTableHeader>
                    <AdminTableBody>
                      {filteredPlans.map((p) => {
                        const hasProductCode = Boolean(p.perfectpayProductId);
                        const hasPlanCode = Boolean(p.perfectpayPlanId);
                        const hasCheckoutUrl = Boolean(p.checkoutUrl);
                        const isFullyConfigured = hasProductCode && hasPlanCode && hasCheckoutUrl;

                        return (
                          <AdminTableRow key={p.id}>
                            <AdminTableCell>
                              <div className="flex items-center gap-2">
                                <PlatformIcon platform={p.platform} size={18} />
                                <div>
                                  <div className="font-semibold text-[#142126] flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.badge && (
                                      <span className="px-1.5 py-0.2 bg-[#F4F5F6] text-[#42526E] text-[9px] font-bold rounded">
                                        {p.badge}
                                      </span>
                                    )}
                                  </div>
                                  <span className="capitalize text-[#65737A] text-[11px]">
                                    {p.platform} • {p.service}
                                  </span>
                                </div>
                              </div>
                            </AdminTableCell>

                            <AdminTableCell className="text-right font-mono text-[#142126]">
                              <div className="font-semibold">{p.quantity.toLocaleString()}</div>
                              {p.bonus > 0 && (
                                <div className="text-[10px] text-[#16B77A]">+{p.bonus.toLocaleString()} bonus</div>
                              )}
                            </AdminTableCell>

                            <AdminTableCell className="text-right font-mono">
                              <div className="font-bold text-[#142126]">${p.price.toFixed(2)}</div>
                              {p.oldPrice && (
                                <div className="text-[10px] text-[#8A979D] line-through">${p.oldPrice.toFixed(2)}</div>
                              )}
                            </AdminTableCell>

                            <AdminTableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span 
                                  title={p.syncHome ? "Home Sync Active" : "Home Sync Disabled"}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    p.syncHome ? "bg-[#EAF6F5] text-[#0F8F8A] border border-[#B9E3E0]" : "bg-[#F1F5F5] text-[#8A979D]"
                                  }`}
                                >
                                  HOME
                                </span>
                                <span 
                                  title={p.syncOfferStep3 ? "Step 3 Sync Active" : "Step 3 Sync Disabled"}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    p.syncOfferStep3 ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]" : "bg-[#F1F5F5] text-[#8A979D]"
                                  }`}
                                >
                                  STEP 3
                                </span>
                              </div>
                            </AdminTableCell>

                            <AdminTableCell>
                              <div className="space-y-1 font-mono text-[11px]">
                                {(() => {
                                  const evalStatus = evaluateCheckoutStatus(p.perfectpayProductId, p.perfectpayPlanId, p.checkoutUrl);
                                  if (evalStatus.status === 'READY') {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E8F8F2] text-[#16B77A] font-bold text-[10px] border border-[#B9E9D7]">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        CHECKOUT READY
                                      </span>
                                    );
                                  }
                                  if (evalStatus.status === 'INCOMPLETE') {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] font-bold text-[10px] border border-[#FED7AA]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                        CHECKOUT INCOMPLETE
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F5] text-[#8A979D] font-bold text-[10px] border border-[#D9E2E3]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8A979D]" />
                                      CHECKOUT MISSING
                                    </span>
                                  );
                                })()}
                                
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#65737A]">
                                  <span className={`px-1 py-0.2 rounded font-medium ${p.perfectpayProductId ? 'bg-[#EAF6F5] text-[#0F8F8A]' : 'bg-[#F1F5F5] text-[#8A979D]'}`}>
                                    Prod: {p.perfectpayProductId ? 'Configured' : 'Missing'}
                                  </span>
                                  <span className={`px-1 py-0.2 rounded font-medium ${p.perfectpayPlanId ? 'bg-[#EAF6F5] text-[#0F8F8A]' : 'bg-[#F1F5F5] text-[#8A979D]'}`}>
                                    Plan: {p.perfectpayPlanId ? 'Configured' : 'Missing'}
                                  </span>
                                  <span className={`px-1 py-0.2 rounded font-medium ${validateCheckoutUrl(p.checkoutUrl) ? 'bg-[#EAF6F5] text-[#0F8F8A]' : 'bg-[#F1F5F5] text-[#8A979D]'}`}>
                                    URL: {validateCheckoutUrl(p.checkoutUrl) ? 'Configured' : 'Missing'}
                                  </span>
                                </div>

                                {p.checkoutUrl && (
                                  <span className="text-[#8A979D] flex items-center gap-1 text-[10px] truncate max-w-[200px]" title={p.checkoutUrl}>
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" /> {p.checkoutUrl}
                                  </span>
                                )}
                              </div>
                            </AdminTableCell>

                            <AdminTableCell className="text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                                p.active 
                                  ? "bg-[#E8F8F2] text-[#16B77A] border border-[#B9E9D7]" 
                                  : "bg-[#F1F5F5] text-[#65737A] border border-[#D9E2E3]"
                              }`}>
                                {p.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </AdminTableCell>

                            <AdminTableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <AdminIconButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(p)}
                                  title="Edit Card Commercial Settings"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </AdminIconButton>
                                <AdminIconButton
                                  variant={p.active ? "danger" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleActive(p)}
                                  title={p.active ? "Deactivate Override" : "Activate Override"}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </AdminIconButton>
                                <AdminIconButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => confirmDeleteOffer(p)}
                                  title="Delete Override (Card falls back to Catalog Default)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </AdminIconButton>
                              </div>
                            </AdminTableCell>
                          </AdminTableRow>
                        );
                      })}
                    </AdminTableBody>
                  </AdminTable>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {filteredPlans.map((p) => (
                    <MobileDataCard
                      key={p.id}
                      platform={p.platform}
                      title={p.name}
                      subtitle={`${p.platform} • ${p.service}`}
                      status={
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                          p.active 
                            ? "bg-[#E8F8F2] text-[#16B77A] border border-[#B9E9D7]" 
                            : "bg-[#F1F5F5] text-[#65737A] border border-[#D9E2E3]"
                        }`}>
                          {p.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      }
                      metrics={[
                        { label: "Quantity", value: p.quantity.toLocaleString() },
                        { label: "Price", value: `$${p.price.toFixed(2)}` },
                        { 
                          label: "Checkout", 
                          value: p.checkoutUrl && p.perfectpayProductId && p.perfectpayPlanId ? "CONFIGURED" : "MISSING" 
                        },
                      ]}
                      actions={
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D9E2E3]">
                          <div className="flex items-center gap-1.5">
                            <AdminButton
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(p)}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </AdminButton>
                            <AdminButton
                              variant={p.active ? "danger" : "outline"}
                              size="sm"
                              onClick={() => handleToggleActive(p)}
                            >
                              <Power className="w-3.5 h-3.5 mr-1" />
                              {p.active ? "Deactivate" : "Activate"}
                            </AdminButton>
                          </div>
                          <AdminButton
                            variant="danger"
                            size="sm"
                            onClick={() => confirmDeleteOffer(p)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </AdminButton>
                        </div>
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. ORDER BUMPS & UPSELLS */}
      {activeTab === "offers" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                  ORDER BUMPS (CHECKOUT)
                </h3>
                <span className="text-[12px] font-semibold text-[#65737A]">{bumps.length} Configured</span>
              </div>
              <p className="text-[12px] text-[#65737A] mb-6">Micro-offers rendered in the 1-click checkout flow</p>
            </div>

            <div className="py-12 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
              <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
                <Tag className="w-5 h-5" />
              </div>
              <p className="text-[12px] font-semibold text-[#65737A]">No active order bump offers</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                  POST-PURCHASE UPSELLS
                </h3>
                <span className="text-[12px] font-semibold text-[#65737A]">{upsells.length} Configured</span>
              </div>
              <p className="text-[12px] text-[#65737A] mb-6">One-click post payment high-ticket offers</p>
            </div>

            <div className="py-12 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
              <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
                <Percent className="w-5 h-5" />
              </div>
              <p className="text-[12px] font-semibold text-[#65737A]">No post-purchase upsells active</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. COUPONS TAB */}
      {activeTab === "coupons" && (
        <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                PROMOTIONAL COUPONS
              </h3>
              <p className="text-[12px] text-[#65737A] mt-0.5">Discount vouchers for marketing and cart recovery</p>
            </div>
          </div>

          <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
            <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
              <Tag className="w-5 h-5" />
            </div>
            <h4 className="text-[13px] font-semibold text-[#142126]">No coupons active</h4>
            <p className="text-[11px] text-[#65737A] mt-1 max-w-sm mx-auto">
              Promotional codes will be persisted in database table `coupons` when configured.
            </p>
          </div>
        </div>
      )}

      {/* 4. A/B TESTS TAB */}
      {activeTab === "ab" && (
        <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 md:p-6 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_5px_16px_rgba(10,35,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">
                SPLIT PRICING & FUNNEL TESTS
              </h3>
              <p className="text-[12px] text-[#65737A] mt-0.5">Automated conversion rate optimization experiments</p>
            </div>
          </div>

          <div className="py-16 text-center rounded-[8px] bg-[#FAFCFC] border border-[#D9E2E3]">
            <div className="w-10 h-10 rounded-full bg-[#EAF6F5] text-[#0F8F8A] flex items-center justify-center mx-auto mb-2">
              <Split className="w-5 h-5" />
            </div>
            <h4 className="text-[13px] font-semibold text-[#142126]">No active A/B experiments</h4>
            <p className="text-[11px] text-[#65737A] mt-1 max-w-sm mx-auto">
              Launch split-testing between price points to discover conversion sweet spots.
            </p>
          </div>
        </div>
      )}

      {/* 5. TEST OFFERS TAB */}
      {activeTab === "test_offers" && <TestOffersTab />}

      {/* CREATE / EDIT MODAL */}
      <AdminModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingOfferId ? "Edit Commercial Card Override" : "Configure Commercial Card"}
        description="Select card identity to automatically load canonical catalog pricing, customize parameters, and attach PerfectPay checkout."
      >
        <form onSubmit={handleSaveOffer} className="space-y-4 text-[12px]">
          {/* SECTION 1: IDENTIFICATION */}
          <div className="p-3 bg-[#F8FAFB] border border-[#E4E9EC] rounded-[8px] space-y-3">
            <span className="text-[11px] font-bold text-[#142126] uppercase tracking-wider block">
              1. Card Identification
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Platform</label>
                <select
                  value={formPlatform}
                  onChange={(e) => handleIdentityChange(e.target.value as CommercialPlatform, formService, formPlan)}
                  disabled={Boolean(editingOfferId)}
                  className="w-full bg-[#FFFFFF] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A]"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="text-[#142126] font-semibold block mb-1">Service</label>
                <select
                  value={formService}
                  onChange={(e) => handleIdentityChange(formPlatform, e.target.value as CommercialService, formPlan)}
                  disabled={Boolean(editingOfferId)}
                  className="w-full bg-[#FFFFFF] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A]"
                >
                  {(PLATFORM_SERVICES[formPlatform] || ['followers']).map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#142126] font-semibold block mb-1">Plan</label>
                <select
                  value={formPlan}
                  onChange={(e) => handleIdentityChange(formPlatform, formService, e.target.value as CommercialPlan)}
                  disabled={Boolean(editingOfferId)}
                  className="w-full bg-[#FFFFFF] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A]"
                >
                  {CANONICAL_PLANS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: COMMERCIAL CARD METRICS */}
          <div className="p-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[8px] space-y-3">
            <span className="text-[11px] font-bold text-[#142126] uppercase tracking-wider block">
              2. Commercial Card Data
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-mono focus:outline-hidden focus:border-[#0F8F8A]"
                  required
                />
              </div>

              <div>
                <label className="text-[#142126] font-semibold block mb-1">Bonus</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formBonus}
                  onChange={(e) => setFormBonus(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-mono focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>

              <div>
                <label className="text-[#142126] font-semibold block mb-1">Price ($ USD)</label>
                <input
                  type="text"
                  placeholder="14.90"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-mono focus:outline-hidden focus:border-[#0F8F8A]"
                  required
                />
              </div>

              <div>
                <label className="text-[#142126] font-semibold block mb-1">Compare-at ($)</label>
                <input
                  type="text"
                  placeholder="19.90"
                  value={formOldPrice}
                  onChange={(e) => setFormOldPrice(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] font-mono focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Card Badge (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MOST POPULAR"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] placeholder:text-[#8A979D] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Button CTA Text</label>
                <input
                  type="text"
                  placeholder="e.g. Get Started Now"
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] placeholder:text-[#8A979D] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
            </div>

            <div>
              <label className="text-[#142126] font-semibold block mb-1">Custom Feature Bullets (1 per line)</label>
              <textarea
                rows={2}
                placeholder="Instant Delivery&#10;High Retention&#10;24/7 Support"
                value={formBenefits}
                onChange={(e) => setFormBenefits(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
              />
            </div>
          </div>

          {/* SECTION 3: PERFECTPAY CONFIGURATION */}
          <div className="p-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[8px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#142126] uppercase tracking-wider">
                3. PerfectPay / Centerpag Integration
              </span>
              {(() => {
                const s = evaluateCheckoutStatus(formProductId, formPlanId, formCheckoutUrl);
                if (s.status === 'READY') {
                  return (
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#E8F8F2] text-[#16B77A] font-bold text-[10px] border border-[#B9E9D7]">
                      STATUS: CHECKOUT READY
                    </span>
                  );
                }
                if (s.status === 'INCOMPLETE') {
                  return (
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#D97706] font-bold text-[10px] border border-[#FED7AA]">
                      STATUS: CHECKOUT INCOMPLETE
                    </span>
                  );
                }
                return (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#F1F5F5] text-[#8A979D] font-bold text-[10px] border border-[#D9E2E3]">
                    STATUS: CHECKOUT MISSING
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#65737A] font-semibold block mb-1">PerfectPay Product Code</label>
                <input
                  type="text"
                  placeholder="e.g. PP_PROD_123"
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
              <div>
                <label className="text-[#65737A] font-semibold block mb-1">PerfectPay Plan Code</label>
                <input
                  type="text"
                  placeholder="e.g. PP_PLAN_456"
                  value={formPlanId}
                  onChange={(e) => setFormPlanId(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
            </div>

            <div>
              <label className="text-[#65737A] font-semibold block mb-1">Centerpag Checkout URL (https://)</label>
              <input
                type="url"
                placeholder="https://checkout.perfectpay.com.br/pay/..."
                value={formCheckoutUrl}
                onChange={(e) => setFormCheckoutUrl(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
              />
            </div>
          </div>

          {/* SECTION 4: SYNCHRONIZATION & STATUS */}
          <div className="p-3 bg-[#F8FAFB] border border-[#E4E9EC] rounded-[8px] space-y-2">
            <span className="text-[11px] font-bold text-[#142126] uppercase tracking-wider block">
              4. Surface Sync & Status
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formSyncHome"
                  checked={formSyncHome}
                  onChange={(e) => setFormSyncHome(e.target.checked)}
                  className="rounded-xs border-[#D9E2E3] text-[#0F8F8A] focus:ring-[#0F8F8A]"
                />
                <label htmlFor="formSyncHome" className="text-[#142126] font-medium cursor-pointer">
                  Sync to Home Page Card
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formSyncStep3"
                  checked={formSyncStep3}
                  onChange={(e) => setFormSyncStep3(e.target.checked)}
                  className="rounded-xs border-[#D9E2E3] text-[#0F8F8A] focus:ring-[#0F8F8A]"
                />
                <label htmlFor="formSyncStep3" className="text-[#142126] font-medium cursor-pointer">
                  Sync to Offers / Step 3 Card
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E4E9EC]">
              <input
                type="checkbox"
                id="formActive"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded-xs border-[#D9E2E3] text-[#0F8F8A] focus:ring-[#0F8F8A]"
              />
              <label htmlFor="formActive" className="text-[#142126] font-semibold cursor-pointer">
                Card Active (If disabled, falls back to canonical default)
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9E2E3] flex items-center justify-end gap-2">
            <AdminButton
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="primary"
              size="md"
              disabled={formLoading}
            >
              {formLoading ? "Saving..." : editingOfferId ? "Update Card Configuration" : "Save Card Configuration"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* DELETE CONFIRM MODAL */}
      <AdminModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove Override Configuration"
        description="Are you sure you want to remove this commercial override?"
      >
        <div className="space-y-4 text-[13px] text-[#142126]">
          <div className="p-3 rounded-[8px] bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318]">
            <p className="font-semibold">Notice: Card is NOT deleted from public catalogue.</p>
            <p className="text-[12px] mt-1 text-[#7A271A]">
              Removing this admin override will reset <strong>{itemToDelete?.platform} {itemToDelete?.service} {itemToDelete?.name}</strong> to the approved canonical pricing & quantities automatically.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton
              type="button"
              variant="outline"
              size="md"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="button"
              variant="danger"
              size="md"
              onClick={handleDeleteOffer}
            >
              Confirm Remove Override
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
