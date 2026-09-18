import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { IOS_STOREFRONT_CONTRACT, CONTRACT_STANDARD, CONTRACT_LARGE, CONTRACT_COMPACT } from "../platform/ios-storefront.contract";

describe("iOS Standard Fit Geometry & Regression Suite (375px - 413px)", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");

  const stdBlock = canonicalCss.slice(
    canonicalCss.indexOf("@media (min-width: 375px) and (max-width: 413px)"),
    canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)")
  );

  const largeBlock = canonicalCss.slice(
    canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)")
  );

  it("1. Goal Grid Geometry: Standard uses 6px gap and proportional 1.20fr / 0.90fr columns", () => {
    expect(CONTRACT_STANDARD.geometry.goalGap).toBe("6px");
    expect(CONTRACT_STANDARD.goals.buttonGap).toBe("6px");
    expect(CONTRACT_STANDARD.goals.buttonPadding).toBe("0 4px");

    expect(stdBlock).toContain("--cf-ios-goal-gap: 6px;");
    expect(stdBlock).toContain("--ios-control-goal-padding: 0 4px;");
    expect(stdBlock).toContain("grid-template-columns: minmax(0, 1.20fr) minmax(0, 0.90fr) minmax(0, 0.90fr) !important;");
  });

  it("2. Network Grid Geometry: Standard uses 5px gap, 4 columns, and calibrated height", () => {
    expect(CONTRACT_STANDARD.geometry.platformGap).toBe("5px");
    expect(CONTRACT_STANDARD.networks.buttonHeight).toBe("78px");
    expect(CONTRACT_STANDARD.networks.labelFontSize).toBe("14px");

    expect(stdBlock).toContain("--cf-ios-platform-gap: 5px;");
    expect(stdBlock).toContain("grid-template-columns: repeat(4, minmax(0, 1fr)) !important;");
    expect(stdBlock).toContain("gap: var(--cf-ios-platform-gap) !important;");
  });

  it("3. Typography Hierarchy: Hero & Builder Head remain unchanged, internal controls calibrated", () => {
    expect(CONTRACT_STANDARD.hero.h1SpanFontSize).toBe("25px");
    expect(CONTRACT_STANDARD.hero.h1BFontSize).toBe("25px");
    expect(CONTRACT_STANDARD.hero.subtitleFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.builderHead.eyebrowFontSize).toBe("16px");
    expect(CONTRACT_STANDARD.builderHead.titleFontSize).toBe("24px");
    expect(CONTRACT_STANDARD.builderHead.descriptionFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.stepLabels.labelBFontSize).toBe("16px");
    expect(CONTRACT_STANDARD.stepLabels.labelSmallFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.goals.labelFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.networks.labelFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.inputs.fieldLabelFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.inputs.inputTextFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.inputs.privacyFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.analyzeCta.textFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.pwaBanner.titleFontSize).toBe("16px");
    expect(CONTRACT_STANDARD.pwaBanner.subtitleFontSize).toBe("14.5px");
  });

  it("4. Builder Subtitle 375px: Sub-range 375-389 balances line break without changing font size", () => {
    expect(canonicalCss).toContain("@media (min-width: 375px) and (max-width: 389px)");
    expect(canonicalCss).toContain("max-width: 250px !important;");
    expect(IOS_STOREFRONT_CONTRACT.standardFitGeometry.builderSubtitleMaxWidth375).toBe("250px");
  });

  it("5. PWA Banner Geometry: Standard recovers horizontal padding and gap safely", () => {
    expect(stdBlock).toContain('[data-testid="public-pwa-banner"]');
    expect(stdBlock).toContain("padding-left: 10px !important;");
    expect(stdBlock).toContain("padding-right: 10px !important;");
    expect(IOS_STOREFRONT_CONTRACT.standardFitGeometry.pwaPaddingHorizontal).toBe("10px");
  });

  it("6. LARGE Frozen: Large block remains 100% frozen with 8px goal gap and 7px network gap", () => {
    expect(largeBlock).toContain("--cf-ios-goal-gap: 8px;");
    expect(largeBlock).toContain("--cf-ios-platform-gap: 7px;");
    expect(largeBlock).toContain("--ios-control-goal-padding: 0 5px;");
    expect(largeBlock).toContain("grid-template-columns: minmax(0, 1.14fr) minmax(0, 0.93fr) minmax(0, 0.93fr) !important;");
    expect(largeBlock).toContain("padding: 6px 2px !important;");
    expect(largeBlock).toContain("top: -6px !important;");
    expect(largeBlock).toContain("right: -4px !important;");
  });

  it("7. COMPACT Untouched: Compact <=374 remains 100% frozen", () => {
    expect(CONTRACT_COMPACT.geometry.pageGutter).toBe("10px");
    expect(CONTRACT_COMPACT.geometry.goalGap).toBe("5px");
    expect(CONTRACT_COMPACT.geometry.platformGap).toBe("4px");
  });
});
