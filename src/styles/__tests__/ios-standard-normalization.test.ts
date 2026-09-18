import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore
import { JSDOM } from "jsdom";
import { CONTRACT_STANDARD, CONTRACT_LARGE, CONTRACT_COMPACT } from "../platform/ios-storefront.contract";

describe("iOS Standard Normalization to Large Regression Suite", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");

  it("1. Verifies that 375, 390, 393, 402, 413 match Standard calibrated values", () => {
    // Both STANDARD and LARGE share hero, header, and analyze tokens
    expect(CONTRACT_STANDARD.hero.h1SpanFontSize).toBe("25px");
    expect(CONTRACT_STANDARD.hero.h1BFontSize).toBe("25px");
    expect(CONTRACT_STANDARD.hero.subtitleFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.header.logoHeight).toBe("40px");
    expect(CONTRACT_STANDARD.header.taglineFontSize).toBe("15.5px");
    expect(CONTRACT_STANDARD.geometry.pageGutter).toBe("8px");
    expect(CONTRACT_STANDARD.geometry.builderPadding).toBe("8px");
    // Standard internal builder controls density calibrated
    expect(CONTRACT_STANDARD.goals.labelFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.goals.buttonHeight).toBe("60px");
    expect(CONTRACT_STANDARD.networks.labelFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.networks.buttonHeight).toBe("78px");
    expect(CONTRACT_STANDARD.inputs.fieldLabelFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.inputs.inputHeight).toBe("45px");
    expect(CONTRACT_STANDARD.inputs.inputTextFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.inputs.privacyFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.analyzeCta.buttonHeight).toBe("49px");
    expect(CONTRACT_STANDARD.analyzeCta.textFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.pwaBanner.titleFontSize).toBe("16px");
    expect(CONTRACT_STANDARD.pwaBanner.subtitleFontSize).toBe("14.5px");
  });

  it("2. Verifies responsive copy swaps are active in STANDARD iOS block", () => {
    const stdBlock = canonicalCss.slice(
      canonicalCss.indexOf("@media (min-width: 375px) and (max-width: 413px)"),
      canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)")
    );

    expect(stdBlock).toContain(".cf-hero-subtitle-ios-large {\n    display: inline !important;");
    expect(stdBlock).toContain(".cf-pb-analyze-desc-ios-large {\n    display: inline !important;");
    expect(stdBlock).toContain(".cf-pb-privacy-desc-ios-large {\n    display: inline !important;");
    expect(stdBlock).toContain(".cf-pwa-subtitle-ios-large {\n    display: inline !important;");
  });

  it("3. Verifies LARGE contract block is frozen and untouched", () => {
    const largeBlock = canonicalCss.slice(
      canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)")
    );

    expect(largeBlock).toContain("--cf-ios-content-max: 440px;");
    expect(largeBlock).toContain("--ios-type-hero-h1-span: 25px;");
    expect(largeBlock).toContain("--ios-control-platform-height: 84px;");
    expect(largeBlock).toContain("grid-template-columns: minmax(0, 1.14fr) minmax(0, 0.93fr) minmax(0, 0.93fr) !important;");
    expect(largeBlock).toContain("top: -6px !important;");
  });

  it("4. Negative test: Compact <=374 does not receive Standard normalized tokens", () => {
    expect(CONTRACT_COMPACT.hero.h1SpanFontSize).toBe("31px");
    expect(CONTRACT_COMPACT.header.logoHeight).toBe("35px");
    expect(CONTRACT_COMPACT.goals.buttonHeight).toBe("64px");
    expect(CONTRACT_COMPACT.geometry.pageGutter).toBe("10px");
  });
});
