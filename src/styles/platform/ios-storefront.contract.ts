/**
 * CloutFlow iOS Storefront Visual Contract
 *
 * Source of truth for approved iPhone/iOS visual calibrations.
 * Every critical value in `src/styles/platform/ios-storefront.css`
 * MUST match this contract.
 *
 * Regression guards enforce exact parity in `ios-storefront-contract.test.ts`.
 */

export const IOS_STOREFRONT_CONTRACT = {
  header: {
    logoHeight: "37px",
    logoMaxWidth: "132px",
    taglineFontSize: "14.5px",
    flameSize: "18px",
  },

  hero: {
    subtitleFontSize: "15px",
    subtitleMaxWidth: "350px",
    subtitleColor: "#66779a",
  },

  builder: {
    headSmallFontSize: "15px",
    headSmallColor: "#ff2d72",
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
} as const;

export type IosStorefrontContract = typeof IOS_STOREFRONT_CONTRACT;
