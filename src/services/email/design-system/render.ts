/**
 * CloutFlow Email Design System - Pure Renderer
 * Official PAYMENT_RECEIVED layout — aligned to approved desktop/mobile reference.
 * 750px desktop / 390px mobile, larger readable typography.
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
  bodyText?: string;
  body?: string;
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

const SITE_URL = 'https://cloutflow.co';
const ASSET = `${SITE_URL}/email`;
const OFFER_ASSET = `${SITE_URL}/offer`;

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNetworkDisplay(network?: string | null): string | null {
  if (!network) return null;
  switch (network.toLowerCase().trim()) {
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    case 'x':
    case 'twitter': return 'X';
    case 'youtube': return 'YouTube';
    default: return null;
  }
}

function getNetworkAsset(network?: string | null): string {
  switch ((network || '').toLowerCase().trim()) {
    case 'instagram': return `${ASSET}/email-network-instagram.png`;
    case 'tiktok': return `${ASSET}/email-network-tiktok.png`;
    case 'x':
    case 'twitter': return `${ASSET}/email-network-x.png`;
    case 'youtube': return `${ASSET}/email-network-youtube.png`;
    default: return '';
  }
}


function getServiceAsset(service?: string | null): string {
  const normalized = (service || '').toLowerCase().trim();
  if (!normalized) return `${ASSET}/email-icon-service.png`;

  if (normalized.includes('follower')) return `${ASSET}/email-icon-followers.png`;
  if (normalized.includes('like')) return `${ASSET}/email-icon-like.png`;
  if (normalized.includes('view')) return `${ASSET}/email-icon-views.png`;

  return `${ASSET}/email-icon-service.png`;
}

function getNetworkTheme(network?: string | null) {
  switch ((network || '').toLowerCase().trim()) {
    case 'tiktok':
      return { primary:'#111827', soft:'#F3FFFF', border:'#BDEFF0' };
    case 'x':
    case 'twitter':
      return { primary:'#111111', soft:'#F6F7F9', border:'#D8DDE5' };
    case 'youtube':
      return { primary:'#E60023', soft:'#FFF3F3', border:'#FFC4C4' };
    default:
      return { primary:'#E725A7', soft:'#FFF2F8', border:'#FFC2E0' };
  }
}

function iconImage(src: string, alt: string, size = 32, className = ''): string {
  const classAttr = className ? ` class="${className}"` : '';
  return `<img${classAttr} src="${src}" width="${size}" height="${size}" alt="${escapeHtml(alt)}" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;text-decoration:none;" />`;
}

function safeParagraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p class="body-paragraph" style="margin:0 0 14px 0;font-size:17px;line-height:24px;color:#52637B;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function renderBulletproofCta(cta: EmailCta): string {
  const url = escapeHtml(cta.url.trim());
  const label = escapeHtml(cta.label.trim());
  return `<tr><td align="center" style="padding:22px 0 4px;">
    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#6D3CF6"><w:anchorlock/><center style="color:#ffffff;font-family:Aptos,'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center></v:roundrect><![endif]-->
    <!--[if !mso]><!--><a href="${url}" target="_blank" style="display:inline-block;padding:15px 32px;border-radius:12px;background:#6D3CF6;background-image:linear-gradient(90deg,#E72CA8 0%,#8B3DFF 48%,#1577FF 100%);color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:700;">${label}</a><!--<![endif]-->
  </td></tr>`;
}

function detailRow(
  icon: string,
  label: string,
  value: string,
  valueColor = '#111A3A',
  badge?: string,
  badgeBg = '#F4F7FF',
  badgeColor = '#2563EB',
  badgeBorder = '#C9D8FF'
): string {
  return `<tr><td class="detail-row-cell" style="padding:12px 14px;border-bottom:1px solid #E7ECF6;">
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
      <td class="detail-icon" width="40" valign="middle">${iconImage(icon, label, 32)}</td>
      <td class="detail-label" valign="middle" style="width:86px;padding-left:9px;font-size:15px;line-height:20px;color:#5E7092;">${escapeHtml(label)}</td>
      <td class="detail-value" valign="middle" style="font-size:15px;line-height:21px;color:${valueColor};font-weight:700;word-break:break-word;">${escapeHtml(value)}</td>
      ${badge ? `<td class="detail-badge" align="right" width="92" style="padding-left:6px;"><span style="display:inline-block;padding:6px 11px;border-radius:999px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:13.5px;line-height:17px;font-weight:700;">${escapeHtml(badge)}</span></td>` : ''}
    </tr></table>
  </td></tr>`;
}

export function renderCloutFlowEmail(options: RenderCloutFlowEmailOptions): RenderCloutFlowEmailResult {
  const category = options.category || 'transactional';
  const preheaderText = options.preheader?.trim() || '';
  const eyebrowText = options.eyebrow?.trim() || '';
  const titleText = options.title?.trim() || '';
  const customerName = options.customerName?.trim() || '';
  const rawBodyText = options.bodyText?.trim() || options.body?.trim() || '';
  const rawBodyHtml = options.bodyHtml?.trim() || '';
  const footerText = options.footerText?.trim() || '';
  const order = options.order;
  const resolvedNetwork = options.network || order?.network || null;
  const networkDisplayName = formatNetworkDisplay(resolvedNetwork);
  const networkAsset = getNetworkAsset(resolvedNetwork);
  const theme = getNetworkTheme(resolvedNetwork);

  const isPaymentReceipt =
    /received your order/i.test(titleText) ||
    /payment confirmed|order confirmed/i.test(eyebrowText);

  const hasOrderDetails = Boolean(
    order &&
    (order.publicId || order.network || order.service || order.quantity || order.target || order.status)
  );

  const hasValidCta = Boolean(options.cta?.label?.trim() && options.cta?.url?.trim());
  const showUnsubscribe = category === 'marketing' && Boolean(options.unsubscribeUrl?.trim());

  const quantityValue =
    order?.quantity !== undefined &&
    order?.quantity !== null &&
    String(order.quantity).trim() !== ''
      ? typeof order.quantity === 'number'
        ? order.quantity.toLocaleString('en-US')
        : String(order.quantity)
      : '';

  const preheaderHtml = preheaderText
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheaderText)}${'&zwnj;&nbsp;'.repeat(32)}</div>`
    : '';

  const titleHtml = escapeHtml(titleText).replace(
    /(your order)/i,
    '<span style="color:#E725A7;">$1</span>'
  );

  const bodyContentHtml = rawBodyHtml
    ? `<div class="body-desktop" style="font-size:17px;line-height:24px;color:#52637B;">${rawBodyHtml}</div>${isPaymentReceipt ? `<div class="body-mobile" style="display:none;font-size:14px;line-height:20px;color:#52637B;">Payment confirmed. Your order is being prepared.</div>` : ''}`
    : rawBodyText
      ? `${isPaymentReceipt ? `<div class="body-desktop">${safeParagraphs(rawBodyText)}</div><div class="body-mobile" style="display:none;font-size:14px;line-height:20px;color:#52637B;">Payment confirmed. Your order is being prepared.</div>` : safeParagraphs(rawBodyText)}`
      : '';

  const greetingHtml = customerName
    ? `<p class="greeting" style="margin:0 0 14px;font-size:17px;line-height:24px;color:#52637B;font-weight:600;">Hello ${escapeHtml(customerName)},</p>`
    : '';

  const confirmationHtml = isPaymentReceipt ? `
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
      <td class="confirm-left" width="53%" valign="top" style="padding-right:10px;">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#ECFFF6;border:1px solid #8CE7B9;border-radius:14px;">
          <tr><td style="padding:14px 16px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
              <td width="52">${iconImage(`${ASSET}/email-icon-status.png`, 'Payment confirmed', 50, 'mobile-confirm-icon')}</td>
              <td style="padding-left:11px;">
                <div class="confirm-title" style="font-size:18px;line-height:23px;color:#07875E;font-weight:800;">PAYMENT CONFIRMED</div>
                <div class="confirm-subtitle" style="font-size:15px;line-height:21px;color:#248D6B;padding-top:2px;">Your order is now being prepared</div>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </td>
      <td class="confirm-right" width="47%" valign="top" style="padding-left:10px;">
        ${order?.publicId ? `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F8FAFF;border:1px solid #C9D9FF;border-radius:14px;">
          <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
              <td width="48">${iconImage(`${ASSET}/email-icon-order.png`, 'Order ID', 46, 'mobile-order-id-icon')}</td>
              <td style="padding-left:9px;">
                <div class="order-id-label" style="font-size:15px;line-height:19px;color:#66789A;">Order ID</div>
                <div class="order-id-value" style="font-size:17px;line-height:22px;color:#111A3A;font-weight:800;white-space:nowrap;">${escapeHtml(order.publicId)}</div>
              </td>
              <td align="right" width="36">${iconImage(`${ASSET}/email-icon-copy.png`, 'Copy order ID', 32)}</td>
            </tr></table>
          </td></tr>
        </table>` : ''}
      </td>
    </tr></table>
  ` : '';

  let orderDetailsHtml = '';
  if (hasOrderDetails && order) {
    const orderNetwork = formatNetworkDisplay(order.network) || networkDisplayName || '';
    let rowsHtml = '';

    if (orderNetwork) {
      rowsHtml += detailRow(
        networkAsset || `${ASSET}/email-icon-service.png`,
        'Network',
        orderNetwork,
        '#111A3A',
        orderNetwork,
        theme.soft,
        theme.primary,
        theme.border
      );
    }
    if (order.service) {
      rowsHtml += detailRow(
        getServiceAsset(order.service),
        'Service',
        order.service,
        '#111A3A',
        'Growth',
        '#F2F7FF',
        '#1769E8',
        '#C9DEFF'
      );
    }
    if (quantityValue) {
      rowsHtml += detailRow(`${ASSET}/email-icon-quantity.png`, 'Quantity', quantityValue, '#111A3A', 'Standard', '#EAFBF3', '#07875E', '#B9EBD3');
    }
    if (order.target) {
      rowsHtml += detailRow(`${ASSET}/email-icon-target.png`, 'Target', order.target, '#111A3A', '@username', '#EEF5FF', '#1769E8', '#C9DEFF');
    }
    if (order.status) {
      rowsHtml += detailRow(
        `${ASSET}/email-icon-status.png`,
        'Status',
        order.status,
        '#07966B',
        'Approved',
        '#EAFBF3',
        '#07875E',
        '#B9EBD3'
      );
    }

    orderDetailsHtml = `
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#FCFDFF;border:1px solid #C9D9FF;border-radius:15px;overflow:hidden;">
        <tr><td style="padding:13px 14px;background:#F6F3FF;background-image:linear-gradient(90deg,#FBF4FF,#F2F7FF);border-bottom:1px solid #DDE5F7;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
            <td width="38">${iconImage(`${ASSET}/email-icon-order.png`, 'Order details', 30)}</td>
            <td class="order-details-title" style="padding-left:9px;font-size:17px;line-height:22px;color:#111A3A;font-weight:800;">Order Details</td>
            ${order.publicId ? `<td class="order-head-id" align="right" style="font-size:14px;line-height:19px;color:#1262FF;font-weight:800;white-space:nowrap;">${escapeHtml(order.publicId)}</td>` : ''}
          </tr></table>
        </td></tr>
        ${rowsHtml}
      </table>
    `;
  }

  const nextStepsHtml = isPaymentReceipt ? `
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#FFF8FE;background-image:linear-gradient(135deg,#FFF8FD,#F8F2FF);border:1px solid #EFC5F4;border-radius:15px;">
      <tr><td style="padding:15px 15px 16px;">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
          <td width="54" valign="top">${iconImage(`${ASSET}/email-icon-rocket.png`, 'Next steps', 52)}</td>
          <td valign="top" style="padding-left:9px;">
            <div class="next-title" style="font-size:18px;line-height:22px;color:#8D1595;font-weight:800;">What happens next?</div>
            <div class="next-copy" style="padding-top:5px;font-size:15px;line-height:22px;color:#6E4676;">Our team is now preparing your order. You&#39;ll receive another email once the delivery is completed.</div>
          </td>
        </tr></table>

        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:14px;">
          <tr><td width="42" valign="top"><div style="width:34px;height:34px;line-height:34px;text-align:center;border-radius:50%;background:#8748F7;color:#fff;font-size:16px;font-weight:800;">1</div></td><td style="padding-bottom:10px;"><div class="step-title" style="font-size:16px;line-height:20px;font-weight:800;color:#1B1534;">Processing</div><div style="font-size:14px;line-height:19px;color:#6F5B85;">We validate your order</div></td></tr>
          <tr><td width="42" valign="top"><div style="width:34px;height:34px;line-height:34px;text-align:center;border-radius:50%;background:#8748F7;color:#fff;font-size:16px;font-weight:800;">2</div></td><td style="padding-bottom:10px;"><div class="step-title" style="font-size:16px;line-height:20px;font-weight:800;color:#1B1534;">Delivery</div><div style="font-size:14px;line-height:19px;color:#6F5B85;">We start the delivery</div></td></tr>
          <tr><td width="42" valign="top"><div style="width:34px;height:34px;line-height:34px;text-align:center;border-radius:50%;background:#8748F7;color:#fff;font-size:16px;font-weight:800;">3</div></td><td><div class="step-title" style="font-size:16px;line-height:20px;font-weight:800;color:#1B1534;">Complete</div><div style="font-size:14px;line-height:19px;color:#6F5B85;">You&#39;ll get an update</div></td></tr>
        </table>
      </td></tr>
    </table>
  ` : '';

  const supportHtml = options.supportReplyNotice ? `
    <tr><td style="padding-top:18px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F5FAFF;border:1px solid #C9DEFF;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
            <td width="62">${iconImage(`${ASSET}/email-icon-support.png`, 'Support', 50)}</td>
            <td style="padding-left:10px;">
              <div class="support-title" style="font-size:17px;line-height:22px;color:#111A3A;font-weight:800;">Need help?</div>
              <div class="support-copy support-copy-desktop" style="padding-top:3px;font-size:17px;line-height:21px;color:#566B8D;">Simply reply directly to this email. Our support team will be happy to assist you.</div>
              <div class="support-copy support-copy-mobile" style="display:none;padding-top:3px;font-size:13.5px;line-height:19px;color:#566B8D;">Reply to this email. Our team is happy to help.</div>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  ` : '';

  const trustHtml = isPaymentReceipt ? `
    <tr><td class="trust-wrap" style="padding:20px 4px 6px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
        ${[
          ['email-icon-secure.png','Secure & Reliable','Your data is safe'],
          ['email-icon-fast.png','Fast Delivery','Get results quickly'],
          ['email-icon-people.png','Real People','Real engagement'],
          ['email-icon-partner.png','Growth Partner',"We're with you"]
        ].map((x,i) => `<td width="25%" align="center" valign="top" style="padding:0 9px;${i ? 'border-left:1px solid #DCE4F0;' : ''}">
          ${iconImage(`${ASSET}/${x[0]}`, x[1], 40)}
          <div style="padding-top:6px;font-size:15px;line-height:20px;color:#111A3A;font-weight:800;">${x[1]}</div>
          <div style="font-size:15px;line-height:18px;color:#667794;">${x[2]}</div>
        </td>`).join('')}
      </tr></table>
    </td></tr>
  ` : '';

  const ctaHtml = hasValidCta && options.cta ? renderBulletproofCta(options.cta) : '';
  const unsubscribeHtml =
    showUnsubscribe && options.unsubscribeUrl
      ? `<tr><td align="center" style="padding:8px 0;font-size:13px;line-height:18px;color:#8794AA;">No longer want these emails? <a href="${escapeHtml(options.unsubscribeUrl.trim())}" style="color:#64748B;text-decoration:underline;">Unsubscribe</a></td></tr>`
      : '';

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(titleText)}</title>
<style type="text/css">
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
body,table,td,a,div,p,h1,h2,h3,span{font-family:Aptos,'Segoe UI','Helvetica Neue',Arial,sans-serif;}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
table{border-collapse:separate;}
img{-ms-interpolation-mode:bicubic;border:0;}
body{margin:0!important;padding:0!important;width:100%!important;background:#F4F7FB;}
.hero-mobile{display:none;max-height:0;overflow:hidden;}
.benefit-sub-mobile{display:none;}
@media only screen and (max-width:620px){
  *{box-sizing:border-box!important;}
  .outer{padding:0!important;}
  .container{width:100%!important;max-width:390px!important;margin:0 auto!important;}
  .content{padding:16px 14px 20px!important;}
  .hero-desktop{display:none!important;max-height:0!important;overflow:hidden!important;}
  .hero-mobile{display:block!important;max-height:none!important;overflow:visible!important;}
  .hero-mobile img{display:block!important;width:100%!important;height:auto!important;}
  .hero-benefits{table-layout:fixed!important;width:100%!important;}
  .benefit-cell{width:33.33%!important;padding:9px 4px 11px!important;text-align:center!important;vertical-align:top!important;box-sizing:border-box!important;}
  .benefit-inner{width:100%!important;table-layout:fixed!important;}
  .benefit-icon-cell,.benefit-text-cell{display:block!important;width:100%!important;text-align:center!important;padding:0!important;}
  .benefit-icon-cell img{width:24px!important;height:24px!important;margin:0 auto 4px!important;}
  .benefit-title{font-size:10.5px!important;line-height:13px!important;white-space:nowrap!important;text-align:center!important;letter-spacing:-.18px!important;word-break:normal!important;overflow-wrap:normal!important;}
  .benefit-subtitle{font-size:11.5px!important;line-height:14.5px!important;white-space:normal!important;text-align:center!important;padding-top:4px!important;}
  .benefit-sub-desktop{display:none!important;}
  .benefit-sub-mobile{display:inline!important;}
  .confirm-left,.confirm-right{display:block!important;width:100%!important;padding:0!important;}
  .confirm-right{padding-top:10px!important;}
  .confirm-left>table,.confirm-right>table{width:100%!important;table-layout:fixed!important;}
  .confirm-left td,.confirm-right td{box-sizing:border-box!important;}
  .confirm-left>table>tbody>tr>td,.confirm-right>table>tbody>tr>td{padding:12px 13px!important;}
  .mobile-confirm-icon,.mobile-order-id-icon{width:35px!important;height:35px!important;}
  .confirm-title{font-size:14px!important;line-height:10px!important;white-space:normal!important;}
  .confirm-subtitle{font-size:14px!important;line-height:19px!important;}
  .order-id-label{font-size:13px!important;line-height:18px!important;}
  .order-id-value{font-size:14px!important;line-height:19px!important;white-space:nowrap!important;}
  .headline{font-size:17px!important;line-height:21px!important;letter-spacing:-.25px!important;word-break:normal!important;overflow-wrap:normal!important;white-space:nowrap!important;}
  .main-left,.main-right{display:block!important;width:100%!important;padding:0!important;}
  .main-right{padding-top:12px!important;}
  .main-left>table,.main-right>table{width:100%!important;max-width:100%!important;table-layout:fixed!important;}
  .detail-row-cell{padding:11px 12px!important;}
  .detail-icon{width:34px!important;}
  .detail-icon img{width:28px!important;height:28px!important;}
  .detail-label{width:72px!important;padding-left:7px!important;font-size:13px!important;line-height:18px!important;}
  .detail-value{font-size:15px!important;line-height:20px!important;text-align:left!important;padding-left:3px!important;font-weight:700!important;word-break:normal!important;overflow-wrap:anywhere!important;}
  .detail-badge{display:none!important;width:0!important;max-width:0!important;padding:0!important;overflow:hidden!important;}
  .order-details-title{font-size:14.5px!important;line-height:21px!important;}
  .order-head-id{font-size:12px!important;line-height:17px!important;white-space:nowrap!important;}
  .next-title{font-size:14.5px!important;line-height:16px!important;}
  .next-copy{font-size:14.5px!important;line-height:21px!important;}
  .main-right table td{word-break:normal!important;}
  .step-title{font-size:14.5px!important;line-height:20px!important;}
  .support-title{font-size:14.5px!important;line-height:20px!important;}
  .support-copy{font-size:13.5px!important;line-height:19px!important;}
  .body-paragraph,.greeting{font-size:16px!important;line-height:24px!important;}
  .body-desktop,.support-copy-desktop{display:none!important;max-height:0!important;overflow:hidden!important;}
  .body-mobile,.support-copy-mobile{display:block!important;max-height:none!important;overflow:visible!important;}
  .trust-wrap{display:none!important;}
  .footer-pad{padding:16px 14px 0!important;}
  .footer-brand,.footer-socials{display:block!important;width:100%!important;border-right:0!important;padding:0!important;text-align:center!important;}
  .footer-brand img{margin:0 auto!important;width:150px!important;}
  .footer-brand div{font-size:13.5px!important;line-height:19px!important;}
  .footer-socials{padding-top:12px!important;}
  .footer-socials table{width:100%!important;table-layout:fixed!important;}
  .footer-socials td{width:25%!important;padding:0 2px!important;}
  .footer-socials img{width:24px!important;height:24px!important;margin:0 auto!important;}
  .footer-social-label{font-size:13px!important;line-height:15px!important;}
  .footer-tagline{font-size:14px!important;line-height:20px!important;}
  .footer-copyright{font-size:12.5px!important;line-height:19px!important;}
}
@media only screen and (max-width:360px){
  .content{padding:14px 11px 18px!important;}
  .headline{font-size:16px!important;line-height:20px!important;white-space:nowrap!important;}
  .benefit-title{font-size:12px!important;line-height:12.5px!important;letter-spacing:-.22px!important;white-space:nowrap!important;}
  .benefit-subtitle{font-size:12px!important;line-height:13.8px!important;}
  .detail-label{width:66px!important;font-size:12.5px!important;}
  .detail-value{font-size:14.5px!important;line-height:19px!important;}
  .order-head-id{font-size:11px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Aptos,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111A3A;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;">
${preheaderHtml}
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F4F7FB;">
<tr><td class="outer" align="center" style="padding:24px 10px 34px;">
<table role="presentation" class="container" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:780px;margin:0 auto;">
<tr><td style="line-height:0;background:#F7F4FF;border-radius:16px 16px 0 0;overflow:hidden;">
  <div class="hero-desktop"><a href="${SITE_URL}" target="_blank"><img src="${ASSET}/cloutflow-payment-hero-desktop.png" width="780" alt="CloutFlow — Real People. Real Results. Growth Made Simple." style="display:block;width:100%;height:auto;"></a></div>
  <!--[if !mso]><!--><div class="hero-mobile"><a href="${SITE_URL}" target="_blank"><img src="${ASSET}/cloutflow-payment-hero-mobile.png" width="390" alt="CloutFlow — Growth Made Simple." style="display:none;width:100%;height:auto;"></a></div><!--<![endif]-->
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="hero-benefits" style="width:100%;background:#F7F4FF;background-image:linear-gradient(90deg,#FFF6FC 0%,#F4F4FF 52%,#EEF7FF 100%);">
    <tr>
      <td class="benefit-cell" width="33.33%" valign="middle" style="padding:11px 13px 12px 18px;">
        <table class="benefit-inner" role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
          <td class="benefit-icon-cell" width="38" valign="middle">${iconImage(`${ASSET}/email-icon-fast.png`, 'More Reach', 34)}</td>
          <td class="benefit-text-cell" valign="middle" style="padding-left:8px;">
            <div class="benefit-title" style="font-size:15.5px;line-height:19px;color:#17213B;font-weight:800;white-space:nowrap;">More Reach</div>
            <div class="benefit-subtitle" style="font-size:15px;line-height:18px;color:#66738F;white-space:nowrap;"><span class="benefit-sub-desktop">Expand Your Audience</span><span class="benefit-sub-mobile">Expand Your<br>Audience</span></div>
          </td>
        </tr></table>
      </td>
      <td class="benefit-cell" width="33.33%" valign="middle" style="padding:11px 10px 12px;border-left:1px solid #DDE2F2;">
        <table class="benefit-inner" role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
          <td class="benefit-icon-cell" width="38" valign="middle">${iconImage(`${ASSET}/email-icon-quantity.png`, 'More Engagement', 34)}</td>
          <td class="benefit-text-cell" valign="middle" style="padding-left:8px;">
            <div class="benefit-title" style="font-size:15.5px;line-height:19px;color:#17213B;font-weight:800;white-space:nowrap;">More Engagement</div>
            <div class="benefit-subtitle" style="font-size:15px;line-height:18px;color:#66738F;white-space:nowrap;"><span class="benefit-sub-desktop">Build Real Connections</span><span class="benefit-sub-mobile">Build Real<br>Connections</span></div>
          </td>
        </tr></table>
      </td>
      <td class="benefit-cell" width="33.33%" valign="middle" style="padding:11px 18px 12px 10px;border-left:1px solid #DDE2F2;">
        <table class="benefit-inner" role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
          <td class="benefit-icon-cell" width="38" valign="middle">${iconImage(`${ASSET}/email-icon-people.png`, 'More Opportunities', 34)}</td>
          <td class="benefit-text-cell" valign="middle" style="padding-left:8px;">
            <div class="benefit-title" style="font-size:15.5px;line-height:19px;color:#17213B;font-weight:800;white-space:nowrap;">More Opportunities</div>
            <div class="benefit-subtitle" style="font-size:15px;line-height:18px;color:#66738F;white-space:nowrap;"><span class="benefit-sub-desktop">Turn Growth Into Results</span><span class="benefit-sub-mobile">Turn Growth Into<br>Results</span></div>
          </td>
        </tr></table>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="background:#fff;border:1px solid #E0E6F1;border-top:0;">
<table role="presentation" class="content" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:20px 24px 24px;">
<tr><td>${confirmationHtml}</td></tr>
<tr><td style="padding-top:${isPaymentReceipt ? '20px' : '0'};">
  <h1 class="headline" style="margin:0;font-size:36px;line-height:41px;letter-spacing:-.6px;color:#111A3A;font-weight:800;">${titleHtml}</h1>
</td></tr>
<tr><td style="padding-top:10px;">${greetingHtml}${bodyContentHtml}</td></tr>

${hasOrderDetails || isPaymentReceipt ? `<tr><td style="padding-top:12px;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
    <td class="main-left" width="62%" valign="top" style="padding-right:8px;">${orderDetailsHtml}</td>
    <td class="main-right" width="38%" valign="top" style="padding-left:8px;">${nextStepsHtml}</td>
  </tr></table>
</td></tr>` : ''}

${ctaHtml}
${supportHtml}
${trustHtml}
</table>
</td></tr>

<tr><td class="footer-pad" align="center" style="background:#fff;padding:18px 24px 0;border-top:1px solid #EEF1F7;">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:694px;">
${footerText ? `<tr><td align="center" style="padding-bottom:8px;font-size:13px;line-height:19px;color:#71809A;">${escapeHtml(footerText)}</td></tr>` : ''}
${unsubscribeHtml}
<tr><td style="padding:2px 0 10px;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
    <td class="footer-brand" width="46%" valign="middle" style="padding-right:20px;border-right:1px solid #DCE4F0;">
      <img src="${SITE_URL}/cloutflow-header-logo.png" width="180" alt="CloutFlow" style="display:block;width:180px;height:auto;">
      <div style="padding-top:3px;font-size:15px;line-height:20px;color:#566B8D;">Social Growth, Simplified.</div>
    </td>
    <td class="footer-socials" width="54%" valign="middle" style="padding-left:20px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
        ${[
          ['Instagram','email-network-instagram.png'],
          ['TikTok','email-network-tiktok.png'],
          ['X','email-network-x.png'],
          ['YouTube','email-network-youtube.png']
        ].map((x) => `<td align="center" width="25%" style="padding:0 5px;">
          ${iconImage(`${ASSET}/${x[1]}`, x[0], 28)}
          <div class="footer-social-label" style="padding-top:5px;font-size:15px;line-height:17px;color:#60708C;">${x[0]}</div>
        </td>`).join('')}
      </tr></table>
    </td>
  </tr></table>
</td></tr>
<tr><td align="center" class="footer-tagline" style="padding:8px 0 3px;font-size:15px;line-height:20px;color:#566B8D;">Grow Your Presence. Unlock New Opportunities.</td></tr>
<tr><td align="center" class="footer-copyright" style="font-size:15px;line-height:19px;color:#7A89A2;">&copy; 2026 CloutFlow. All rights reserved.</td></tr>
<tr><td style="padding-top:6px;line-height:0;">
  <img src="${ASSET}/cloutflow-email-footer-wave.png" width="694" alt="" style="display:block;width:100%;max-width:694px;height:auto;border:0;margin:0 auto;" />
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const textSections: string[] = [];
  textSections.push('CLOUTFLOW\nSocial Growth, Simplified.');
  textSections.push('Real People. Real Results. Growth Made Simple.\nMore Reach | More Engagement | More Opportunities');

  if (eyebrowText) textSections.push(eyebrowText.toUpperCase());
  if (titleText) textSections.push(titleText);

  const bodyTextParts: string[] = [];
  if (customerName) bodyTextParts.push(`Hello ${customerName},`);
  if (rawBodyText) bodyTextParts.push(rawBodyText);
  else if (rawBodyHtml) {
    const stripped = rawBodyHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (stripped) bodyTextParts.push(stripped);
  }
  if (bodyTextParts.length) textSections.push(bodyTextParts.join('\n\n'));

  if (hasOrderDetails && order) {
    const lines = ['ORDER DETAILS'];
    if (order.publicId) lines.push(`Order ID: ${order.publicId}`);
    const orderNetwork = formatNetworkDisplay(order.network) || networkDisplayName || '';
    if (orderNetwork) lines.push(`Network: ${orderNetwork}`);
    if (order.service) lines.push(`Service: ${order.service}`);
    if (quantityValue) lines.push(`Quantity: ${quantityValue}`);
    if (order.target) lines.push(`Target: ${order.target}`);
    if (order.status) lines.push(`Status: ${order.status}`);
    textSections.push(lines.join('\n'));
  }

  if (isPaymentReceipt) {
    textSections.push("What happens next?\nProcessing — We validate your order\nDelivery — We start the delivery\nComplete — You'll get an update");
  }

  if (hasValidCta && options.cta) {
    textSections.push(`${options.cta.label.trim()}:\n${options.cta.url.trim()}`);
  }

  if (options.supportReplyNotice) {
    textSections.push('Need help? Simply reply directly to this email.\nOur support team will be happy to assist you.');
  }

  if (footerText) textSections.push(footerText);
  if (showUnsubscribe && options.unsubscribeUrl) {
    textSections.push(`Unsubscribe: ${options.unsubscribeUrl.trim()}`);
  }

  textSections.push(
    'Grow Your Presence. Unlock New Opportunities.\nInstagram | TikTok | X | YouTube\ncloutflow.co\n© 2026 CloutFlow. All rights reserved.'
  );

  return { html, text: textSections.join('\n\n') };
}
