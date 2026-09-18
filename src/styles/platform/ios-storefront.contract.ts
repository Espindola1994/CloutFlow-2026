/**
 * CloutFlow iOS Storefront Visual & Composition Contract (Contract V3 - Canonical Storefront Frame)
 *
 * Source of truth for approved iPhone/iOS visual calibrations and composition frame.
 * Every critical value in `src/styles/platform/ios-storefront.css` MUST match this contract.
 *
 * Golden Viewport: 393px (iPhone standard reference = 1.000).
 * Architecture: iOS CANONICAL STOREFRONT FRAME
 * - Content bounded to canonical frame width: min(100%, 393px)
 * - Full-bleed background, bounded content
 * - Golden typography, icon, control, and grid geometry preserved across 393px, 430px, 440px
 * - Compact adaptivity on small viewports (<=375px) via safe responsive gutters without aggressive font shrinkage
 *
 * Regression guards enforce exact parity in `ios-storefront-contract.test.ts` and `ios-composition-contract.test.ts`.
 */

export interface CanonicalTokenDefinition {
  readonly canonicalWidth: 393;
  readonly gutterCompact: number;
  readonly gutterCanonical: number;
  readonly gutterLarge: number;
}

export const IOS_STOREFRONT_CONTRACT = {
  canonicalFrame: {
    referenceWidth: 393,
    maxWidth: "393px",
    gutterCompact: "10px",   // <= 374px
    gutterCanonical: "14px", // 375px - 393px
    gutterLarge: "20px",     // >= 394px (Pro / Pro Max)
  },

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
    padding: "14px",
    stepPadding: "13px",
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
    gridColumns: "repeat(3, minmax(0, 1fr))",
  },

  networks: {
    buttonSvgSize: "21px",
    buttonHeight: "80px",
    buttonBorderRadius: "12px",
    platformImageSize: "40px",
    labelFontSizeNarrow: "14px", // <=480px
    gridColumns: "repeat(4, minmax(0, 1fr))",
  },

  inputs: {
    fieldLabelFontSize: "15px",
    fieldLabelColor: "#1a2233",
    inputSvgSize: "28px",
    inputSvgColor: "#7786a1",
    inputHeight: "41px",
    inputTextFontSize: "13.5px",
    privacyFontSize: "14px",
    privacyColor: "#7a879e",
  },

  analyzeCta: {
    svgSize: "28px",
    textFontSize: "15.7px",
    height: "44px",
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
     CANONICAL GOLDEN BASELINE TOKENS (Preserved identically across 393/430/440)
     ========================================================================== */
  goldenTokens: {
    typography: {
      heroSubtitle: 15,
      builderEyebrow: 15,
      builderDescription: 15,
      builderLabelB: 15.5,
      builderLabelSmall: 14.5,
      goalLabel: 14,
      platformLabelNarrow: 14,
      fieldLabel: 15,
      inputText: 13.5,
      privacyText: 14,
      analyzeText: 15.7,
      summaryTitle: 14.5,
      summarySmall: 13.8,
      emptyTitle: 15.5,
      emptyDescription: 14.5,
      pwaTitle: 15,
      pwaSubtitle: 13.5,
      analyzingTitle: 15.5,
      analyzingSubtitle: 14.5,
      analyzingStep: 13.5,
      finalCtaTitle: 17.5,
      headerTagline: 14.5,
    },
    icons: {
      builderLabelIcon: 30,
      builderLabelIconFont: 15,
      goalCheckmark: 22,
      goalServiceIcon: 41,
      goalGlyph: 30,
      platformCheckmark: 21,
      platformImage: 40,
      inputSvg: 28,
      analyzeSvg: 28,
      summaryGlyph: 30,
      summaryIconContainer: 41,
      summaryPlatformImage: 35,
      emptyIcon: 59,
      emptyIconFont: 38,
      pwaIcon: 18,
      finalCtaRocket: 78,
      headerFlame: 18,
    },
    controls: {
      platformButtonHeight: 80,
      inputHeight: 41,
      analyzeButtonHeight: 44,
    },
    spacing: {
      builderPadding: 14,
      stepPadding: 13,
      goalGap: 7,
      platformGap: 6,
    },
  },
} as const;

export type IosStorefrontContract = typeof IOS_STOREFRONT_CONTRACT;
