/**
 * CloutFlow Email Design System - Pure Renderer
 * Phase 2A-MIN: Isolated pure email rendering engine
 * 
 * Generates email-client safe HTML (table-based, inline CSS, MSO compatible)
 * and clean native plain-text companion.
 * 
 * NOT CONNECTED TO ANY PRODUCTION TRIGGER OR DISPATCH FLOW.
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
 * Returns badge styling colors for supported networks
 */
function getNetworkBadgeColors(network: string): { bg: string; text: string; border: string } {
  const lower = network.toLowerCase();
  switch (lower) {
    case 'instagram':
      return { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' };
    case 'tiktok':
      return { bg: '#F1F5F9', text: '#0F172A', border: '#E2E8F0' };
    case 'x':
      return { bg: '#F8FAFC', text: '#020617', border: '#CBD5E1' };
    case 'youtube':
      return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
    default:
      return { bg: '#F0FDFA', text: '#0D9488', border: '#CCFBF1' };
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

  // Network Badge
  let networkBadgeHtml = '';
  if (networkDisplayName) {
    const badgeColors = getNetworkBadgeColors(networkDisplayName);
    networkBadgeHtml = `
      <tr>
        <td align="left" style="padding: 0 0 12px 0;">
          <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; background-color: ${badgeColors.bg}; color: ${badgeColors.text}; border: 1px solid ${badgeColors.border};">
            ${escapeHtml(networkDisplayName)}
          </span>
        </td>
      </tr>`;
  }

  // Eyebrow
  let eyebrowHtml = '';
  if (eyebrowText) {
    eyebrowHtml = `
      <tr>
        <td align="left" style="padding: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0D9488;">
          ${escapeHtml(eyebrowText)}
        </td>
      </tr>`;
  }

  // Greeting
  let greetingHtml = '';
  if (customerName) {
    greetingHtml = `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">Hello ${escapeHtml(customerName)},</p>`;
  }

  // Body content
  let bodyContentHtml = '';
  if (rawBodyHtml) {
    bodyContentHtml = `<div style="font-size: 15px; line-height: 24px; color: #334155; margin-bottom: 20px;">${rawBodyHtml}</div>`;
  } else if (rawBodyText) {
    const paragraphs = rawBodyText.split(/\n\s*\n/);
    bodyContentHtml = paragraphs
      .map((p) => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
      .join('');
  }

  // Order Details Table
  let orderTableHtml = '';
  if (hasOrderDetails && order) {
    const rows: { label: string; value: string }[] = [];
    if (order.publicId) rows.push({ label: 'Order ID', value: order.publicId });
    const orderNet = formatNetworkDisplay(order.network) || (networkDisplayName ? networkDisplayName : undefined);
    if (orderNet) rows.push({ label: 'Network', value: orderNet });
    if (order.service) rows.push({ label: 'Service', value: order.service });
    if (order.quantity !== undefined && order.quantity !== null && String(order.quantity).trim() !== '') {
      const qVal = typeof order.quantity === 'number' ? order.quantity.toLocaleString('en-US') : String(order.quantity);
      rows.push({ label: 'Quantity', value: qVal });
    }
    if (order.target) rows.push({ label: 'Target', value: order.target });
    if (order.status) rows.push({ label: 'Status', value: order.status });

    if (rows.length > 0) {
      const tableRowsHtml = rows
        .map(
          (r, idx) => `
            <tr>
              <td style="padding: 10px 14px; font-size: 13px; color: #64748B; font-weight: 500; border-bottom: ${idx === rows.length - 1 ? 'none' : '1px solid #F1F5F9'}; width: 35%;">
                ${escapeHtml(r.label)}
              </td>
              <td style="padding: 10px 14px; font-size: 13px; color: #0F172A; font-weight: 600; border-bottom: ${idx === rows.length - 1 ? 'none' : '1px solid #F1F5F9'}; text-align: right;">
                ${escapeHtml(r.value)}
              </td>
            </tr>`
        )
        .join('');

      orderTableHtml = `
      <tr>
        <td style="padding: 20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <tr>
              <td colspan="2" style="padding: 12px 14px 8px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0D9488; border-bottom: 1px solid #E2E8F0;">
                Order Details
              </td>
            </tr>
            ${tableRowsHtml}
          </table>
        </td>
      </tr>`;
    }
  }

  // Call to Action (CTA) Button with Outlook MSO compatibility
  let ctaHtml = '';
  if (hasValidCta && options.cta) {
    const ctaUrl = escapeHtml(options.cta.url.trim());
    const ctaLabel = escapeHtml(options.cta.label.trim());
    ctaHtml = `
      <tr>
        <td align="center" style="padding: 24px 0 16px 0;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="14%" stroke="f" fillcolor="#0D9488">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;">
              ${ctaLabel}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #0D9488; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; mso-hide: all;">
            ${ctaLabel}
          </a>
          <!--<![endif]-->
        </td>
      </tr>`;
  }

  // Support reply notice
  let supportNoticeHtml = '';
  if (options.supportReplyNotice) {
    supportNoticeHtml = `
      <tr>
        <td style="padding: 16px 0 8px 0; border-top: 1px solid #F1F5F9; text-align: center;">
          <p style="margin: 0; font-size: 13px; line-height: 20px; color: #64748B;">
            Need help? Simply reply directly to this email.
          </p>
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
    /* Mobile styles */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .email-content { padding: 24px 20px !important; }
      .header-padding { padding: 24px 20px 16px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${preheaderHtml}
  
  <!-- Outer Wrapper Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 12px 40px 12px;">
        
        <!-- Main Container (Max 600px) -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Header Branding -->
          <tr>
            <td align="center" class="header-padding" style="padding: 0 0 24px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0F172A; text-decoration: none;">
                      CLOUTFLOW
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 2px;">
                    <span style="font-size: 12px; font-weight: 500; letter-spacing: 0.2px; color: #0D9488; text-transform: uppercase;">
                      Social Growth, Simplified.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Card Content Body -->
          <tr>
            <td style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-content" style="padding: 32px 32px 28px 32px;">
                ${eyebrowHtml}
                ${networkBadgeHtml}
                
                <!-- Title -->
                <tr>
                  <td align="left" style="padding: 0 0 16px 0;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; line-height: 28px; color: #0F172A;">
                      ${escapeHtml(titleText)}
                    </h1>
                  </td>
                </tr>
                
                <!-- Main Body -->
                <tr>
                  <td align="left" style="padding: 0;">
                    ${greetingHtml}
                    ${bodyContentHtml}
                  </td>
                </tr>
                
                ${orderTableHtml}
                ${ctaHtml}
                ${supportNoticeHtml}
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 16px 0 16px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                ${customFooterHtml}
                ${unsubscribeHtml}
                <tr>
                  <td align="center" style="padding: 8px 0 0 0;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
                      &copy; CloutFlow &bull; <a href="https://cloutflow.co" target="_blank" style="color: #64748B; text-decoration: none;">cloutflow.co</a>
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

  // CTA
  if (hasValidCta && options.cta) {
    textSections.push(`${options.cta.label.trim()}:\n${options.cta.url.trim()}`);
  }

  // Support Reply Notice
  if (options.supportReplyNotice) {
    textSections.push('Need help? Simply reply directly to this email.');
  }

  // Footer / Unsubscribe
  const footerLines: string[] = [];
  if (footerText) {
    footerLines.push(footerText);
  }
  if (showUnsubscribe && options.unsubscribeUrl) {
    footerLines.push(`Unsubscribe: ${options.unsubscribeUrl.trim()}`);
  }
  footerLines.push('CloutFlow\nhttps://cloutflow.co');
  textSections.push(footerLines.join('\n'));

  const text = textSections.join('\n\n');

  return { html, text };
}
