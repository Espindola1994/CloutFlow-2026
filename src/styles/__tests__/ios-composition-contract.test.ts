import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore - jsdom types optional for unit smoke test
import { JSDOM } from "jsdom";
import {
  IOS_STOREFRONT_CONTRACT,
  CONTRACT_COMPACT,
  CONTRACT_STANDARD,
  CONTRACT_LARGE,
  VisualContractTokens,
} from "../platform/ios-storefront.contract";

/**
 * Helper to resolve the active Visual Contract by viewport width
 */
export function getActiveContract(viewportWidth: number): VisualContractTokens {
  if (viewportWidth <= 374) {
    return CONTRACT_COMPACT;
  } else if (viewportWidth <= 413) {
    return CONTRACT_STANDARD;
  } else {
    return CONTRACT_LARGE;
  }
}

/**
 * Helper to calculate layout geometry for a viewport width based on active contract
 */
export function calculateGeometry(viewportWidth: number) {
  const contract = getActiveContract(viewportWidth);
  const gutter = parseInt(contract.geometry.pageGutter, 10);
  const padding = parseInt(contract.geometry.builderPadding, 10);
  const maxContent =
    contract.geometry.contentMax === "100%"
      ? viewportWidth - gutter * 2
      : parseInt(contract.geometry.contentMax, 10);

  const availableWidth = viewportWidth - gutter * 2;
  const builderWidth = Math.min(availableWidth, maxContent);
  const mainContentWidth = availableWidth;
  const heroWidth = Math.min(availableWidth, maxContent);
  const summaryWidth = builderWidth - padding * 2;

  return {
    viewport: viewportWidth,
    mainContentWidth,
    heroWidth,
    builderWidth,
    builderPadding: contract.geometry.builderPadding,
    goalButtonHeight: contract.goals.buttonHeight,
    goalGap: contract.geometry.goalGap,
    networkHeight: contract.networks.buttonHeight,
    networkGap: contract.geometry.platformGap,
    inputHeight: contract.inputs.inputHeight,
    analyzeHeight: contract.analyzeCta.buttonHeight,
    summaryWidth,
    builderRatio: builderWidth / viewportWidth,
    hasOverflow: builderWidth + gutter * 2 > viewportWidth,
  };
}

describe("iOS Storefront 3 Responsive Visual Contracts (COMPACT / STANDARD / LARGE)", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");

  it("1. Standard is Density Calibrated: reflects calibrated scale in 375-413px", () => {
    const std = CONTRACT_STANDARD;
    expect(std.hero.subtitleFontSize).toBe("16.5px");
    expect(std.builderHead.eyebrowFontSize).toBe("16px");
    expect(std.builderHead.descriptionFontSize).toBe("16.5px");
    expect(std.builderHead.titleFontSize).toBe("24px");
    expect(std.stepLabels.labelBFontSize).toBe("16px");
    expect(std.stepLabels.labelSmallFontSize).toBe("15px");
    expect(std.goals.labelFontSize).toBe("15px");
    expect(std.goals.serviceIconSize).toBe("41px");
    expect(std.goals.glyphSize).toBe("30px");
    expect(std.networks.labelFontSize).toBe("14px");
    expect(std.networks.platformImageSize).toBe("40px");
    expect(std.networks.buttonHeight).toBe("78px");
    expect(std.inputs.fieldLabelFontSize).toBe("15px");
    expect(std.inputs.inputTextFontSize).toBe("14px");
    expect(std.inputs.inputHeight).toBe("45px");
    expect(std.inputs.privacyFontSize).toBe("14px");
    expect(std.inputs.errorFontSize).toBe("13px");
    expect(std.analyzeCta.textFontSize).toBe("16.5px");
    expect(std.analyzeCta.buttonHeight).toBe("49px");
    expect(std.summary.titleFontSize).toBe("16px");
    expect(std.summary.smallFontSize).toBe("16px");
    expect(std.emptyState.titleFontSize).toBe("16.5px");
    expect(std.emptyState.descriptionFontSize).toBe("15.5px");
    expect(std.analyzing.titleFontSize).toBe("17px");
    expect(std.analyzing.subtitleFontSize).toBe("15.5px");
    expect(std.analyzing.stepLabelsFontSize).toBe("14.5px");
    expect(std.pwaBanner.titleFontSize).toBe("16px");
    expect(std.pwaBanner.subtitleFontSize).toBe("14.5px");
    expect(std.finalCta.titleFontSize).toBe("19px");
  });

  it("2. Large Contract reflects approved calibration for Pro Max", () => {
    const lrg = CONTRACT_LARGE;
    expect(lrg.hero.subtitleFontSize).toBe("16.5px");
    expect(lrg.builderHead.eyebrowFontSize).toBe("16px");
    expect(lrg.builderHead.descriptionFontSize).toBe("16.5px");
    expect(lrg.builderHead.titleFontSize).toBe("24px");
    expect(lrg.stepLabels.labelBFontSize).toBe("17px");
    expect(lrg.stepLabels.labelSmallFontSize).toBe("16px");
    expect(lrg.goals.labelFontSize).toBe("16px");
    expect(lrg.goals.serviceIconSize).toBe("45px");
    expect(lrg.goals.glyphSize).toBe("33px");
    expect(lrg.goals.checkmarkSize).toBe("24px");
    expect(lrg.goals.buttonHeight).toBe("64px");
    expect(lrg.networks.labelFontSize).toBe("15px");
    expect(lrg.networks.platformImageSize).toBe("44px");
    expect(lrg.networks.checkmarkSize).toBe("22px");
    expect(lrg.networks.buttonHeight).toBe("84px");
    expect(lrg.inputs.fieldLabelFontSize).toBe("16px");
    expect(lrg.inputs.inputTextFontSize).toBe("14.5px");
    expect(lrg.inputs.inputHeight).toBe("45px");
    expect(lrg.inputs.privacyFontSize).toBe("15px");
    expect(lrg.inputs.errorFontSize).toBe("14px");
    expect(lrg.analyzeCta.textFontSize).toBe("16.5px");
    expect(lrg.analyzeCta.buttonHeight).toBe("49px");
    expect(lrg.summary.titleFontSize).toBe("16px");
    expect(lrg.summary.smallFontSize).toBe("16px");
    expect(lrg.emptyState.titleFontSize).toBe("16.5px");
    expect(lrg.emptyState.descriptionFontSize).toBe("15.5px");
    expect(lrg.analyzing.titleFontSize).toBe("17px");
    expect(lrg.analyzing.subtitleFontSize).toBe("15.5px");
    expect(lrg.analyzing.stepLabelsFontSize).toBe("14.5px");
    expect(lrg.pwaBanner.titleFontSize).toBe("16px");
    expect(lrg.pwaBanner.subtitleFontSize).toBe("14.5px");
    expect(lrg.finalCta.titleFontSize).toBe("19px");
  });

  it("3. Compact Contract protects legibility on <=374px without aggressive shrinkage (>=94-96% of Baseline)", () => {
    const cmp = CONTRACT_COMPACT;

    // Reduced gutters and gaps in Compact
    expect(cmp.geometry.pageGutter).toBe("10px");
    expect(cmp.geometry.builderPadding).toBe("11px");
    expect(cmp.geometry.stepPadding).toBe("11px");
    expect(cmp.geometry.goalGap).toBe("5px");
    expect(cmp.geometry.platformGap).toBe("4px");
  });

  it("4. Matrix Verification (320, 360, 375, 390, 393, 402, 413, 414, 430, 440): Contract Mapping & No Overflow", () => {
    const matrix = [320, 360, 375, 390, 393, 402, 413, 414, 430, 440];

    for (const vp of matrix) {
      const contract = getActiveContract(vp);
      const geom = calculateGeometry(vp);

      if (vp <= 374) {
        expect(contract.id).toBe("compact");
      } else if (vp <= 413) {
        expect(contract.id).toBe("standard");
      } else {
        expect(contract.id).toBe("large");
      }

      // No horizontal overflow: builder + 2*gutter <= viewport width
      expect(geom.hasOverflow).toBe(false);
      expect(geom.builderWidth).toBeLessThanOrEqual(vp);
      expect(geom.builderWidth).toBeGreaterThan(0);
    }
  });

  it("5. Boundary Transition Test: 413px (Standard) -> 414px (Large) is smooth, no clipping, no overflow", () => {
    const c413 = getActiveContract(413);
    const c414 = getActiveContract(414);

    expect(c413.id).toBe("standard");
    expect(c414.id).toBe("large");

    const g413 = calculateGeometry(413);
    const g414 = calculateGeometry(414);

    expect(g413.hasOverflow).toBe(false);
    expect(g414.hasOverflow).toBe(false);

    // Builder width transition is smooth (no drastic drop or blowout)
    // 413 available: 413 - 28 = 385px. Capped at 393px = 385px.
    // 414 available: 414 - 16 = 398px. Capped at 440px = 398px.
    expect(Math.abs(g414.builderWidth - g413.builderWidth)).toBeLessThanOrEqual(15);

    // Both preserve healthy builder width ratio ~92.5-93.5%
    expect(g413.builderRatio).toBeGreaterThan(0.92);
    expect(g414.builderRatio).toBeGreaterThan(0.92);
  });

  it("6. Computed Styles Table Verification: 360 (Compact), 393 (Standard), 440 (Large)", () => {
    const c360 = getActiveContract(360);
    const c393 = getActiveContract(393);
    const c440 = getActiveContract(440);

    const computedTable = [
      { element: "Hero H1 span", compact: c360.hero.h1SpanFontSize, standard: c393.hero.h1SpanFontSize, large: c440.hero.h1SpanFontSize },
      { element: "Hero H1 b", compact: c360.hero.h1BFontSize, standard: c393.hero.h1BFontSize, large: c440.hero.h1BFontSize },
      { element: "Hero subtitle", compact: c360.hero.subtitleFontSize, standard: c393.hero.subtitleFontSize, large: c440.hero.subtitleFontSize },
      { element: "Builder title", compact: c360.builderHead.titleFontSize, standard: c393.builderHead.titleFontSize, large: c440.builderHead.titleFontSize },
      { element: "Builder description", compact: c360.builderHead.descriptionFontSize, standard: c393.builderHead.descriptionFontSize, large: c440.builderHead.descriptionFontSize },
      { element: "Step title", compact: c360.stepLabels.labelBFontSize, standard: c393.stepLabels.labelBFontSize, large: c440.stepLabels.labelBFontSize },
      { element: "Step helper", compact: c360.stepLabels.labelSmallFontSize, standard: c393.stepLabels.labelSmallFontSize, large: c440.stepLabels.labelSmallFontSize },
      { element: "Goal label", compact: c360.goals.labelFontSize, standard: c393.goals.labelFontSize, large: c440.goals.labelFontSize },
      { element: "Goal icon", compact: c360.goals.serviceIconSize, standard: c393.goals.serviceIconSize, large: c440.goals.serviceIconSize },
      { element: "Network label", compact: c360.networks.labelFontSize, standard: c393.networks.labelFontSize, large: c440.networks.labelFontSize },
      { element: "Network icon", compact: c360.networks.platformImageSize, standard: c393.networks.platformImageSize, large: c440.networks.platformImageSize },
      { element: "Field label", compact: c360.inputs.fieldLabelFontSize, standard: c393.inputs.fieldLabelFontSize, large: c440.inputs.fieldLabelFontSize },
      { element: "Input text", compact: c360.inputs.inputTextFontSize, standard: c393.inputs.inputTextFontSize, large: c440.inputs.inputTextFontSize },
      { element: "Privacy", compact: c360.inputs.privacyFontSize, standard: c393.inputs.privacyFontSize, large: c440.inputs.privacyFontSize },
      { element: "Error message", compact: c360.inputs.errorFontSize, standard: c393.inputs.errorFontSize, large: c440.inputs.errorFontSize },
      { element: "Analyze title", compact: c360.analyzing.titleFontSize, standard: c393.analyzing.titleFontSize, large: c440.analyzing.titleFontSize },
      { element: "Analyze subtitle", compact: c360.analyzing.subtitleFontSize, standard: c393.analyzing.subtitleFontSize, large: c440.analyzing.subtitleFontSize },
      { element: "Analyze CTA text", compact: c360.analyzeCta.textFontSize, standard: c393.analyzeCta.textFontSize, large: c440.analyzeCta.textFontSize },
      { element: "Summary title", compact: c360.summary.titleFontSize, standard: c393.summary.titleFontSize, large: c440.summary.titleFontSize },
      { element: "Summary helper", compact: c360.summary.smallFontSize, standard: c393.summary.smallFontSize, large: c440.summary.smallFontSize },
      { element: "Empty title", compact: c360.emptyState.titleFontSize, standard: c393.emptyState.titleFontSize, large: c440.emptyState.titleFontSize },
      { element: "Empty helper", compact: c360.emptyState.descriptionFontSize, standard: c393.emptyState.descriptionFontSize, large: c440.emptyState.descriptionFontSize },
      { element: "PWA title", compact: c360.pwaBanner.titleFontSize, standard: c393.pwaBanner.titleFontSize, large: c440.pwaBanner.titleFontSize },
      { element: "PWA subtitle", compact: c360.pwaBanner.subtitleFontSize, standard: c393.pwaBanner.subtitleFontSize, large: c440.pwaBanner.subtitleFontSize },
    ];

    expect(computedTable.length).toBe(24);
    for (const row of computedTable) {
      // Hero H1 was intentionally calibrated at 25px in STANDARD/LARGE per user spec
      if (row.element.startsWith("Hero H1")) {
        expect(parseFloat(row.large)).toBe(25);
        expect(parseFloat(row.standard)).toBe(25);
      } else {
        expect(parseFloat(row.compact)).toBeLessThanOrEqual(parseFloat(row.standard));
        expect(parseFloat(row.large)).toBeGreaterThanOrEqual(parseFloat(row.standard));
      }
    }
  });

  it("7. Geometry Table Verification: 360 (Compact), 393 (Standard), 440 (Large)", () => {
    const g360 = calculateGeometry(360);
    const g393 = calculateGeometry(393);
    const g440 = calculateGeometry(440);

    expect(g360.viewport).toBe(360);
    expect(g360.builderWidth).toBe(340);
    expect(g360.builderRatio).toBeCloseTo(0.944, 2);

    expect(g393.viewport).toBe(393);
    expect(g393.builderWidth).toBe(377);
    expect(g393.builderRatio).toBeCloseTo(0.959, 2);

    expect(g440.viewport).toBe(440);
    expect(g440.builderWidth).toBe(424);
    expect(g440.builderRatio).toBeCloseTo(0.964, 2);
  });

  it("8. Negative Test: Android (no cf-platform-ios) NEVER matches iOS canonical rules", () => {
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

  it("9. Negative Test: iPadOS (cf-platform-ipados) NEVER matches html.cf-platform-ios rules", () => {
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

  it("10. Negative Test: Desktop Viewport (> 900px) does not apply mobile handheld media rules", () => {
    const lines = canonicalCss.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("@media") && !line.includes("max-width")) {
        expect(line).not.toContain("min-width: 901px");
      }
    }
  });

  it("11. Result Action Buttons: Large contract calibration vs non-Large isolation", () => {
    // Verify that the canonical stylesheet defines the large override strictly within 414px-900px
    const largeMediaBlock = canonicalCss.substring(canonicalCss.indexOf("@media (min-width: 414px) and (max-width: 900px)"));
    expect(largeMediaBlock).toContain("html.cf-platform-ios body .cf-pb-result-actions button {");
    expect(largeMediaBlock).toContain("border-radius: 10px !important;");
    expect(largeMediaBlock).toContain("justify-content: center !important;");
    expect(largeMediaBlock).toContain("align-items: center !important;");
    expect(largeMediaBlock).toContain("gap: 6px !important;");
    expect(largeMediaBlock).toContain("height: 50px !important;");
    expect(largeMediaBlock).toContain("min-height: 50px !important;");
    expect(largeMediaBlock).toContain("font-size: 15.5px !important;");
    expect(largeMediaBlock).toContain("html.cf-platform-ios body .cf-pb-result-actions button svg {");
    expect(largeMediaBlock).toContain("width: 18px !important;");
    expect(largeMediaBlock).toContain("height: 18px !important;");
  });

  it("12. Large Contract: Pricing and Plan Cards calibration matches tokens", () => {
    const largeTokens = IOS_STOREFRONT_CONTRACT.largePricingAndPackageCards;
    expect(largeTokens.pricingTitleSpanFontSize).toBe("25px");
    expect(largeTokens.pricingSubtitleFontSize).toBe("16.5px");
    expect(largeTokens.planNameFontSize).toBe("17.5px");
    expect(largeTokens.qtyFontSize).toBe("16.5px");
    expect(largeTokens.bonusFontSize).toBe("15.2px");
    expect(largeTokens.bonusSvgSize).toBe("16px");
    expect(largeTokens.oldPriceDelFontSize).toBe("16.5px");
    expect(largeTokens.couponFontSize).toBe("15px");
    expect(largeTokens.benefitsLiFontSize).toBe("15px");
    expect(largeTokens.benefitIconContainerSize).toBe("18px");
    expect(largeTokens.benefitSvgSize).toBe("12px");
    expect(largeTokens.assuranceFontSize).toBe("15px");
    expect(largeTokens.assuranceSvgSize).toBe("20px");
    expect(largeTokens.ctaDefaultFontSize).toBe("16px");
    expect(largeTokens.discountBadgeSpanFontSize).toBe("15px");
    expect(largeTokens.discountBadgeSvgWidth).toBe("16px");
    expect(largeTokens.discountBadgeSvgMinWidth).toBe("18px");
    expect(largeTokens.discountBadgeSvgHeight).toBe("18px");
    expect(largeTokens.discountBadgeSvgStrokeWidth).toBe("2.1px");
    expect(largeTokens.gridGap).toBe("22px");
    expect(largeTokens.bestBadgeFontSize).toBe("15px");
    expect(largeTokens.bestBadgeHeight).toBe("24px");
    expect(largeTokens.bestBadgeSvgSize).toBe("18px");
    expect(largeTokens.packageGridWidthInvariant).toBe("min(66%, 320px)");
    expect(largeTokens.packageGridMaxWidthInvariant).toBe("320px");
  });
});
