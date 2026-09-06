import { describe, expect, it } from "vitest";
import ServiceSalesLandingPage from "@/app/[platform]/[service]/page";

describe("service deep links", () => {
  it.each([["instagram", "followers"], ["tiktok", "followers"], ["x", "views"], ["youtube", "likes"]])("renders %s/%s without redirect", async (platform, service) => {
    const element = await ServiceSalesLandingPage({ params: Promise.resolve({ platform, service }) });
    expect(element).toBeTruthy();
  });
});
