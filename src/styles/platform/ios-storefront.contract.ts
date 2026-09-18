/**
 * CloutFlow iOS Storefront Visual Contracts (Fase Final iOS — 3 Responsive Visual Contracts)
 *
 * Source of truth for approved iPhone/iOS visual calibrations.
 * Defined strictly by CSS viewport width under html.cf-platform-ios.
 * Never detects device models in code.
 *
 * THREE RESPONSIVE VISUAL CONTRACTS:
 * - CONTRACT A — COMPACT (<= 374px, e.g. iPhone SE / legacy compact)
 * - CONTRACT B — STANDARD (375px - 413px, GOLDEN REFERENCE, e.g. iPhone 16 @ 393px)
 * - CONTRACT C — LARGE (414px - 900px, e.g. iPhone 16 Pro Max @ 440px, 430px, 414px)
 *
 * Golden Viewport: 393px (STANDARD = 1.000 GOLDEN REFERENCE, UNTOUCHED).
 * Large Viewport Target: Unconservative, rich visual density for Pro Max (STANDARD × 1.08–1.15 by category).
 * Compact Viewport Target: Legibility prioritized (>=94-96% typography), safe gutters (10px), reduced paddings/gaps.
 *
 * Regression guards enforce exact parity in `ios-storefront-contract.test.ts` and `ios-composition-contract.test.ts`.
 */

export interface VisualContractTokens {
  readonly id: "compact" | "standard" | "large";
  readonly name: string;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly referenceWidth: number;
  readonly geometry: {
    readonly contentMax: string;
    readonly pageGutter: string;
    readonly builderPadding: string;
    readonly stepPadding: string;
    readonly goalGap: string;
    readonly platformGap: string;
    readonly builderWidthRatioApprox: number;
  };
  readonly header: {
    readonly logoHeight: string;
    readonly logoMaxWidth: string;
    readonly taglineFontSize: string;
    readonly flameSize: string;
    readonly taglineLetterSpacing: string;
  };
  readonly hero: {
    readonly h1SpanFontSize: string;
    readonly h1BFontSize: string;
    readonly h1LineHeight: string;
    readonly h1LetterSpacing: string;
    readonly subtitleFontSize: string;
    readonly subtitleMaxWidth: string;
    readonly subtitleLineHeight: string;
  };
  readonly builderHead: {
    readonly eyebrowFontSize: string;
    readonly eyebrowLetterSpacing: string;
    readonly titleFontSize: string;
    readonly titleLineHeight: string;
    readonly titleLetterSpacing: string;
    readonly titleFontWeight: number;
    readonly descriptionFontSize: string;
    readonly descriptionLineHeight: string;
  };
  readonly stepLabels: {
    readonly labelBFontSize: string;
    readonly labelBLineHeight: string;
    readonly labelSmallFontSize: string;
    readonly labelSmallLineHeight: string;
    readonly badgeSize: string;
    readonly badgeFontSize: string;
  };
  readonly goals: {
    readonly labelFontSize: string;
    readonly serviceIconSize: string;
    readonly glyphSize: string;
    readonly checkmarkSize: string;
    readonly buttonHeight: string;
    readonly buttonGap: string;
    readonly buttonPadding: string;
  };
  readonly networks: {
    readonly labelFontSize: string;
    readonly platformImageSize: string;
    readonly checkmarkSize: string;
    readonly buttonHeight: string;
    readonly buttonBorderRadius: string;
  };
  readonly inputs: {
    readonly fieldLabelFontSize: string;
    readonly inputHeight: string;
    readonly inputTextFontSize: string;
    readonly inputSvgSize: string;
    readonly privacyFontSize: string;
  };
  readonly analyzeCta: {
    readonly buttonHeight: string;
    readonly textFontSize: string;
    readonly svgSize: string;
  };
  readonly summary: {
    readonly titleFontSize: string;
    readonly smallFontSize: string;
    readonly glyphSize: string;
    readonly containerSize: string;
    readonly platformImageSize: string;
  };
  readonly emptyState: {
    readonly titleFontSize: string;
    readonly descriptionFontSize: string;
    readonly descriptionLineHeight: string;
    readonly containerSize: string;
    readonly fontIconSize: string;
  };
  readonly analyzing: {
    readonly titleFontSize: string;
    readonly titleLineHeight: string;
    readonly subtitleFontSize: string;
    readonly subtitleLineHeight: string;
    readonly stepLabelsFontSize: string;
    readonly stepLabelsLineHeight: string;
  };
  readonly pwaBanner: {
    readonly titleFontSize: string;
    readonly subtitleFontSize: string;
    readonly iconSize: string;
  };
  readonly finalCta: {
    readonly titleFontSize: string;
    readonly rocketArtSize: string;
  };
}

export const CONTRACT_COMPACT: VisualContractTokens = {
  id: "compact",
  name: "CONTRACT A — COMPACT (<=374px)",
  minWidth: 0,
  maxWidth: 374,
  referenceWidth: 360,
  geometry: {
    contentMax: "100%",
    pageGutter: "10px",
    builderPadding: "11px",
    stepPadding: "11px",
    goalGap: "5px",
    platformGap: "4px",
    builderWidthRatioApprox: 0.944, // 340 / 360 = 94.4%
  },
  header: {
    logoHeight: "35px",
    logoMaxWidth: "125px",
    taglineFontSize: "13.5px",
    flameSize: "17px",
    taglineLetterSpacing: "-0.4px",
  },
  hero: {
    h1SpanFontSize: "31px",
    h1BFontSize: "29px",
    h1LineHeight: "1.02",
    h1LetterSpacing: "-1px",
    subtitleFontSize: "14.5px",
    subtitleMaxWidth: "320px",
    subtitleLineHeight: "1.45",
  },
  builderHead: {
    eyebrowFontSize: "14.5px",
    eyebrowLetterSpacing: "0.11em",
    titleFontSize: "22px",
    titleLineHeight: "1.05",
    titleLetterSpacing: "-1px",
    titleFontWeight: 900,
    descriptionFontSize: "14.5px",
    descriptionLineHeight: "1.4",
  },
  stepLabels: {
    labelBFontSize: "15px",
    labelBLineHeight: "1.25",
    labelSmallFontSize: "14px",
    labelSmallLineHeight: "1.3",
    badgeSize: "28px",
    badgeFontSize: "14px",
  },
  goals: {
    labelFontSize: "13.5px",
    serviceIconSize: "38px",
    glyphSize: "28px",
    checkmarkSize: "20px",
    buttonHeight: "64px",
    buttonGap: "5px",
    buttonPadding: "0 3px",
  },
  networks: {
    labelFontSize: "13.5px",
    platformImageSize: "38px",
    checkmarkSize: "20px",
    buttonHeight: "76px",
    buttonBorderRadius: "12px",
  },
  inputs: {
    fieldLabelFontSize: "14.5px",
    inputHeight: "40px",
    inputTextFontSize: "13px",
    inputSvgSize: "26px",
    privacyFontSize: "13.5px",
  },
  analyzeCta: {
    buttonHeight: "42px",
    textFontSize: "15px",
    svgSize: "26px",
  },
  summary: {
    titleFontSize: "14px",
    smallFontSize: "13.5px",
    glyphSize: "28px",
    containerSize: "38px",
    platformImageSize: "33px",
  },
  emptyState: {
    titleFontSize: "15px",
    descriptionFontSize: "14px",
    descriptionLineHeight: "1.45",
    containerSize: "54px",
    fontIconSize: "35px",
  },
  analyzing: {
    titleFontSize: "15px",
    titleLineHeight: "1.25",
    subtitleFontSize: "14px",
    subtitleLineHeight: "1.35",
    stepLabelsFontSize: "13px",
    stepLabelsLineHeight: "1.2",
  },
  pwaBanner: {
    titleFontSize: "14.5px",
    subtitleFontSize: "13px",
    iconSize: "17px",
  },
  finalCta: {
    titleFontSize: "16.5px",
    rocketArtSize: "72px",
  },
} as const;

export const CONTRACT_STANDARD: VisualContractTokens = {
  id: "standard",
  name: "CONTRACT B — STANDARD (375px–413px) GOLDEN",
  minWidth: 375,
  maxWidth: 413,
  referenceWidth: 393,
  geometry: {
    contentMax: "393px",
    pageGutter: "14px",
    builderPadding: "14px",
    stepPadding: "13px",
    goalGap: "7px",
    platformGap: "6px",
    builderWidthRatioApprox: 0.929, // (393 - 28) / 393 = 365 / 393 = 92.88%
  },
  header: {
    logoHeight: "37px",
    logoMaxWidth: "132px",
    taglineFontSize: "14.5px",
    flameSize: "18px",
    taglineLetterSpacing: "-0.5px",
  },
  hero: {
    h1SpanFontSize: "34px",
    h1BFontSize: "32px",
    h1LineHeight: "1.02",
    h1LetterSpacing: "-1.2px",
    subtitleFontSize: "15px",
    subtitleMaxWidth: "350px",
    subtitleLineHeight: "1.45",
  },
  builderHead: {
    eyebrowFontSize: "15px",
    eyebrowLetterSpacing: "0.11em",
    titleFontSize: "24px",
    titleLineHeight: "1.05",
    titleLetterSpacing: "-1.1px",
    titleFontWeight: 900,
    descriptionFontSize: "15px",
    descriptionLineHeight: "1.4",
  },
  stepLabels: {
    labelBFontSize: "15.5px",
    labelBLineHeight: "1.25",
    labelSmallFontSize: "14.5px",
    labelSmallLineHeight: "1.3",
    badgeSize: "30px",
    badgeFontSize: "15px",
  },
  goals: {
    labelFontSize: "14px",
    serviceIconSize: "41px",
    glyphSize: "30px",
    checkmarkSize: "22px",
    buttonHeight: "68px",
    buttonGap: "7px",
    buttonPadding: "0 4px",
  },
  networks: {
    labelFontSize: "14px",
    platformImageSize: "40px",
    checkmarkSize: "21px",
    buttonHeight: "80px",
    buttonBorderRadius: "12px",
  },
  inputs: {
    fieldLabelFontSize: "15px",
    inputHeight: "41px",
    inputTextFontSize: "13.5px",
    inputSvgSize: "28px",
    privacyFontSize: "14px",
  },
  analyzeCta: {
    buttonHeight: "44px",
    textFontSize: "15.7px",
    svgSize: "28px",
  },
  summary: {
    titleFontSize: "14.5px",
    smallFontSize: "13.8px",
    glyphSize: "30px",
    containerSize: "41px",
    platformImageSize: "35px",
  },
  emptyState: {
    titleFontSize: "15.5px",
    descriptionFontSize: "14.5px",
    descriptionLineHeight: "1.45",
    containerSize: "59px",
    fontIconSize: "38px",
  },
  analyzing: {
    titleFontSize: "15.5px",
    titleLineHeight: "1.25",
    subtitleFontSize: "14.5px",
    subtitleLineHeight: "1.35",
    stepLabelsFontSize: "13.5px",
    stepLabelsLineHeight: "1.2",
  },
  pwaBanner: {
    titleFontSize: "15px",
    subtitleFontSize: "13.5px",
    iconSize: "18px",
  },
  finalCta: {
    titleFontSize: "17.5px",
    rocketArtSize: "78px",
  },
} as const;

export const CONTRACT_LARGE: VisualContractTokens = {
  id: "large",
  name: "CONTRACT C — LARGE (414px–900px) PRO & PRO MAX",
  minWidth: 414,
  maxWidth: 900,
  referenceWidth: 440,
  geometry: {
    contentMax: "440px",
    pageGutter: "8px",
    builderPadding: "8px",
    stepPadding: "15px",
    goalGap: "8px",
    platformGap: "7px",
    builderWidthRatioApprox: 0.964, // (440 - 16) / 440 = 424 / 440 = 96.36%
  },
  header: {
    logoHeight: "40px",
    logoMaxWidth: "144px",
    taglineFontSize: "15.5px",
    flameSize: "20px",
    taglineLetterSpacing: "-0.5px",
  },
  hero: {
    h1SpanFontSize: "25px",
    h1BFontSize: "25px",
    h1LineHeight: "1.03",
    h1LetterSpacing: "-1.3px",
    subtitleFontSize: "16.5px",
    subtitleMaxWidth: "380px",
    subtitleLineHeight: "1.45",
  },
  builderHead: {
    eyebrowFontSize: "16px",
    eyebrowLetterSpacing: "0.11em",
    titleFontSize: "24px",
    titleLineHeight: "1.06",
    titleLetterSpacing: "-1.15px",
    titleFontWeight: 900,
    descriptionFontSize: "16.5px",
    descriptionLineHeight: "1.4",
  },
  stepLabels: {
    labelBFontSize: "17px",
    labelBLineHeight: "1.25",
    labelSmallFontSize: "16px",
    labelSmallLineHeight: "1.3",
    badgeSize: "33px",
    badgeFontSize: "16.5px",
  },
  goals: {
    labelFontSize: "16px",
    serviceIconSize: "45px",
    glyphSize: "33px",
    checkmarkSize: "24px",
    buttonHeight: "64px",
    buttonGap: "8px",
    buttonPadding: "0 5px",
  },
  networks: {
    labelFontSize: "15px",
    platformImageSize: "44px",
    checkmarkSize: "22px",
    buttonHeight: "84px",
    buttonBorderRadius: "12px",
  },
  inputs: {
    fieldLabelFontSize: "16px",
    inputHeight: "45px",
    inputTextFontSize: "14.5px",
    inputSvgSize: "31px",
    privacyFontSize: "15px",
  },
  analyzeCta: {
    buttonHeight: "49px",
    textFontSize: "16.5px",
    svgSize: "31px",
  },
  summary: {
    titleFontSize: "16px",
    smallFontSize: "16px",
    glyphSize: "31px",
    containerSize: "35px",
    platformImageSize: "35px",
  },
  emptyState: {
    titleFontSize: "16.5px",
    descriptionFontSize: "15.5px",
    descriptionLineHeight: "1.45",
    containerSize: "64px",
    fontIconSize: "41px",
  },
  analyzing: {
    titleFontSize: "17px",
    titleLineHeight: "1.25",
    subtitleFontSize: "15.5px",
    subtitleLineHeight: "1.35",
    stepLabelsFontSize: "14.5px",
    stepLabelsLineHeight: "1.2",
  },
  pwaBanner: {
    titleFontSize: "16px",
    subtitleFontSize: "14.5px",
    iconSize: "20px",
  },
  finalCta: {
    titleFontSize: "19px",
    rocketArtSize: "86px",
  },
} as const;

export const IOS_STOREFRONT_CONTRACT = {
  contracts: {
    compact: CONTRACT_COMPACT,
    standard: CONTRACT_STANDARD,
    large: CONTRACT_LARGE,
  },

  canonicalFrame: {
    referenceWidth: 393,
    maxWidth: "393px",
    gutterCompact: "10px",   // <= 374px
    gutterCanonical: "14px", // 375px - 393px
    gutterLarge: "20px",     // legacy reference
  },

  header: {
    logoHeight: CONTRACT_STANDARD.header.logoHeight,
    logoMaxWidth: CONTRACT_STANDARD.header.logoMaxWidth,
    taglineFontSize: CONTRACT_STANDARD.header.taglineFontSize,
    flameSize: CONTRACT_STANDARD.header.flameSize,
    taglineLetterSpacing: CONTRACT_STANDARD.header.taglineLetterSpacing,
    taglineColor: "#24334f",
  },

  hero: {
    subtitleFontSize: CONTRACT_STANDARD.hero.subtitleFontSize,
    subtitleMaxWidth: CONTRACT_STANDARD.hero.subtitleMaxWidth,
    subtitleColor: "#66779a",
  },

  builder: {
    headSmallFontSize: CONTRACT_STANDARD.builderHead.eyebrowFontSize,
    headSmallColor: "#ff2d72",
    headSmallLetterSpacing: CONTRACT_STANDARD.builderHead.eyebrowLetterSpacing,
    headDescriptionFontSize: CONTRACT_STANDARD.builderHead.descriptionFontSize,
    headDescriptionColor: "#73809a",
    labelBFontSize: CONTRACT_STANDARD.stepLabels.labelBFontSize,
    labelBColor: "#111827",
    labelSmallFontSize: CONTRACT_STANDARD.stepLabels.labelSmallFontSize,
    labelSmallColor: "#78859d",
    labelIconSize: CONTRACT_STANDARD.stepLabels.badgeSize,
    labelIconFontSize: CONTRACT_STANDARD.stepLabels.badgeFontSize,
    padding: CONTRACT_STANDARD.geometry.builderPadding,
    stepPadding: CONTRACT_STANDARD.geometry.stepPadding,
  },

  goals: {
    labelFontSize: CONTRACT_STANDARD.goals.labelFontSize,
    labelColor: "#172033",
    buttonGap: CONTRACT_STANDARD.goals.buttonGap,
    buttonPadding: CONTRACT_STANDARD.goals.buttonPadding,
    buttonSvgSize: CONTRACT_STANDARD.goals.checkmarkSize,
    serviceIconSize: CONTRACT_STANDARD.goals.serviceIconSize,
    serviceIconBorderRadius: "12px",
    glyphSize: CONTRACT_STANDARD.goals.glyphSize,
    gridColumns: "repeat(3, minmax(0, 1fr))",
  },

  networks: {
    buttonSvgSize: CONTRACT_STANDARD.networks.checkmarkSize,
    buttonHeight: CONTRACT_STANDARD.networks.buttonHeight,
    buttonBorderRadius: CONTRACT_STANDARD.networks.buttonBorderRadius,
    platformImageSize: CONTRACT_STANDARD.networks.platformImageSize,
    labelFontSizeNarrow: CONTRACT_STANDARD.networks.labelFontSize,
    gridColumns: "repeat(4, minmax(0, 1fr))",
  },

  inputs: {
    fieldLabelFontSize: CONTRACT_STANDARD.inputs.fieldLabelFontSize,
    fieldLabelColor: "#1a2233",
    inputSvgSize: CONTRACT_STANDARD.inputs.inputSvgSize,
    inputSvgColor: "#7786a1",
    inputHeight: CONTRACT_STANDARD.inputs.inputHeight,
    inputTextFontSize: CONTRACT_STANDARD.inputs.inputTextFontSize,
    privacyFontSize: CONTRACT_STANDARD.inputs.privacyFontSize,
    privacyColor: "#7a879e",
  },

  analyzeCta: {
    svgSize: CONTRACT_STANDARD.analyzeCta.svgSize,
    textFontSize: CONTRACT_STANDARD.analyzeCta.textFontSize,
    height: CONTRACT_STANDARD.analyzeCta.buttonHeight,
  },

  summary: {
    titleFontSize: CONTRACT_STANDARD.summary.titleFontSize,
    titleColor: "#182033",
    smallFontSize: CONTRACT_STANDARD.summary.smallFontSize,
    smallColor: "#8591a6",
    serviceGlyphSize: CONTRACT_STANDARD.summary.glyphSize,
    iconContainerSize: CONTRACT_STANDARD.summary.containerSize,
    iconContainerBorderRadius: "9px",
    platformImageSize: CONTRACT_STANDARD.summary.platformImageSize,
  },

  emptyState: {
    titleFontSize: CONTRACT_STANDARD.emptyState.titleFontSize,
    titleColor: "#182033",
    descriptionFontSize: CONTRACT_STANDARD.emptyState.descriptionFontSize,
    descriptionLineHeight: CONTRACT_STANDARD.emptyState.descriptionLineHeight,
    iconSize: CONTRACT_STANDARD.emptyState.containerSize,
    iconFontSize: CONTRACT_STANDARD.emptyState.fontIconSize,
    iconBorderRadius: "15px",
  },

  analyzing: {
    titleFontSize: CONTRACT_STANDARD.analyzing.titleFontSize,
    subtitleFontSize: CONTRACT_STANDARD.analyzing.subtitleFontSize,
    stepLabelsFontSize: CONTRACT_STANDARD.analyzing.stepLabelsFontSize,
    statusesFontSize: CONTRACT_STANDARD.analyzing.stepLabelsFontSize,
    copies: [
      "Checking profile",
      "Searching profile",
      "Loading profile data",
      "Compiling results",
    ] as const,
  },

  pwaBanner: {
    titleFontSize: CONTRACT_STANDARD.pwaBanner.titleFontSize,
    iconSize: CONTRACT_STANDARD.pwaBanner.iconSize,
    subtitleFontSize: CONTRACT_STANDARD.pwaBanner.subtitleFontSize,
    copy: "Grow faster with CloutFlow",
  },

  reviews: {
    overflow: "visible",
    webkitOverflowScrolling: "touch",
  },

  finalCta: {
    gridTemplateColumns: "78px minmax(0, 1fr)",
    rocketArtSize: CONTRACT_STANDARD.finalCta.rocketArtSize,
    titleFontSize: CONTRACT_STANDARD.finalCta.titleFontSize,
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

  /**
   * Approved iOS LARGE calibration for Home Pricing + Home Plan Cards + /offer PACKAGE Cards.
   * Viewport: 414px - 900px under html.cf-platform-ios.
   */
  largePricingAndPackageCards: {
    pricingTitleSpanFontSize: "25px",
    pricingSubtitleFontSize: "16.5px",
    planNameFontSize: "17.5px",
    qtyFontSize: "16.5px",
    bonusFontSize: "15.2px",
    bonusSvgSize: "16px",
    oldPriceDelFontSize: "16.5px",
    oldPriceDelColor: "#9ba6b6",
    couponFontSize: "15px",
    couponColor: "#7a8799",
    couponMinHeight: "15px",
    couponMargin: "2px 0 9px",
    benefitsLiFontSize: "15px",
    benefitIconContainerSize: "18px",
    benefitIconBorderRadius: "999px",
    benefitSvgSize: "12px",
    assuranceFontSize: "15px",
    assuranceSvgSize: "20px",
    ctaDefaultFontSize: "16px",
    discountBadgeSpanFontSize: "15px",
    discountBadgeSvgWidth: "16px",
    discountBadgeSvgMinWidth: "18px",
    discountBadgeSvgHeight: "18px",
    discountBadgeSvgStrokeWidth: "2.1px",
    gridGap: "22px",
    bestBadgeFontSize: "15px",
    bestBadgeHeight: "24px",
    bestBadgeSvgSize: "18px",
    packageGridWidthInvariant: "min(66%, 320px)",
    packageGridMaxWidthInvariant: "320px",
  },

  /* ==========================================================================
     CANONICAL GOLDEN BASELINE TOKENS (Preserved identically in Standard 375-413)
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
