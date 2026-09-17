// Client-side DOM element measurement helper for Mobile Diagnostics
// Reads ONLY: no mutations, no telemetry, no storage, no CSS modification.

export interface DomElementMetrics {
  selector: string;
  found: boolean;
  computed?: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    width: string;
    height: string;
    padding: string;
    margin: string;
    gap: string;
    display: string;
    position: string;
    transform: string;
    zoom: string;
  };
  boundingClientRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export function inspectElement(selector: string): DomElementMetrics {
  if (typeof document === 'undefined') {
    return { selector, found: false };
  }

  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    return { selector, found: false };
  }

  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  return {
    selector,
    found: true,
    computed: {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      width: style.width,
      height: style.height,
      padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
      margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
      gap: style.gap,
      display: style.display,
      position: style.position,
      transform: style.transform,
      zoom: (style as any).zoom || '1',
    },
    boundingClientRect: {
      x: Math.round(rect.x * 100) / 100,
      y: Math.round(rect.y * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      top: Math.round(rect.top * 100) / 100,
      right: Math.round(rect.right * 100) / 100,
      bottom: Math.round(rect.bottom * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
    },
  };
}

export function inspectMultiple(selectors: Record<string, string>): Record<string, DomElementMetrics> {
  const result: Record<string, DomElementMetrics> = {};
  for (const [key, selector] of Object.entries(selectors)) {
    result[key] = inspectElement(selector);
  }
  return result;
}

export function getCssCustomProperty(name: string): string {
  if (typeof document === 'undefined') return '';
  const bodyVal = window.getComputedStyle(document.body).getPropertyValue(name).trim();
  if (bodyVal) return bodyVal;
  const docVal = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return docVal || 'not set';
}

export function getGlobalEnvironment(deviceLabel: string) {
  if (typeof window === 'undefined') return null;

  const docEl = document.documentElement;
  const body = document.body;
  const docElStyle = window.getComputedStyle(docEl);
  const bodyStyle = window.getComputedStyle(body);
  const vv = window.visualViewport;

  // Safe area elements check
  let safeArea = { top: '0px', right: '0px', bottom: '0px', left: '0px' };
  try {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:env(safe-area-inset-top);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);left:env(safe-area-inset-left);pointer-events:none;visibility:hidden;z-index:-999;';
    document.body.appendChild(probe);
    const pStyle = window.getComputedStyle(probe);
    safeArea = {
      top: pStyle.top,
      right: pStyle.right,
      bottom: pStyle.bottom,
      left: pStyle.left,
    };
    document.body.removeChild(probe);
  } catch {}

  // Meta viewport
  const metaVp = document.querySelector('meta[name="viewport"]');
  const metaVpContent = metaVp?.getAttribute('content') || 'not found';

  // Standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Orientation
  let orientation = 'unknown';
  if (window.screen?.orientation?.type) {
    orientation = window.screen.orientation.type;
  } else if (typeof window.orientation !== 'undefined') {
    orientation = String(window.orientation);
  }

  // Breakpoints check
  const breakpointQueries: Record<string, string> = {
    '(max-width: 350px)': '(max-width: 350px)',
    '(max-width: 359px)': '(max-width: 359px)',
    '(max-width: 360px)': '(max-width: 360px)',
    '(max-width: 374px)': '(max-width: 374px)',
    '(max-width: 375px)': '(max-width: 375px)',
    '(max-width: 389px)': '(max-width: 389px)',
    '(max-width: 390px)': '(max-width: 390px)',
    '(max-width: 413px)': '(max-width: 413px)',
    '(min-width: 390px) and (max-width: 413px)': '(min-width: 390px) and (max-width: 413px)',
    '(min-width: 414px) and (max-width: 430px)': '(min-width: 414px) and (max-width: 430px)',
    '(max-width: 414px)': '(max-width: 414px)',
    '(max-width: 420px)': '(max-width: 420px)',
    '(max-width: 430px)': '(max-width: 430px)',
    '(max-width: 480px)': '(max-width: 480px)',
    '(max-width: 520px)': '(max-width: 520px)',
    '(max-width: 560px)': '(max-width: 560px)',
    '(max-width: 768px)': '(max-width: 768px)',
    '(max-width: 900px)': '(max-width: 900px)',
    '(min-width: 901px)': '(min-width: 901px)',
  };

  const breakpointResults: Record<string, boolean> = {};
  for (const [key, query] of Object.entries(breakpointQueries)) {
    breakpointResults[key] = window.matchMedia(query).matches;
  }

  const w = window.innerWidth;
  let activeRange = 'unknown';
  if (w <= 389) activeRange = '<=389';
  else if (w <= 413) activeRange = '390–413';
  else if (w <= 430) activeRange = '414–430';
  else if (w <= 480) activeRange = '431–480';
  else if (w <= 520) activeRange = '481–520';
  else if (w <= 560) activeRange = '521–560';
  else if (w <= 768) activeRange = '561–768';
  else if (w <= 900) activeRange = '769–900';
  else activeRange = '>=901';

  // Fonts check
  const fontChecks: Record<string, boolean> = {};
  const weightsToTest = ['400', '500', '600', '700', '800', '850', '950'];
  if (document.fonts && typeof document.fonts.check === 'function') {
    for (const wt of weightsToTest) {
      fontChecks[`Inter ${wt}`] = document.fonts.check(`${wt} 16px Inter`);
    }
  }

  const fontFacesList: string[] = [];
  if (document.fonts && (document.fonts as any).forEach) {
    (document.fonts as any).forEach((ff: any) => {
      fontFacesList.push(`${ff.family} (weight: ${ff.weight}, style: ${ff.style}, status: ${ff.status})`);
    });
  }

  return {
    deviceLabel: deviceLabel || 'NOT_SPECIFIED',
    timestamp: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      platform: (navigator as any).userAgentData?.platform || navigator.platform,
      vendor: navigator.vendor,
      devicePixelRatio: window.devicePixelRatio,
      orientation,
      standalone: isStandalone,
    },
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      clientWidth: docEl.clientWidth,
      clientHeight: docEl.clientHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      visualViewport: vv ? {
        width: Math.round(vv.width * 100) / 100,
        height: Math.round(vv.height * 100) / 100,
        scale: Math.round(vv.scale * 1000) / 1000,
        offsetLeft: vv.offsetLeft,
        offsetTop: vv.offsetTop,
      } : null,
      metaViewport: metaVpContent,
    },
    documentProperties: {
      documentElement: {
        fontSize: docElStyle.fontSize,
        fontFamily: docElStyle.fontFamily,
        webkitTextSizeAdjust: (docElStyle as any).webkitTextSizeAdjust || (docElStyle as any)['-webkit-text-size-adjust'] || 'none',
        textSizeAdjust: (docElStyle as any).textSizeAdjust || 'none',
        zoom: (docElStyle as any).zoom || '1',
      },
      body: {
        fontSize: bodyStyle.fontSize,
        fontFamily: bodyStyle.fontFamily,
        fontWeight: bodyStyle.fontWeight,
        lineHeight: bodyStyle.lineHeight,
        letterSpacing: bodyStyle.letterSpacing,
        webkitTextSizeAdjust: (bodyStyle as any).webkitTextSizeAdjust || (bodyStyle as any)['-webkit-text-size-adjust'] || 'none',
        textSizeAdjust: (bodyStyle as any).textSizeAdjust || 'none',
        zoom: (bodyStyle as any).zoom || '1',
        transform: bodyStyle.transform,
      },
    },
    fonts: {
      status: document.fonts?.status || 'unsupported',
      interChecks: fontChecks,
      fontFaces: fontFacesList,
    },
    breakpoints: {
      queries: breakpointResults,
      activeRange,
    },
    safeArea,
  };
}

// Selectors mapping for HOME page elements
export const HOME_SELECTORS = {
  header: 'header',
  logo: 'header a[aria-label="CloutFlow"] img, header img',
  heroTitleLine1: 'h1 span:first-child, h1',
  heroTitleLine2: 'h1 span:last-child',
  emailInput: 'input[type="email"]',
  targetInput: 'input[placeholder*="@"], input[placeholder*="username"], input[placeholder*="link"]',
  analyzeButton: 'button:has(svg), button[type="submit"]',
  helperText: 'p.text-xs, p.text-sm.text-muted-foreground, p.text-slate-400',
  profileCard: '.profile-card, [data-testid="profile-card"], [class*="verifiedTarget"]',
  confirmationCTA: 'button[class*="confirm"], button[class*="primary"]',
  pricingTitle: 'h2:has(span), h2',
  pricingSubtitle: 'h2 + p, p.text-muted-foreground',
  planCard: '[class*="plan-card"], [class*="PlanCard"], [class*="offer-card"]',
  planName: '[class*="plan-name"], [class*="PlanName"], h3',
  planQuantity: '[class*="quantity"], [class*="Quantity"]',
  oldPrice: '[class*="old-price"], [class*="line-through"]',
  currentPrice: '[class*="price"]:not([class*="old"])',
  coupon: '[class*="coupon"], [class*="Coupon"]',
  benefit: '[class*="benefit"], [class*="Benefit"]',
  planCTA: '[class*="plan-card"] button, [class*="PlanCard"] button',
};

// Selectors mapping for OFFER PREFILL stage
export const OFFER_PREFILL_SELECTORS = {
  offerPage: '.cf-offer-page',
  offerMain: '.cf-offer-main',
  offerHeader: '.cf-offer-header-new, header',
  logo: '.cf-offer-brand-logo',
  timer: '.cf-timer578, .cf-timer578-card',
  profilePanel: '.cf-o10-panel, .cf-offer-panel',
  networkGrid: '.cf-o10-network-grid, .cf-offer-network-grid',
  goalGrid: '.cf-o10-goal-grid, .cf-offer-goal-grid',
  email: 'input[type="email"]',
  searchInput: '.cf-o10-search-input, input[type="text"]',
  analyzeButton: '.cf-o10-analyze-btn, button:has(.cf-o10-search-btn-content)',
  helperText: '.cf-o10-helper, p.text-xs, p.text-muted-foreground',
};

// Selectors mapping for OFFER PACKAGE stage
export const OFFER_PACKAGE_SELECTORS = {
  packageMain: '.cf-offer-main',
  packagePanel: '.cf-o10-package-panel, .cf-o10-panel',
  packageGrid: '.cf-o10-package-ref-grid',
  packageCard: '.cf-o10-package-ref-card',
  header: '.cf-o10-panel-title-row h2',
  subtitle: '.cf-o10-panel-title-row p',
  flow25: '.cf-o10-flow25-badge, [class*="flow25"]',
  planName: '.cf-o10-package-ref-plan-name strong',
  planIcon: '.cf-plan-premium-icon img',
  quantity: '.cf-o10-package-ref-plan-name, [class*="quantity"]',
  promo: '.cf-o10-package-ref-promo',
  discountBadge: '.cf-o10-package-ref-discount-badge',
  coupon: '.cf-o10-flow25-code',
  benefit: '.cf-o10-package-ref-benefits, .cf-o10-package-ref-features',
  assurance: '.cf-o10-package-ref-assurances',
  oldPrice: '.cf-o10-package-ref-old-price',
  currentPrice: '.cf-o10-package-ref-current-price',
  cta: '.cf-o10-package-ref-cta',
  bestBadge: '.cf-o10-package-ref-best',
};

export function measureCurrentView(view: 'home' | 'offerPrefill' | 'offerPackage') {
  if (view === 'home') {
    return inspectMultiple(HOME_SELECTORS);
  } else if (view === 'offerPrefill') {
    const metrics = inspectMultiple(OFFER_PREFILL_SELECTORS);
    const customProps = {
      '--cf-m-step1': getCssCustomProperty('--cf-m-step1'),
      '--cf-m-package': getCssCustomProperty('--cf-m-package'),
      '--cf-m-header': getCssCustomProperty('--cf-m-header'),
    };
    return { metrics, customProps };
  } else {
    const metrics = inspectMultiple(OFFER_PACKAGE_SELECTORS);
    const customProps = {
      '--cf-m-step1': getCssCustomProperty('--cf-m-step1'),
      '--cf-m-package': getCssCustomProperty('--cf-m-package'),
      '--cf-m-header': getCssCustomProperty('--cf-m-header'),
    };
    return { metrics, customProps };
  }
}
