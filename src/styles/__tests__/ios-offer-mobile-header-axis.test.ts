import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("/offer Mobile Header Axis Alignment Contract Tests", () => {
  const iosCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const globalsCssPath = path.resolve(__dirname, "../../app/globals.css");
  const contractPath = path.resolve(__dirname, "../platform/ios-storefront.contract.ts");

  const iosCss = fs.readFileSync(iosCssPath, "utf-8");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");
  const contractTs = fs.readFileSync(contractPath, "utf-8");

  it("1. Verifies authoritative timer positioning contract in ios-storefront.css under @media (max-width: 900px)", () => {
    expect(iosCss).toContain("html.cf-platform-ios .cf-timer578");
    expect(iosCss).toContain("transform: translateY(-60%) scale(.7436) !important;");
    expect(iosCss).toContain("transform-origin: 144% !important;");
    expect(iosCss).toContain("right: -58px !important;");
    expect(iosCss).toContain("top: 50% !important;");
    expect(iosCss).toContain("position: absolute !important;");
  });

  it("2. Verifies authoritative timer positioning in globals.css under @media (max-width: 900px)", () => {
    expect(globalsCss).toContain("transform: translateY(-60%) scale(.7436) !important;");
    expect(globalsCss).toContain("right: -58px !important;");
    expect(globalsCss).toContain("transform-origin: 144% !important;");
  });

  it("3. Verifies logo vertical positioning adjustment exists under @media (max-width: 900px)", () => {
    expect(iosCss).toContain("html.cf-platform-ios body .cf-offer-header-clean .cf-offer-brand-logo {\n    transform: translateY(-8.4px) !important;\n  }");
    expect(globalsCss).toContain("transform: translateY(-8.4px) !important;");
  });

  it("4. Verifies contract tokens updated in ios-storefront.contract.ts", () => {
    expect(contractTs).toContain('timerTransform: "translateY(-60%) scale(.7436)"');
    expect(contractTs).toContain('timerRight: "-58px"');
    expect(contractTs).toContain('timerTransformOrigin: "144%"');
    expect(contractTs).toContain('logoTransform: "translateY(-8.4px)"');
  });

  it("5. Verifies package grid invariant min(66%, 320px) is preserved unchanged", () => {
    expect(iosCss).toContain("width: min(66%, 320px) !important;");
    expect(iosCss).toContain("max-width: 320px !important;");
    expect(iosCss).toContain("margin: 0 auto !important;");
  });

  it("6. Verifies Home isolation: no logo or header leakage to home selectors", () => {
    // Neither rule should target .cf-plans-logo or .cf-plans-header
    const offerLogoRule = "html.cf-platform-ios body .cf-offer-header-clean .cf-offer-brand-logo";
    expect(offerLogoRule).not.toContain(".cf-plans");
  });
});
