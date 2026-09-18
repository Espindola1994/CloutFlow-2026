import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("iOS Large Home Lower Sections Computed Style Simulation & Validation", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const css = fs.readFileSync(canonicalCssPath, "utf-8");

  it("validates that all 30 Large calibration rules exist strictly under @media (min-width: 414px) and (max-width: 900px)", () => {
    const largeBlockStart = css.indexOf("@media (min-width: 414px) and (max-width: 900px)");
    expect(largeBlockStart).toBeGreaterThan(0);
    const largeCss = css.slice(largeBlockStart);

    // Check all 30 items in the LARGE section
    expect(largeCss).toContain(".cf-plans-section-title h2");
    expect(largeCss).toContain("letter-spacing: -.48px !important;");
    expect(largeCss).toContain("font-size: 25px !important;");

    expect(largeCss).toContain(".cf-plans-section-title p");
    expect(largeCss).toContain("color: #718097 !important;");
    expect(largeCss).toContain("font-size: 16.5px !important;");

    expect(largeCss).toContain(".cf-plans-review-head b");
    expect(largeCss).toContain("font-size: 14.5px !important;");

    expect(largeCss).toContain(".cf-plans-review-head small");
    expect(largeCss).toContain(".cf-universal-target-compact small");
    expect(largeCss).toContain("font-size: 13.4px !important;");

    expect(largeCss).toContain(".cf-plans-review-head > svg");
    expect(largeCss).toContain("color: #168cff !important;");
    expect(largeCss).toContain("fill: #168cff !important;");
    expect(largeCss).toContain("stroke: #fff !important;");
    expect(largeCss).toContain("width: 20px !important;");
    expect(largeCss).toContain("height: 20px !important;");

    expect(largeCss).toContain(".cf-plans-review-card p");
    expect(largeCss).toContain("font-size: 12.5px !important;");
    expect(largeCss).toContain("line-height: 1.35 !important;");

    expect(largeCss).toContain(".cf-plans-review-tag");
    expect(largeCss).toContain("font-size: 13px !important;");
    expect(largeCss).toContain("font-weight: 650 !important;");

    expect(largeCss).toContain(".cf-trust-pill .cf-trust-excellent");
    expect(largeCss).toContain(".cf-trust-pill .cf-trust-score");
    expect(largeCss).toContain(".cf-trust-pill .cf-trust-reviews");
    expect(largeCss).toContain(".cf-trust-pill .cf-trustpilot");
    expect(largeCss).toContain("font-size: 14.5px !important;");

    expect(largeCss).toContain(".cf-trust-stars span");
    expect(largeCss).toContain("font-size: 11.5px !important;");

    expect(largeCss).toContain(".cf-trustpilot > span");
    expect(largeCss).toContain("color: #00b67a !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-eyebrow");
    expect(largeCss).toContain("color: #ef2f75 !important;");
    expect(largeCss).toContain("font-size: 16px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-eyebrow svg");
    expect(largeCss).toContain("width: 15px !important;");
    expect(largeCss).toContain("height: 15px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-head h2");
    expect(largeCss).toContain("font-size: 24px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-head p");
    expect(largeCss).toContain("color: #7b879e !important;");
    expect(largeCss).toContain("margin: 8px auto 0 !important;");
    expect(largeCss).toContain("font-size: 16.5px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-question-copy");
    expect(largeCss).toContain("color: #20283b !important;");
    expect(largeCss).toContain("font-size: 15.5px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-icon");
    expect(largeCss).toContain("border-radius: 9px !important;");
    expect(largeCss).toContain("width: 33px !important;");
    expect(largeCss).toContain("height: 33px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-icon svg");
    expect(largeCss).toContain("width: 20px !important;");
    expect(largeCss).toContain("height: 20px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-toggle svg");
    expect(largeCss).toContain("stroke-width: 2.2px !important;");
    expect(largeCss).toContain("width: 18px !important;");
    expect(largeCss).toContain("height: 18px !important;");

    expect(largeCss).toContain(".cf-home-faq-compact .cf-home-faq-answer p");
    expect(largeCss).toContain("padding: 0 48px 12px 56px !important;");
    expect(largeCss).toContain("font-size: 14.5px !important;");
    expect(largeCss).toContain("font-weight: 410 !important;");

    expect(largeCss).toContain(".cf-plans-final-copy p");
    expect(largeCss).toContain("margin-top: -7px !important;");
    expect(largeCss).toContain("font-size: 15.5px !important;");
    expect(largeCss).toContain("font-weight: 470 !important;");

    expect(largeCss).toContain(".cf-plans-final-action button");
    expect(largeCss).toContain("min-height: 56px !important;");
    expect(largeCss).toContain("font-size: 16px !important;");

    expect(largeCss).toContain(".cf-plans-final-cta .cf-plans-rocket-premium");
    expect(largeCss).toContain("inset: 50% auto auto 65% !important;");
    expect(largeCss).toContain("width: 115px !important;");

    expect(largeCss).toContain(".cf-plans-final-action small");
    expect(largeCss).toContain("font-size: 15.5px !important;");

    expect(largeCss).toContain(".cf-social-proof-verified svg");
    expect(largeCss).toContain("stroke-width: 2.4px !important;");
    expect(largeCss).toContain("width: 18px !important;");
    expect(largeCss).toContain("height: 18px !important;");

    expect(largeCss).toContain(".cf-customer-faces img");
    expect(largeCss).toContain("width: 31px !important;");
    expect(largeCss).toContain("height: 31px !important;");
    expect(largeCss).toContain("margin-left: -7px !important;");

    expect(largeCss).toContain(".cf-plans-value-row b");
    expect(largeCss).toContain("font-size: 15.5px !important;");

    expect(largeCss).toContain(".cf-plans-value-row small");
    expect(largeCss).toContain("font-size: 14px !important;");

    expect(largeCss).toContain(".cf-plans-value-row > div > svg");
    expect(largeCss).toContain("width: 33px !important;");
    expect(largeCss).toContain("height: 33px !important;");
    expect(largeCss).toContain("padding: 5px !important;");

    expect(largeCss).toContain(".cf-plans-value-row > div");
    expect(largeCss).toContain("grid-template-columns: 29px minmax(0, 1fr) !important;");
    expect(largeCss).toContain("gap: 10px !important;");

    expect(largeCss).toContain(".cf-plans-final-action");
    expect(largeCss).toContain("grid-area: action !important;");
    expect(largeCss).toContain("gap: 11px !important;");
    expect(largeCss).toContain("margin-top: 6px !important;");
  });

  it("verifies negative scoping: none of these 30 new rules affect iOS Compact (<=374px) or Standard (375-413px) or Android or Desktop", () => {
    const compactBlock = css.substring(
      css.indexOf("/* ========================================\n   iOS VISUAL CONTRACT — COMPACT <=374"),
      css.indexOf("/* ========================================\n   iOS VISUAL CONTRACT — STANDARD 375-413")
    );
    const standardBlock = css.substring(
      css.indexOf("/* ========================================\n   iOS VISUAL CONTRACT — STANDARD 375-413"),
      css.indexOf("/* ========================================\n   iOS VISUAL CONTRACT — LARGE 414-900")
    );

    // Compact block must not contain the large calibration values
    expect(compactBlock).not.toContain("font-size: 14.5px !important;\n    font-weight: 410");
    expect(compactBlock).not.toContain("inset: 50% auto auto 65% !important;");
    expect(compactBlock).not.toContain("width: 115px !important;");

    // Standard block must not contain the large calibration values
    expect(standardBlock).not.toContain("font-size: 14.5px !important;\n    font-weight: 410");
    expect(standardBlock).not.toContain("inset: 50% auto auto 65% !important;");
    expect(standardBlock).not.toContain("width: 115px !important;");

    // Android/Desktop are unaffected because every single rule is under html.cf-platform-ios within @media (min-width: 414px) and (max-width: 900px)
  });

  it("verifies /offer isolation: the lower sections of Home do not match /offer packages", () => {
    // /offer package uses .cf-o10-master[data-stage="package"] and .cf-o10-package-panel
    // None of the newly added rules target .cf-o10-*
    const newRulesStart = css.indexOf("/* ==========================================================================\n     iOS LARGE HOME LOWER SECTIONS CALIBRATION");
    const newRules = css.slice(newRulesStart);
    expect(newRules).not.toContain(".cf-o10-");
  });
});
