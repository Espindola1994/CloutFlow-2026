import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  IOS_STOREFRONT_CONTRACT,
  CONTRACT_COMPACT,
  CONTRACT_STANDARD,
  CONTRACT_LARGE,
} from "../platform/ios-storefront.contract";

describe("iOS Standard Density Calibration Suite (375px - 413px)", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");

  const stdBlock = canonicalCss.slice(
    canonicalCss.indexOf("@media (min-width: 375px) and (max-width: 413px)"),
    canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)")
  );

  const largeBlock = canonicalCss.slice(
    canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)")
  );

  it("1. Standard Density Calibrations: Internal builder controls reduced by ~5-8%", () => {
    // Step typography
    expect(CONTRACT_STANDARD.stepLabels.labelBFontSize).toBe("16px");
    expect(CONTRACT_STANDARD.stepLabels.labelSmallFontSize).toBe("15px");
    expect(stdBlock).toContain("--ios-type-builder-label-b: 16px;");
    expect(stdBlock).toContain("--ios-type-builder-label-small: 15px;");

    // Goal cards
    expect(CONTRACT_STANDARD.goals.labelFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.goals.glyphSize).toBe("30px");
    expect(CONTRACT_STANDARD.goals.serviceIconSize).toBe("41px");
    expect(CONTRACT_STANDARD.goals.buttonHeight).toBe("60px");
    expect(stdBlock).toContain("--ios-type-goal-label: 15px;");
    expect(stdBlock).toContain("--ios-icon-goal-glyph: 30px;");
    expect(stdBlock).toContain("--ios-icon-goal-service: 41px;");
    expect(stdBlock).toContain("--ios-control-goal-height: 60px;");

    // Network cards
    expect(CONTRACT_STANDARD.networks.labelFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.networks.platformImageSize).toBe("40px");
    expect(CONTRACT_STANDARD.networks.buttonHeight).toBe("78px");
    expect(stdBlock).toContain("--ios-type-platform-label: 14px;");
    expect(stdBlock).toContain("--ios-type-platform-label-narrow: 14px;");
    expect(stdBlock).toContain("--ios-icon-platform-image: 40px;");
    expect(stdBlock).toContain("--ios-control-platform-height: 78px;");

    // Fields & privacy
    expect(CONTRACT_STANDARD.inputs.fieldLabelFontSize).toBe("15px");
    expect(CONTRACT_STANDARD.inputs.inputTextFontSize).toBe("14px");
    expect(CONTRACT_STANDARD.inputs.privacyFontSize).toBe("14px");
    expect(stdBlock).toContain("--ios-type-field-label: 15px;");
    expect(stdBlock).toContain("--ios-type-input-text: 14px;");
    expect(stdBlock).toContain("--ios-type-privacy-text: 14px;");
  });

  it("2. Hero & Builder Top Hierarchy strictly preserved in Standard (ZERO change)", () => {
    expect(CONTRACT_STANDARD.hero.h1SpanFontSize).toBe("25px");
    expect(CONTRACT_STANDARD.hero.h1BFontSize).toBe("25px");
    expect(CONTRACT_STANDARD.hero.subtitleFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.builderHead.eyebrowFontSize).toBe("16px");
    expect(CONTRACT_STANDARD.builderHead.titleFontSize).toBe("24px");
    expect(CONTRACT_STANDARD.builderHead.descriptionFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.analyzeCta.textFontSize).toBe("16.5px");
    expect(CONTRACT_STANDARD.analyzeCta.buttonHeight).toBe("49px");
    expect(CONTRACT_STANDARD.analyzeCta.svgSize).toBe("31px");
    expect(CONTRACT_STANDARD.stepLabels.badgeSize).toBe("33px");
    expect(CONTRACT_STANDARD.stepLabels.badgeFontSize).toBe("16.5px");

    expect(stdBlock).toContain("--ios-type-hero-h1-span: 25px;");
    expect(stdBlock).toContain("--ios-type-hero-h1-b: 25px;");
    expect(stdBlock).toContain("--ios-type-hero-subtitle: 16.5px;");
    expect(stdBlock).toContain("--ios-type-builder-eyebrow: 16px;");
    expect(stdBlock).toContain("--ios-type-builder-title: 24px;");
    expect(stdBlock).toContain("--ios-type-builder-description: 16.5px;");
    expect(stdBlock).toContain("--ios-type-analyze-text: 16.5px;");
    expect(stdBlock).toContain("--ios-control-analyze-height: 49px;");
  });

  it("3. Standard 9ca15c0 Geometry Preserved: Goal gap 6px, padding 0 4px, network gap 5px", () => {
    expect(CONTRACT_STANDARD.geometry.goalGap).toBe("6px");
    expect(CONTRACT_STANDARD.geometry.platformGap).toBe("5px");
    expect(CONTRACT_STANDARD.goals.buttonPadding).toBe("0 4px");
    expect(stdBlock).toContain("grid-template-columns: minmax(0, 1.20fr) minmax(0, 0.90fr) minmax(0, 0.90fr) !important;");
    expect(stdBlock).toContain("grid-template-columns: repeat(4, minmax(0, 1fr)) !important;");
  });

  it("4. Boundary Guard: 414px+ (LARGE) does NOT receive density reduction and remains FROZEN", () => {
    expect(CONTRACT_LARGE.stepLabels.labelBFontSize).toBe("17px");
    expect(CONTRACT_LARGE.stepLabels.labelSmallFontSize).toBe("16px");
    expect(CONTRACT_LARGE.goals.labelFontSize).toBe("16px");
    expect(CONTRACT_LARGE.goals.serviceIconSize).toBe("45px");
    expect(CONTRACT_LARGE.goals.glyphSize).toBe("33px");
    expect(CONTRACT_LARGE.goals.buttonHeight).toBe("64px");
    expect(CONTRACT_LARGE.networks.labelFontSize).toBe("15px");
    expect(CONTRACT_LARGE.networks.platformImageSize).toBe("44px");
    expect(CONTRACT_LARGE.networks.buttonHeight).toBe("84px");
    expect(CONTRACT_LARGE.inputs.fieldLabelFontSize).toBe("16px");
    expect(CONTRACT_LARGE.inputs.inputTextFontSize).toBe("14.5px");
    expect(CONTRACT_LARGE.inputs.privacyFontSize).toBe("15px");

    expect(largeBlock).toContain("--ios-type-builder-label-b: 17px;");
    expect(largeBlock).toContain("--ios-type-builder-label-small: 16px;");
    expect(largeBlock).toContain("--ios-type-goal-label: 16px;");
    expect(largeBlock).toContain("--ios-control-goal-height: 64px;");
    expect(largeBlock).toContain("--ios-icon-goal-service: 45px;");
    expect(largeBlock).toContain("--ios-icon-goal-glyph: 33px;");
    expect(largeBlock).toContain("--ios-type-platform-label: 15px;");
    expect(largeBlock).toContain("--ios-icon-platform-image: 44px;");
    expect(largeBlock).toContain("--ios-control-platform-height: 84px;");
    expect(largeBlock).toContain("--ios-type-field-label: 16px;");
    expect(largeBlock).toContain("--ios-type-input-text: 14.5px;");
    expect(largeBlock).toContain("--ios-type-privacy-text: 15px;");
  });

  it("5. Boundary Guard: <=374px (COMPACT) does NOT receive Standard density tokens and remains FROZEN", () => {
    expect(CONTRACT_COMPACT.stepLabels.labelBFontSize).toBe("15px");
    expect(CONTRACT_COMPACT.stepLabels.labelSmallFontSize).toBe("14px");
    expect(CONTRACT_COMPACT.goals.labelFontSize).toBe("13.5px");
    expect(CONTRACT_COMPACT.goals.glyphSize).toBe("28px");
    expect(CONTRACT_COMPACT.goals.serviceIconSize).toBe("38px");
    expect(CONTRACT_COMPACT.goals.buttonHeight).toBe("64px");
    expect(CONTRACT_COMPACT.networks.labelFontSize).toBe("13.5px");
    expect(CONTRACT_COMPACT.networks.platformImageSize).toBe("38px");
    expect(CONTRACT_COMPACT.networks.buttonHeight).toBe("76px");
    expect(CONTRACT_COMPACT.inputs.fieldLabelFontSize).toBe("14.5px");
    expect(CONTRACT_COMPACT.inputs.inputTextFontSize).toBe("13px");
    expect(CONTRACT_COMPACT.inputs.privacyFontSize).toBe("13.5px");
  });

  it("6. Documentation Token Object matches contract tokens", () => {
    const d = IOS_STOREFRONT_CONTRACT.standardDensityTokens;
    expect(d.stepTitle).toBe("16px");
    expect(d.stepSubtitle).toBe("15px");
    expect(d.goalLabel).toBe("15px");
    expect(d.goalIconService).toBe("41px");
    expect(d.goalIconGlyph).toBe("30px");
    expect(d.goalCardHeight).toBe("60px");
    expect(d.networkLabel).toBe("14px");
    expect(d.networkIcon).toBe("40px");
    expect(d.networkCardHeight).toBe("78px");
    expect(d.fieldLabel).toBe("15px");
    expect(d.inputText).toBe("14px");
    expect(d.privacyText).toBe("14px");
    expect(d.heroH1Span).toBe("25px");
    expect(d.heroH1B).toBe("25px");
    expect(d.heroSubtitle).toBe("16.5px");
    expect(d.builderEyebrow).toBe("16px");
    expect(d.builderTitle).toBe("24px");
    expect(d.builderSubtitle).toBe("16.5px");
    expect(d.analyzeText).toBe("16.5px");
    expect(d.analyzeHeight).toBe("49px");
  });
});
