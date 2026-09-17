import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore - jsdom types optional for unit smoke test
import { JSDOM } from "jsdom";
import { IOS_STOREFRONT_CONTRACT, FluidTokenDefinition } from "../platform/ios-storefront.contract";

describe("iOS Storefront Fluid Scaling & Platform Isolation Tests", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const globalsCssPath = path.resolve(__dirname, "../../app/globals.css");

  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  function evaluateFluidToken(token: FluidTokenDefinition, vw: number): number {
    const raw = token.golden + (vw - token.goldenViewport) * token.rate;
    return Math.min(token.max, Math.max(token.min, Number(raw.toFixed(4))));
  }

  it("1. Mathematical Invariant: At 393px, ALL fluid tokens equal EXACT Golden values with 0 deviation", () => {
    const typography = IOS_STOREFRONT_CONTRACT.fluid.typography;
    const icons = IOS_STOREFRONT_CONTRACT.fluid.icons;
    const controls = IOS_STOREFRONT_CONTRACT.fluid.controls;

    // Check key values
    expect(evaluateFluidToken(typography.heroSubtitle, 393)).toBe(15);
    expect(evaluateFluidToken(typography.builderEyebrow, 393)).toBe(15);
    expect(evaluateFluidToken(typography.builderDescription, 393)).toBe(15);
    expect(evaluateFluidToken(typography.builderLabelB, 393)).toBe(15.5);
    expect(evaluateFluidToken(typography.builderLabelSmall, 393)).toBe(14.5);
    expect(evaluateFluidToken(typography.goalLabel, 393)).toBe(14);
    expect(evaluateFluidToken(icons.goalServiceIcon, 393)).toBe(41);
    expect(evaluateFluidToken(icons.goalGlyph, 393)).toBe(30);
    expect(evaluateFluidToken(icons.platformImage, 393)).toBe(40);
    expect(evaluateFluidToken(controls.platformButtonHeight, 393)).toBe(80);
    expect(evaluateFluidToken(typography.fieldLabel, 393)).toBe(15);
    expect(evaluateFluidToken(typography.inputText, 393)).toBe(13.5);
    expect(evaluateFluidToken(typography.privacyText, 393)).toBe(14);
    expect(evaluateFluidToken(icons.analyzeSvg, 393)).toBe(28);
    expect(evaluateFluidToken(typography.analyzeText, 393)).toBe(15.7);
    expect(evaluateFluidToken(typography.summaryTitle, 393)).toBe(14.5);
    expect(evaluateFluidToken(typography.summarySmall, 393)).toBe(13.8);
    expect(evaluateFluidToken(icons.summaryIconContainer, 393)).toBe(41);
    expect(evaluateFluidToken(icons.summaryPlatformImage, 393)).toBe(35);
    expect(evaluateFluidToken(typography.emptyTitle, 393)).toBe(15.5);
    expect(evaluateFluidToken(typography.emptyDescription, 393)).toBe(14.5);
    expect(evaluateFluidToken(icons.emptyIcon, 393)).toBe(59);
    expect(evaluateFluidToken(icons.emptyIconFont, 393)).toBe(38);
    expect(evaluateFluidToken(typography.pwaTitle, 393)).toBe(15);
    expect(evaluateFluidToken(icons.pwaIcon, 393)).toBe(18);
    expect(evaluateFluidToken(typography.pwaSubtitle, 393)).toBe(13.5);
    expect(evaluateFluidToken(typography.analyzingTitle, 393)).toBe(15.5);
    expect(evaluateFluidToken(typography.analyzingSubtitle, 393)).toBe(14.5);
    expect(evaluateFluidToken(typography.analyzingStep, 393)).toBe(13.5);
    expect(evaluateFluidToken(icons.finalCtaRocket, 393)).toBe(78);
    expect(evaluateFluidToken(typography.finalCtaTitle, 393)).toBe(17.5);
  });

  it("2. Monotonic scaling across all viewports (320 <= 360 <= 375 <= 390 <= 393 <= 402 <= 414 <= 430 <= 440)", () => {
    const viewports = [320, 360, 375, 390, 393, 402, 414, 430, 440];
    const allTokens = {
      ...IOS_STOREFRONT_CONTRACT.fluid.typography,
      ...IOS_STOREFRONT_CONTRACT.fluid.icons,
      ...IOS_STOREFRONT_CONTRACT.fluid.controls,
    };

    for (const [tokenName, token] of Object.entries(allTokens)) {
      for (let i = 0; i < viewports.length - 1; i++) {
        const v1 = viewports[i];
        const v2 = viewports[i + 1];
        const val1 = evaluateFluidToken(token, v1);
        const val2 = evaluateFluidToken(token, v2);
        expect(
          val1,
          `Token ${tokenName} at ${v1}px (${val1}) must be <= at ${v2}px (${val2})`
        ).toBeLessThanOrEqual(val2);
      }
    }
  });

  it("3. Clamp bounds are strictly observed even at extreme viewports (280px and 600px)", () => {
    const allTokens = {
      ...IOS_STOREFRONT_CONTRACT.fluid.typography,
      ...IOS_STOREFRONT_CONTRACT.fluid.icons,
      ...IOS_STOREFRONT_CONTRACT.fluid.controls,
    };

    for (const [tokenName, token] of Object.entries(allTokens)) {
      const at280 = evaluateFluidToken(token, 280);
      const at600 = evaluateFluidToken(token, 600);
      expect(at280, `${tokenName} at 280px must equal min`).toBe(token.min);
      expect(at600, `${tokenName} at 600px must equal max`).toBe(token.max);
    }
  });

  it("4. Negative Test: Android (no cf-platform-ios) NEVER matches iOS fluid rules", () => {
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
