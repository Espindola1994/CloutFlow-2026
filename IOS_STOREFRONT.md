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

The following values were calibrated and approved across commits `8a0fbb4`, `106735b`, `fc34097` and are permanently registered in `src/styles/platform/ios-storefront.contract.ts`:

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
- **Privacy Text**: `font-size: 14px !important; color: #7a879e !important;`
- **Analyze CTA Button SVG**: `width: 28px !important; height: 28px !important;`
- **Analyze CTA Button Text**: `font-size: 15.7px !important;`
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

## 4. Fluid iPhone Scaling (Contract V2)

### 4.1 Motivation & Principles
- On iPhone standard viewports (~393px), the interface has approved, calibrated visual proportions.
- On larger iPhones (e.g. Pro Max at ~430px), static pixel values appear proportionally small, while on smaller iPhones (320px–375px), excessive dimensions risk horizontal clipping.
- **Golden Viewport**: `393px = 1.000` is an invariant baseline. At exactly 393px, computed styles match the approved Golden baseline with 0% deviation.
- **Viewport-based, not device-based**: No User-Agent sniffing for model names (no iPhone 14, 15, 16 Pro Max regexes). Scaling is driven purely by `html.cf-platform-ios` + CSS viewport width (`100vw`). Future iPhones scale automatically.
- **Zero impact on other platforms**: Android, Desktop (>900px), iPadOS (`cf-platform-ipados`), and `/admin` remain 100% untouched.
- **No zoom / transform scale**: Never use `zoom`, `transform: scale()`, global body font scaling, or modified `-webkit-text-size-adjust`. Scaling uses semantic fluid CSS custom properties with `clamp(MIN, calc(GOLDEN + ((100vw - 393px) * RATE)), MAX)`.

### 4.2 Mathematical Formula
Every fluid token follows the formula:
```css
clamp(MIN, calc(GOLDEN + ((100vw - 393px) * RATE)), MAX)
```
At `100vw = 393px`:
`calc(GOLDEN + (0px * RATE)) = GOLDEN`.
Thus, 393px is mathematically guaranteed to equal the Golden baseline.

For viewports `< 393px`:
Values decrease gently at `RATE` until reaching `MIN`, protecting against overflow on compact screens.

For viewports `> 393px`:
Values increase gently at `RATE` until reaching `MAX`, keeping Pro Max screens proportionate without oversized controls.

### 4.3 Semantic Token Categories
Fluid tokens are declared in `html.cf-platform-ios` in `src/styles/platform/ios-storefront.css`:

1. **Typography (`--ios-type-*`)**:
   - `--ios-type-hero-subtitle`: `clamp(14px, calc(15px + ((100vw - 393px) * 0.02)), 16.5px)`
   - `--ios-type-builder-eyebrow`: `clamp(14px, calc(15px + ((100vw - 393px) * 0.02)), 16.5px)`
   - `--ios-type-builder-description`: `clamp(14px, calc(15px + ((100vw - 393px) * 0.02)), 16.5px)`
   - `--ios-type-builder-label-b`: `clamp(14.5px, calc(15.5px + ((100vw - 393px) * 0.02)), 17px)`
   - `--ios-type-builder-label-small`: `clamp(13.5px, calc(14.5px + ((100vw - 393px) * 0.02)), 16px)`
   - `--ios-type-goal-label`: `clamp(13px, calc(14px + ((100vw - 393px) * 0.02)), 15.5px)`
   - `--ios-type-platform-label-narrow`: `clamp(13px, calc(14px + ((100vw - 393px) * 0.02)), 15.5px)`
   - `--ios-type-field-label`: `clamp(14px, calc(15px + ((100vw - 393px) * 0.02)), 16.5px)`
   - `--ios-type-input-text`: `clamp(12.5px, calc(13.5px + ((100vw - 393px) * 0.02)), 15px)`
   - `--ios-type-privacy-text`: `clamp(13px, calc(14px + ((100vw - 393px) * 0.02)), 15.5px)`
   - `--ios-type-analyze-text`: `clamp(14.7px, calc(15.7px + ((100vw - 393px) * 0.02)), 17.2px)`
   - `--ios-type-summary-title`: `clamp(13.5px, calc(14.5px + ((100vw - 393px) * 0.02)), 16px)`
   - `--ios-type-summary-small`: `clamp(12.8px, calc(13.8px + ((100vw - 393px) * 0.02)), 15.2px)`
   - `--ios-type-empty-title`: `clamp(14.5px, calc(15.5px + ((100vw - 393px) * 0.02)), 17px)`
   - `--ios-type-empty-description`: `clamp(13.5px, calc(14.5px + ((100vw - 393px) * 0.02)), 16px)`
   - `--ios-type-pwa-title`: `clamp(14px, calc(15px + ((100vw - 393px) * 0.02)), 16.5px)`
   - `--ios-type-pwa-subtitle`: `clamp(12.5px, calc(13.5px + ((100vw - 393px) * 0.02)), 15px)`
   - `--ios-type-analyzing-title`: `clamp(14.5px, calc(15.5px + ((100vw - 393px) * 0.02)), 17px)`
   - `--ios-type-analyzing-subtitle`: `clamp(13.5px, calc(14.5px + ((100vw - 393px) * 0.02)), 16px)`
   - `--ios-type-analyzing-step`: `clamp(12.5px, calc(13.5px + ((100vw - 393px) * 0.02)), 15px)`
   - `--ios-type-final-cta-title`: `clamp(16px, calc(17.5px + ((100vw - 393px) * 0.03)), 19.5px)`

2. **Icons & Artwork (`--ios-icon-*`)**:
   - `--ios-icon-builder-label`: `clamp(28px, calc(30px + ((100vw - 393px) * 0.04)), 34px)`
   - `--ios-icon-builder-label-font`: `clamp(14px, calc(15px + ((100vw - 393px) * 0.02)), 16.5px)`
   - `--ios-icon-goal-checkmark`: `clamp(20px, calc(22px + ((100vw - 393px) * 0.03)), 25px)`
   - `--ios-icon-goal-service`: `clamp(38px, calc(41px + ((100vw - 393px) * 0.06)), 45px)`
   - `--ios-icon-goal-glyph`: `clamp(28px, calc(30px + ((100vw - 393px) * 0.04)), 34px)`
   - `--ios-icon-platform-checkmark`: `clamp(19px, calc(21px + ((100vw - 393px) * 0.03)), 24px)`
   - `--ios-icon-platform-image`: `clamp(37px, calc(40px + ((100vw - 393px) * 0.05)), 44px)`
   - `--ios-icon-input-svg`: `clamp(26px, calc(28px + ((100vw - 393px) * 0.04)), 32px)`
   - `--ios-icon-analyze-svg`: `clamp(26px, calc(28px + ((100vw - 393px) * 0.04)), 32px)`
   - `--ios-icon-summary-glyph`: `clamp(28px, calc(30px + ((100vw - 393px) * 0.04)), 34px)`
   - `--ios-icon-summary-container`: `clamp(38px, calc(41px + ((100vw - 393px) * 0.06)), 45px)`
   - `--ios-icon-summary-platform`: `clamp(32px, calc(35px + ((100vw - 393px) * 0.05)), 39px)`
   - `--ios-icon-empty-container`: `clamp(54px, calc(59px + ((100vw - 393px) * 0.08)), 65px)`
   - `--ios-icon-empty-font`: `clamp(35px, calc(38px + ((100vw - 393px) * 0.05)), 42px)`
   - `--ios-icon-pwa`: `clamp(16px, calc(18px + ((100vw - 393px) * 0.03)), 20px)`
   - `--ios-icon-final-cta-rocket`: `clamp(72px, calc(78px + ((100vw - 393px) * 0.1)), 86px)`

3. **Controls (`--ios-control-*`)**:
   - `--ios-control-platform-height`: `clamp(76px, calc(80px + ((100vw - 393px) * 0.1)), 88px)`

### 4.4 How to Add a New Token
1. Register the token in `src/styles/platform/ios-storefront.contract.ts` under `IOS_STOREFRONT_CONTRACT.fluid.<category>`.
   Define: `goldenViewport: 393`, `golden`, `min`, `max`, `rate`, and `unit: "px"`.
2. Declare the custom property under `html.cf-platform-ios` in `src/styles/platform/ios-storefront.css` using `buildFluidClamp` formula.
3. Apply the token with `var(--ios-...) !important;` on the intended element selector.
4. Run `npm test -- ios-` to ensure contract parity, monotonic scaling, and boundary constraints.

### 4.5 How to Alter a Golden Value
1. Update `golden` (and proportional `min`, `max`) in `src/styles/platform/ios-storefront.contract.ts`.
2. Update the corresponding CSS variable clamp in `src/styles/platform/ios-storefront.css`.
3. Run the full test suite (`npm test -- ios-` and `npm run build`).

---

## 5. Operational Rules for Modifying iOS Storefront

When a future task asks to modify an iOS storefront visual:
1. **Locate the Rule**: Modify ONLY `src/styles/platform/ios-storefront.css`.
2. **Update the Contract**: If intentional, update the corresponding key in `src/styles/platform/ios-storefront.contract.ts`.
3. **Never Edit globals.css**: Do not edit `globals.css` to fix or adjust iPhone appearance.
4. **Never Add Custom UA Regex**: Always rely on `html.cf-platform-ios` applied by `PlatformBootstrapScript`.
5. **Keep Analyzing & PWA Isolated**: Never remove `.cf-pb-result-analyzing` or `[data-testid="public-pwa-banner"]` scoping.
6. **Run Contract Tests**: Run `npm test -- ios-` before committing. If a value changed without updating the contract, the test will intentionally fail.
