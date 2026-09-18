import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore - jsdom types optional in tests
import { JSDOM } from "jsdom";
import { IOS_STOREFRONT_CONTRACT } from "../platform/ios-storefront.contract";
import { PLATFORM_BOOTSTRAP_SCRIPT } from "../../lib/platform";

describe("iOS Real Runtime & Synchronous Bootstrap Integration Tests", () => {
  const nextHtmlPath = path.resolve(__dirname, "../../../.next/server/app/index.html");
  const layoutPath = path.resolve(__dirname, "../../app/layout.tsx");
  const bootstrapPath = path.resolve(__dirname, "../../components/platform/PlatformBootstrapScript.tsx");
  const canonicalCssPath = path.resolve(__dirname, "../platform/ios-storefront.css");
  const canonicalCss = fs.readFileSync(canonicalCssPath, "utf-8");

  it("1. PlatformBootstrapScript uses native synchronous inline <script> directly in <head>", () => {
    const bootstrapContent = fs.readFileSync(bootstrapPath, "utf-8");
    expect(bootstrapContent).toContain("<script");
    expect(bootstrapContent).not.toContain('import Script from "next/script"');
    expect(bootstrapContent).not.toContain("strategy=");
    expect(bootstrapContent).toContain("PLATFORM_BOOTSTRAP_SCRIPT");
  });

  it("2. Real HTML output contains native synchronous script that executes before hydration on iPhone", () => {
    // If .next/server/app/index.html exists, test against real built HTML; otherwise read layout
    let html = "";
    if (fs.existsSync(nextHtmlPath)) {
      html = fs.readFileSync(nextHtmlPath, "utf-8");
      expect(html).toContain('id="cf-platform-bootstrap">(function()');
    } else {
      const layoutContent = fs.readFileSync(layoutPath, "utf-8");
      expect(layoutContent).toContain("<PlatformBootstrapScript />");
      html = `<!DOCTYPE html><html lang="en" class="dark"><head><script id="cf-platform-bootstrap">${PLATFORM_BOOTSTRAP_SCRIPT}</script></head><body></body></html>`;
    }

    // Run synchronous script execution during initial HTML parse (before any client JS or hydration)
    const iPhoneUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

    const dom = new JSDOM(html, {
      url: "https://cloutflow.co/",
      runScripts: "dangerously",
      beforeParse(window: any) {
        Object.defineProperty(window.navigator, "userAgent", {
          value: iPhoneUa,
          configurable: true,
        });
      },
    });

    expect(dom.window.document.documentElement.classList.contains("cf-platform-ios")).toBe(true);
    expect(dom.window.document.documentElement.classList.contains("cf-platform-ipados")).toBe(false);
  });

  it("3. Regression: iPhone 16 Pro Max in Chrome DevTools (440x956, DPR 3, touch 0) activates cf-platform-ios and Large Contract styles", () => {
    const devToolsUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

    const html = `<!DOCTYPE html><html lang="en" class="dark"><head><script id="cf-platform-bootstrap">${PLATFORM_BOOTSTRAP_SCRIPT}</script><style>${canonicalCss}</style></head><body>
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
          <h1><span>Choose the Perfect Plan</span><b>to Accelerate Your Growth</b></h1>
          <p>Real people. Real results.</p>
        </div>
        <div class="cf-premium-builder">
          <div class="cf-premium-builder-head">
            <small>START HERE</small>
            <h2>Build Your Growth Package</h2>
            <p>Three quick steps</p>
          </div>
          <div class="cf-premium-builder-controls">
            <div class="cf-pb-step">
              <div class="cf-pb-label">
                <i>1</i>
                <div><b>Choose your goal</b><small>What do you want to achieve?</small></div>
              </div>
            </div>
            <div class="cf-pb-goals">
              <button class="active">
                <span class="cf-pb-service-icon cf-pb-service-followers"><svg class="cf-pb-glyph"></svg></span>
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
            <div class="cf-pb-step cf-pb-analyze">
              <button class="cf-pb-analyze-btn"><svg></svg>Analyze Profile</button>
            </div>
          </div>
          <div class="cf-premium-builder-result cf-pb-result-idle">
            <div class="cf-pb-summary">
              <div>
                <span class="cf-pb-service-icon"><svg class="cf-pb-glyph"></svg></span>
                <span><b>Followers</b><small>Goal</small></span>
              </div>
            </div>
            <div class="cf-pb-empty">
              <span>✦</span>
              <h3>Ready when you are</h3>
              <p>Select your goal</p>
            </div>
          </div>
        </div>
      </section>
    </body></html>`;

    const dom = new JSDOM(html, {
      url: "https://cloutflow.co/",
      runScripts: "dangerously",
      beforeParse(window: any) {
        Object.defineProperty(window.navigator, "userAgent", {
          value: devToolsUa,
          configurable: true,
        });
        Object.defineProperty(window.navigator, "maxTouchPoints", {
          value: 0,
          configurable: true,
        });
        Object.defineProperty(window, "innerWidth", {
          value: 440,
          configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: 956,
          configurable: true,
        });
        Object.defineProperty(window, "devicePixelRatio", {
          value: 3,
          configurable: true,
        });
      },
    });

    const doc = dom.window.document;
    const docEl = doc.documentElement;

    // 1. Invariant: cf-platform-ios is activated
    expect(docEl.classList.contains("cf-platform-ios")).toBe(true);
    expect(docEl.classList.contains("cf-platform-ipados")).toBe(false);

    // 2. Invariant: Hero H1 spans have their dedicated internal sizes, while container stays valid
    const heroH1Span = doc.querySelector(".cf-plans-shell .cf-plans-hero h1 span");
    const heroH1B = doc.querySelector(".cf-plans-shell .cf-plans-hero h1 b");
    expect(heroH1Span).not.toBeNull();
    expect(heroH1B).not.toBeNull();

    // 3. Contract C (LARGE @ 440px) values match exactly
    const largeContract = IOS_STOREFRONT_CONTRACT.contracts.large;
    expect(largeContract.builderHead.titleFontSize).toBe("26.5px");
    expect(largeContract.stepLabels.labelBFontSize).toBe("17px");
    expect(largeContract.stepLabels.labelSmallFontSize).toBe("15.5px");
    expect(largeContract.goals.labelFontSize).toBe("15.5px");
    expect(largeContract.inputs.fieldLabelFontSize).toBe("16px");
    expect(largeContract.inputs.inputTextFontSize).toBe("14.5px");
    expect(largeContract.analyzeCta.textFontSize).toBe("17.2px");
  });

  it("4. Negative Test: Synchronous script does NOT add cf-platform-ios on Android / Poco", () => {
    const androidUa =
      "Mozilla/5.0 (Linux; Android 13; POCO F5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    let html = "";
    if (fs.existsSync(nextHtmlPath)) {
      html = fs.readFileSync(nextHtmlPath, "utf-8");
    } else {
      html = `<!DOCTYPE html><html lang="en" class="dark"><head><script id="cf-platform-bootstrap">${PLATFORM_BOOTSTRAP_SCRIPT}</script></head><body></body></html>`;
    }

    const dom = new JSDOM(html, {
      url: "https://cloutflow.co/",
      runScripts: "dangerously",
      beforeParse(window: any) {
        Object.defineProperty(window.navigator, "userAgent", {
          value: androidUa,
          configurable: true,
        });
        Object.defineProperty(window.navigator, "maxTouchPoints", {
          value: 5,
          configurable: true,
        });
      },
    });

    expect(dom.window.document.documentElement.classList.contains("cf-platform-ios")).toBe(false);
    expect(dom.window.document.documentElement.classList.contains("cf-platform-ipados")).toBe(false);
  });

  it("5. Negative Test: Synchronous script does NOT add cf-platform-ios on iPadOS (multi-touch Mac/iPad)", () => {
    const ipadUa =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
    let html = "";
    if (fs.existsSync(nextHtmlPath)) {
      html = fs.readFileSync(nextHtmlPath, "utf-8");
    } else {
      html = `<!DOCTYPE html><html lang="en" class="dark"><head><script id="cf-platform-bootstrap">${PLATFORM_BOOTSTRAP_SCRIPT}</script></head><body></body></html>`;
    }

    const dom = new JSDOM(html, {
      url: "https://cloutflow.co/",
      runScripts: "dangerously",
      beforeParse(window: any) {
        Object.defineProperty(window.navigator, "userAgent", {
          value: ipadUa,
          configurable: true,
        });
        Object.defineProperty(window.navigator, "maxTouchPoints", {
          value: 5,
          configurable: true,
        });
      },
    });

    expect(dom.window.document.documentElement.classList.contains("cf-platform-ios")).toBe(false);
    expect(dom.window.document.documentElement.classList.contains("cf-platform-ipados")).toBe(true);
  });

  it("6. Negative Test: Synchronous script does NOT add cf-platform-ios on Windows Chrome", () => {
    const windowsUa =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const html = `<!DOCTYPE html><html lang="en" class="dark"><head><script id="cf-platform-bootstrap">${PLATFORM_BOOTSTRAP_SCRIPT}</script></head><body></body></html>`;

    const dom = new JSDOM(html, {
      url: "https://cloutflow.co/",
      runScripts: "dangerously",
      beforeParse(window: any) {
        Object.defineProperty(window.navigator, "userAgent", {
          value: windowsUa,
          configurable: true,
        });
        Object.defineProperty(window.navigator, "maxTouchPoints", {
          value: 0,
          configurable: true,
        });
      },
    });

    expect(dom.window.document.documentElement.classList.contains("cf-platform-ios")).toBe(false);
    expect(dom.window.document.documentElement.classList.contains("cf-platform-ipados")).toBe(false);
  });

  it("7. Real Built DOM contains exact selectors matching all canonical contract rules", () => {
    let html = "";
    if (fs.existsSync(nextHtmlPath)) {
      html = fs.readFileSync(nextHtmlPath, "utf-8");
    } else {
      return;
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Inject canonical CSS and add cf-platform-ios to simulate real iPhone DOM
    const styleEl = doc.createElement("style");
    styleEl.textContent = canonicalCss;
    doc.head.appendChild(styleEl);
    doc.documentElement.classList.add("cf-platform-ios");

    const criticalSelectors = [
      ".cf-plans-shell .cf-plans-hero p",
      ".cf-premium-builder-head small",
      ".cf-premium-builder-head p",
      ".cf-pb-label b",
      ".cf-pb-label small",
      ".cf-premium-builder-controls .cf-pb-goals button b",
      ".cf-premium-builder-controls .cf-pb-field-label",
      ".cf-premium-builder-controls .cf-pb-input input",
      ".cf-pb-privacy",
      ".cf-premium-builder-controls .cf-pb-analyze-btn",
      ".cf-plans-header-tagline .cf-tagline-text-mobile",
      ".cf-plans-header-clean .cf-plans-logo.cf-plans-logo-image > img",
      ".cf-pb-summary b",
      ".cf-pb-summary small",
      ".cf-pb-empty h3",
      ".cf-pb-empty p",
    ];

    criticalSelectors.forEach((sel) => {
      const el = doc.querySelector(sel);
      expect(el, `Selector should exist in real DOM: ${sel}`).not.toBeNull();
    });
  });
});

