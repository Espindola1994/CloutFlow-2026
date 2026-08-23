"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Power
} from "lucide-react";
import { Plan, OrderBumpOffer, UpsellOffer, Coupon, AbTest, Platform } from "../types";
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

interface GrowthModuleProps {
  bumps: OrderBumpOffer[];
  upsells: UpsellOffer[];
  coupons: Coupon[];
  abTests: AbTest[];
}

export function GrowthModule({ bumps, upsells, coupons, abTests }: GrowthModuleProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "offers" | "coupons" | "ab" | "test_offers">("plans");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  
  // Real Offers State from Supabase
  const [offersList, setOffersList] = useState<Plan[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [isRefreshingOffers, setIsRefreshingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const triggerRevalidate = useAdminRevalidate();

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [formPlatform, setFormPlatform] = useState<Platform>("instagram");
  const [formService, setFormService] = useState("followers");
  const [formName, setFormName] = useState("");
  const [formQuantity, setFormQuantity] = useState("1000");
  const [formPrice, setFormPrice] = useState("9.99");
  const [formOldPrice, setFormOldPrice] = useState("19.99");
  const [formBadge, setFormBadge] = useState("");
  const [formPopular, setFormPopular] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formBenefits, setFormBenefits] = useState("");
  const [formCtaText, setFormCtaText] = useState("");
  const [formCheckoutUrl, setFormCheckoutUrl] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formPlanId, setFormPlanId] = useState("");
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

  const openCreateModal = () => {
    setEditingOfferId(null);
    setFormPlatform("instagram");
    setFormService("followers");
    setFormName("");
    setFormQuantity("1000");
    setFormPrice("9.99");
    setFormOldPrice("19.99");
    setFormBadge("");
    setFormPopular(false);
    setFormSortOrder("0");
    setFormBenefits("");
    setFormCtaText("");
    setFormCheckoutUrl("");
    setFormProductId("");
    setFormPlanId("");
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (offer: Plan) => {
    setEditingOfferId(offer.id);
    setFormPlatform(offer.platform);
    setFormService(offer.service);
    setFormName(offer.name);
    setFormQuantity(offer.quantity.toString());
    setFormPrice(offer.price.toFixed(2));
    setFormOldPrice(offer.oldPrice ? offer.oldPrice.toFixed(2) : "");
    setFormBadge(offer.tag || "");
    setFormPopular(Boolean(offer.popular));
    setFormSortOrder(offer.sortOrder !== undefined ? offer.sortOrder.toString() : "0");
    setFormBenefits(Array.isArray(offer.benefits) ? offer.benefits.join("\n") : "");
    setFormCtaText(offer.ctaText || "");
    setFormCheckoutUrl(offer.checkoutUrl || "");
    setFormProductId(offer.perfectpayProductId || "");
    setFormPlanId(offer.perfectpayPlanId || "");
    setFormActive(offer.active);
    setIsModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formQuantity || !formPrice) return;

    setFormLoading(true);
    try {
      const priceCents = Math.round(parseFloat(formPrice) * 100);
      const oldPriceCents = formOldPrice ? Math.round(parseFloat(formOldPrice) * 100) : null;
      const slug = `${formPlatform}-${formService}-${formQuantity}`.toLowerCase();
      const sortOrder = parseInt(formSortOrder, 10) || 0;
      const benefitsArray = formBenefits
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean);

      if (editingOfferId) {
        // PATCH existing offer
          const res = await fetch(`/api/admin/offers/${editingOfferId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform: formPlatform,
              service: formService,
              slug,
              name: formName,
            quantity: parseInt(formQuantity, 10),
            priceCents,
            oldPriceCents,
            currency: "USD",
            badge: formBadge ? formBadge.trim() : null,
            isPopular: formPopular,
            sortOrder,
            benefits: benefitsArray.length > 0 ? benefitsArray : null,
            ctaText: formCtaText ? formCtaText.trim() : null,
            externalCheckoutUrl: formCheckoutUrl ? formCheckoutUrl.trim() : null,
            perfectpayProductId: formProductId ? formProductId.trim() : null,
            perfectpayPlanId: formPlanId ? formPlanId.trim() : null,
            active: formActive,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setIsModalOpen(false);
          fetchOffers(false);
          triggerRevalidate("offers", true);
        } else {
          alert(json.error?.message || "Error updating offer");
        }
      } else {
        // POST new offer
        const res = await fetch("/api/admin/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: formPlatform,
            service: formService,
            name: formName,
            slug,
            quantity: parseInt(formQuantity, 10),
            priceCents,
            oldPriceCents: oldPriceCents || undefined,
            currency: "USD",
            badge: formBadge ? formBadge.trim() : undefined,
            isPopular: formPopular,
            sortOrder,
            benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
            ctaText: formCtaText ? formCtaText.trim() : undefined,
            externalCheckoutUrl: formCheckoutUrl ? formCheckoutUrl.trim() : null,
            perfectpayProductId: formProductId ? formProductId.trim() : null,
            perfectpayPlanId: formPlanId ? formPlanId.trim() : null,
            active: true,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setIsModalOpen(false);
          fetchOffers(false);
          triggerRevalidate("offers", true);
        } else {
          alert(json.error?.message || "Error creating offer");
        }
      }
    } catch {
      alert("Error submitting offer to server");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (offer: Plan) => {
    // Optimistic toggle in local UI
    setOffersList((prev) =>
      prev.map((p) => (p.id === offer.id ? { ...p, active: !p.active } : p))
    );

    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !offer.active }),
      });
      if (res.ok) {
        fetchOffers(true);
        triggerRevalidate("offers", true);
      } else {
        // Rollback on failure
        fetchOffers(false);
      }
    } catch {
      fetchOffers(false);
    }
  };

  const filteredPlans = offersList.filter((p) => platformFilter === "all" || p.platform === platformFilter);

  return (
    <div className="space-y-6">
      {/* Module Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[650] text-[#142126] tracking-tight">
            Growth / Offers
          </h1>
          <p className="text-[13px] text-[#65737A] mt-0.5">
            Manage social growth products, pricing and commercial campaigns.
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
            Live Offers ({offersList.length})
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03),0_4px_12px_rgba(10,35,42,0.02)]">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] px-3 py-2 text-[12px] text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A] cursor-pointer"
            >
              <option value="all">All Networks</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X (Twitter)</option>
              <option value="youtube">YouTube</option>
            </select>

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
                Add Offer
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
                <h4 className="text-[13px] font-semibold text-[#142126]">No offer records created yet</h4>
                <p className="text-[11px] text-[#65737A] mt-1 max-w-sm mx-auto">
                  Click &quot;Add Offer&quot; above to persist a new commercial package linked to PerfectPay.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block">
                  <AdminTable>
                    <AdminTableHeader>
                      <AdminTableRow>
                        <AdminTableHead>Platform</AdminTableHead>
                        <AdminTableHead>Service</AdminTableHead>
                        <AdminTableHead>Package Name</AdminTableHead>
                        <AdminTableHead className="text-right">Quantity</AdminTableHead>
                        <AdminTableHead className="text-right">Price (USD)</AdminTableHead>
                        <AdminTableHead>PerfectPay Linkage</AdminTableHead>
                        <AdminTableHead className="text-center">Status</AdminTableHead>
                        <AdminTableHead className="text-right">Actions</AdminTableHead>
                      </AdminTableRow>
                    </AdminTableHeader>
                    <AdminTableBody>
                      {filteredPlans.map((p) => {
                        const hasLinkage = Boolean(p.perfectpayProductId && p.perfectpayPlanId);
                        const hasCheckout = Boolean(p.checkoutUrl);

                        return (
                          <AdminTableRow key={p.id}>
                            <AdminTableCell>
                              <div className="flex items-center gap-2">
                                <PlatformIcon platform={p.platform} size={18} />
                                <span className="capitalize font-semibold text-[#142126]">{p.platform}</span>
                              </div>
                            </AdminTableCell>
                            <AdminTableCell className="capitalize text-[#65737A] font-medium">
                              {p.service}
                            </AdminTableCell>
                            <AdminTableCell className="font-semibold text-[#142126]">
                              {p.name}
                            </AdminTableCell>
                            <AdminTableCell className="text-right font-mono text-[#142126]">
                              {p.quantity.toLocaleString()}
                            </AdminTableCell>
                            <AdminTableCell className="text-right font-bold text-[#142126] font-mono">
                              ${p.price.toFixed(2)}
                            </AdminTableCell>
                            <AdminTableCell>
                              <div className="space-y-0.5 font-mono text-[11px]">
                                {hasLinkage ? (
                                  <span className="text-[#16B77A] flex items-center gap-1 font-semibold">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    <span>Prod: {p.perfectpayProductId} · Plan: {p.perfectpayPlanId}</span>
                                  </span>
                                ) : (
                                  <span className="text-[#D97706] text-[11px] font-medium">
                                    Missing {!p.perfectpayProductId ? "Product Code" : "Plan Code"}
                                  </span>
                                )}
                                {hasCheckout && (
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
                              <div className="flex items-center justify-end gap-1.5">
                                <AdminIconButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(p)}
                                  title="Edit Offer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </AdminIconButton>
                                <AdminIconButton
                                  variant={p.active ? "danger" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleActive(p)}
                                  title={p.active ? "Deactivate Offer" : "Activate Offer"}
                                >
                                  <Power className="w-3.5 h-3.5" />
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
                          label: "PerfectPay", 
                          value: p.perfectpayProductId && p.perfectpayPlanId 
                            ? `P:${p.perfectpayProductId} / Pl:${p.perfectpayPlanId}` 
                            : "Not Linked" 
                        },
                      ]}
                      actions={
                        <div className="flex items-center gap-2 pt-2 border-t border-[#D9E2E3]">
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
      <AdminModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingOfferId ? "Edit Offer Package" : "Create New Offer"}
        description="Configure package metadata, pricing and PerfectPay product linkage."
      >
        <form onSubmit={handleSaveOffer} className="space-y-4 text-[12px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-[#142126] font-semibold block mb-1">Platform</label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value as Platform)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
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
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
                >
                <option value="followers">Followers</option>
                <option value="likes">Likes</option>
                <option value="views">Views</option>
                <option value="comments">Comments</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[#142126] font-semibold block mb-1">Offer Name</label>
            <input
              type="text"
              placeholder="e.g. 1,000 High-Quality Followers"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] focus:outline-hidden focus:border-[#0F8F8A]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[#142126] font-semibold block mb-1">Service Quantity</label>
              <input
                type="number"
                placeholder="e.g. 2000"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
                required
              />
              <span className="text-[10px] text-[#8A979D] block mt-0.5">Delivered per order</span>
            </div>
            <div>
              <label className="text-[#142126] font-semibold block mb-1">Price ($ USD)</label>
              <input
                type="text"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
                required
              />
            </div>
            <div>
              <label className="text-[#142126] font-semibold block mb-1">Old Price ($ USD)</label>
              <input
                type="text"
                value={formOldPrice}
                onChange={(e) => setFormOldPrice(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
              />
            </div>
          </div>

          {/* Marketing & Card Customization */}
          <div className="pt-2 border-t border-[#D9E2E3] space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Card Badge</label>
                <input
                  type="text"
                  placeholder="e.g. MOST POPULAR"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Sort Position (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
              <div>
                <label className="text-[#142126] font-semibold block mb-1">Button CTA Text</label>
                <input
                  type="text"
                  placeholder="e.g. GET STARTED"
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
            </div>

            <div>
              <label className="text-[#142126] font-semibold block mb-1">Custom Feature Bullets (1 per line)</label>
              <textarea
                rows={3}
                placeholder="Fast start&#10;No password required&#10;Secure checkout"
                value={formBenefits}
                onChange={(e) => setFormBenefits(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="formPopular"
                checked={formPopular}
                onChange={(e) => setFormPopular(e.target.checked)}
                className="rounded-xs border-[#D9E2E3] text-[#0F8F8A] focus:ring-[#0F8F8A]"
              />
              <label htmlFor="formPopular" className="text-[#142126] font-medium cursor-pointer">
                Featured Card (Highlighted badge, default focus)
              </label>
            </div>
          </div>

          <div>
            <label className="text-[#142126] font-semibold block mb-1">External Checkout URL (https://)</label>
            <input
              type="url"
              placeholder="https://checkout.perfectpay.com.br/pay/..."
              value={formCheckoutUrl}
              onChange={(e) => setFormCheckoutUrl(e.target.value)}
              className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
            />
          </div>

          {/* PerfectPay Integration Section */}
          <div className="pt-3 border-t border-[#D9E2E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#142126] uppercase tracking-wider">
                PerfectPay Integration
              </span>
              <span className="px-2 py-0.5 rounded-[4px] bg-[#EAF6F5] text-[#0F8F8A] font-semibold text-[10px] border border-[#B9E3E0]">
                Gateway: PerfectPay
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#65737A] font-semibold block mb-1">PerfectPay Product Code (`product.code`)</label>
                <input
                  type="text"
                  placeholder="e.g. PP_PROD_123"
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
              <div>
                <label className="text-[#65737A] font-semibold block mb-1">PerfectPay Plan Code (`plan.code`)</label>
                <input
                  type="text"
                  placeholder="e.g. PP_PLAN_456"
                  value={formPlanId}
                  onChange={(e) => setFormPlanId(e.target.value)}
                  className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-[7px] p-2.5 text-[#142126] placeholder:text-[#8A979D] font-mono text-[11px] focus:outline-hidden focus:border-[#0F8F8A]"
                />
              </div>
            </div>
          </div>

          {editingOfferId && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="formActive"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded-xs border-[#D9E2E3] text-[#0F8F8A] focus:ring-[#0F8F8A]"
              />
              <label htmlFor="formActive" className="text-[#142126] font-medium cursor-pointer">
                Offer is active and visible in the public funnel
              </label>
            </div>
          )}

          <div className="pt-4 border-t border-[#D9E2E3] flex items-center justify-end gap-2">
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
              {formLoading ? "Saving..." : editingOfferId ? "Update Offer" : "Save Offer"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
