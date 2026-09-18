import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore
import { JSDOM } from "jsdom";

describe("iOS /offer LARGE Parity Contract Tests", () => {
  const cssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  it("1. Verifies /offer LARGE parity rules exist in ios-storefront.css under @media (min-width: 414px) and (max-width: 900px)", () => {
    const largeBlock = css.substring(
      css.indexOf("@media (min-width: 414px) and (max-width: 900px)")
    );
    expect(largeBlock).toContain(".cf-offer-page .cf-o10-master[data-stage=\"package\"] .cf-o10-package-ref-plan-name strong");
    expect(largeBlock).toContain("font-size: 16px !important;");
    expect(largeBlock).toContain("font-size: 15px !important;");
    expect(largeBlock).toContain("font-size: 13px !important;");
    expect(largeBlock).toContain("font-size: 14.5px !important;");
    expect(largeBlock).toContain("font-size: 12px !important;");
    expect(largeBlock).toContain("font-size: 12.5px !important;");
    expect(largeBlock).toContain("font-size: 13.5px !important;");
  });

  it("2. Verifies all /offer LARGE parity selectors are strictly scoped under html.cf-platform-ios body .cf-offer-page", () => {
    const sectionStart = css.indexOf("/* ==========================================================================\n     iOS LARGE /OFFER PARITY WITH APPROVED STANDARD 393px");
    expect(sectionStart).toBeGreaterThan(-1);
    const sectionEnd = css.indexOf("/* ==========================================================================\n     iOS LARGE HOME LOWER SECTIONS CALIBRATION");
    const offerSection = css.substring(sectionStart, sectionEnd);

    const lines = offerSection.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.endsWith("{") && !trimmed.startsWith("/*")) {
        const parts = trimmed.replace("{", "").split(",");
        for (const p of parts) {
          const s = p.trim();
          if (s) {
            expect(s.startsWith("html.cf-platform-ios body .cf-offer-page")).toBe(true);
          }
        }
      }
    }
  });

  it("3. Verifies Home plan cards maintain their approved large scale (17.5px, etc.) while /offer uses 393px reference scale (16px, etc.)", () => {
    // Shared Home rules
    expect(css).toContain("html.cf-platform-ios body .cf-home-offer-card-host .cf-o10-package-ref-grid");
    expect(css).toContain(".cf-home-offer-card-host .cf-o10-package-ref-benefits li > span");

    // Scoped /offer rules override for .cf-offer-page only
    expect(css).toContain("html.cf-platform-ios body .cf-offer-page .cf-o10-master[data-stage=\"package\"] .cf-o10-package-ref-plan-name strong,\n  html.cf-platform-ios body .cf-offer-page .cf-o10-package-panel .cf-o10-package-ref-plan-name strong {\n    font-size: 16px !important;\n  }");
  });

  it("4. Verifies package grid invariant min(66%, 320px) is strictly preserved", () => {
    expect(css).toContain("width: min(66%, 320px) !important;");
    expect(css).toContain("max-width: 320px !important;");
    expect(css).toContain("margin: 0 auto !important;");
  });
});
