import { describe, expect, it, beforeEach } from "vitest";
import { useFunnelStore, purgeLegacyFunnelStorage } from "@/stores/funnel.store";

describe("funnel analysis reset", () => {
  beforeEach(() => {
    useFunnelStore.getState().reset();
  });

  it("clears analysis and checkout selections while preserving customer inputs", () => {
    const store = useFunnelStore.getState();
    store.setPlatform("instagram");
    store.setService("followers");
    store.setEmail("creator@example.com");
    store.setDraftIdentifier("@creator");
    store.setUsername("creator");
    store.setTarget({
      targetType: "profile",
      targetValue: "creator",
      targetUrl: "https://instagram.com/creator",
      socialUsername: "creator",
      profileUrl: "https://instagram.com/creator",
      verifiedTargetData: { username: "creator", followers_count: 1234 },
      verificationStatus: "success",
    });
    store.setProfileData({ username: "creator", avatar_url: "avatar.jpg" });
    store.setPlan("plan_starter");
    store.setNiche("fashion", "streetwear");
    store.setSelectedMedia(["post-1"]);

    useFunnelStore.getState().resetAnalysis();
    const reset = useFunnelStore.getState();

    expect(reset.platformSlug).toBe("instagram");
    expect(reset.serviceSlug).toBeNull();
    expect(reset.email).toBe("creator@example.com");
    expect(reset.draftIdentifier).toBe("@creator");
    expect(reset.username).toBeNull();
    expect(reset.profileData).toBeNull();
    expect(reset.targetType).toBeNull();
    expect(reset.targetValue).toBeNull();
    expect(reset.targetUrl).toBeNull();
    expect(reset.socialUsername).toBeNull();
    expect(reset.profileUrl).toBeNull();
    expect(reset.verifiedTargetData).toBeNull();
    expect(reset.verificationStatus).toBe("idle");
    expect(reset.planId).toBeNull();
    expect(reset.nicheId).toBeNull();
    expect(reset.customNiche).toBeNull();
    expect(reset.selectedMedia).toBeNull();
    expect(reset.getReadiness().canShowPlans).toBe(false);
    expect(reset.getReadiness().canCheckout).toBe(false);
  });

  it("preserves the typed target draft while clearing the analyzed target", () => {
    const store = useFunnelStore.getState();
    store.setEmail("creator@example.com");
    store.setDraftIdentifier("@creator");
    store.setPlatform("instagram");
    store.setService("followers");
    store.setTarget({
      targetType: "profile",
      targetValue: "creator",
      socialUsername: "creator",
      verifiedTargetData: { username: "creator" },
      verificationStatus: "success",
    });

    useFunnelStore.getState().resetAnalysis();
    expect(useFunnelStore.getState().draftIdentifier).toBe("@creator");
    expect(useFunnelStore.getState().targetValue).toBeNull();
  });

  it("resetTarget preserves email and platform/service while clearing target and plan", () => {
    const store = useFunnelStore.getState();
    store.setPlatform("instagram");
    store.setService("followers");
    store.setEmail("creator@example.com");
    store.setDraftIdentifier("@creator");
    store.setTarget({
      targetType: "profile",
      targetValue: "creator",
      socialUsername: "creator",
      verifiedTargetData: { username: "creator" },
      verificationStatus: "success",
    });
    store.setPlan("plan_starter");

    store.resetTarget();

    const current = useFunnelStore.getState();
    expect(current.platformSlug).toBe("instagram");
    expect(current.serviceSlug).toBe("followers");
    expect(current.email).toBe("creator@example.com");
    expect(current.draftIdentifier).toBe("@creator");
    expect(current.targetValue).toBeNull();
    expect(current.verifiedTargetData).toBeNull();
    expect(current.verificationStatus).toBe("idle");
    expect(current.planId).toBeNull();
  });

  it("resetAfterCheckoutReturn clears ALL funnel data including email and target draft", () => {
    const store = useFunnelStore.getState();
    store.setPlatform("instagram");
    store.setService("followers");
    store.setEmail("creator@example.com");
    store.setDraftIdentifier("@creator");
    store.setUsername("creator");
    store.setTarget({
      targetType: "profile",
      targetValue: "creator",
      targetUrl: "https://instagram.com/creator",
      socialUsername: "creator",
      profileUrl: "https://instagram.com/creator",
      verifiedTargetData: { username: "creator", followers_count: 1234 },
      verificationStatus: "success",
    });
    store.setProfileData({ username: "creator", avatar_url: "avatar.jpg" });
    store.setPlan("plan_starter");
    store.setNiche("fashion", "streetwear");
    store.setSelectedMedia(["post-1"]);

    useFunnelStore.getState().resetAfterCheckoutReturn();
    const reset = useFunnelStore.getState();

    expect(reset.platformSlug).toBeNull();
    expect(reset.serviceSlug).toBeNull();
    expect(reset.email).toBeNull();
    expect(reset.draftIdentifier).toBeNull();
    expect(reset.username).toBeNull();
    expect(reset.profileData).toBeNull();
    expect(reset.targetType).toBeNull();
    expect(reset.targetValue).toBeNull();
    expect(reset.targetUrl).toBeNull();
    expect(reset.socialUsername).toBeNull();
    expect(reset.profileUrl).toBeNull();
    expect(reset.verifiedTargetData).toBeNull();
    expect(reset.verificationStatus).toBe("idle");
    expect(reset.planId).toBeNull();
    expect(reset.nicheId).toBeNull();
    expect(reset.customNiche).toBeNull();
    expect(reset.selectedMedia).toBeNull();
    expect(reset.getReadiness().canShowPlans).toBe(false);
    expect(reset.getReadiness().canCheckout).toBe(false);
  });
});

describe("funnel sessionStorage persistence and legacy cleanup", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    useFunnelStore.getState().reset();
  });

  it("TESTE 1: funnel-session-v1 is written to sessionStorage on state changes", () => {
    const store = useFunnelStore.getState();
    store.setEmail("session_test@example.com");
    store.setPlatform("instagram");
    store.setService("followers");

    const sessionRaw = window.sessionStorage.getItem("funnel-session-v1");
    expect(sessionRaw).not.toBeNull();
    const sessionData = JSON.parse(sessionRaw!);
    expect(sessionData.state.email).toBe("session_test@example.com");
    expect(sessionData.state.platformSlug).toBe("instagram");
    expect(sessionData.state.serviceSlug).toBe("followers");
  });

  it("TESTE 2: funnel-storage-v3 is NOT used for new persistence in localStorage", () => {
    const store = useFunnelStore.getState();
    store.setEmail("new_user@example.com");
    store.setDraftIdentifier("@newuser");

    expect(window.localStorage.getItem("funnel-storage-v3")).toBeNull();
  });

  it("TESTE 3: legacy funnel-storage-v3 is removed from localStorage by purgeLegacyFunnelStorage", () => {
    window.localStorage.setItem("funnel-storage-v3", JSON.stringify({ state: { email: "old@example.com" } }));
    expect(window.localStorage.getItem("funnel-storage-v3")).not.toBeNull();

    purgeLegacyFunnelStorage();

    expect(window.localStorage.getItem("funnel-storage-v3")).toBeNull();
  });

  it("TESTE 4: cf_aid_v1 is NOT removed when purging legacy storage", () => {
    window.localStorage.setItem("cf_aid_v1", "test-visitor-uuid-1234");
    window.localStorage.setItem("funnel-storage-v3", "stale-data");

    purgeLegacyFunnelStorage();

    expect(window.localStorage.getItem("funnel-storage-v3")).toBeNull();
    expect(window.localStorage.getItem("cf_aid_v1")).toBe("test-visitor-uuid-1234");
  });

  it("TESTE 5: cloutflow_coupon and cloutflow_coupon_code are NOT removed when purging legacy storage", () => {
    window.localStorage.setItem("cloutflow_coupon", "FLOW25");
    window.localStorage.setItem("cloutflow_coupon_code", "FLOW25");
    window.localStorage.setItem("funnel-storage-v3", "stale-data");

    purgeLegacyFunnelStorage();

    expect(window.localStorage.getItem("funnel-storage-v3")).toBeNull();
    expect(window.localStorage.getItem("cloutflow_coupon")).toBe("FLOW25");
    expect(window.localStorage.getItem("cloutflow_coupon_code")).toBe("FLOW25");
  });

  it("TESTE 6: cloutflow:return-home-after-checkout is NOT removed from sessionStorage", () => {
    window.sessionStorage.setItem("cloutflow:return-home-after-checkout", "1");
    window.localStorage.setItem("funnel-storage-v3", "stale-data");

    purgeLegacyFunnelStorage();

    expect(window.sessionStorage.getItem("cloutflow:return-home-after-checkout")).toBe("1");
  });

  it("TESTE 7: refresh/rehydration from the same sessionStorage preserves funnel data", async () => {
    const initialSessionState = {
      state: {
        platformSlug: "tiktok",
        serviceSlug: "followers",
        email: "persistent@example.com",
        draftIdentifier: "@persistent",
        targetType: "profile",
        targetValue: "persistent",
        socialUsername: "persistent",
        profileUrl: "https://tiktok.com/@persistent",
        verifiedTargetData: { username: "persistent" },
        verificationStatus: "success",
        planId: "plan_growth",
      },
      version: 0,
    };
    window.sessionStorage.setItem("funnel-session-v1", JSON.stringify(initialSessionState));

    // Rehydrate by calling rehydrate on persist API
    await useFunnelStore.persist.rehydrate();

    const state = useFunnelStore.getState();
    expect(state.platformSlug).toBe("tiktok");
    expect(state.serviceSlug).toBe("followers");
    expect(state.email).toBe("persistent@example.com");
    expect(state.draftIdentifier).toBe("@persistent");
    expect(state.targetType).toBe("profile");
    expect(state.targetValue).toBe("persistent");
    expect(state.verifiedTargetData).toEqual({ username: "persistent" });
    expect(state.verificationStatus).toBe("success");
    expect(state.planId).toBe("plan_growth");
  });

  it("TESTE 8: a fresh empty sessionStorage initializes a clean funnel", async () => {
    window.sessionStorage.clear();
    useFunnelStore.getState().reset();
    await useFunnelStore.persist.rehydrate();

    const state = useFunnelStore.getState();
    expect(state.platformSlug).toBeNull();
    expect(state.serviceSlug).toBeNull();
    expect(state.email).toBeNull();
    expect(state.draftIdentifier).toBeNull();
    expect(state.targetValue).toBeNull();
    expect(state.verifiedTargetData).toBeNull();
    expect(state.verificationStatus).toBe("idle");
    expect(state.planId).toBeNull();
    expect(state.getReadiness().canShowPlans).toBe(false);
    expect(state.getReadiness().canCheckout).toBe(false);
  });
});
