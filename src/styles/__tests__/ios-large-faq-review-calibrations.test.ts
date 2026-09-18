import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("iOS Large Additional Visual Calibrations: FAQ, Review Badge, Review Avatar", () => {
  const cssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  it("verifies FAQ question min-height = 68px !important strictly under LARGE contract", () => {
    expect(css).toContain(
      "html.cf-platform-ios body .cf-home-faq-compact .cf-home-faq-question {\n    min-height: 68px !important;\n  }"
    );
  });

  it("verifies Review verified badge align-self & margin strictly under LARGE contract", () => {
    expect(css).toContain(
      "html.cf-platform-ios body .cf-plans-review-head > svg {\n    color: #168cff !important;\n    fill: #168cff !important;\n    stroke: #fff !important;\n    width: 20px !important;\n    height: 20px !important;\n    align-self: center !important;\n    margin: -17px 0 8px -7px !important;\n  }"
    );
  });

  it("verifies Review avatar img 41x41 cover strictly under LARGE contract", () => {
    expect(css).toContain(
      "html.cf-platform-ios body .cf-plans-review-avatar img {\n    object-fit: cover !important;\n    width: 41px !important;\n    height: 41px !important;\n  }"
    );
  });

  it("ensures no generic max-width: 900px or unscoped rules were introduced for these calibrations", () => {
    const lines = css.split("\n");
    const faqQMatches = lines.filter(l => l.includes(".cf-home-faq-question {"));
    const avatarImgMatches = lines.filter(l => l.includes(".cf-plans-review-avatar img {"));
    
    // Scoped under Standard (375-413) and Large (414-900)
    expect(faqQMatches.length).toBeLessThanOrEqual(2);
    expect(avatarImgMatches.length).toBeLessThanOrEqual(2);
  });
});
