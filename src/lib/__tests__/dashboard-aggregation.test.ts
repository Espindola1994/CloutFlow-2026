import { describe, expect, it } from "vitest";
import { aggregateDashboardOrders } from "@/lib/dashboard-aggregation";

describe("dashboard order aggregation", () => {
  it("aggregates TikTok Followers and preserves platform regressions", () => {
    const result = aggregateDashboardOrders([
      { platform: "TikTok", service: "Followers", paymentStatus: "PAID", totalCents: 1490 },
      { platform: "Instagram", paymentStatus: "COMPLETED", totalCents: 1000 },
      { platform: "TikTok", paymentStatus: "APPROVED", totalCents: 2000 },
      { platform: "TikTok", paymentStatus: "PENDING", totalCents: 999 },
      { platform: "X", paymentStatus: "PAID", totalCents: 3000 },
      { platform: "YouTube", paymentStatus: "PAID", totalCents: 4000 },
    ], 114.9);
    expect(result.tiktok).toMatchObject({ count: 3, revenue: 34.9 });
    expect(result.instagram).toMatchObject({ count: 1, revenue: 10 });
    expect(result.youtube).toMatchObject({ count: 1, revenue: 40 });
    expect(result.twitter).toMatchObject({ count: 0, revenue: 0 });
  });
});
