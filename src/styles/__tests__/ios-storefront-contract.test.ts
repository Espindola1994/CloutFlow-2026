import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { IOS_STOREFRONT_CONTRACT } from "../platform/ios-storefront.contract";

describe("iOS Storefront Contract V3 & Canonical Frame Invariants", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const contractTsPath = path.resolve(__dirname, "../platform/ios-storefront.contract.ts");
  const layoutPath = path.resolve(__dirname, "../../app/layout.tsx");

  const cssContent = fs.readFileSync(canonicalCssPath, "utf-8");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("1. Canonical file exists and contract file exists", () => {
    expect(fs.existsSync(canonicalCssPath)).toBe(true);
    expect(fs.existsSync(contractTsPath)).toBe(true);
  });

  it("2. Canonical import exists in RootLayout (src/app/layout.tsx)", () => {
    expect(layoutContent).toContain('@/styles/platform/ios-storefront.css');
  });

  it("3. All rule selectors are strictly scoped under html.cf-platform-ios", () => {
    const lines = cssContent.split("\n");
    const selectors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith("{") && !line.startsWith("@") && !line.startsWith("/*") && !line.startsWith("*")) {
        const parts = line.replace("{", "").split(",");
        for (const p of parts) {
          const s = p.trim();
          if (s) selectors.push(s);
        }
      }
    }

    expect(selectors.length).toBeGreaterThan(20);
    for (const sel of selectors) {
      expect(
        sel.startsWith("html.cf-platform-ios"),
        `Selector "${sel}" must start with "html.cf-platform-ios"`
      ).toBe(true);
    }
  });

  it("4. Contains ZERO Android rules or references to Android classes", () => {
    expect(cssContent.toLowerCase()).not.toContain("android");
    expect(cssContent).not.toContain("cf-platform-android");
  });

  it("5. Critical selectors exist in canonical stylesheet", () => {
    // Header & logo
    expect(cssContent).toContain(".cf-plans-header-clean .cf-plans-logo.cf-plans-logo-image > img");
    expect(cssContent).toContain(".cf-plans-header-tagline .cf-tagline-text-mobile");
    expect(cssContent).toContain(".cf-plans-header-flame");

    // Hero
    expect(cssContent).toContain(".cf-plans-shell .cf-plans-hero p");

    // Builder
    expect(cssContent).toContain(".cf-premium-builder-head small");
    expect(cssContent).toContain(".cf-premium-builder-head p");
    expect(cssContent).toContain(".cf-pb-label b");
    expect(cssContent).toContain(".cf-pb-label small");
    expect(cssContent).toContain(".cf-pb-label > i");

    // Goals & Networks
    expect(cssContent).toContain(".cf-premium-builder-controls .cf-pb-goals button b");
    expect(cssContent).toContain(".cf-pb-goals button .cf-pb-service-icon");
    expect(cssContent).toContain(".cf-pb-goals button .cf-pb-glyph");
    expect(cssContent).toContain(".cf-pb-platform-icon img");

    // Inputs & CTA
    expect(cssContent).toContain(".cf-premium-builder-controls .cf-pb-field-label");
    expect(cssContent).toContain(".cf-pb-input svg");
    expect(cssContent).toContain(".cf-premium-builder-controls .cf-pb-input input");
    expect(cssContent).toContain(".cf-pb-privacy");
    expect(cssContent).toContain(".cf-premium-builder-controls .cf-pb-analyze-btn");

    // Summary & Empty
    expect(cssContent).toContain(".cf-pb-summary b");
    expect(cssContent).toContain(".cf-pb-summary small");
    expect(cssContent).toContain(".cf-pb-empty h3");
    expect(cssContent).toContain(".cf-pb-empty p");
    expect(cssContent).toContain(".cf-pb-empty > span");

    // PWA & Analyzing
    expect(cssContent).toContain('[data-testid="public-pwa-banner"]');
    expect(cssContent).toContain(".cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-loading");
  });

  it("6. Critical values strictly correspond to IOS_STOREFRONT_CONTRACT (Golden Baseline & Var Links)", () => {
    // Header
    expect(cssContent).toContain(`height: ${IOS_STOREFRONT_CONTRACT.header.logoHeight} !important;`);
    expect(cssContent).toContain(`max-width: ${IOS_STOREFRONT_CONTRACT.header.logoMaxWidth} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.header.taglineFontSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.header.flameSize} !important;`);
    expect(cssContent).toContain(`height: ${IOS_STOREFRONT_CONTRACT.header.flameSize} !important;`);

    // Hero
    expect(cssContent).toContain("font-size: var(--ios-type-hero-subtitle) !important;");
    expect(cssContent).toContain(`max-width: ${IOS_STOREFRONT_CONTRACT.hero.subtitleMaxWidth} !important;`);
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.hero.subtitleColor} !important;`);

    // Builder Head & Labels
    expect(cssContent).toContain("font-size: var(--ios-type-builder-eyebrow) !important;");
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.headSmallColor} !important;`);
    expect(cssContent).toContain("font-size: var(--ios-type-builder-description) !important;");
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.headDescriptionColor} !important;`);
    expect(cssContent).toContain("font-size: var(--ios-type-builder-label-b) !important;");
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.labelBColor} !important;`);
    expect(cssContent).toContain("font-size: var(--ios-type-builder-label-small) !important;");
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.labelSmallColor} !important;`);
    expect(cssContent).toContain("width: var(--ios-icon-builder-label) !important;");
    expect(cssContent).toContain("font-size: var(--ios-icon-builder-label-font) !important;");

    // Goals
    expect(cssContent).toContain("font-size: var(--ios-type-goal-label) !important;");
    expect(cssContent).toContain(`gap: ${IOS_STOREFRONT_CONTRACT.goals.buttonGap} !important;`);
    expect(cssContent).toContain("width: var(--ios-icon-goal-checkmark) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-goal-service) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-goal-glyph) !important;");

    // Networks
    expect(cssContent).toContain("width: var(--ios-icon-platform-checkmark) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-platform-image) !important;");
    expect(cssContent).toContain("height: var(--ios-control-platform-height) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-platform-label-narrow) !important;");

    // Inputs & CTA
    expect(cssContent).toContain("font-size: var(--ios-type-field-label) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-input-svg) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-input-text) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-privacy-text) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-analyze-text) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-analyze-svg) !important;");

    // Summary
    expect(cssContent).toContain("font-size: var(--ios-type-summary-title) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-summary-small) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-summary-glyph) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-summary-container) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-summary-platform) !important;");

    // Empty
    expect(cssContent).toContain("font-size: var(--ios-type-empty-title) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-empty-description) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-empty-container) !important;");
    expect(cssContent).toContain("font-size: var(--ios-icon-empty-font) !important;");
  });

  it("7. Analyzing progress is strictly scoped to .cf-pb-result-analyzing", () => {
    const analyzingSectionMarker = "10 — ANALYSIS PROGRESS PANEL";
    const nextSectionMarker = "11 — PUBLIC PWA INSTALL BANNER";
    const start = cssContent.indexOf(analyzingSectionMarker);
    const end = cssContent.indexOf(nextSectionMarker);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const analyzingBlock = cssContent.slice(start, end);
    const lines = analyzingBlock.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.endsWith("{") && !line.startsWith("@media") && !line.startsWith("/*")) {
        const sel = line.replace("{", "").trim();
        expect(sel).toContain(".cf-pb-result-analyzing");
      }
    }
  });

  it("8. PWA banner is strictly scoped to [data-testid=\"public-pwa-banner\"]", () => {
    const pwaSectionMarker = "11 — PUBLIC PWA INSTALL BANNER";
    const nextSectionMarker = "12 — REVIEWS / TESTIMONIALS CAROUSEL";
    const start = cssContent.indexOf(pwaSectionMarker);
    const end = cssContent.indexOf(nextSectionMarker);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const pwaBlock = cssContent.slice(start, end);
    const lines = pwaBlock.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.endsWith("{") && !line.startsWith("@media") && !line.startsWith("/*")) {
        const sel = line.replace("{", "").trim();
        expect(sel).toContain('[data-testid="public-pwa-banner"]');
      }
    }
  });

  it("9. Analyzing progress typography uses stable tokens scoped to analyzing contract", () => {
    const analyzingSectionMarker = "10 — ANALYSIS PROGRESS PANEL";
    const nextSectionMarker = "11 — PUBLIC PWA INSTALL BANNER";
    const block = cssContent.slice(cssContent.indexOf(analyzingSectionMarker), cssContent.indexOf(nextSectionMarker));

    expect(block).toMatch(/\.cf-pb-loading\s+h3\s*\{[^}]*font-size:\s*var\(--ios-type-analyzing-title\)/);
    expect(block).toMatch(/\.cf-pb-loading\s+p\s*\{[^}]*font-size:\s*var\(--ios-type-analyzing-subtitle\)/);
    expect(block).toMatch(/\.cf-pb-statuses\s+b\s*\{[^}]*font-size:\s*var\(--ios-type-analyzing-step\)/);
    expect(block).toMatch(/\.cf-pb-statuses\s+small\s*\{[^}]*font-size:\s*var\(--ios-type-analyzing-step\)/);
  });

  it("10. Analyzing copy contract defines the 4 approved iOS copies", () => {
    expect(IOS_STOREFRONT_CONTRACT.analyzing.copies).toEqual([
      "Checking profile",
      "Searching profile",
      "Loading profile data",
      "Compiling results",
    ]);
  });

  it("11. PWA banner contract defines tokens and approved copy", () => {
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.titleFontSize).toBe("15px");
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.iconSize).toBe("18px");
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.subtitleFontSize).toBe("13.5px");
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.copy).toBe("Grow faster with CloutFlow");
  });

  it("12. Validates all critical calibration points from user specification at Golden 393px", () => {
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.heroSubtitle).toBe(15);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.builderEyebrow).toBe(15);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.builderDescription).toBe(15);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.builderLabelB).toBe(15.5);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.builderLabelSmall).toBe(14.5);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.goalLabel).toBe(14);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.goalServiceIcon).toBe(41);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.goalGlyph).toBe(30);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.platformImage).toBe(40);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.controls.platformButtonHeight).toBe(80);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.fieldLabel).toBe(15);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.inputText).toBe(13.5);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.privacyText).toBe(14);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.analyzeSvg).toBe(28);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.analyzeText).toBe(15.7);
    expect(IOS_STOREFRONT_CONTRACT.header.taglineFontSize).toBe("14.5px");
    expect(IOS_STOREFRONT_CONTRACT.header.flameSize).toBe("18px");
    expect(IOS_STOREFRONT_CONTRACT.header.logoHeight).toBe("37px");
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.summaryTitle).toBe(14.5);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.summarySmall).toBe(13.8);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.summaryIconContainer).toBe(41);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.summaryPlatformImage).toBe(35);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.emptyTitle).toBe(15.5);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.emptyDescription).toBe(14.5);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.emptyIcon).toBe(59);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.emptyIconFont).toBe(38);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.pwaTitle).toBe(15);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.icons.pwaIcon).toBe(18);
    expect(IOS_STOREFRONT_CONTRACT.goldenTokens.typography.pwaSubtitle).toBe(13.5);
  });

  it("13. Contract V3: Canonical frame definitions are present in CSS", () => {
    expect(cssContent).toContain("--cf-ios-content-max: 393px;");
    expect(cssContent).toContain("--cf-ios-page-gutter: 14px;");
    expect(cssContent).toContain("--cf-ios-builder-padding: 14px;");
    expect(cssContent).toContain("width: min(100%, var(--cf-ios-content-max)) !important;");
    expect(cssContent).toContain("max-width: var(--cf-ios-content-max) !important;");
    expect(cssContent).toContain("margin-left: auto !important;");
    expect(cssContent).toContain("margin-right: auto !important;");
  });

  it("14. Contract V3: CSS contains NO fluid clamp() formulas on typography or controls", () => {
    expect(cssContent).not.toContain("calc(15px + ((100vw - 393px)");
    expect(cssContent).not.toContain("calc(80px + ((100vw - 393px)");
    expect(cssContent).not.toContain("calc(15.5px + ((100vw - 393px)");
  });
});
