/**
 * CloutFlow Email Design System - Pure Renderer
 * Phase 2B.2: Premium Visual Upgrade for PAYMENT_RECEIVED & CloutFlow Emails
 * 
 * Generates email-client safe HTML (table-based, inline CSS, MSO compatible)
 * and clean native plain-text companion.
 * 
 * Compliant with Outlook Desktop (Word engine), Gmail Web/App, Apple Mail, and mobile screens (320px-430px).
 * High fidelity to CloutFlow visual identity: vibrant gradients, crisp SaaS cards, subtle borders/shadows,
 * social networks, official logo, responsive desktop & mobile tables.
 */

export type EmailCategory = 'transactional' | 'support' | 'marketing';

export type SupportedNetwork = 'instagram' | 'tiktok' | 'x' | 'youtube';

export interface EmailOrderDetails {
  publicId?: string;
  network?: SupportedNetwork | string;
  service?: string;
  quantity?: number | string;
  target?: string;
  status?: string;
}

export interface EmailCta {
  label: string;
  url: string;
}

export interface RenderCloutFlowEmailOptions {
  category?: EmailCategory;
  network?: SupportedNetwork | null;
  preheader?: string;
  eyebrow?: string;
  title: string;
  customerName?: string;
  /**
   * Safe plain text body.
   * If provided, will be HTML-escaped and paragraphs separated with line breaks.
   */
  bodyText?: string;
  /**
   * Optional alias for bodyText to satisfy base options interface.
   * Will be treated strictly as safe text (escaped) unless bodyHtml is explicitly used.
   */
  body?: string;
  /**
   * Explicit separate field for pre-sanitized HTML body if ever needed in the future.
   * Takes precedence over bodyText/body if present.
   */
  bodyHtml?: string;
  order?: EmailOrderDetails;
  cta?: EmailCta;
  supportReplyNotice?: boolean;
  unsubscribeUrl?: string;
  footerText?: string;
}

export interface RenderCloutFlowEmailResult {
  html: string;
  text: string;
}

/**
 * Escapes HTML characters to prevent XSS and broken layout
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats network name with proper branding display
 */
function formatNetworkDisplay(network?: string | null): string | null {
  if (!network) return null;
  const lower = network.toLowerCase().trim();
  switch (lower) {
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'x':
    case 'twitter':
      return 'X';
    case 'youtube':
      return 'YouTube';
    default:
      return null;
  }
}

/**
 * Returns network badge and icon styling
 */
function getNetworkBadgeConfig(network: string): { bg: string; text: string; border: string; iconSymbol: string } {
  const lower = network.toLowerCase();
  switch (lower) {
    case 'instagram':
      return { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8', iconSymbol: '&#9678;' };
    case 'tiktok':
      return { bg: '#F1F5F9', text: '#0F172A', border: '#CBD5E1', iconSymbol: '&#9835;' };
    case 'x':
    case 'twitter':
      return { bg: '#F8FAFC', text: '#0F172A', border: '#CBD5E1', iconSymbol: '&#120143;' };
    case 'youtube':
      return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', iconSymbol: '&#9658;' };
    default:
      return { bg: '#F0FDFA', text: '#0D9488', border: '#CCFBF1', iconSymbol: '&#10022;' };
  }
}

/**
 * Pure rendering function for CloutFlow emails.
 * Compliant with Outlook, Gmail, Apple Mail, and mobile clients.
 */
export function renderCloutFlowEmail(options: RenderCloutFlowEmailOptions): RenderCloutFlowEmailResult {
  const category = options.category || 'transactional';
  const preheaderText = options.preheader?.trim() || '';
  const eyebrowText = options.eyebrow?.trim() || '';
  const titleText = options.title?.trim() || '';
  const customerName = options.customerName?.trim() || '';
  const rawBodyText = options.bodyText?.trim() || options.body?.trim() || '';
  const rawBodyHtml = options.bodyHtml?.trim() || '';
  const footerText = options.footerText?.trim() || '';

  // Network resolution: explicitly passed or derived from order
  const resolvedNetwork = options.network || options.order?.network || null;
  const networkDisplayName = formatNetworkDisplay(resolvedNetwork);

  // CTA resolution
  const hasValidCta = Boolean(
    options.cta &&
    options.cta.label &&
    options.cta.label.trim() &&
    options.cta.url &&
    options.cta.url.trim()
  );

  // Order Details resolution (only display if at least one field is defined)
  const order = options.order;
  const hasOrderDetails = Boolean(
    order &&
    (order.publicId || order.service || order.quantity || order.target || order.status || order.network)
  );

  // Unsubscribe resolution: only show if category is marketing and URL is provided
  const showUnsubscribe = category === 'marketing' && Boolean(options.unsubscribeUrl && options.unsubscribeUrl.trim());

  // -------------------------------------------------------------
  // HTML GENERATION
  // -------------------------------------------------------------

  // Preheader snippet with invisible padding hack to prevent preview pollution
  const preheaderHtml = preheaderText
    ? `<!-- Preheader Text -->
<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
  ${escapeHtml(preheaderText)}
  ${'&zwnj;&nbsp;'.repeat(30)}
</div>`
    : '';

  // Network Badge inside main content
  let networkBadgeHtml = '';
  if (networkDisplayName) {
    const badgeColors = getNetworkBadgeConfig(networkDisplayName);
    networkBadgeHtml = `
      <tr>
        <td align="left" style="padding: 0 0 12px 0;">
          <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; background-color: ${badgeColors.bg}; color: ${badgeColors.text}; border: 1px solid ${badgeColors.border};">
            <span style="margin-right: 4px;">${badgeColors.iconSymbol}</span> ${escapeHtml(networkDisplayName)}
          </span>
        </td>
      </tr>`;
  }

  // Eyebrow / Badge
  let eyebrowHtml = '';
  if (eyebrowText) {
    eyebrowHtml = `
      <tr>
        <td align="left" style="padding: 0 0 10px 0;">
          <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; border-radius: 4px; background-color: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;">
            &#10003;&nbsp; ${escapeHtml(eyebrowText)}
          </span>
        </td>
      </tr>`;
  }

  // Greeting
  let greetingHtml = '';
  if (customerName) {
    greetingHtml = `<p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #334155; font-weight: 500;">Hello ${escapeHtml(customerName)},</p>`;
  }

  // Body content
  let bodyContentHtml = '';
  if (rawBodyHtml) {
    bodyContentHtml = `<div style="font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 20px;">${rawBodyHtml}</div>`;
  } else if (rawBodyText) {
    const paragraphs = rawBodyText.split(/\n\s*\n/);
    bodyContentHtml = paragraphs
      .map((p) => `<p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #475569;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
      .join('');
  }

  // Order Details Table with high fidelity icons & responsive table rows
  let orderTableHtml = '';
  if (hasOrderDetails && order) {
    const rows: { label: string; value: string; icon: string }[] = [];
    if (order.publicId) rows.push({ label: 'Order ID', value: order.publicId, icon: '&#128179;' });
    const orderNet = formatNetworkDisplay(order.network) || (networkDisplayName ? networkDisplayName : undefined);
    if (orderNet) rows.push({ label: 'Network', value: orderNet, icon: '&#9678;' });
    if (order.service) rows.push({ label: 'Service', value: order.service, icon: '&#9733;' });
    if (order.quantity !== undefined && order.quantity !== null && String(order.quantity).trim() !== '') {
      const qVal = typeof order.quantity === 'number' ? order.quantity.toLocaleString('en-US') : String(order.quantity);
      rows.push({ label: 'Quantity', value: qVal, icon: '&#128200;' });
    }
    if (order.target) rows.push({ label: 'Target', value: order.target, icon: '&#127919;' });
    if (order.status) rows.push({ label: 'Status', value: order.status, icon: '&#9679;' });

    if (rows.length > 0) {
      const tableRowsHtml = rows
        .map(
          (r, idx) => `
            <tr>
              <td class="order-detail-label" style="padding: 10px 14px; font-size: 13px; color: #64748B; font-weight: 500; border-bottom: ${idx === rows.length - 1 ? 'none' : '1px solid #F1F5F9'}; width: 38%; vertical-align: middle;">
                <span style="margin-right: 6px; font-size: 12px; display: inline-block;">${r.icon}</span>${escapeHtml(r.label)}
              </td>
              <td class="order-detail-value" style="padding: 10px 14px; font-size: 13px; color: #0F172A; font-weight: 600; border-bottom: ${idx === rows.length - 1 ? 'none' : '1px solid #F1F5F9'}; text-align: right; word-break: break-all; overflow-wrap: anywhere; vertical-align: middle;">
                ${r.label === 'Status' ? `<span style="color: #059669; font-weight: 700;">&#10003; ${escapeHtml(r.value)}</span>` : escapeHtml(r.value)}
              </td>
            </tr>`
        )
        .join('');

      orderTableHtml = `
      <tr>
        <td style="padding: 18px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="order-details-table" style="width: 100%; max-width: 100%; border-collapse: separate; border-spacing: 0; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; table-layout: fixed;">
            <tr>
              <td colspan="2" style="padding: 12px 14px 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0F172A; background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%;">
                  <tr>
                    <td align="left" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0F172A;">
                      Order Details
                    </td>
                    ${order.publicId ? `<td align="right" class="order-head-id" style="font-size: 12px; font-weight: 700; color: #2563EB; letter-spacing: 0.2px; word-break: break-all;">${escapeHtml(order.publicId)}</td>` : ''}
                  </tr>
                </table>
              </td>
            </tr>
            ${tableRowsHtml}
          </table>
        </td>
      </tr>`;
    }
  }

  // Order ID side pill in Payment Confirmed area (Desktop two-column layout, mobile stacks safely)
  const orderIdDesktopPill = order?.publicId
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="order-id-badge-table" style="width: 100%; margin: 0;">
        <tr>
          <td align="right" class="order-id-badge-td" style="background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 8px; padding: 6px 12px; text-align: right;">
            <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #64748B;">Order ID</span>
            <span style="display: block; font-size: 13px; font-weight: 800; color: #0F172A; font-family: monospace, -apple-system, sans-serif; word-break: break-all;">${escapeHtml(order.publicId)}</span>
          </td>
        </tr>
      </table>`
    : '';

  // What Happens Next Card (highlighted card with rocket icon)
  const whatHappensNextHtml = `
      <tr>
        <td style="padding: 6px 0 16px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FDF4FF; border: 1px solid #F0ABFC; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="padding: 16px 18px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="top" style="width: 32px; padding-right: 12px; font-size: 22px; line-height: 1;">
                      &#128640;
                    </td>
                    <td valign="top">
                      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #701A75; line-height: 20px;">
                        What happens next?
                      </p>
                      <p style="margin: 0; font-size: 13px; line-height: 19px; color: #86198F;">
                        Our team is now preparing your order. You&#39;ll receive another email once the delivery is completed.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

  // Call to Action (CTA) Button with Outlook MSO compatibility
  let ctaHtml = '';
  if (hasValidCta && options.cta) {
    const ctaUrl = escapeHtml(options.cta.url.trim());
    const ctaLabel = escapeHtml(options.cta.label.trim());
    ctaHtml = `
      <tr>
        <td align="center" style="padding: 20px 0 16px 0;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="14%" stroke="f" fillcolor="#2563EB">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;">
              ${ctaLabel}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); text-align: center; mso-hide: all;">
            ${ctaLabel}
          </a>
          <!--<![endif]-->
        </td>
      </tr>`;
  }

  // Support section
  let supportNoticeHtml = '';
  if (options.supportReplyNotice) {
    supportNoticeHtml = `
      <tr>
        <td style="padding: 16px 0 4px 0; border-top: 1px solid #E2E8F0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 12px 14px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #F1F5F9;">
                <p style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #0F172A;">
                  Need help?
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 19px; color: #64748B;">
                  Need help? Simply reply directly to this email. Our support team will be happy to assist you.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  // Unsubscribe section
  let unsubscribeHtml = '';
  if (showUnsubscribe && options.unsubscribeUrl) {
    unsubscribeHtml = `
      <tr>
        <td align="center" style="padding: 8px 0;">
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
            No longer want to receive these emails? <a href="${escapeHtml(options.unsubscribeUrl.trim())}" style="color: #64748B; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>`;
  }

  // Optional custom footer text
  let customFooterHtml = '';
  if (footerText) {
    customFooterHtml = `
      <tr>
        <td align="center" style="padding: 4px 0 8px 0;">
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
            ${escapeHtml(footerText)}
          </p>
        </td>
      </tr>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(titleText)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Client-specific Resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; }
    
    /* Mobile Responsive Styles (320px - 430px) */
    @media only screen and (max-width: 620px) {
      .email-outer-td { padding: 12px 8px 24px 8px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-hero-card { padding: 0 !important; }
      .email-content { padding: 18px 14px 18px 14px !important; }
      
      /* Hero Image Responsive Switch: Show mobile hero, hide desktop hero */
      .hero-desktop-wrapper { display: none !important; mso-hide: all !important; max-height: 0px !important; overflow: hidden !important; }
      .hero-mobile-wrapper { display: block !important; width: 100% !important; max-width: 100% !important; height: auto !important; overflow: visible !important; }
      .hero-img-mobile { display: block !important; width: 100% !important; max-width: 100% !important; height: auto !important; }
      
      /* Mobile Confirmation Section Stacking: Order ID goes below */
      .confirm-head-table { width: 100% !important; }
      .desktop-split-col { display: block !important; width: 100% !important; }
      .order-id-col { display: block !important; width: 100% !important; padding-top: 14px !important; }
      .order-id-badge-table { width: 100% !important; margin-top: 4px !important; }
      .order-id-badge-td { text-align: left !important; padding: 8px 12px !important; }
      
      /* Mobile Order Summary List Stacking */
      .order-details-table { width: 100% !important; }
      .order-detail-label { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 8px 12px 2px 12px !important; border-bottom: none !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; }
      .order-detail-value { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 2px 12px 10px 12px !important; text-align: left !important; font-size: 13px !important; font-weight: 700 !important; }
      
      /* Mobile Footer */
      .footer-stacked-cell { display: block !important; width: 100% !important; text-align: center !important; }
      .footer-social-td { padding: 4px 6px !important; font-size: 11px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${preheaderHtml}
  
  <!-- Outer Wrapper Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-outer-table" style="background-color: #F8FAFC; width: 100%; min-height: 100vh;">
    <tr>
      <td align="center" class="email-outer-td" style="padding: 32px 12px 40px 12px;">
        
        <!-- Main Container (Max 600px, 100% fluid on mobile) -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="width: 600px;">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- HERO PREMIUM SECTION (Vibrant CloutFlow gradient & identity) -->
          <tr>
            <td class="email-hero-card" style="background: linear-gradient(135deg, #090D1A 0%, #171038 35%, #251048 70%, #0D1D3A 100%); background-color: #090D1A; border-radius: 14px 14px 0 0; border: 1px solid #1E293B; border-bottom: none; padding: 0; text-align: center; overflow: hidden;">
              
              <!-- DESKTOP HERO IMAGE (Visible on screens > 620px) -->
              <!--[if !mso]><!-->
              <div class="hero-desktop-wrapper" style="width: 100%; max-width: 600px; margin: 0 auto; text-align: center;">
              <!--<![endif]-->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="hero-desktop-table" style="width: 100%; max-width: 600px; margin: 0 auto;">
                  <tr>
                    <td align="center" style="padding: 0; line-height: 0;">
                      <a href="https://cloutflow.co" target="_blank" style="text-decoration: none; display: block;">
                        <img src="https://cloutflow.co/email/cloutflow-payment-hero-desktop.png" alt="CloutFlow - Social Growth, Simplified. Real People. Real Results. Growth Made Simple." width="600" class="hero-img-desktop" style="display: block; border: 0; width: 100%; max-width: 100%; height: auto; margin: 0 auto; line-height: 100%; outline: none; text-decoration: none;" />
                      </a>
                    </td>
                  </tr>
                </table>
              <!--[if !mso]><!-->
              </div>
              <!--<![endif]-->

              <!-- MOBILE HERO IMAGE (Visible on screens <= 620px) -->
              <!--[if !mso]><!-->
              <div class="hero-mobile-wrapper" style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; width: 100%; text-align: center;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 100%;">
                  <tr>
                    <td align="center" style="padding: 0; line-height: 0;">
                      <a href="https://cloutflow.co" target="_blank" style="text-decoration: none; display: block;">
                        <img src="https://cloutflow.co/email/cloutflow-payment-hero-mobile.png" alt="CloutFlow - Social Growth, Simplified. Real People. Real Results. Growth Made Simple." width="600" class="hero-img-mobile" style="display: none; border: 0; width: 100%; max-width: 100%; height: auto; margin: 0 auto; line-height: 100%; outline: none; text-decoration: none;" />
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              <!--<![endif]-->

            </td>
          </tr>
          
          <!-- Card Content Body (Vibrant clean white card, subtle SaaS border) -->
          <tr>
            <td style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 14px 14px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04); overflow: hidden;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-content" style="padding: 28px 24px 22px 24px;">
                
                <!-- Payment Confirmed Area + Order ID Header Row -->
                <tr>
                  <td style="padding: 0 0 16px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="confirm-head-table">
                      <tr>
                        <td class="desktop-split-col" valign="middle" align="left">
                          ${eyebrowHtml}
                          <h2 style="margin: 0; font-size: 20px; font-weight: 800; line-height: 26px; color: #0F172A; letter-spacing: -0.3px;">
                            ${escapeHtml(titleText)}
                          </h2>
                        </td>
                        ${order?.publicId ? `
                        <td class="desktop-split-col order-id-col" valign="middle" align="right">
                          ${orderIdDesktopPill}
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
                
                ${networkBadgeHtml}
                
                <!-- Greeting & Body Text -->
                <tr>
                  <td align="left" style="padding: 0 0 10px 0;">
                    ${greetingHtml}
                    ${bodyContentHtml}
                  </td>
                </tr>
                
                ${orderTableHtml}
                ${whatHappensNextHtml}
                ${ctaHtml}
                ${supportNoticeHtml}
              </table>
            </td>
          </tr>
          
          <!-- FOOTER (Clean slate theme) -->
          <tr>
            <td align="center" style="padding: 24px 16px 16px 16px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                ${customFooterHtml}
                ${unsubscribeHtml}
                
                <!-- Brand logo in footer -->
                <tr>
                  <td align="center" style="padding: 0 0 4px 0;">
                    <span style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px; color: #0F172A;">
                      CLOUTFLOW
                    </span>
                  </td>
                </tr>
                
                <!-- Footer Tagline & Message -->
                <tr>
                  <td align="center" style="padding: 0 0 10px 0;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B;">
                      Social Growth, Simplified.
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748B; font-weight: 500;">
                      Grow Your Presence. Unlock New Opportunities.
                    </p>
                  </td>
                </tr>
                
                <!-- Social Network Links (Instagram, TikTok, X, YouTube) -->
                <tr>
                  <td align="center" style="padding: 6px 0 12px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="footer-social-td" style="padding: 0 6px;">
                          <span style="font-size: 12px; color: #475569; font-weight: 600;">
                            Instagram
                          </span>
                        </td>
                        <td style="color: #94A3B8; font-size: 11px;">&bull;</td>
                        <td class="footer-social-td" style="padding: 0 6px;">
                          <span style="font-size: 12px; color: #475569; font-weight: 600;">
                            TikTok
                          </span>
                        </td>
                        <td style="color: #94A3B8; font-size: 11px;">&bull;</td>
                        <td class="footer-social-td" style="padding: 0 6px;">
                          <span style="font-size: 12px; color: #475569; font-weight: 600;">
                            X
                          </span>
                        </td>
                        <td style="color: #94A3B8; font-size: 11px;">&bull;</td>
                        <td class="footer-social-td" style="padding: 0 6px;">
                          <span style="font-size: 12px; color: #475569; font-weight: 600;">
                            YouTube
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Copyright & cloutflow.co -->
                <tr>
                  <td align="center" style="padding: 8px 0 0 0; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 8px 0 0 0; font-size: 11px; line-height: 16px; color: #64748B;">
                      <a href="https://cloutflow.co" target="_blank" style="color: #2563EB; text-decoration: none; font-weight: 600;">cloutflow.co</a>
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; line-height: 16px; color: #94A3B8;">
                      &copy; 2026 CloutFlow. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
        
      </td>
    </tr>
  </table>
</body>
</html>`;

  // -------------------------------------------------------------
  // TEXT/PLAIN GENERATION (Clean native plain text)
  // -------------------------------------------------------------

  const textSections: string[] = [];

  // Header
  textSections.push('CLOUTFLOW\nSocial Growth, Simplified.');

  // Hero Headline
  textSections.push('Real People. Real Results. Growth Made Simple.\nMore Reach | More Engagement | More Opportunities');

  // Eyebrow & Network
  const statusLines: string[] = [];
  if (eyebrowText) {
    statusLines.push(eyebrowText.toUpperCase());
  }
  if (networkDisplayName) {
    statusLines.push(`[${networkDisplayName.toUpperCase()}]`);
  }
  if (statusLines.length > 0) {
    textSections.push(statusLines.join(' '));
  }

  // Title
  if (titleText) {
    textSections.push(titleText);
  }

  // Greeting & Body
  const bodyTextParts: string[] = [];
  if (customerName) {
    bodyTextParts.push(`Hello ${customerName},`);
  }
  if (rawBodyText) {
    bodyTextParts.push(rawBodyText);
  } else if (rawBodyHtml) {
    // If only bodyHtml provided, do a minimal safe strip of tags for text version
    const stripped = rawBodyHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (stripped) {
      bodyTextParts.push(stripped);
    }
  }
  if (bodyTextParts.length > 0) {
    textSections.push(bodyTextParts.join('\n\n'));
  }

  // Order Details
  if (hasOrderDetails && order) {
    const orderLines: string[] = ['ORDER DETAILS'];
    if (order.publicId) orderLines.push(`Order ID: ${order.publicId}`);
    const orderNet = formatNetworkDisplay(order.network) || (networkDisplayName ? networkDisplayName : undefined);
    if (orderNet) orderLines.push(`Network: ${orderNet}`);
    if (order.service) orderLines.push(`Service: ${order.service}`);
    if (order.quantity !== undefined && order.quantity !== null && String(order.quantity).trim() !== '') {
      const qVal = typeof order.quantity === 'number' ? order.quantity.toLocaleString('en-US') : String(order.quantity);
      orderLines.push(`Quantity: ${qVal}`);
    }
    if (order.target) orderLines.push(`Target: ${order.target}`);
    if (order.status) orderLines.push(`Status: ${order.status}`);

    if (orderLines.length > 1) {
      textSections.push(orderLines.join('\n'));
    }
  }

  // What Happens Next
  textSections.push("What happens next?\nOur team is now preparing your order. You'll receive another email once the delivery is completed.");

  // CTA
  if (hasValidCta && options.cta) {
    textSections.push(`${options.cta.label.trim()}:\n${options.cta.url.trim()}`);
  }

  // Support Reply Notice
  if (options.supportReplyNotice) {
    textSections.push('Need help? Simply reply directly to this email.\nOur support team will be happy to assist you.');
  }

  // Footer / Unsubscribe
  const footerLines: string[] = [];
  if (footerText) {
    footerLines.push(footerText);
  }
  if (showUnsubscribe && options.unsubscribeUrl) {
    footerLines.push(`Unsubscribe: ${options.unsubscribeUrl.trim()}`);
  }
  footerLines.push('Grow Your Presence. Unlock New Opportunities.');
  footerLines.push('Instagram | TikTok | X | YouTube');
  footerLines.push('cloutflow.co\n© 2026 CloutFlow. All rights reserved.');
  textSections.push(footerLines.join('\n'));

  const text = textSections.join('\n\n');

  return { html, text };
}
