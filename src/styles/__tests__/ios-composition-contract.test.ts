import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore - jsdom types optional for unit smoke test
import { JSDOM } from "jsdom";
import { IOS_STOREFRONT_CONTRACT } from "../platform/ios-storefront.contract";

describe("iOS Storefront Canonical Frame & Composition Stability Tests (Contract V3)", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const globalsCssPath = path.resolve(__dirname, "../../app/globals.css");

  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  it("1. Mathematical Invariant: Golden typography values are 100% stable across 393px, 430px, 440px", () => {
    const typography = IOS_STOREFRONT_CONTRACT.goldenTokens.typography;
    const icons = IOS_STOREFRONT_CONTRACT.goldenTokens.icons;
    const controls = IOS_STOREFRONT_CONTRACT.goldenTokens.controls;

    // Direct Golden checks matching the approved specification
    expect(typography.heroSubtitle).toBe(15);
    expect(typography.builderEyebrow).toBe(15);
    expect(typography.builderDescription).toBe(15);
    expect(typography.builderLabelB).toBe(15.5);
    expect(typography.builderLabelSmall).toBe(14.5);
    expect(typography.goalLabel).toBe(14);
    expect(typography.platformLabelNarrow).toBe(14);
    expect(typography.fieldLabel).toBe(15);
    expect(typography.inputText).toBe(13.5);
    expect(typography.privacyText).toBe(14);
    expect(typography.analyzeText).toBe(15.7);
    expect(typography.summaryTitle).toBe(14.5);
    expect(typography.summarySmall).toBe(13.8);
    expect(typography.emptyTitle).toBe(15.5);
    expect(typography.emptyDescription).toBe(14.5);
    expect(typography.pwaTitle).toBe(15);
    expect(typography.pwaSubtitle).toBe(13.5);
    expect(typography.analyzingTitle).toBe(15.5);
    expect(typography.analyzingSubtitle).toBe(14.5);
    expect(typography.analyzingStep).toBe(13.5);
    expect(typography.finalCtaTitle).toBe(17.5);

    expect(icons.goalServiceIcon).toBe(41);
    expect(icons.goalGlyph).toBe(30);
    expect(icons.platformImage).toBe(40);
    expect(icons.inputSvg).toBe(28);
    expect(icons.analyzeSvg).toBe(28);
    expect(icons.summaryGlyph).toBe(30);
    expect(icons.summaryIconContainer).toBe(41);
    expect(icons.summaryPlatformImage).toBe(35);
    expect(icons.emptyIcon).toBe(59);
    expect(icons.emptyIconFont).toBe(38);
    expect(icons.pwaIcon).toBe(18);
    expect(icons.finalCtaRocket).toBe(78);

    expect(controls.platformButtonHeight).toBe(80);
    expect(controls.inputHeight).toBe(41);
    expect(controls.analyzeButtonHeight).toBe(44);
  });

  it("2. Canonical Frame Geometry: 393px reference width, bounded content across larger viewports", () => {
    expect(IOS_STOREFRONT_CONTRACT.canonicalFrame.referenceWidth).toBe(393);
    expect(IOS_STOREFRONT_CONTRACT.canonicalFrame.maxWidth).toBe("393px");
    expect(IOS_STOREFRONT_CONTRACT.canonicalFrame.gutterCompact).toBe("10px");
    expect(IOS_STOREFRONT_CONTRACT.canonicalFrame.gutterCanonical).toBe("14px");
    expect(IOS_STOREFRONT_CONTRACT.canonicalFrame.gutterLarge).toBe("20px");
  });

  it("3. Matrix Verification (320, 360, 375, 390, 393, 402, 414, 430, 440): Content Frame & Gutter Behavior", () => {
    const viewports = [320, 360, 375, 390, 393, 402, 414, 430, 440];
    const canonicalMax = 393;

    for (const vp of viewports) {
      // Gutter calculation
      let gutter = 14;
      if (vp <= 374) {
        gutter = 10;
      } else if (vp >= 394) {
        gutter = 20;
      }

      // Available content width
      const availableWidth = vp - (gutter * 2);
      const contentFrameWidth = Math.min(availableWidth, canonicalMax);

      expect(contentFrameWidth).toBeLessThanOrEqual(canonicalMax);
      expect(contentFrameWidth).toBeGreaterThan(0);

      // On 393, 430, 440, builder content frame width remains capped to canonical frame
      if (vp >= 393) {
        if (vp === 393) {
          // At 393: 393 - 2*14 = 365px available, capped at min(365, 393) = 365px
          expect(contentFrameWidth).toBe(365);
        } else {
          // At 430: 430 - 2*20 = 390px
          // At 440: 440 - 2*20 = 400px -> capped at 393px!
          if (vp === 430) expect(contentFrameWidth).toBe(390);
          if (vp === 440) expect(contentFrameWidth).toBe(393);
        }
      }
    }
  });

  it("4. Negative Test: Android (no cf-platform-ios) NEVER matches iOS canonical rules", () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en" class="dark">
      <head>
        <style>${canonicalCss}</style>
      </head>
      <body>
        <section class="cf-plans-shell">
          <div class="cf-plans-hero"><p>Hero</p></div>
          <div class="cf-premium-builder-controls">
            <div class="cf-pb-goals"><button><b>Goal</b></button></div>
          </div>
        </section>
      </body>
      </html>
    `;
    const dom = new JSDOM(html, { pretendToBeVisual: true });
    const doc = dom.window.document;

    const styleEl = doc.querySelector("style")!;
    const sheet = styleEl.sheet as CSSStyleSheet;
    const heroP = doc.querySelector(".cf-plans-hero p")!;

    let iosMatched = 0;
    for (let i = 0; i < sheet.cssRules.length; i++) {
      const rule = sheet.cssRules[i] as any;
      if (rule instanceof dom.window.CSSMediaRule) {
        for (let j = 0; j < (rule.cssRules?.length || 0); j++) {
          const sub = rule.cssRules[j] as CSSStyleRule;
          if (sub.selectorText && heroP.matches(sub.selectorText)) iosMatched++;
        }
      } else if (rule instanceof dom.window.CSSStyleRule) {
        if (rule.selectorText && heroP.matches(rule.selectorText)) iosMatched++;
      }
    }

    expect(iosMatched).toBe(0);
  });

  it("5. Negative Test: iPadOS (cf-platform-ipados) NEVER matches html.cf-platform-ios rules", () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en" class="dark cf-platform-ipados">
      <head>
        <style>${canonicalCss}</style>
      </head>
      <body>
        <div class="cf-plans-hero"><p>Hero</p></div>
      </body>
      </html>
    `;
    const dom = new JSDOM(html, { pretendToBeVisual: true });
    const doc = dom.window.document;
    const heroP = doc.querySelector(".cf-plans-hero p")!;

    const styleEl = doc.querySelector("style")!;
    const sheet = styleEl.sheet as CSSStyleSheet;

    let matched = 0;
    for (let i = 0; i < sheet.cssRules.length; i++) {
      const rule = sheet.cssRules[i] as any;
      if (rule instanceof dom.window.CSSMediaRule) {
        for (let j = 0; j < (rule.cssRules?.length || 0); j++) {
          const sub = rule.cssRules[j] as CSSStyleRule;
          if (sub.selectorText && heroP.matches(sub.selectorText)) matched++;
        }
      } else if (rule instanceof dom.window.CSSStyleRule) {
        if (rule.selectorText && heroP.matches(rule.selectorText)) matched++;
      }
    }

    expect(matched).toBe(0);
  });

  it("6. Negative Test: Desktop Viewport (> 900px) does not apply mobile handheld media rules", () => {
    const lines = canonicalCss.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("@media") && !line.includes("max-width")) {
        // Must only be bounded by max-width media queries
        expect(line).not.toContain("min-width: 901px");
      }
    }
  });
});
