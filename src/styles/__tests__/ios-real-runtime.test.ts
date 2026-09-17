import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { IOS_STOREFRONT_CONTRACT } from "../platform/ios-storefront.contract";

describe("iOS Real Runtime Storefront Integration Tests", () => {
  const nextHtmlPath = path.resolve(__dirname, "../../../.next/server/app/index.html");
  const nextCssDir = path.resolve(__dirname, "../../../.next/static/chunks");

  it("1. Synchronous bootstrap script executes in real browser and applies cf-platform-ios on iPhone (430x932)", async () => {
    if (!fs.existsSync(nextHtmlPath)) {
      console.warn(".next/server/app/index.html not found, run npm run build first");
      return;
    }

    const htmlContent = fs.readFileSync(nextHtmlPath, "utf-8");
    const cssFiles = fs.readdirSync(nextCssDir).filter((f) => f.endsWith(".css"));
    let fullCss = "";
    for (const f of cssFiles) {
      fullCss += fs.readFileSync(path.join(nextCssDir, f), "utf-8") + "\n";
    }

    // Embed stylesheets directly into HTML for offline runtime inspection
    const testHtml = htmlContent.replace("</head>", `<style>${fullCss}</style></head>`);

    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
      );
      await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

      await page.setContent(testHtml, { waitUntil: "domcontentloaded" });

      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains("cf-platform-ios")
      );
      expect(hasClass).toBe(true);

      const computed = await page.evaluate(() => {
        const getFs = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? window.getComputedStyle(el).fontSize : null;
        };
        const getH = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? window.getComputedStyle(el).height : null;
        };

        return {
          heroSubtitle: getFs(".cf-plans-shell .cf-plans-hero p"),
          builderEyebrow: getFs(".cf-premium-builder-head small"),
          builderDescription: getFs(".cf-premium-builder-head p"),
          primaryLabel: getFs(".cf-pb-label b"),
          secondaryLabel: getFs(".cf-pb-label small"),
          goalLabel: getFs(".cf-premium-builder-controls .cf-pb-goals button b"),
          fieldLabel: getFs(".cf-premium-builder-controls .cf-pb-field-label"),
          input: getFs(".cf-premium-builder-controls .cf-pb-input input"),
          privacy: getFs(".cf-pb-privacy"),
          analyzeBtn: getFs(".cf-premium-builder-controls .cf-pb-analyze-btn"),
          tagline: getFs(".cf-plans-header-tagline .cf-tagline-text-mobile"),
          logoHeight: getH(".cf-plans-header-clean .cf-plans-logo.cf-plans-logo-image > img"),
        };
      });

      expect(computed.heroSubtitle).toBe(IOS_STOREFRONT_CONTRACT.hero.subtitleFontSize);
      expect(computed.builderEyebrow).toBe(IOS_STOREFRONT_CONTRACT.builder.headSmallFontSize);
      expect(computed.builderDescription).toBe(IOS_STOREFRONT_CONTRACT.builder.headDescriptionFontSize);
      expect(computed.primaryLabel).toBe(IOS_STOREFRONT_CONTRACT.builder.labelBFontSize);
      expect(computed.secondaryLabel).toBe(IOS_STOREFRONT_CONTRACT.builder.labelSmallFontSize);
      expect(computed.goalLabel).toBe(IOS_STOREFRONT_CONTRACT.goals.labelFontSize);
      expect(computed.fieldLabel).toBe(IOS_STOREFRONT_CONTRACT.inputs.fieldLabelFontSize);
      expect(computed.input).toBe(IOS_STOREFRONT_CONTRACT.inputs.inputTextFontSize);
      expect(computed.privacy).toBe(IOS_STOREFRONT_CONTRACT.inputs.privacyFontSize);
      expect(computed.analyzeBtn).toBe(IOS_STOREFRONT_CONTRACT.analyzeCta.textFontSize);
      expect(computed.tagline).toBe(IOS_STOREFRONT_CONTRACT.header.taglineFontSize);
      expect(computed.logoHeight).toBe(IOS_STOREFRONT_CONTRACT.header.logoHeight);
    } finally {
      await browser.close();
    }
  });

  it("2. Synchronous bootstrap script executes in real browser and applies cf-platform-ios on iPhone (375x812)", async () => {
    if (!fs.existsSync(nextHtmlPath)) return;

    const htmlContent = fs.readFileSync(nextHtmlPath, "utf-8");
    const cssFiles = fs.readdirSync(nextCssDir).filter((f) => f.endsWith(".css"));
    let fullCss = "";
    for (const f of cssFiles) {
      fullCss += fs.readFileSync(path.join(nextCssDir, f), "utf-8") + "\n";
    }

    const testHtml = htmlContent.replace("</head>", `<style>${fullCss}</style></head>`);

    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
      );
      await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

      await page.setContent(testHtml, { waitUntil: "domcontentloaded" });

      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains("cf-platform-ios")
      );
      expect(hasClass).toBe(true);

      const computed = await page.evaluate(() => {
        const getFs = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? window.getComputedStyle(el).fontSize : null;
        };
        const getH = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? window.getComputedStyle(el).height : null;
        };

        return {
          heroSubtitle: getFs(".cf-plans-shell .cf-plans-hero p"),
          builderEyebrow: getFs(".cf-premium-builder-head small"),
          builderDescription: getFs(".cf-premium-builder-head p"),
          primaryLabel: getFs(".cf-pb-label b"),
          secondaryLabel: getFs(".cf-pb-label small"),
          goalLabel: getFs(".cf-premium-builder-controls .cf-pb-goals button b"),
          fieldLabel: getFs(".cf-premium-builder-controls .cf-pb-field-label"),
          input: getFs(".cf-premium-builder-controls .cf-pb-input input"),
          privacy: getFs(".cf-pb-privacy"),
          analyzeBtn: getFs(".cf-premium-builder-controls .cf-pb-analyze-btn"),
          tagline: getFs(".cf-plans-header-tagline .cf-tagline-text-mobile"),
          logoHeight: getH(".cf-plans-header-clean .cf-plans-logo.cf-plans-logo-image > img"),
        };
      });

      expect(computed.heroSubtitle).toBe("15px");
      expect(computed.builderEyebrow).toBe("15px");
      expect(computed.builderDescription).toBe("15px");
      expect(computed.primaryLabel).toBe("15.5px");
      expect(computed.secondaryLabel).toBe("14.5px");
      expect(computed.goalLabel).toBe("14px");
      expect(computed.fieldLabel).toBe("15px");
      expect(computed.input).toBe("13.5px");
      expect(computed.privacy).toBe("14px");
      expect(computed.analyzeBtn).toBe("15.7px");
      expect(computed.tagline).toBe("14.5px");
      expect(computed.logoHeight).toBe("37px");
    } finally {
      await browser.close();
    }
  });

  it("3. Negative Test: Android / Poco does NOT receive cf-platform-ios and iPhone contract is not applied", async () => {
    if (!fs.existsSync(nextHtmlPath)) return;

    const htmlContent = fs.readFileSync(nextHtmlPath, "utf-8");
    const cssFiles = fs.readdirSync(nextCssDir).filter((f) => f.endsWith(".css"));
    let fullCss = "";
    for (const f of cssFiles) {
      fullCss += fs.readFileSync(path.join(nextCssDir, f), "utf-8") + "\n";
    }

    const testHtml = htmlContent.replace("</head>", `<style>${fullCss}</style></head>`);

    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Linux; Android 13; POCO F5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      );
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

      await page.setContent(testHtml, { waitUntil: "domcontentloaded" });

      const hasClass = await page.evaluate(() =>
        document.documentElement.classList.contains("cf-platform-ios")
      );
      expect(hasClass).toBe(false);

      const computed = await page.evaluate(() => {
        const el = document.querySelector(".cf-plans-shell .cf-plans-hero p");
        return el ? window.getComputedStyle(el).fontSize : null;
      });

      // On Android / non-iOS, the 15px iPhone override must NOT be active
      expect(computed).not.toBe("15px");
    } finally {
      await browser.close();
    }
  });
});
