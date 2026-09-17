import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("ios-overrides.css - Analysis Progress Isolation Invariant", () => {
  const cssPath = path.resolve(__dirname, "../../styles/ios-overrides.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("ensures Section 9 exists and every single selector inside it is strictly anchored to .cf-pb-result-analyzing", () => {
    // Find Section 9 header
    const section9Marker = "9. ANALYSIS PROGRESS PANEL";
    const section9Index = cssContent.indexOf(section9Marker);
    expect(section9Index).toBeGreaterThan(-1);

    const section9Content = cssContent.slice(section9Index);

    // Extract all rule declarations inside Section 9 (ignoring @media lines)
    const lines = section9Content.split("\n");
    const selectorLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.endsWith("{") && !line.startsWith("@media") && !line.startsWith("/*")) {
        selectorLines.push(line.replace("{", "").trim());
      }
    }

    expect(selectorLines.length).toBeGreaterThan(0);

    // Invariant: Every selector in Section 9 MUST contain .cf-pb-result-analyzing
    for (const selector of selectorLines) {
      expect(
        selector.includes(".cf-pb-result-analyzing"),
        `Selector "${selector}" in Section 9 must contain ".cf-pb-result-analyzing" to prevent leaking into idle/result/normal storefront state`
      ).toBe(true);

      // Invariant: Must also be scoped to html.cf-platform-ios
      expect(
        selector.startsWith("html.cf-platform-ios"),
        `Selector "${selector}" must be scoped to "html.cf-platform-ios"`
      ).toBe(true);
    }
  });

  it("ensures step labels and statuses are preserved at 13.5px and never reduced to 12px", () => {
    const section9Marker = "9. ANALYSIS PROGRESS PANEL";
    const section9Content = cssContent.slice(cssContent.indexOf(section9Marker));

    // Confirm 13.5px font-size for labels and statuses
    expect(section9Content).toMatch(/\.cf-pb-statuses\s+b\s*\{[^}]*font-size:\s*13\.5px/);
    expect(section9Content).toMatch(/\.cf-pb-statuses\s+small\s*\{[^}]*font-size:\s*13\.5px/);

    // Confirm that inside media queries (like max-width: 330px), labels and status are NOT reduced to 12px
    const media330Marker = "@media (max-width: 330px)";
    const media330Index = section9Content.indexOf(media330Marker);
    expect(media330Index).toBeGreaterThan(-1);

    const media330Block = section9Content.slice(media330Index);
    expect(media330Block).not.toMatch(/\.cf-pb-statuses\s+b\s*\{[^}]*font-size:\s*12px/);
    expect(media330Block).not.toMatch(/\.cf-pb-statuses\s+small\s*\{[^}]*font-size:\s*12px/);
  });
});
