"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Tag, 
  Percent, 
  Split, 
  Plus, 
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  X
} from "lucide-react";
import { Plan, OrderBumpOffer, UpsellOffer, Coupon, AbTest, Platform } from "../types";

interface GrowthModuleProps {
  bumps: OrderBumpOffer[];
  upsells: UpsellOffer[];
  coupons: Coupon[];
  abTests: AbTest[];
}

export function GrowthModule({ bumps, upsells, coupons, abTests }: GrowthModuleProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "offers" | "coupons" | "ab">("plans");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  
  // Real Offers State from Supabase
  const [offersList, setOffersList] = useState<Plan[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offersError, setOffersError] = useState<string | null>(null);

  // New Offer Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>("instagram");
  const [newService, setNewService] = useState("followers");
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1000");
  const [newPrice, setNewPrice] = useState("9.99");
  const [newOldPrice, setNewOldPrice] = useState("19.99");
  const [newCheckoutUrl, setNewCheckoutUrl] = useState("");

  const fetchOffers = async () => {
    try {
      setLoadingOffers(true);
      setOffersError(null);
      const res = await fetch("/api/admin/offers");
      const json = await res.json();
      if (res.ok && json.success) {
        setOffersList(json.data.items || []);
      } else {
        setOffersError(json.error?.message || "Failed to load offers");
      }
    } catch {
      setOffersError("Unable to connect to offers API");
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "plans") {
      fetchOffers();
    }
  }, [activeTab]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newQuantity || !newPrice) return;

    setCreateLoading(true);
    try {
      const priceCents = Math.round(parseFloat(newPrice) * 100);
      const oldPriceCents = newOldPrice ? Math.round(parseFloat(newOldPrice) * 100) : undefined;
      const slug = `${newPlatform}-${newService}-${newQuantity}`.toLowerCase();

      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newPlatform,
          service: newService,
          name: newName,
          slug,
          quantity: parseInt(newQuantity, 10),
          priceCents,
          oldPriceCents,
          currency: "USD",
          externalCheckoutUrl: newCheckoutUrl ? newCheckoutUrl.trim() : null,
          active: true,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsCreateModalOpen(false);
        setNewName("");
        setNewCheckoutUrl("");
        fetchOffers();
      } else {
        alert(json.error?.message || "Error creating offer");
      }
    } catch {
      alert("Error submitting offer to server");
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredPlans = offersList.filter((p) => platformFilter === "all" || p.platform === platformFilter);

  return (
    <div className="space-y-6">
      {/* Module Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Growth & Offers</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Manage real offer packages, external checkouts, coupons and A/B experiments</p>
        </div>

        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "plans" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Live Offers ({offersList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("offers")}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "offers" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Bumps & Upsells
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "coupons" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Coupons ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ab")}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "ab" ? "bg-neutral-800 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            A/B Tests ({abTests.length})
          </button>
        </div>
      </div>

      {/* 1. PLANS / OFFERS TAB */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-[#12161f] border border-neutral-800/80 rounded-2xl p-4 shadow-xs">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Networks</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X / Twitter</option>
              <option value="youtube">YouTube</option>
            </select>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Offer
            </button>
          </div>

          {offersError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
              <span>{offersError}</span>
              <button
                type="button"
                onClick={fetchOffers}
                className="flex items-center gap-1 font-bold underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
            {filteredPlans.length === 0 ? (
              <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
                <Sparkles className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-neutral-300">No offer records created yet</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Click &quot;Add Offer&quot; above to persist a new commercial package linked to an external checkout URL.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="pb-3 font-semibold">Platform</th>
                      <th className="pb-3 font-semibold">Service</th>
                      <th className="pb-3 font-semibold">Package Name</th>
                      <th className="pb-3 font-semibold">Quantity</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">External Checkout</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-medium">
                    {filteredPlans.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3.5 capitalize font-semibold">{p.platform}</td>
                        <td className="py-3.5 capitalize">{p.service}</td>
                        <td className="py-3.5 font-bold text-white">{p.name}</td>
                        <td className="py-3.5">{p.quantity.toLocaleString()}</td>
                        <td className="py-3.5 font-bold text-emerald-400">${p.price.toFixed(2)}</td>
                        <td className="py-3.5">
                          {p.checkoutUrl ? (
                            <span className="text-blue-400 flex items-center gap-1 font-mono text-[11px] truncate max-w-[200px]" title={p.checkoutUrl}>
                              <ExternalLink className="w-3 h-3 shrink-0" /> {p.checkoutUrl}
                            </span>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">None configured</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-500"
                          }`}>
                            {p.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ORDER BUMPS & UPSELLS */}
      {activeTab === "offers" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Order Bumps (Checkout)</h3>
                <span className="text-xs font-semibold text-neutral-400">{bumps.length} Configured</span>
              </div>
              <p className="text-xs text-neutral-400 mb-6">Micro-offers rendered in the 1-click checkout flow</p>
            </div>

            <div className="py-12 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
              <Tag className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-400">No active order bump offers</p>
            </div>
          </div>

          <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Post-Purchase Upsells</h3>
                <span className="text-xs font-semibold text-neutral-400">{upsells.length} Configured</span>
              </div>
              <p className="text-xs text-neutral-400 mb-6">One-click post payment high-ticket offers</p>
            </div>

            <div className="py-12 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
              <Percent className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-400">No post-purchase upsells active</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. COUPONS TAB */}
      {activeTab === "coupons" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Promotional Coupons</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Discount vouchers for marketing and cart recovery</p>
            </div>
          </div>

          <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
            <Tag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-300">No coupons active</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Promotional codes will be persisted in database table `coupons` when configured.
            </p>
          </div>
        </div>
      )}

      {/* 4. A/B TESTS TAB */}
      {activeTab === "ab" && (
        <div className="bg-[#12161f] border border-neutral-800/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Split Pricing & Funnel Tests</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Automated conversion rate optimization experiments</p>
            </div>
          </div>

          <div className="py-16 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/40">
            <Split className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-300">No active A/B experiments</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Launch split-testing between price points to discover conversion sweet spots.
            </p>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#12161f] border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Offer</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as Platform)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white"
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
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="followers">Followers</option>
                    <option value="likes">Likes</option>
                    <option value="views">Views</option>
                    <option value="comments">Comments</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Offer Name</label>
                <input
                  type="text"
                  placeholder="e.g. 1,000 High-Quality Followers"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white placeholder:text-neutral-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Price ($)</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Old Price ($)</label>
                  <input
                    type="text"
                    value={newOldPrice}
                    onChange={(e) => setNewOldPrice(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">External Checkout URL (https://)</label>
                <input
                  type="url"
                  placeholder="https://checkout.gateway.com/pay/..."
                  value={newCheckoutUrl}
                  onChange={(e) => setNewCheckoutUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white placeholder:text-neutral-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? "Saving..." : "Save Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
