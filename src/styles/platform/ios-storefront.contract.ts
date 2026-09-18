/**
 * CloutFlow iOS Storefront Visual Contract & Fluid Scaling Definition (Contract V2)
 *
 * Source of truth for approved iPhone/iOS visual calibrations.
 * Every critical value in `src/styles/platform/ios-storefront.css`
 * MUST match this contract.
 *
 * Golden Viewport: 393px (iPhone standard reference = 1.000).
 * Fluid scaling adapts smoothly between compact (320px-375px) and larger iPhones (430px-440px)
 * using clamp(min, calc(golden + (100vw - 393px) * rate), max).
 *
 * Regression guards enforce exact parity in `ios-storefront-contract.test.ts`.
 */

export interface FluidTokenDefinition {
  readonly goldenViewport: 393;
  readonly golden: number;
  readonly min: number;
  readonly max: number;
  readonly rate: number;
  readonly unit: "px";
}

export function buildFluidClamp(token: FluidTokenDefinition): string {
  return `clamp(${token.min}${token.unit}, calc(${token.golden}${token.unit} + ((100vw - 393px) * ${token.rate})), ${token.max}${token.unit})`;
}

export const IOS_STOREFRONT_CONTRACT = {
  header: {
    logoHeight: "37px",
    logoMaxWidth: "132px",
    taglineFontSize: "14.5px",
    flameSize: "18px",
    taglineLetterSpacing: "-0.5px",
    taglineColor: "#24334f",
  },

  hero: {
    subtitleFontSize: "15px",
    subtitleMaxWidth: "350px",
    subtitleColor: "#66779a",
  },

  builder: {
    headSmallFontSize: "15px",
    headSmallColor: "#ff2d72",
    headSmallLetterSpacing: "0.11em",
    headDescriptionFontSize: "15px",
    headDescriptionColor: "#73809a",
    labelBFontSize: "15.5px",
    labelBColor: "#111827",
    labelSmallFontSize: "14.5px",
    labelSmallColor: "#78859d",
    labelIconSize: "30px",
    labelIconFontSize: "15px",
  },

  goals: {
    labelFontSize: "14px",
    labelColor: "#172033",
    buttonGap: "7px",
    buttonPadding: "0 4px",
    buttonSvgSize: "22px",
    serviceIconSize: "41px",
    serviceIconBorderRadius: "12px",
    glyphSize: "30px",
  },

  networks: {
    buttonSvgSize: "21px",
    buttonHeight: "80px",
    buttonBorderRadius: "12px",
    platformImageSize: "40px",
    labelFontSizeNarrow: "14px", // <=480px
  },

  inputs: {
    fieldLabelFontSize: "15px",
    fieldLabelColor: "#1a2233",
    inputSvgSize: "28px",
    inputSvgColor: "#7786a1",
    inputTextFontSize: "13.5px",
    privacyFontSize: "14px",
    privacyColor: "#7a879e",
  },

  analyzeCta: {
    svgSize: "28px",
    textFontSize: "15.7px",
  },

  summary: {
    titleFontSize: "14.5px",
    titleColor: "#182033",
    smallFontSize: "13.8px",
    smallColor: "#8591a6",
    serviceGlyphSize: "30px",
    iconContainerSize: "41px",
    iconContainerBorderRadius: "9px",
    platformImageSize: "35px",
  },

  emptyState: {
    titleFontSize: "15.5px",
    titleColor: "#182033",
    descriptionFontSize: "14.5px",
    descriptionLineHeight: "1.45",
    iconSize: "59px",
    iconFontSize: "38px",
    iconBorderRadius: "15px",
  },

  analyzing: {
    titleFontSize: "15.5px",
    subtitleFontSize: "14.5px",
    stepLabelsFontSize: "13.5px",
    statusesFontSize: "13.5px",
    copies: [
      "Checking profile",
      "Searching profile",
      "Loading profile data",
      "Compiling results",
    ] as const,
  },

  pwaBanner: {
    titleFontSize: "15px", // .text-xs
    iconSize: "18px", // .w-3.5, .h-3.5
    subtitleFontSize: "13.5px", // .text-[11px]
    copy: "Grow faster with CloutFlow",
  },

  reviews: {
    overflow: "visible",
    webkitOverflowScrolling: "touch",
  },

  finalCta: {
    gridTemplateColumns: "78px minmax(0, 1fr)",
    rocketArtSize: "78px",
    titleFontSize: "17.5px",
  },

  offer: {
    headerCleanHeight: "56px",
    headerNavHeight: "56px",
    timerSlotWidth: "220px",
    timerSlotHeight: "72px",
    timerScale: "0.7436",
    taglineMaxWidth: "88px",
    taglineStrongFontSize: "8px",
    packageGridWidth: "min(66%, 320px)",
    packageCardPadding: "18px",
    planNameFontSize: "16px",
    planIconSize: "26px",
    qtyFontSize: "15px",
    bonusFontSize: "13px",
    discountBadgeFontSize: "12.5px",
    couponFontSize: "12px",
    benefitsLiFontSize: "12.5px",
    assuranceFontSize: "12.5px",
    priceDelFontSize: "14.5px",
    priceStrongFontSize: "21px",
    ctaDefaultFontSize: "13.5px",
    bestBadgeFontSize: "12px",
    bestBadgeHeight: "22px",
  },

  /* ==========================================================================
     FLUID SCALE TOKENS CONTRACT (393px = 1.000 Golden Viewport) - V2.1
     ========================================================================== */
  fluid: {
    typography: {
      heroSubtitle: { goldenViewport: 393, golden: 15, min: 14.5, max: 16.8, rate: 0.035, unit: "px" } as const,
      builderEyebrow: { goldenViewport: 393, golden: 15, min: 14.5, max: 16.8, rate: 0.035, unit: "px" } as const,
      builderDescription: { goldenViewport: 393, golden: 15, min: 14.5, max: 16.8, rate: 0.035, unit: "px" } as const,
      builderLabelB: { goldenViewport: 393, golden: 15.5, min: 15.0, max: 17.3, rate: 0.036, unit: "px" } as const,
      builderLabelSmall: { goldenViewport: 393, golden: 14.5, min: 14.0, max: 16.2, rate: 0.034, unit: "px" } as const,
      goalLabel: { goldenViewport: 393, golden: 14, min: 13.5, max: 15.6, rate: 0.032, unit: "px" } as const,
      platformLabelNarrow: { goldenViewport: 393, golden: 14, min: 13.5, max: 15.6, rate: 0.032, unit: "px" } as const,
      fieldLabel: { goldenViewport: 393, golden: 15, min: 14.5, max: 16.8, rate: 0.035, unit: "px" } as const,
      inputText: { goldenViewport: 393, golden: 13.5, min: 13.0, max: 15.2, rate: 0.032, unit: "px" } as const,
      privacyText: { goldenViewport: 393, golden: 14, min: 13.5, max: 15.6, rate: 0.032, unit: "px" } as const,
      analyzeText: { goldenViewport: 393, golden: 15.7, min: 15.2, max: 17.5, rate: 0.036, unit: "px" } as const,
      summaryTitle: { goldenViewport: 393, golden: 14.5, min: 14.0, max: 16.2, rate: 0.034, unit: "px" } as const,
      summarySmall: { goldenViewport: 393, golden: 13.8, min: 13.3, max: 15.4, rate: 0.032, unit: "px" } as const,
      emptyTitle: { goldenViewport: 393, golden: 15.5, min: 15.0, max: 17.3, rate: 0.036, unit: "px" } as const,
      emptyDescription: { goldenViewport: 393, golden: 14.5, min: 14.0, max: 16.2, rate: 0.034, unit: "px" } as const,
      pwaTitle: { goldenViewport: 393, golden: 15, min: 14.5, max: 16.8, rate: 0.035, unit: "px" } as const,
      pwaSubtitle: { goldenViewport: 393, golden: 13.5, min: 13.0, max: 15.2, rate: 0.032, unit: "px" } as const,
      analyzingTitle: { goldenViewport: 393, golden: 15.5, min: 15.0, max: 17.3, rate: 0.036, unit: "px" } as const,
      analyzingSubtitle: { goldenViewport: 393, golden: 14.5, min: 14.0, max: 16.2, rate: 0.034, unit: "px" } as const,
      analyzingStep: { goldenViewport: 393, golden: 13.5, min: 13.0, max: 15.2, rate: 0.032, unit: "px" } as const,
      finalCtaTitle: { goldenViewport: 393, golden: 17.5, min: 17.0, max: 19.8, rate: 0.045, unit: "px" } as const,
    },
    icons: {
      builderLabelIcon: { goldenViewport: 393, golden: 30, min: 29, max: 33.5, rate: 0.07, unit: "px" } as const,
      builderLabelIconFont: { goldenViewport: 393, golden: 15, min: 14.5, max: 16.8, rate: 0.035, unit: "px" } as const,
      goalCheckmark: { goldenViewport: 393, golden: 22, min: 21.2, max: 24.5, rate: 0.05, unit: "px" } as const,
      goalServiceIcon: { goldenViewport: 393, golden: 41, min: 40, max: 45.5, rate: 0.09, unit: "px" } as const,
      goalGlyph: { goldenViewport: 393, golden: 30, min: 29, max: 33.5, rate: 0.07, unit: "px" } as const,
      platformCheckmark: { goldenViewport: 393, golden: 21, min: 20.2, max: 23.5, rate: 0.05, unit: "px" } as const,
      platformImage: { goldenViewport: 393, golden: 40, min: 39, max: 44.5, rate: 0.09, unit: "px" } as const,
      inputSvg: { goldenViewport: 393, golden: 28, min: 27, max: 31.5, rate: 0.07, unit: "px" } as const,
      analyzeSvg: { goldenViewport: 393, golden: 28, min: 27, max: 31.5, rate: 0.07, unit: "px" } as const,
      summaryGlyph: { goldenViewport: 393, golden: 30, min: 29, max: 33.5, rate: 0.07, unit: "px" } as const,
      summaryIconContainer: { goldenViewport: 393, golden: 41, min: 40, max: 45.5, rate: 0.09, unit: "px" } as const,
      summaryPlatformImage: { goldenViewport: 393, golden: 35, min: 34, max: 39, rate: 0.08, unit: "px" } as const,
      emptyIcon: { goldenViewport: 393, golden: 59, min: 57, max: 65.5, rate: 0.13, unit: "px" } as const,
      emptyIconFont: { goldenViewport: 393, golden: 38, min: 37, max: 42, rate: 0.08, unit: "px" } as const,
      pwaIcon: { goldenViewport: 393, golden: 18, min: 17.5, max: 20, rate: 0.04, unit: "px" } as const,
      finalCtaRocket: { goldenViewport: 393, golden: 78, min: 76, max: 86.5, rate: 0.17, unit: "px" } as const,
    },
    controls: {
      platformButtonHeight: { goldenViewport: 393, golden: 80, min: 78, max: 88, rate: 0.16, unit: "px" } as const,
      inputHeight: { goldenViewport: 393, golden: 41, min: 40, max: 46, rate: 0.09, unit: "px" } as const,
      analyzeButtonHeight: { goldenViewport: 393, golden: 44, min: 43, max: 49.5, rate: 0.1, unit: "px" } as const,
    },
    spacing: {
      builderPadding: { goldenViewport: 393, golden: 14, min: 13, max: 17, rate: 0.05, unit: "px" } as const,
      stepPadding: { goldenViewport: 393, golden: 13, min: 12, max: 15.5, rate: 0.04, unit: "px" } as const,
      goalGap: { goldenViewport: 393, golden: 6, min: 6, max: 8, rate: 0.03, unit: "px" } as const,
      platformGap: { goldenViewport: 393, golden: 5, min: 5, max: 7, rate: 0.03, unit: "px" } as const,
      shellPadding: { goldenViewport: 393, golden: 12, min: 10, max: 16, rate: 0.06, unit: "px" } as const,
    },
  },
} as const;

export type IosStorefrontContract = typeof IOS_STOREFRONT_CONTRACT;
