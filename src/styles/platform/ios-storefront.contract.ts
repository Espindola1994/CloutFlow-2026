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
  name: "CONTRACT B — STANDARD (375px–413px) DENSITY CALIBRATED",
  minWidth: 375,
  maxWidth: 413,
  referenceWidth: 393,
  geometry: {
    contentMax: "440px",
    pageGutter: "8px",
    builderPadding: "8px",
    stepPadding: "15px",
    goalGap: "6px",
    platformGap: "5px",
    builderWidthRatioApprox: 0.959, // (393 - 16) / 393 = 377 / 393 = 95.9%
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
    labelBFontSize: "16px",
    labelBLineHeight: "1.25",
    labelSmallFontSize: "15px",
    labelSmallLineHeight: "1.3",
    badgeSize: "33px",
    badgeFontSize: "16.5px",
  },
  goals: {
    labelFontSize: "15px",
    serviceIconSize: "41px",
    glyphSize: "30px",
    checkmarkSize: "24px",
    buttonHeight: "60px",
    buttonGap: "6px",
    buttonPadding: "0 4px",
  },
  networks: {
    labelFontSize: "14px",
    platformImageSize: "40px",
    checkmarkSize: "22px",
    buttonHeight: "78px",
    buttonBorderRadius: "12px",
  },
  inputs: {
    fieldLabelFontSize: "15px",
    inputHeight: "45px",
    inputTextFontSize: "14px",
    inputSvgSize: "31px",
    privacyFontSize: "14px",
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
     CANONICAL GOLDEN BASELINE TOKENS (Mirrored from Large Approved Calibration)
     ========================================================================== */
  goldenTokens: {
    typography: {
      heroSubtitle: 16.5,
      builderEyebrow: 16,
      builderDescription: 16.5,
      builderLabelB: 17,
      builderLabelSmall: 16,
      goalLabel: 16,
      platformLabelNarrow: 15,
      fieldLabel: 16,
      inputText: 14.5,
      privacyText: 15,
      analyzeText: 16.5,
      summaryTitle: 16,
      summarySmall: 16,
      emptyTitle: 16.5,
      emptyDescription: 15.5,
      pwaTitle: 16,
      pwaSubtitle: 14.5,
      analyzingTitle: 17,
      analyzingSubtitle: 15.5,
      analyzingStep: 14.5,
      finalCtaTitle: 19,
      headerTagline: 15.5,
    },
    icons: {
      builderLabelIcon: 33,
      builderLabelIconFont: 16.5,
      goalCheckmark: 24,
      goalServiceIcon: 45,
      goalGlyph: 33,
      platformCheckmark: 22,
      platformImage: 44,
      inputSvg: 31,
      analyzeSvg: 31,
      summaryGlyph: 31,
      summaryIconContainer: 35,
      summaryPlatformImage: 35,
      emptyIcon: 64,
      emptyIconFont: 41,
      pwaIcon: 20,
      finalCtaRocket: 86,
      headerFlame: 20,
    },
    controls: {
      platformButtonHeight: 84,
      inputHeight: 45,
      analyzeButtonHeight: 49,
    },
    spacing: {
      builderPadding: 8,
      stepPadding: 15,
      goalGap: 6,
      platformGap: 5,
    },
  },

  /**
   * STANDARD FIT GEOMETRY
   * 375–413 typography mirrors approved LARGE scale.
   * Geometry compacts goal gap (6px) and platform gap (5px) with proportional columns
   * to comfortably fit narrower viewports (375-413px) without clipping or text shrinking.
   * 414–900 remains independent and absolutely frozen.
   */
  standardFitGeometry: {
    goalGap: "6px",
    goalCardPadding: "0 4px",
    goalGridColumns: "minmax(0, 1.20fr) minmax(0, 0.90fr) minmax(0, 0.90fr)",
    platformGap: "5px",
    platformCardPadding: "6px 2px",
    platformGridColumns: "repeat(4, minmax(0, 1fr))",
    builderSubtitleMaxWidth375: "250px",
    pwaPaddingHorizontal: "10px",
    pwaGap: "8px",
  },
  /**
   * STANDARD DENSITY CALIBRATION
   * 375–413 uses reduced internal control density while preserving approved hero/builder hierarchy.
   * Internal controls are calibrated with proportional typography and heights to provide
   * natural whitespace and breathability without feeling compressed or tiny.
   * 414–900 retains approved LARGE scale and remains absolutely frozen.
   */
  standardDensityTokens: {
    stepTitle: "16px",
    stepSubtitle: "15px",
    goalLabel: "15px",
    goalIconService: "41px",
    goalIconGlyph: "30px",
    goalCardHeight: "60px",
    networkLabel: "14px",
    networkIcon: "40px",
    networkCardHeight: "78px",
    fieldLabel: "15px",
    inputText: "14px",
    privacyText: "14px",
    // Preserved unchanged:
    heroH1Span: "25px",
    heroH1B: "25px",
    heroSubtitle: "16.5px",
    builderEyebrow: "16px",
    builderTitle: "24px",
    builderSubtitle: "16.5px",
    analyzeText: "16.5px",
    analyzeHeight: "49px",
  },
} as const;

export type IosStorefrontContract = typeof IOS_STOREFRONT_CONTRACT;
