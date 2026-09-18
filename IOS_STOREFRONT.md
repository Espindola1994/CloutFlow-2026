# CloutFlow iOS Storefront Contract

This document governs all iPhone/iOS storefront presentation rules across the CloutFlow codebase.
Any developer or AI assistant modifying storefront visual styling MUST read and follow these rules.

---

## 1. Principles & Platform Separation

1. **Android / Poco Baseline**: Android devices (such as Poco) use the default Storefront styles defined in `src/app/globals.css`. Never modify Android styling to fix an iOS divergence.
2. **Desktop Baseline**: Desktop browsers (viewports > 900px) use their dedicated compact desktop styles. They must never receive iOS mobile rules.
3. **Admin Dashboard**: Admin interfaces (`/admin/*`) are completely isolated from storefront styles and use dedicated admin theme tokens.
4. **iPhone Handheld Layer**: Handheld iPhones (viewports 320px–440px / <= 900px) receive the official canonical layer.
5. **iPadOS**: iPadOS devices receive `cf-platform-ipados` and NEVER match `cf-platform-ios`. iPadOS is treated as tablet/desktop, not iPhone.

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

## 3. Approved Critical Values (Golden Baseline)

The following values are the approved Golden reference baseline registered in `src/styles/platform/ios-storefront.contract.ts`:

- **Header Logo**: `height: 37px !important; max-width: 132px !important;`
- **Header Tagline**: `font-size: 14.5px !important; letter-spacing: -0.5px !important; color: #24334f !important;`
- **Header Flame**: `width: 18px !important; height: 18px !important;`
- **Hero Subtitle**: `font-size: 15px !important; max-width: 350px !important; color: #66779a !important;`
- **Builder Head Small**: `font-size: 15px !important; color: #ff2d72 !important; letter-spacing: .11em !important;`
- **Builder Head Description**: `font-size: 15px !important; color: #73809a !important;`
- **Builder Step Label (b)**: `font-size: 15.5px !important; color: #111827 !important;`
- **Builder Step Label (small)**: `font-size: 14.5px !important; color: #78859d !important;`
- **Builder Step Label Icon (i)**: `width: 30px !important; height: 30px !important; font-size: 15px !important;`
- **Goal Button Label**: `font-size: 14px !important; color: #172033 !important;`
- **Goal Button**: `gap: 7px !important; padding: 0 4px !important;`
- **Goal Button SVG Checkmark**: `width: 22px !important; height: 22px !important;`
- **Goal Service Icon**: `width: 41px !important; height: 41px !important; border-radius: 12px !important;`
- **Goal Glyph**: `width: 30px !important; height: 30px !important;`
- **Platform Button SVG Checkmark**: `width: 21px !important; height: 21px !important;`
- **Platform Icon Image**: `width: 40px !important; height: 40px !important;`
- **Platform Button**: `height: 80px !important; border-radius: 12px !important;`
- **Platform Button Label (<=480px)**: `font-size: 14px !important;`
- **Field Label**: `font-size: 15px !important; color: #1a2233 !important;`
- **Input SVG**: `width: 28px !important; height: 28px !important; color: #7786a1 !important;`
- **Input Text**: `font-size: 13.5px !important; appearance: none !important;`
- **Input Container Height**: `height: 41px !important;`
- **Privacy Text**: `font-size: 14px !important; color: #7a879e !important;`
- **Analyze CTA Button SVG**: `width: 28px !important; height: 28px !important;`
- **Analyze CTA Button Text**: `font-size: 15.7px !important;`
- **Analyze CTA Button Height**: `height: 44px !important;`
- **Summary Title**: `font-size: 14.5px !important; color: #182033 !important;`
- **Summary Small**: `font-size: 13.8px !important; color: #8591a6 !important;`
- **Summary Service Glyph**: `width: 30px !important; height: 30px !important;`
- **Summary Service/Platform Container**: `width: 41px !important; height: 41px !important; border-radius: 9px !important;`
- **Summary Platform Image**: `width: 35px !important; height: 35px !important;`
- **Empty State Title**: `font-size: 15.5px !important; color: #182033 !important;`
- **Empty State Description**: `font-size: 14.5px !important; line-height: 1.45 !important;`
- **Empty State Icon**: `width: 59px !important; height: 59px !important; font-size: 38px !important;`

### Analysis Progress Contract
- **Title (h3)**: `15.5px`
- **Subtitle (p)**: `14.5px`
- **Step Labels (b)**: `13.5px`
- **Statuses (small)**: `13.5px`
- **Approved Copies**:
  1. `Checking profile`
  2. `Searching profile`
  3. `Loading profile data`
  4. `Compiling results`
- **Scope**: Strictly inside `.cf-premium-builder-result.cf-pb-result-analyzing .cf-pb-loading`. Must never affect normal/idle builder states.

### PWA Install Banner Contract
- **Title (.text-xs)**: `15px`
- **Icon (.w-3.5, .h-3.5)**: `18px x 18px`
- **Subtitle (.text-[11px])**: `13.5px`
- **iPhone Copy**: `"Grow faster with CloutFlow"`
- **Scope**: Strictly inside `[data-testid="public-pwa-banner"]`.

---

## 4. iOS Canonical Storefront Frame Architecture (Contract V3)

### 4.1 Architectural Decision
- Replaces Fluid V1 and Fluid V2 scaling curves.
- Instead of scaling up all typography, icons and controls as viewport grows (which degraded typographic density, proportions, and control perception on larger iPhones like Pro and Pro Max), the layout uses the **iOS Canonical Storefront Frame**.
- **FULL BLEED**: Backgrounds, blur gradients, and page canvas remain 100% viewport width.
- **CONTENT BOUNDED**: Interactive and informational content (Hero copy, Growth Package Builder, Pricing, Plans, Reviews, Final CTA) is contained within a canonical content frame (`width: min(100%, 393px); margin-inline: auto;`).

### 4.2 Canonical Frame Tokens
Declared in `html.cf-platform-ios` in `src/styles/platform/ios-storefront.css`:
- `--cf-ios-content-max: 393px` (Golden reference design width)
- `--cf-ios-page-gutter: 14px` (375px–393px standard)
- Compact iPhone gutter (<= 374px): `10px`
- Large iPhone gutter (>= 394px): `20px`

### 4.3 Viewport Classes & Behavior
1. **Compact iPhone (<= 374px, e.g. iPhone SE)**:
   - Full responsive fit (`width: 100%`) with safe 10px gutters.
   - Text legibility prioritized without aggressive font shrinkage.
2. **Canonical iPhone (375px–393px, e.g. iPhone 16 / 15)**:
   - Exact Golden proportions.
3. **Large iPhone (>= 394px, e.g. 402px, 414px, 430px, 440px Pro & Pro Max)**:
   - Content frame bounded at `393px` and centered with `margin-inline: auto`.
   - Typography, controls, icons, and card density remain identical to Golden reference.
   - Surplus space is dedicated to balanced margins rather than inflating components.

---

## 5. Operational Rules for Modifying iOS Storefront

When modifying an iOS storefront visual:
1. **Locate the Rule**: Modify ONLY `src/styles/platform/ios-storefront.css`.
2. **Update the Contract**: If intentional, update the corresponding key in `src/styles/platform/ios-storefront.contract.ts`.
3. **Never Edit globals.css**: Do not edit `globals.css` to fix or adjust iPhone appearance.
4. **Never Add Custom UA Regex**: Always rely on `html.cf-platform-ios` applied by `PlatformBootstrapScript`.
5. **Keep Analyzing & PWA Isolated**: Never remove `.cf-pb-result-analyzing` or `[data-testid="public-pwa-banner"]` scoping.
6. **Run Contract Tests**: Run `npm test -- ios-` before committing.
