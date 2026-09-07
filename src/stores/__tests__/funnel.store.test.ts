import { describe, expect, it, beforeEach } from "vitest";
import { useFunnelStore } from "@/stores/funnel.store";

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
});
