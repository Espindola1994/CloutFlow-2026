import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { IOS_STOREFRONT_CONTRACT } from "../platform/ios-storefront.contract";

describe("iOS Storefront Contract & Canonical Layer Invariants", () => {
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

  it("6. Critical values strictly correspond to IOS_STOREFRONT_CONTRACT", () => {
    // Header
    expect(cssContent).toContain(`height: ${IOS_STOREFRONT_CONTRACT.header.logoHeight} !important;`);
    expect(cssContent).toContain(`max-width: ${IOS_STOREFRONT_CONTRACT.header.logoMaxWidth} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.header.taglineFontSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.header.flameSize} !important;`);
    expect(cssContent).toContain(`height: ${IOS_STOREFRONT_CONTRACT.header.flameSize} !important;`);

    // Hero
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.hero.subtitleFontSize} !important;`);
    expect(cssContent).toContain(`max-width: ${IOS_STOREFRONT_CONTRACT.hero.subtitleMaxWidth} !important;`);
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.hero.subtitleColor} !important;`);

    // Builder Head & Labels
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.builder.headSmallFontSize} !important;`);
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.headSmallColor} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.builder.headDescriptionFontSize} !important;`);
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.headDescriptionColor} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.builder.labelBFontSize} !important;`);
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.labelBColor} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.builder.labelSmallFontSize} !important;`);
    expect(cssContent).toContain(`color: ${IOS_STOREFRONT_CONTRACT.builder.labelSmallColor} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.builder.labelIconSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.builder.labelIconFontSize} !important;`);

    // Goals
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.goals.labelFontSize} !important;`);
    expect(cssContent).toContain(`gap: ${IOS_STOREFRONT_CONTRACT.goals.buttonGap} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.goals.buttonSvgSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.goals.serviceIconSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.goals.glyphSize} !important;`);

    // Networks
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.networks.buttonSvgSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.networks.platformImageSize} !important;`);
    expect(cssContent).toContain(`height: ${IOS_STOREFRONT_CONTRACT.networks.buttonHeight} !important;`);

    // Inputs & CTA
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.inputs.fieldLabelFontSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.inputs.inputSvgSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.inputs.inputTextFontSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.inputs.privacyFontSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.analyzeCta.textFontSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.analyzeCta.svgSize} !important;`);

    // Summary
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.summary.titleFontSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.summary.smallFontSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.summary.serviceGlyphSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.summary.iconContainerSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.summary.platformImageSize} !important;`);

    // Empty
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.emptyState.titleFontSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.emptyState.descriptionFontSize} !important;`);
    expect(cssContent).toContain(`width: ${IOS_STOREFRONT_CONTRACT.emptyState.iconSize} !important;`);
    expect(cssContent).toContain(`font-size: ${IOS_STOREFRONT_CONTRACT.emptyState.iconFontSize} !important;`);
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

  it("9. Analyzing progress typography matches contract (15.5px / 14.5px / 13.5px / 13.5px)", () => {
    const analyzingSectionMarker = "10 — ANALYSIS PROGRESS PANEL";
    const nextSectionMarker = "11 — PUBLIC PWA INSTALL BANNER";
    const block = cssContent.slice(cssContent.indexOf(analyzingSectionMarker), cssContent.indexOf(nextSectionMarker));

    // Title: 15.5px
    expect(block).toMatch(/\.cf-pb-loading\s+h3\s*\{[^}]*font-size:\s*15\.5px/);
    // Subtitle: 14.5px
    expect(block).toMatch(/\.cf-pb-loading\s+p\s*\{[^}]*font-size:\s*14\.5px/);
    // Step labels: 13.5px
    expect(block).toMatch(/\.cf-pb-statuses\s+b\s*\{[^}]*font-size:\s*13\.5px/);
    // Statuses: 13.5px
    expect(block).toMatch(/\.cf-pb-statuses\s+small\s*\{[^}]*font-size:\s*13\.5px/);
  });

  it("10. Analyzing copy contract defines the 4 approved iOS copies", () => {
    expect(IOS_STOREFRONT_CONTRACT.analyzing.copies).toEqual([
      "Checking profile",
      "Searching profile",
      "Loading profile data",
      "Compiling results",
    ]);
  });

  it("11. PWA banner contract defines 15px title, 18px icon, 13.5px subtitle, and approved copy", () => {
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.titleFontSize).toBe("15px");
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.iconSize).toBe("18px");
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.subtitleFontSize).toBe("13.5px");
    expect(IOS_STOREFRONT_CONTRACT.pwaBanner.copy).toBe("Grow faster with CloutFlow");
  });
});
