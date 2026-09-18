# CloutFlow iOS Storefront Contract

This document governs all iPhone/iOS storefront presentation rules across the CloutFlow codebase.
Any developer or AI assistant modifying storefront visual styling MUST read and follow these rules.

---

## 1. Principles & Platform Separation

1. **Android / Poco Baseline**: Android devices (such as Poco) use the default Storefront styles defined in `src/app/globals.css`. Never modify Android styling to fix an iOS divergence.
2. **Desktop Baseline**: Desktop browsers (viewports > 900px) use their dedicated compact desktop styles. They must never receive iOS mobile rules.
3. **Admin Dashboard**: Admin interfaces (`/admin/*`) are completely isolated from storefront styles and use dedicated admin theme tokens.
4. **iPhone Handheld Layer**: Handheld iPhones (viewports <= 900px) receive the official iOS storefront layer.
5. **iPadOS**: iPadOS devices receive `cf-platform-ipados` and NEVER match `cf-platform-ios`. iPadOS is treated as tablet/desktop, not iPhone.
6. **No Device Model Detection**: Visual contracts are defined strictly by CSS viewport width. Device models (e.g. iPhone SE, iPhone 16, iPhone 16 Pro Max) are only illustrative examples, never runtime branching rules.

---

## 2. Canonical Layer Architecture

- **Canonical CSS Layer**: `src/styles/platform/ios-storefront.css`
- **Visual Contract**: `src/styles/platform/ios-storefront.contract.ts`
- **Root Layout Loader**: `src/app/layout.tsx` imports `@/styles/platform/ios-storefront.css` immediately after `globals.css`.
- **Platform Bootstrap**: `src/components/platform/PlatformBootstrapScript.tsx` synchronously runs before render in document `<head>` to evaluate `navigator.userAgent` and tag `document.documentElement` with `cf-platform-ios`.

Every rule in `ios-storefront.css` is strictly scoped to:
```css
html.cf-platform-ios ...
```
And bounded by responsive media queries (e.g. `@media (max-width: 900px)`).

---

## 3. Three Responsive Visual Contracts

Instead of attempting a single scale across all screen widths, iOS handheld presentation is structured into **Three Responsive Visual Contracts**:

### CONTRACT A — COMPACT (`<= 374px`)
- **Reference Example**: iPhone SE (375/320), compact handheld screens
- **Priority**:
  1. Maintain text legibility (typography stays >= 94-96% of Standard)
  2. Tighten gutters (10px)
  3. Reduce gaps (goal gap 5px, network gap 4px)
  4. Reduce paddings (builder padding 11px, step padding 11px)
  5. Only afterwards adjust icon sizes proportionally

### CONTRACT B — STANDARD (`375px até 413px`) — GOLDEN REFERENCE
- **Reference Example**: iPhone 16 / iPhone 15 (@ ~393px viewport)
- **Status**: GOLDEN REFERENCE — DO NOT ALTER VISUALLY
- **Values**:
  - Hero Subtitle: 15px
  - Builder Eyebrow: 15px
  - Builder Description: 15px
  - Primary Step Label (b): 15.5px
  - Secondary / Helper Label (small): 14.5px
  - Goal Label: 14px
  - Goal Service Icon: 41px
  - Goal Glyph: 30px
  - Network Label: 14px
  - Platform Image: 40px
  - Platform Button Height: 80px
  - Field Label: 15px
  - Input Text: 13.5px
  - Input Height: 41px
  - Input SVG: 28px
  - Privacy Text: 14px
  - Analyze CTA Text: 15.7px
  - Analyze CTA Height: 44px
  - Analyze CTA SVG: 28px
  - Summary Title: 14.5px
  - Summary Small: 13.8px
  - Summary Container: 41px
  - Summary Platform: 35px
  - Empty Title: 15.5px
  - Empty Description: 14.5px
  - Empty Container: 59px (font 38px)
  - Analyzing Title: 15.5px, Subtitle: 14.5px, Step: 13.5px
  - PWA Title: 15px, Subtitle: 13.5px, Icon: 18px
  - Tagline: 14.5px, Flame: 18px, Logo Height: 37px
  - Builder Padding: 14px, Step Padding: 13px, Gutter: 14px

### CONTRACT C — LARGE (`414px até 900px`)
- **Reference Example**: iPhone 16 Pro Max (@ 440px), iPhone 15 Pro Max (@ 430px), iPhone 11 Pro Max (@ 414px)
- **Goal**: Re-establish equivalent visual density to the Golden Standard. Content fills the card properly without feeling sparse or under-dense.
- **Calibration Ranges**:
  - Typography: STANDARD × 1.10–1.15
  - Icons: STANDARD × 1.08–1.13
  - Controls: STANDARD × 1.08–1.12
  - Spacing: STANDARD × 1.05–1.12
- **Calibrated Values**:
  - Hero Subtitle: 16.8px
  - Hero H1: span 38px, b 36px
  - Builder Eyebrow: 16.5px
  - Builder Title (h2): 26.5px
  - Builder Description: 16.2px
  - Primary Step Label (b): 17px
  - Secondary / Helper Label (small): 15.5px
  - Goal Label: 15.5px
  - Goal Service Icon: 45px
  - Goal Glyph: 33px
  - Goal Checkmark: 24px
  - Goal Button Height: 74px
  - Network Label: 15px
  - Platform Image: 44px
  - Platform Checkmark: 23px
  - Platform Button Height: 86px
  - Field Label: 16px
  - Input Text: 14.5px
  - Input Height: 45px
  - Input SVG: 31px
  - Privacy Text: 15px
  - Analyze CTA Text: 17.2px
  - Analyze CTA Height: 49px
  - Analyze CTA SVG: 31px
  - Summary Title: 16px
  - Summary Small: 15px
  - Summary Container: 45px
  - Summary Platform: 38px
  - Summary Glyph: 33px
  - Empty Title: 17px
  - Empty Description: 15.5px
  - Empty Container: 64px (font 41px)
  - Analyzing Title: 17px, Subtitle: 15.5px, Step: 14.5px
  - PWA Title: 16px, Subtitle: 14.5px, Icon: 20px
  - Tagline: 15.5px, Flame: 20px, Logo Height: 40px
  - Builder Padding: 16px, Step Padding: 15px, Gutter: 16px
  - Content Max Width: 428px (preserves Golden ~92.8% width ratio at 440px)

---

## 4. Analysis Progress Contract

- **Standard Golden**:
  - Title (h3): `15.5px`
  - Subtitle (p): `14.5px`
  - Step Labels (b): `13.5px`
  - Statuses (small): `13.5px`
- **Large Pro Max**:
  - Title (h3): `17px`
  - Subtitle (p): `15.5px`
  - Step Labels (b): `14.5px`
  - Statuses (small): `14.5px`
- **Compact**:
  - Title (h3): `15px`
  - Subtitle (p): `14px`
  - Step Labels (b): `13px`
  - Statuses (small): `13px`
- **Approved Copies**:
  1. `Checking profile`
  2. `Searching profile`
  3. `Loading profile data`
  4. `Compiling results`
- **Scope**: Strictly inside `.cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-loading`. Must never affect normal/idle builder states.

---

## 5. PWA Install Banner Contract

- **Standard Golden**:
  - Title (.text-xs): `15px`
  - Icon (.w-3.5, .h-3.5): `18px x 18px`
  - Subtitle (.text-[11px]): `13.5px`
- **Large Pro Max**:
  - Title: `16px`, Subtitle: `14.5px`, Icon: `20px`
- **Compact**:
  - Title: `14.5px`, Subtitle: `13px`, Icon: `17px`
- **Approved Copy**: `"Grow faster with CloutFlow"`
- **Scope**: Strictly inside `[data-testid="public-pwa-banner"]`.

---

## 6. CSS Architecture (`ios-storefront.css`)

The end of `src/styles/platform/ios-storefront.css` is structured as:
```css
/* ========================================
   iOS VISUAL CONTRACT — BASE
   ======================================== */

/* ========================================
   iOS VISUAL CONTRACT — COMPACT <=374
   ======================================== */

/* ========================================
   iOS VISUAL CONTRACT — STANDARD 375-413
   GOLDEN
   ======================================== */

/* ========================================
   iOS VISUAL CONTRACT — LARGE 414-900
   ======================================== */
```

- Each property has **one single winning definition per viewport faixa**.
- Zero accumulated overrides.
- Zero device model detection.

---

## 7. Operational Rules for Modifying iOS Storefront

When modifying an iOS storefront visual:
1. **Locate the Rule**: Modify ONLY `src/styles/platform/ios-storefront.css`.
2. **Update the Contract**: If intentional, update the corresponding key in `src/styles/platform/ios-storefront.contract.ts`.
3. **Never Edit globals.css**: Do not edit `globals.css` to fix or adjust iPhone appearance.
4. **Never Add Custom UA Regex**: Always rely on `html.cf-platform-ios` applied by `PlatformBootstrapScript`.
5. **Keep Analyzing & PWA Isolated**: Never remove `.cf-pb-result-analyzing` or `[data-testid="public-pwa-banner"]` scoping.
6. **Run Contract Tests**: Run `npm test -- ios-` before committing.
