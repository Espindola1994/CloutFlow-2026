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
    expect(cssContent).toContain("height: var(--ios-icon-header-logo-height) !important;");
    expect(cssContent).toContain("max-width: var(--ios-icon-header-logo-max-width) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-header-tagline) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-header-flame) !important;");
    expect(cssContent).toContain("height: var(--ios-icon-header-flame) !important;");

    // Hero
    expect(cssContent).toContain("font-size: var(--ios-type-hero-subtitle) !important;");
    expect(cssContent).toContain("max-width: var(--ios-hero-subtitle-max-width) !important;");
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
    expect(cssContent).toContain("gap: var(--cf-ios-goal-gap) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-goal-checkmark) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-goal-service) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-goal-glyph) !important;");

    // Networks
    expect(cssContent).toContain("width: var(--ios-icon-platform-checkmark) !important;");
    expect(cssContent).toContain("width: var(--ios-icon-platform-image) !important;");
    expect(cssContent).toContain("height: var(--ios-control-platform-height) !important;");
    expect(cssContent).toContain("font-size: var(--ios-type-platform-label) !important;");

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

  it("15. LARGE contract variables and responsive copies regression guard", () => {
    // 1. LARGE variables
    expect(cssContent).toContain("--cf-ios-content-max: 440px;");
    expect(cssContent).toContain("--cf-ios-page-gutter: 8px;");
    expect(cssContent).toContain("--cf-ios-builder-padding: 8px;");
    expect(cssContent).toContain("--cf-ios-step-padding: 15px;");
    expect(cssContent).toContain("--cf-ios-goal-gap: 8px;");
    expect(cssContent).toContain("--cf-ios-platform-gap: 7px;");
    expect(cssContent).toContain("--ios-type-hero-h1-span: 25px;");
    expect(cssContent).toContain("--ios-type-hero-h1-b: 25px;");
    expect(cssContent).toContain("--ios-type-hero-h1-letter-spacing: -1.3px;");
    expect(cssContent).toContain("--ios-type-hero-subtitle: 16.5px;");
    expect(cssContent).toContain("--ios-type-builder-eyebrow: 16px;");
    expect(cssContent).toContain("--ios-type-builder-title: 24px;");
    expect(cssContent).toContain("--ios-type-builder-description: 16.5px;");
    expect(cssContent).toContain("--ios-type-builder-label-small: 16px;");
    expect(cssContent).toContain("--ios-type-goal-label: 16px;");
    expect(cssContent).toContain("--ios-control-goal-height: 64px;");
    expect(cssContent).toContain("--ios-type-platform-label: 15px;");
    expect(cssContent).toContain("--ios-icon-platform-image: 44px;");
    expect(cssContent).toContain("--ios-control-platform-height: 84px;");
    expect(cssContent).toContain("--ios-type-analyze-text: 16.5px;");

    // Negative guard: ht: 86px must NEVER exist
    expect(cssContent).not.toContain("ht: 86px");
    expect(cssContent).not.toContain("ht:86px");

    // Responsive copy selectors scoped to LARGE
    expect(cssContent).toContain(".cf-hero-subtitle-default");
    expect(cssContent).toContain(".cf-hero-subtitle-ios-large");
    expect(cssContent).toContain(".cf-pb-analyze-desc-default");
    expect(cssContent).toContain(".cf-pb-analyze-desc-ios-large");
    expect(cssContent).toContain(".cf-pb-privacy-desc-default");
    expect(cssContent).toContain(".cf-pb-privacy-desc-ios-large");
    expect(cssContent).toContain(".cf-pwa-subtitle-default");
    expect(cssContent).toContain(".cf-pwa-subtitle-ios-large");

    // Goal and Platform grid balance scoped to LARGE
    expect(cssContent).toContain("grid-template-columns: minmax(0, 1.14fr) minmax(0, 0.93fr) minmax(0, 0.93fr) !important;");

    // Network selector badge positioning scoped to LARGE
    expect(cssContent).toContain("top: -6px !important;");
    expect(cssContent).toContain("right: -4px !important;");

    // Result action buttons scoped to LARGE
    expect(cssContent).toContain(".cf-pb-result-actions button");
    expect(cssContent).toContain("height: 50px !important;");
    expect(cssContent).toContain("min-height: 50px !important;");
    expect(cssContent).toContain("font-size: 15.5px !important;");
    expect(cssContent).toContain("width: 18px !important;");
    expect(cssContent).toContain("height: 18px !important;");
  });

  it("16. Unified Large Pricing & Plan Cards (Home + /offer PACKAGE) regression guard", () => {
    // Pricing title and subtitle
    expect(cssContent).toContain(".cf-plans-section-title h2 span {\n    font-size: 25px !important;");
    expect(cssContent).toContain(".cf-plans-pricing .cf-plans-section-title.cf-pricing-title p {\n    font-size: 16.5px !important;");

    // Plan name 17.5px
    expect(cssContent).toContain(".cf-o10-package-ref-plan-name strong {\n    font-size: 17.5px !important;");

    // Plan qty 16.5px
    expect(cssContent).toContain(".cf-o10-package-ref-qty {\n    font-size: 16.5px !important;");

    // Bonus 15.2px, SVG 16px
    expect(cssContent).toContain(".cf-o10-package-ref-bonus {\n    font-size: 15.2px !important;");
    expect(cssContent).toContain("width: 16px !important;\n    min-width: 16px !important;\n    height: 16px !important;");

    // Del 16.5px, #9ba6b6
    expect(cssContent).toContain(".cf-o10-package-ref-price del {\n    color: #9ba6b6 !important;\n    white-space: nowrap !important;\n    font-size: 16.5px !important;");

    // Coupon 15px, #7a8799
    expect(cssContent).toContain(".cf-o10-package-ref-coupon {\n    color: #7a8799 !important;\n    min-height: 15px !important;\n    margin: 2px 0 9px !important;\n    font-size: 15px !important;");

    // Benefits li 15px
    expect(cssContent).toContain(".cf-o10-package-ref-benefits li {\n    font-size: 15px !important;");

    // Benefit icon container 18px x 18px
    expect(cssContent).toContain("flex: 0 0 18px !important;");
    expect(cssContent).toContain("width: 18px !important;\n    min-width: 18px !important;\n    height: 18px !important;\n    min-height: 18px !important;");

    // Benefit SVG 12px
    expect(cssContent).toContain("width: 12px !important;\n    height: 12px !important;");

    // Assurance 15px, SVG 20px
    expect(cssContent).toContain(".cf-o10-package-assurance > div {\n    font-size: 15px !important;");
    expect(cssContent).toContain(".cf-o10-package-assurance svg {\n    width: 20px !important;\n    height: 20px !important;");

    // CTA 16px
    expect(cssContent).toContain(".cf-o10-package-ref-cta .cf-o10-cta-default {\n    font-size: 16px !important;");

    // Discount badge 15px, SVG requested dimensions
    expect(cssContent).toContain(".cf-o10-discount-badge span {\n    white-space: nowrap !important;\n    font-size: 15px !important;");
    expect(cssContent).toContain("stroke-width: 2.1px !important;\n    width: 16px !important;\n    min-width: 18px !important;\n    height: 18px !important;");

    // Grid gap 22px
    expect(cssContent).toContain("gap: 22px !important;");

    // /offer package width invariant preserved
    expect(cssContent).toContain("width: min(66%, 320px) !important;");
    expect(cssContent).toContain("max-width: 320px !important;");

    // Best badge 15px, height 24px, SVG 18px
    expect(cssContent).toContain(".cf-o10-package-ref-best {\n    font-size: 15px !important;\n    height: 24px !important;");
    expect(cssContent).toContain(".cf-o10-package-ref-best svg {\n    width: 18px !important;\n    min-width: 18px !important;\n    height: 18px !important;");
  });

  it("17. iOS LARGE Home Lower Sections Calibration regression guard", () => {
    // 1. Plans section h2
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-section-title h2 {\n    letter-spacing: -.48px !important;\n    margin: 0 !important;\n    padding: 0 !important;\n    font-size: 25px !important;\n  }");

    // 2. Plans section subtitle
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-section-title p {\n    color: #718097 !important;\n    margin: 1px 0 0 !important;\n    font-size: 16.5px !important;\n  }");

    // 3. Review name
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-review-head b {\n    font-size: 14.5px !important;\n  }");

    // 4. Review handle / small text
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-review-head small,\n  html.cf-platform-ios body .cf-universal-target-compact small {\n    font-size: 13.4px !important;\n  }");

    // 5. Review verified badge SVG
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-review-head > svg {\n    color: #168cff !important;\n    fill: #168cff !important;\n    stroke: #fff !important;\n    width: 20px !important;\n    height: 20px !important;\n  }");

    // 6. Review body
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-review-card p {\n    font-size: 12.5px !important;\n    line-height: 1.35 !important;\n  }");

    // 7. Review tag
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-review-tag {\n    font-size: 13px !important;\n    font-weight: 650 !important;\n  }");

    // 8. Trust pill text
    expect(cssContent).toContain(".cf-trust-pill .cf-trust-excellent,\n  html.cf-platform-ios body .cf-trust-pill .cf-trust-score,\n  html.cf-platform-ios body .cf-trust-pill .cf-trust-reviews,\n  html.cf-platform-ios body .cf-trust-pill .cf-trustpilot {\n    font-size: 14.5px !important;\n  }");

    // 9. Trust stars text
    expect(cssContent).toContain("html.cf-platform-ios body .cf-trust-stars span {\n    font-size: 11.5px !important;\n  }");

    // 10. Trustpilot green star/text span
    expect(cssContent).toContain("html.cf-platform-ios body .cf-trustpilot > span {\n    color: #00b67a !important;\n    font-size: 14.5px !important;\n  }");

    // 11. FAQ eyebrow
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-eyebrow {\n    color: #ef2f75 !important;\n    letter-spacing: .12em !important;\n    margin: 0 0 7px !important;\n    font-size: 16px !important;\n  }");

    // 12. FAQ eyebrow SVG
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-eyebrow svg {\n    width: 15px !important;\n    height: 15px !important;\n  }");

    // 13. FAQ title
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-head h2 {\n    font-size: 24px !important;\n  }");

    // 14. FAQ header subtitle
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-head p {\n    color: #7b879e !important;\n    margin: 8px auto 0 !important;\n    font-size: 16.5px !important;\n  }");

    // 15. FAQ question text
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-question-copy {\n    color: #20283b !important;\n    font-size: 15.5px !important;\n  }");

    // 16. FAQ question icon container
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-icon {\n    border-radius: 9px !important;\n    width: 33px !important;\n    height: 33px !important;\n  }");

    // 17. FAQ question icon SVG
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-icon svg {\n    width: 20px !important;\n    height: 20px !important;\n  }");

    // 18. FAQ toggle SVG
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-toggle svg {\n    stroke-width: 2.2px !important;\n    width: 18px !important;\n    height: 18px !important;\n  }");

    // 19. FAQ answer
    expect(cssContent).toContain("html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-answer p {\n    color: #748096 !important;\n    margin: 0 !important;\n    padding: 0 48px 12px 56px !important;\n    font-size: 14.5px !important;\n    font-weight: 410 !important;\n  }");

    // 20. Final copy
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-final-copy p {\n    margin-top: -7px !important;\n    font-size: 15.5px !important;\n    font-weight: 470 !important;\n  }");

    // 21. Final action button
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-final-action button {\n    border-radius: 12px !important;\n    width: 100% !important;\n    max-width: none !important;\n    height: auto !important;\n    min-height: 56px !important;\n    font-size: 16px !important;\n  }");

    // 22. Final CTA rocket
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-final-cta .cf-plans-rocket-premium {\n    object-fit: contain !important;\n    width: 115px !important;\n    max-width: none !important;\n    height: auto !important;\n    max-height: none !important;\n    box-shadow: none !important;\n    filter: none !important;\n    opacity: 1 !important;\n    mix-blend-mode: normal !important;\n    clip-path: none !important;\n    background: 0 0 !important;\n    border: 0 !important;\n    border-radius: 0 !important;\n    position: absolute !important;\n    inset: 50% auto auto 65% !important;\n  }");

    // 23. Final action small
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-final-action small {\n    justify-content: center !important;\n    font-size: 15.5px !important;\n  }");

    // 24. Social proof verified SVG
    expect(cssContent).toContain("html.cf-platform-ios body .cf-social-proof-verified svg {\n    stroke-width: 2.4px !important;\n    width: 18px !important;\n    height: 18px !important;\n  }");

    // 25. Customer faces
    expect(cssContent).toContain("html.cf-platform-ios body .cf-customer-faces img {\n    border: 2px solid #fff !important;\n    width: 31px !important;\n    height: 31px !important;\n    margin-left: -7px !important;\n    transition: transform .2s, margin .2s !important;\n  }");

    // 26. Value row title
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-value-row b {\n    font-size: 15.5px !important;\n  }");

    // 27. Value row small
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-value-row small {\n    font-size: 14px !important;\n  }");

    // 28. Value row main SVG
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-value-row > div > svg {\n    width: 33px !important;\n    height: 33px !important;\n    padding: 5px !important;\n  }");

    // 29. Value row layout
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-value-row > div {\n    border-bottom: 1px solid #edf0f4 !important;\n    border-right: 0 !important;\n    grid-template-columns: 29px minmax(0, 1fr) !important;\n    gap: 10px !important;\n  }");

    // 30. Final action container
    expect(cssContent).toContain("html.cf-platform-ios body .cf-plans-final-action {\n    grid-area: action !important;\n    gap: 11px !important;\n    width: 100% !important;\n    margin-top: 6px !important;\n  }");
  });
});
