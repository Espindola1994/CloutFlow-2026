import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore - jsdom types optional for unit smoke test
import { JSDOM } from "jsdom";
import { IOS_STOREFRONT_CONTRACT } from "../platform/ios-storefront.contract";

describe("Computed Style & Rule Matching Smoke Tests (Canonical Frame: 430px, 393px & 375px)", () => {
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");

  const createDom = (isIos: boolean) => {
    const htmlClass = isIos ? "dark cf-platform-ios" : "dark";
    const html = `
      <!DOCTYPE html>
      <html lang="en" class="${htmlClass}">
      <head>
        <style>${canonicalCss}</style>
      </head>
      <body>
        <header class="cf-plans-header cf-plans-header-clean">
          <a class="cf-plans-logo cf-plans-logo-image">
            <img src="/logo.png" />
          </a>
          <div class="cf-plans-header-tagline">
            <svg class="cf-plans-header-flame"></svg>
            <b class="cf-tagline-text-mobile">Post. Engage. Grow.</b>
          </div>
        </header>

        <section class="cf-plans-shell">
          <div class="cf-plans-hero">
            <p>Real people. Real results.</p>
          </div>
          <div class="cf-premium-builder">
            <div class="cf-premium-builder-head">
              <small>START HERE</small>
              <p>Three quick steps</p>
            </div>
            <div class="cf-premium-builder-controls">
              <div class="cf-pb-label">
                <i>1</i>
                <div><b>Choose your goal</b><small>What do you want to achieve?</small></div>
              </div>
              <div class="cf-pb-goals">
                <button class="active">
                  <span class="cf-pb-service-icon"><svg class="cf-pb-glyph"></svg></span>
                  <b>Followers</b>
                  <svg class="check-svg"></svg>
                </button>
              </div>
              <div class="cf-pb-platforms">
                <button class="active">
                  <span class="cf-pb-platform-icon"><img src="/ig.svg" /></span>
                  <b>Instagram</b>
                  <svg class="check-svg"></svg>
                </button>
              </div>
              <label class="cf-pb-field-label">Username</label>
              <div class="cf-pb-input"><svg></svg><input value="" /></div>
              <p class="cf-pb-privacy">Privacy</p>
              <button class="cf-pb-analyze-btn"><svg></svg>Analyze Profile</button>
            </div>
            <div class="cf-premium-builder-result cf-pb-result-idle">
              <div class="cf-pb-summary">
                <div>
                  <span class="cf-pb-service-icon"><svg class="cf-pb-glyph"></svg></span>
                  <span><b>Followers</b><small>Goal</small></span>
                </div>
                <div>
                  <span class="cf-pb-platform-icon"><img src="/ig.svg" /></span>
                  <span><b>Instagram</b><small>Platform</small></span>
                </div>
              </div>
              <div class="cf-pb-empty">
                <span>✦</span>
                <h3>Ready when you are</h3>
                <p>Select your goal</p>
              </div>
            </div>
            <div class="cf-premium-builder-result cf-pb-result-analyzing">
              <div class="cf-pb-loading">
                <div class="cf-pb-progress"><b>45%</b></div>
                <div>
                  <h3>Analyzing profile...</h3>
                  <p>Please wait while we fetch public data.</p>
                  <div class="cf-pb-statuses">
                    <div class="done"><span><svg></svg></span><b>Checking profile</b><small>Completed</small></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside data-testid="public-pwa-banner">
          <div class="text-xs">CloutFlow App</div>
          <div class="text-[11px]">Grow faster with CloutFlow</div>
          <div class="w-3.5 h-3.5"></div>
        </aside>
      </body>
      </html>
    `;

    return new JSDOM(html, { pretendToBeVisual: true });
  };

  function getAllMatchedRules(doc: Document, element: Element): CSSStyleRule[] {
    const styleEl = doc.querySelector("style");
    if (!styleEl || !styleEl.sheet) return [];

    const matched: CSSStyleRule[] = [];
    const sheet = styleEl.sheet as CSSStyleSheet;

    for (let i = 0; i < sheet.cssRules.length; i++) {
      const rule = sheet.cssRules[i];
      if (rule instanceof doc.defaultView!.CSSMediaRule) {
        for (let j = 0; j < rule.cssRules.length; j++) {
          const subRule = rule.cssRules[j] as CSSStyleRule;
          if (subRule.selectorText && element.matches(subRule.selectorText)) {
            matched.push(subRule);
          }
        }
      } else if (rule instanceof doc.defaultView!.CSSStyleRule) {
        if (rule.selectorText && element.matches(rule.selectorText)) {
          matched.push(rule);
        }
      }
    }
    return matched;
  }

  it("1. On iPhone (cf-platform-ios present), critical elements match iOS storefront contract rules", () => {
    const dom = createDom(true);
    const doc = dom.window.document;

    // 1. Header Logo
    const logoImg = doc.querySelector(".cf-plans-header-clean .cf-plans-logo-image > img")!;
    const logoRules = getAllMatchedRules(doc, logoImg);
    expect(logoRules.length).toBeGreaterThan(0);
    const logoRule = logoRules.find((r) => r.style.height === IOS_STOREFRONT_CONTRACT.header.logoHeight);
    expect(logoRule).toBeDefined();
    expect(logoRule!.style.maxWidth).toBe(IOS_STOREFRONT_CONTRACT.header.logoMaxWidth);

    // 2. Hero Subtitle
    const heroP = doc.querySelector(".cf-plans-hero p")!;
    const heroRules = getAllMatchedRules(doc, heroP);
    expect(heroRules.length).toBeGreaterThan(0);
    expect(heroRules.some((r) => r.style.fontSize === "var(--ios-type-hero-subtitle)")).toBe(true);

    // 3. Step Label B & Small
    const labelB = doc.querySelector(".cf-pb-label b")!;
    const labelBRules = getAllMatchedRules(doc, labelB);
    expect(labelBRules.some((r) => r.style.fontSize === "var(--ios-type-builder-label-b)")).toBe(true);

    const labelSmall = doc.querySelector(".cf-pb-label small")!;
    const labelSmallRules = getAllMatchedRules(doc, labelSmall);
    expect(labelSmallRules.some((r) => r.style.fontSize === "var(--ios-type-builder-label-small)")).toBe(true);

    // 4. Goal Button Label
    const goalBtnB = doc.querySelector(".cf-pb-goals button b")!;
    const goalBtnRules = getAllMatchedRules(doc, goalBtnB);
    expect(goalBtnRules.some((r) => r.style.fontSize === "var(--ios-type-goal-label)")).toBe(true);

    // 5. Networks Button & Label
    const platformBtn = doc.querySelector(".cf-pb-platforms button")!;
    const platformBtnRules = getAllMatchedRules(doc, platformBtn);
    expect(platformBtnRules.some((r) => r.style.height === "var(--ios-control-platform-height)")).toBe(true);

    // 5b. Input Height & Analyze Button Height
    const inputDiv = doc.querySelector(".cf-pb-input")!;
    const inputRules = getAllMatchedRules(doc, inputDiv);
    expect(inputRules.some((r) => r.style.height === "var(--ios-control-input-height)")).toBe(true);

    const analyzeBtn = doc.querySelector(".cf-pb-analyze-btn")!;
    const analyzeRules = getAllMatchedRules(doc, analyzeBtn);
    expect(analyzeRules.some((r) => r.style.height === "var(--ios-control-analyze-height)")).toBe(true);

    // 6. Analyzing Progress Title, Subtitle, Labels, Statuses
    const analyzingH3 = doc.querySelector(".cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-loading h3")!;
    const analyzingH3Rules = getAllMatchedRules(doc, analyzingH3);
    expect(analyzingH3Rules.some((r) => r.style.fontSize === "var(--ios-type-analyzing-title)")).toBe(true);

    const analyzingP = doc.querySelector(".cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-loading p")!;
    const analyzingPRules = getAllMatchedRules(doc, analyzingP);
    expect(analyzingPRules.some((r) => r.style.fontSize === "var(--ios-type-analyzing-subtitle)")).toBe(true);

    const analyzingStatusB = doc.querySelector(".cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-statuses b")!;
    const analyzingStatusBRules = getAllMatchedRules(doc, analyzingStatusB);
    expect(analyzingStatusBRules.some((r) => r.style.fontSize === "var(--ios-type-analyzing-step)")).toBe(true);

    const analyzingStatusSmall = doc.querySelector(".cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-statuses small")!;
    const analyzingStatusSmallRules = getAllMatchedRules(doc, analyzingStatusSmall);
    expect(analyzingStatusSmallRules.some((r) => r.style.fontSize === "var(--ios-type-analyzing-step)")).toBe(true);

    // 7. PWA Banner
    const pwaTitle = doc.querySelector('[data-testid="public-pwa-banner"] .text-xs')!;
    const pwaTitleRules = getAllMatchedRules(doc, pwaTitle);
    expect(pwaTitleRules.some((r) => r.style.fontSize === "var(--ios-type-pwa-title)")).toBe(true);

    const pwaIcon = doc.querySelector('[data-testid="public-pwa-banner"] .w-3\\.5')!;
    const pwaIconRules = getAllMatchedRules(doc, pwaIcon);
    expect(pwaIconRules.some((r) => r.style.width === "var(--ios-icon-pwa)")).toBe(true);

    const pwaSubtitle = doc.querySelector('[data-testid="public-pwa-banner"] .text-\\[11px\\]')!;
    const pwaSubtitleRules = getAllMatchedRules(doc, pwaSubtitle);
    expect(pwaSubtitleRules.some((r) => r.style.fontSize === "var(--ios-type-pwa-subtitle)")).toBe(true);
  });

  it("2. On Non-iOS (cf-platform-ios absent), iOS storefront rules match ZERO elements", () => {
    const dom = createDom(false);
    const doc = dom.window.document;

    const logoImg = doc.querySelector(".cf-plans-header-clean .cf-plans-logo-image > img")!;
    expect(getAllMatchedRules(doc, logoImg)).toHaveLength(0);

    const heroP = doc.querySelector(".cf-plans-hero p")!;
    expect(getAllMatchedRules(doc, heroP)).toHaveLength(0);

    const analyzingH3 = doc.querySelector(".cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-loading h3")!;
    expect(getAllMatchedRules(doc, analyzingH3)).toHaveLength(0);
  });

  it("3. Canonical Frame Invariant: Builder has bounded width min(100%, var(--cf-ios-content-max)) and auto margins", () => {
    const dom = createDom(true);
    const doc = dom.window.document;

    const builder = doc.querySelector(".cf-premium-builder")!;
    const builderRules = getAllMatchedRules(doc, builder);
    expect(builderRules.length).toBeGreaterThan(0);

    expect(builderRules.some((r) => r.style.maxWidth === "var(--cf-ios-content-max)")).toBe(true);
    expect(builderRules.some((r) => r.style.marginLeft === "auto" && r.style.marginRight === "auto")).toBe(true);
  });
});
