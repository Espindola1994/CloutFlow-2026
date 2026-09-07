import { buildUnsubscribeUrl } from './unsubscribe.service';
import { formatOfferDateTime } from '@/services/offers/offer-status';

interface CartRecoveryTemplateData {
  returnUrl: string;
  customerEmail: string;
}

interface PostPurchaseOfferTemplateData {
  customerEmail: string;
}

export function getPostPurchaseOfferTemplate(contextData: Record<string, unknown>, data: PostPurchaseOfferTemplateData): { subject: string; html: string } {
  const unsubscribeUrl = buildUnsubscribeUrl(data.customerEmail);
  const offerCode = (contextData?.offerCode as string) || '';
  const expiresAtStr = contextData?.expiresAt as string;

  let formattedDate = '48 hours';
  if (expiresAtStr) {
    formattedDate = formatOfferDateTime(expiresAtStr, { style: 'email' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cloutflow.co';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const ctaUrl = `${cleanBaseUrl}/offer/${encodeURIComponent(offerCode)}`;

  return {
    subject: "Thanks for your order — here’s 25% off your next one",
    html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your next boost is 25% off</title>
  <style>
    body, table, td, a, p, div, span {
      font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    img { border: 0; outline: none; text-decoration: none; }
    a { text-decoration: none; }

    .rounded-card {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border-radius: 18px !important;
      overflow: hidden !important;
    }

    .hero-mobile-wrap,
    .hero-mobile-img {
      display: none !important;
      max-height: 0 !important;
      overflow: hidden !important;
      mso-hide: all !important;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad { padding: 10px 8px 22px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .main-content { padding: 13px 12px 15px !important; }

      .hero-desktop-wrap,
      .hero-desktop-table,
      .hero-img-desktop {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      .hero-mobile-wrap {
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
      }

      .hero-mobile-img {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }

      .benefit-cell {
        width: 33.33% !important;
        padding: 8px 4px !important;
      }

      .benefit-icon {
        width: 22px !important;
        height: 22px !important;
      }

      .benefit-title {
        font-size: 10px !important;
        line-height: 12px !important;
        white-space: nowrap !important;
      }

      .benefit-subtitle {
        font-size: 9px !important;
        line-height: 11px !important;
        white-space: nowrap !important;
      }

      .reward-title {
        font-size: 24px !important;
        line-height: 29px !important;
        letter-spacing: -0.35px !important;
      }

      .reward-copy {
        font-size: 15px !important;
        line-height: 21px !important;
      }

      .discount-number {
        font-size: 46px !important;
        line-height: 50px !important;
      }

      .offer-grid td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .offer-grid .offer-left {
        padding-right: 0 !important;
        padding-bottom: 10px !important;
      }

      .offer-grid .offer-right {
        padding-left: 0 !important;
      }

      .cta-shell {
        width: 100% !important;
      }

      .cta-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .cta-label {
        font-size: 16px !important;
        line-height: 20px !important;
      }

      .cta-sub {
        font-size: 11px !important;
        line-height: 15px !important;
      }

      .cta-image { width:210px !important; max-width:70% !important; height:auto !important; }

      .footer-pad {
        padding: 15px 11px 10px !important;
      }

      .footer-main-table,
      .footer-left,
      .footer-right {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }

      .footer-left {
        padding-right: 0 !important;
        padding-bottom: 16px !important;
        border-right: 0 !important;
        border-bottom: 1px solid #E0E6F0 !important;
      }

      .footer-right {
        padding-left: 0 !important;
        padding-top: 16px !important;
      }

      .footer-logo {
        width: 145px !important;
        max-width: 55% !important;
        margin: 0 auto !important;
      }

      .footer-social-cell {
        padding: 0 7px !important;
      }

      .footer-social-label {
        font-size: 12px !important;
        line-height: 15px !important;
      }

      .footer-tagline {
        font-size: 13px !important;
        line-height: 18px !important;
      }

      .footer-copy {
        font-size: 12px !important;
        line-height: 17px !important;
      }
    }

    @media only screen and (max-width: 360px) {
      .reward-title {
        font-size: 21px !important;
        line-height: 26px !important;
      }

      .benefit-title {
        font-size: 10px !important;
        line-height: 13px !important;
      }

      .benefit-subtitle {
        font-size: 9px !important;
        line-height: 12px !important;
      }

      .footer-social-cell {
        padding: 0 5px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#F5F7FB;color:#111A3A;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:#F5F7FB;line-height:1px;opacity:0;">
    Your private 25% CloutFlow reward is ready to use on your next eligible order.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background:#F5F7FB;border-collapse:separate;border-spacing:0;">
    <tr>
      <td align="center" class="outer-pad" style="padding:10px 8px 16px;">

        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
          <tr><td>
        <![endif]-->

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="width:100%;max-width:600px;margin:0 auto;border-collapse:separate;border-spacing:0;">

          <tr>
            <td style="padding:0;line-height:0;border-radius:18px 18px 0 0;overflow:hidden;background:#FFFFFF;">
              <div class="hero-desktop-wrap" style="display:block;width:100%;max-width:100%;">
                <a href="${cleanBaseUrl}" target="_blank" style="display:block;text-decoration:none;">
                  <img
                    src="${cleanBaseUrl}/email/cloutflow-payment-hero-desktop.png"
                    width="600"
                    alt="CloutFlow — Real People. Real Results. Growth Made Simple."
                    class="hero-img-desktop"
                    style="display:block;width:100%;max-width:100%;height:auto;border:0;margin:0;padding:0;line-height:0;"
                  />
                </a>
              </div>

              <!--[if !mso]><!-->
              <div class="hero-mobile-wrap" style="display:none;max-height:0;overflow:hidden;width:100%;">
                <a href="${cleanBaseUrl}" target="_blank" style="display:block;text-decoration:none;">
                  <img
                    src="${cleanBaseUrl}/email/cloutflow-payment-hero-mobile.png"
                    width="620"
                    alt="CloutFlow — Real People. Real Results. Growth Made Simple."
                    class="hero-mobile-img"
                    style="display:none;width:100%;max-width:620px;height:auto;border:0;"
                  />
                </a>
              </div>
              <!--<![endif]-->
            </td>
          </tr>

          <!-- Same approved benefit strip used under the payment hero -->
          <tr>
            <td style="background:#F8F6FF;border-left:1px solid #E1E6F2;border-right:1px solid #E1E6F2;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;">
                <tr>
                  <td class="benefit-cell" valign="middle" style="width:33.33%;padding:9px 10px;border-right:1px solid #E1E3F1;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="middle" style="width:30px;">
                          <img src="${cleanBaseUrl}/email/email-icon-fast.png" width="24" height="24" class="benefit-icon" alt="More Reach" style="display:block;width:35px;height:35px;border:0;border-radius:9px;" />
                        </td>
                        <td valign="middle" style="padding-left:8px;">
                          <div class="benefit-title" style="font-size:14.5px;line-height:15px;color:#111A3A;font-weight:800;white-space:nowrap;">More Reach</div>
                          <div class="benefit-subtitle" style="font-size:13.5px;line-height:14px;color:#66738F;white-space:nowrap;">Expand Your Audience</div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td class="benefit-cell" valign="middle" style="width:33.33%;padding:9px 10px;border-right:1px solid #E1E3F1;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="middle" style="width:30px;">
                          <img src="${cleanBaseUrl}/email/email-icon-quantity.png" width="24" height="24" class="benefit-icon" alt="More Engagement" style="display:block;width:35px;height:35px;border:0;border-radius:9px;" />
                        </td>
                        <td valign="middle" style="padding-left:8px;">
                          <div class="benefit-title" style="font-size:14.5px;line-height:15px;color:#111A3A;font-weight:800;white-space:nowrap;">More Engagement</div>
                          <div class="benefit-subtitle" style="font-size:13.5px;line-height:14px;color:#66738F;white-space:nowrap;">Build Real Connections</div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td class="benefit-cell" valign="middle" style="width:33.33%;padding:9px 10px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="middle" style="width:30px;">
                          <img src="${cleanBaseUrl}/email/email-icon-people.png" width="24" height="24" class="benefit-icon" alt="More Opportunities" style="display:block;width:35px;height:35px;border:0;border-radius:9px;" />
                        </td>
                        <td valign="middle" style="padding-left:8px;">
                          <div class="benefit-title" style="font-size:14.5px;line-height:15px;color:#111A3A;font-weight:800;white-space:nowrap;">More Opportunities</div>
                          <div class="benefit-subtitle" style="font-size:13.5px;line-height:14px;color:#66738F;white-space:nowrap;">Turn Growth Into Results</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;border-radius:0 0 18px 18px;overflow:hidden;box-shadow:0 14px 34px rgba(28,39,76,.08);">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:separate;border-spacing:0;">
                <tr>
                  <td class="main-content" style="padding:15px 18px 17px;">

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td align="center" style="padding-top:2px;">
                          <img
                            src="${cleanBaseUrl}/email/cloutflow-email-gift-25off.png"
                            width="145"
                            alt="25% off gift"
                            style="display:block;width:145px;max-width:42%;height:auto;border:0;margin:0 auto;"
                          />
                        </td>
                      </tr>

                      <tr>
                        <td align="center" style="padding-top:2px;">
                          <div class="reward-title" style="font-size:25px;line-height:30px;letter-spacing:-.45px;color:#111A3A;font-weight:800;">
                            Here’s Your <span style="color:#6D3CF6;">25% Off</span>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td align="center" style="padding-top:5px;">
                          <div class="reward-copy" style="max-width:560px;margin:0 auto;color:#66738F;font-size:15px;line-height:21px;">
                            As a thank you for being part of CloutFlow, here’s a special discount just for you.
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-top:13px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="offer-grid" style="border-collapse:separate;border-spacing:0;">
                            <tr>
                              <td class="offer-left" valign="top" style="width:42%;padding-right:7px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="rounded-card" style="background:#FFF7FC;border:1px solid #F0D7E7;border-radius:16px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                                  <tr>
                                    <td style="padding:15px 14px;border-radius:16px;">
                                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                          <td valign="middle" style="width:44px;">
                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                              <tr>
                                                <td align="center" valign="middle" style="width:38px;height:38px;border-radius:12px;background:#FFFFFF;border:1px solid #F2DFEA;">
                                                  <img src="${cleanBaseUrl}/email/email-icon-partner.png" width="28" height="28" alt="Private reward" style="display:block;width:35px;height:35px;border:0;border-radius:9px;" />
                                                </td>
                                              </tr>
                                            </table>
                                          </td>
                                          <td valign="middle" style="padding-left:9px;">
                                            <div style="font-size:14px;line-height:13px;color:#9D2772;font-weight:800;letter-spacing:.45px;text-transform:uppercase;">Private reward</div>
                                            <div style="padding-top:1px;font-size:32px;line-height:35px;color:#E725A7;font-weight:900;letter-spacing:-.9px;">25% <span style="font-size:13px;line-height:17px;color:#111A3A;letter-spacing:0;">OFF</span></div>
                                            <div style="padding-top:1px;font-size:14px;line-height:15px;color:#66738F;">Next eligible order</div>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>

                              <td class="offer-right" valign="top" style="width:58%;padding-left:7px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="rounded-card" style="background:#F8FAFF;border:1px solid #DEE6F2;border-radius:16px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                                  <tr>
                                    <td style="padding:14px 15px;border-radius:16px;">
                                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                          <td valign="top" style="width:58%;">
                                            <div style="font-size:15px;line-height:13px;color:#66789A;font-weight:700;">Offer code</div>
                                            <div style="padding-top:4px;font-size:18px;line-height:22px;color:#111A3A;font-weight:900;letter-spacing:.2px;word-break:break-word;">${offerCode}</div>
                                          </td>
                                          <td valign="top" style="width:42%;padding-left:13px;border-left:1px solid #E5EAF3;">
                                            <div style="font-size:14px;line-height:13px;color:#66789A;font-weight:700;">Expires</div>
                                            <div style="padding-top:4px;font-size:14px;line-height:17px;color:#31415F;font-weight:700;">${formattedDate}</div>
                                          </td>
                                        </tr>
                                      </table>

                                      <div style="margin-top:10px;padding:8px 10px;background:#EEF5FF;border-radius:9px;color:#41618A;font-size:15px;line-height:15px;">
                                        Ready to use on your private offer page.
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td align="center" style="padding-top:12px;">
                          <a href="${ctaUrl}" target="_blank" style="display:block;text-decoration:none;">
                            <img
                              src="${cleanBaseUrl}/email/cloutflow-email-cta-25off-compact.png"
                              width="250"
                              alt="Use My 25% Off — Open your private CloutFlow offer"
                              class="cta-image"
                              style="display:block;width:320px;max-width:58%;height:auto;border:0;margin:0 auto;outline:none;text-decoration:none;"
                            />
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-top:13px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;">
                            <tr>
                              <td align="center" style="width:33.33%;padding:0 6px;">
                                <img src="${cleanBaseUrl}/email/email-icon-fast.png" width="24" height="24" alt="Instant Access" style="display:block;width:35px;height:35px;border:0;border-radius:8px;margin:0 auto;" />
                                <div style="padding-top:5px;font-size:14px;line-height:14px;color:#111A3A;font-weight:800;">Instant Access</div>
                                <div style="padding-top:1px;font-size:13.5px;line-height:13px;color:#66738F;">Use right away</div>
                              </td>
                              <td align="center" style="width:33.33%;padding:0 6px;border-left:1px solid #E4E9F2;border-right:1px solid #E4E9F2;">
                                <img src="${cleanBaseUrl}/email/email-icon-secure.png" width="24" height="24" alt="Safe & Secure" style="display:block;width:35px;height:35px;border:0;border-radius:8px;margin:0 auto;" />
                                <div style="padding-top:5px;font-size:14px;line-height:14px;color:#111A3A;font-weight:800;">Safe & Secure</div>
                                <div style="padding-top:1px;font-size:13.5px;line-height:13px;color:#66738F;">Your data is protected</div>
                              </td>
                              <td align="center" style="width:33.33%;padding:0 6px;">
                                <img src="${cleanBaseUrl}/email/email-icon-status.png" width="24" height="24" alt="Ready to use" style="display:block;width:35px;height:35px;border:0;border-radius:8px;margin:0 auto;" />
                                <div style="padding-top:5px;font-size:14px;line-height:14px;color:#111A3A;font-weight:800;">Ready to Use</div>
                                <div style="padding-top:1px;font-size:13.5px;line-height:13px;color:#66738F;">When you’re ready</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer matched to the approved payment email -->
                <tr>
                  <td class="footer-pad" style="padding:16px 22px 10px;background:#F8FAFD;border-top:1px solid #E5EAF3;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="footer-main-table" style="border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td class="footer-left" valign="middle" style="width:44%;padding-right:20px;border-right:1px solid #DDE4EF;">
                          <img src="${cleanBaseUrl}/cloutflow-header-logo.png" width="155" alt="CloutFlow" class="footer-logo" style="display:block;width:155px;max-width:100%;height:auto;border:0;" />
                          <div style="padding-top:6px;font-size:15px;line-height:20px;color:#60708C;">Social Growth, Simplified.</div>
                        </td>

                        <td class="footer-right" valign="middle" style="width:56%;padding-left:20px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;">
                            <tr>
                              <td align="center" class="footer-social-cell" style="padding:0 8px;">
                                <img src="${cleanBaseUrl}/email/email-network-instagram.png" width="24" height="24" alt="Instagram" style="display:block;width:35px;height:35px;border:0;border-radius:9px;margin:0 auto;" />
                                <div class="footer-social-label" style="font-size:15px;line-height:17px;color:#60708C;padding-top:5px;">Instagram</div>
                              </td>
                              <td align="center" class="footer-social-cell" style="padding:0 8px;">
                                <img src="${cleanBaseUrl}/email/email-network-tiktok.png" width="24" height="24" alt="TikTok" style="display:block;width:35px;height:35px;border:0;border-radius:9px;margin:0 auto;" />
                                <div class="footer-social-label" style="font-size:15px;line-height:17px;color:#60708C;padding-top:5px;">TikTok</div>
                              </td>
                              <td align="center" class="footer-social-cell" style="padding:0 8px;">
                                <img src="${cleanBaseUrl}/email/email-network-x.png" width="24" height="24" alt="X" style="display:block;width:35px;height:35px;border:0;border-radius:9px;margin:0 auto;" />
                                <div class="footer-social-label" style="font-size:15px;line-height:17px;color:#60708C;padding-top:5px;">X</div>
                              </td>
                              <td align="center" class="footer-social-cell" style="padding:0 8px;">
                                <img src="${cleanBaseUrl}/email/email-network-youtube.png" width="24" height="24" alt="YouTube" style="display:block;width:35px;height:35px;border:0;border-radius:9px;margin:0 auto;" />
                                <div class="footer-social-label" style="font-size:15px;line-height:17px;color:#60708C;padding-top:5px;">YouTube</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:11px;border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td align="center" class="footer-tagline" style="font-size:15px;line-height:20px;color:#667690;padding-bottom:5px;">
                          Grow Your Presence. Unlock New Opportunities.
                        </td>
                      </tr>
                      <tr>
                        <td align="center" class="footer-copy" style="font-size:13px;line-height:18px;color:#7A89A2;">
                          © 2026 CloutFlow. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td align="center" class="footer-copy" style="padding-top:8px;font-size:12px;line-height:17px;color:#8A97AD;">
                          <a href="${unsubscribeUrl}" style="color:#66738F;text-decoration:underline;">Unsubscribe</a> from marketing communication.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Full-bleed footer artwork: no padding, no surrounding white box -->
                <tr>
                  <td style="padding:0;margin:0;line-height:0;background:#FFFFFF;border-radius:0 0 18px 18px;overflow:hidden;">
                    <img
                      src="${cleanBaseUrl}/email/cloutflow-email-footer-wave.png"
                      width="1500"
                      alt=""
                      style="display:block;width:100%;max-width:100%;height:auto;border:0;margin:0;padding:0;line-height:0;"
                    />
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>

        <!--[if (gte mso 9)|(IE)]>
          </td></tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

export function getCartRecoveryTemplate(stepNumber: number, data: CartRecoveryTemplateData): { subject: string; html: string } {
  const unsubscribeUrl = buildUnsubscribeUrl(data.customerEmail);

  switch (stepNumber) {
    case 1:
      return {
        subject: "You left something behind",
        html: `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>CloutFlow — Abandoned Cart Step 1</title>
<style>
body,table,td,a,p,div,span{font-family:Aptos,"Segoe UI","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
html,body{margin:0;padding:0;background:#F5F7FB}
table{border-collapse:collapse;border-spacing:0}
img{border:0;outline:none;text-decoration:none;display:block}
a{text-decoration:none}
.hero-mobile{display:none!important;max-height:0!important;overflow:hidden!important;mso-hide:all!important}

</style>


<style>
@media only screen and (max-width:620px){

  html,body{
    margin:0!important;
    padding:0!important;
    width:100%!important;
    max-width:100%!important;
    overflow-x:hidden!important;
    background:#F5F7FB!important;
  }

  .outer{padding:6px!important}

  .email{
    width:100%!important;
    max-width:375px!important;
    margin:0 auto!important;
    table-layout:fixed!important;
  }

  .hero-desktop{
    display:none!important;
    max-height:0!important;
    overflow:hidden!important;
  }

  .hero-mobile{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    max-height:none!important;
    overflow:visible!important;
  }

  .hero-mobile img{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    height:auto!important;
    margin:0!important;
  }

  /* TOP STRIP */
  .feature-cell{
    width:33.333%!important;
    padding:6px 2px!important;
    box-sizing:border-box!important;
    vertical-align:middle!important;
  }

  .feature-cell > table{
    width:100%!important;
    table-layout:fixed!important;
  }

  .feature-cell > table td:first-child{
    width:15px!important;
    min-width:15px!important;
    max-width:15px!important;
    padding:0 3px 0 0!important;
    vertical-align:middle!important;
  }

  .feature-cell > table td:last-child{
    width:auto!important;
    padding:0!important;
    vertical-align:middle!important;
    text-align:left!important;
    overflow:hidden!important;
  }

  .feature-icon{
    display:block!important;
    width:14px!important;
    height:14px!important;
    margin:0 auto!important;
  }

  .feature-title{
    display:block!important;
    font-size:9.5px!important;
    line-height:10.5px!important;
    font-weight:800!important;
    white-space:nowrap!important;
    overflow:hidden!important;
  }

  .feature-subtitle{
    display:block!important;
    font-size:8.7px!important;
    line-height:10px!important;
    white-space:normal!important;
    overflow:hidden!important;
    max-height:20px!important;
  }

  /* MAIN BODY — USE THE WIDTH, KEEP EVEN SIDE GUTTERS */
  .main{
    padding:12px 8px 14px!important;
    box-sizing:border-box!important;
  }

  .main-layout{
    width:100%!important;
    table-layout:fixed!important;
  }

  .main-layout > tbody > tr{
    display:block!important;
    width:100%!important;
  }

  .left,.right{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    box-sizing:border-box!important;
    padding:0!important;
    margin:0 auto!important;
  }

  .headline{
    width:100%!important;
    margin:0!important;
    padding:0!important;
    font-size:22px!important;
    line-height:26px!important;
    letter-spacing:-.3px!important;
    white-space:normal!important;
    overflow-wrap:break-word!important;
    text-align:left!important;
  }

  .copy{
    width:100%!important;
    margin:8px 0 0!important;
    font-size:13.5px!important;
    line-height:19px!important;
    text-align:left!important;
  }

  .left > table[style*="margin-top:17px"]{
    width:100%!important;
    margin:14px auto 0!important;
    table-layout:fixed!important;
  }

  .left > table[style*="margin-top:17px"] td:first-child{
    width:42px!important;
    min-width:42px!important;
    max-width:42px!important;
    padding:5px 6px 5px 0!important;
    text-align:center!important;
    vertical-align:middle!important;
  }

  .left > table[style*="margin-top:17px"] td:first-child svg{
    display:block!important;
    width:35px!important;
    height:35px!important;
    margin:0 auto!important;
  }

  .left > table[style*="margin-top:17px"] td:last-child{
    width:auto!important;
    padding:5px 0!important;
    text-align:left!important;
    vertical-align:middle!important;
  }

  .left > table[style*="margin-top:17px"] td:last-child div:first-child{
    font-size:13.5px!important;
    line-height:17px!important;
    font-weight:800!important;
  }

  .left > table[style*="margin-top:17px"] td:last-child div:last-child{
    font-size:12.5px!important;
    line-height:16px!important;
  }

  .callout{
    display:none!important;
    height:0!important;
    max-height:0!important;
    margin:0!important;
    padding:0!important;
    overflow:hidden!important;
  }

  .right{
    padding-top:5px!important;
    text-align:center!important;
  }

  .clockwrap{
    width:185px!important;
    max-width:56%!important;
    margin:0 auto!important;
  }

  .clockwrap svg{
    display:block!important;
    width:100%!important;
    height:auto!important;
    margin:0 auto!important;
  }

  /* CTA — ITS OWN FULL-WIDTH ROW */
  .cta-final{
    display:block!important;
    width:238px!important;
    max-width:72%!important;
    margin:10px auto 0!important;
    box-sizing:border-box!important;
    border-radius:13px!important;
  }

  .cta-final > table{
    width:100%!important;
    table-layout:fixed!important;
  }

  .cta-final > table > tbody > tr > td:first-child{
    width:auto!important;
    padding:8px 4px 8px 13px!important;
    text-align:left!important;
    vertical-align:middle!important;
  }

  .cta-final > table > tbody > tr > td:last-child{
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;
    padding:4px 6px 4px 0!important;
    text-align:center!important;
    vertical-align:middle!important;
    box-sizing:border-box!important;
  }

  .cta-final > table > tbody > tr > td:last-child span{
    display:block!important;
    width:34px!important;
    height:34px!important;
    line-height:32px!important;
    margin:0 auto!important;
    box-sizing:border-box!important;
    font-size:22px!important;
  }

  .cta-final div[style*="font-size:15.5px"]{
    font-size:14px!important;
    line-height:16px!important;
    white-space:nowrap!important;
  }

  .cta-final div[style*="font-size:10px"]{
    font-size:11.5px!important;
    line-height:11px!important;
    white-space:nowrap!important;
  }

  /* FOOTER */
  .footer-left,.footer-right{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    box-sizing:border-box!important;
    text-align:center!important;
  }

  .footer-left{
    padding:0 0 12px!important;
    border-right:0!important;
    border-bottom:1px solid #DDE4EF!important;
  }

  .footer-right{padding:12px 0 0!important}

  .footer-logo{
    width:135px!important;
    height:auto!important;
    margin:0 auto!important;
  }

  .footer-right > table{
    width:100%!important;
    table-layout:fixed!important;
  }

  .footer-right > table td{
    width:25%!important;
    padding:0 2px!important;
    text-align:center!important;
  }

  .footer-right img{
    width:28px!important;
    height:28px!important;
    margin:0 auto!important;
  }

  .social-label{
    font-size:10px!important;
    line-height:12px!important;
    white-space:nowrap!important;
  }
}
</style>

<style>
@media only screen and (max-width:620px){
  .mobile-hide-benefits{
    display:none!important;
    max-height:0!important;
    height:0!important;
    overflow:hidden!important;
    mso-hide:all!important;
  }
}
</style>


<style>
@media only screen and (max-width:620px){
  .cta-final{
    margin-top:12px!important;
    margin-bottom:17px!important;
  }
}
</style>


<style>
@media only screen and (min-width:621px){
  .email{width:600px!important;max-width:600px!important}
  .hero-desktop{
    display:block!important;
    width:600px!important;
    max-width:600px!important;
    margin:0!important;
    padding:0!important;
    overflow:hidden!important;
  }
  .hero-desktop img{
    display:block!important;
    width:600px!important;
    max-width:600px!important;
    height:auto!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
  }
}
</style>


<style>
@media only screen and (min-width:621px){
  .email{
    width:600px!important;
    max-width:600px!important;
    min-width:600px!important;
    table-layout:fixed!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }

  .desktop-hero-cell{
    width:600px!important;
    max-width:600px!important;
    min-width:600px!important;
    padding:0!important;
    margin:0!important;
    line-height:0!important;
    overflow:hidden!important;
  }

  .hero-desktop{
    display:block!important;
    width:600px!important;
    max-width:600px!important;
    min-width:600px!important;
    padding:0!important;
    margin:0!important;
    line-height:0!important;
    overflow:hidden!important;
  }

  .hero-desktop img{
    display:block!important;
    width:600px!important;
    max-width:600px!important;
    min-width:600px!important;
    height:auto!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
  }

  .desktop-benefits-table{
    width:600px!important;
    max-width:600px!important;
    table-layout:fixed!important;
  }

  .desktop-benefits-table > tbody > tr > .feature-cell{
    width:200px!important;
    max-width:200px!important;
    box-sizing:border-box!important;
  }
}
</style>


<style>
@media only screen and (min-width:621px){
  .desktop-benefits-table{
    width:600px!important;
    max-width:600px!important;
    table-layout:fixed!important;
  }

  .desktop-benefits-table > tbody > tr > .feature-cell{
    width:200px!important;
    max-width:200px!important;
    padding:8px 7px!important;
    box-sizing:border-box!important;
    vertical-align:middle!important;
    overflow:hidden!important;
  }

  .desktop-benefits-table > tbody > tr > .feature-cell > table{
    width:100%!important;
    table-layout:fixed!important;
  }

  .desktop-benefits-table > tbody > tr > .feature-cell > table td:first-child{
    width:38px!important;
    min-width:38px!important;
    max-width:38px!important;
    padding:0!important;
    vertical-align:middle!important;
  }

  .desktop-benefits-table > tbody > tr > .feature-cell > table td:last-child{
    width:auto!important;
    padding-left:6px!important;
    overflow:hidden!important;
    vertical-align:middle!important;
  }

  .desktop-benefits-table .feature-title{
    font-size:13.5px!important;
    line-height:15px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
  }

  .desktop-benefits-table .feature-subtitle{
    font-size:12.5px!important;
    line-height:14px!important;
    white-space:normal!important;
    overflow:hidden!important;
    max-height:28px!important;
  }
}
</style>

</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FB">
<tr><td align="center" class="outer" style="padding:12px 0 20px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email" style="width:600px;max-width:600px;margin:0 auto;background:#FFF">

<tr>
<td class="desktop-hero-cell" style="padding:0;line-height:0;border-radius:18px 18px 0 0;overflow:hidden;background:#FFF">
<div class="hero-desktop" style="display:block;width:100%;max-width:600px;margin:0;padding:0;line-height:0;font-size:0;overflow:hidden"><img src="https://cloutflow.co/email/cloutflow-payment-hero-desktop.png" width="600" alt="CloutFlow" style="display:block;width:100%;max-width:600px;height:auto;margin:0;padding:0;border:0;line-height:0"></div>
<div class="hero-mobile"><img src="https://cloutflow.co/email/cloutflow-payment-hero-mobile.png" width="620" alt="CloutFlow"></div>
</td>
</tr>

<tr>
<td class="mobile-hide-benefits" style="background:#F8F6FF;border-left:1px solid #E1E6F2;border-right:1px solid #E1E6F2">
<table role="presentation" width="100%" class="desktop-benefits-table">
<tr>
<td class="feature-cell" style="width:33.33%;padding:9px 10px;border-right:1px solid #E1E3F1"><table role="presentation"><tr><td style="width:38px"><img src="https://cloutflow.co/email/email-icon-fast.png" width="35" height="35" class="feature-icon" alt=""></td><td style="padding-left:7px"><div class="feature-title" style="font-size:14.5px;line-height:15px;color:#111A3A;font-weight:800;white-space:nowrap">More Reach</div><div class="feature-subtitle" style="font-size:13.5px;line-height:14px;color:#66738F;white-space:nowrap">Expand Your Audience</div></td></tr></table></td>
<td class="feature-cell" style="width:33.33%;padding:9px 10px;border-right:1px solid #E1E3F1"><table role="presentation"><tr><td style="width:38px"><img src="https://cloutflow.co/email/email-icon-quantity.png" width="35" height="35" class="feature-icon" alt=""></td><td style="padding-left:7px"><div class="feature-title" style="font-size:14.5px;line-height:15px;color:#111A3A;font-weight:800;white-space:nowrap">More Engagement</div><div class="feature-subtitle" style="font-size:13.5px;line-height:14px;color:#66738F;white-space:nowrap">Build Real Connections</div></td></tr></table></td>
<td class="feature-cell" style="width:33.33%;padding:9px 10px"><table role="presentation"><tr><td style="width:38px"><img src="https://cloutflow.co/email/email-icon-people.png" width="35" height="35" class="feature-icon" alt=""></td><td style="padding-left:7px"><div class="feature-title" style="font-size:14.5px;line-height:15px;color:#111A3A;font-weight:800;white-space:nowrap">More Opportunities</div><div class="feature-subtitle" style="font-size:13.5px;line-height:14px;color:#66738F;white-space:nowrap">Turn Growth Into Results</div></td></tr></table></td>
</tr>
</table>
</td>
</tr>

<tr>
<td class="main" style="padding:14px 24px 18px;background:#FFF;border-left:1px solid #E1E6F2;border-right:1px solid #E1E6F2">
<table role="presentation" width="100%" class="main-layout">
<tr>
<td class="left" valign="top" style="width:54%;padding-right:12px">

<div class="headline" style="padding-top:0;font-size:25px;line-height:30px;letter-spacing:-.45px;color:#111A3A;font-weight:900">You left something <span style="color:#E725A7">behind</span></div>

<p class="copy" style="margin:10px 0 0;color:#617291;font-size:15px;line-height:20px">You started checking out, but your order wasn’t completed. Your CloutFlow checkout is still saved and ready when you are.</p>

<table role="presentation" width="100%" style="margin-top:17px">
<tr><td style="width:35px;padding:5px 10px 5px 0;vertical-align:middle">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="35" height="35" style="display:block;width:35px;height:35px">
  <rect x=".5" y=".5" width="35" height="35" rx="11" fill="#FBF8FF" stroke="#E8E2F5"/>
  <path d="M13 18v-3.1C13 10.7 15.8 8 20 8s7 2.7 7 6.9V18" fill="none" stroke="#7540F2" stroke-width="3" stroke-linecap="round"/>
  <rect x="11" y="17" width="18" height="15" rx="4.5" fill="#7540F2"/>
  <circle cx="20" cy="24.5" r="2" fill="#FFF"/>
</svg></td><td style="padding:5px 0"><div style="font-size:13.5px;line-height:17px;color:#111A3A;font-weight:800">Secure checkout</div><div style="font-size:13.5px;line-height:17px;color:#6B7B98">Your information is always protected</div></td></tr>
<tr><td style="width:35px;padding:5px 10px 5px 0;vertical-align:middle">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="35" height="35" style="display:block;width:35px;height:35px">
  <rect x=".5" y=".5" width="35" height="35" rx="11" fill="#F5F9FF" stroke="#E3ECF7"/>
  <path d="M22.5 6 11.5 22.5H19L17.5 34 28.7 18.5H21L22.5 6Z" fill="#168BFF"/>
</svg></td><td style="padding:5px 0"><div style="font-size:13.5px;line-height:17px;color:#111A3A;font-weight:800">Takes only a moment</div><div style="font-size:13.5px;line-height:17px;color:#6B7B98">Complete your order in seconds</div></td></tr>
<tr><td style="width:35px;padding:5px 10px 5px 0;vertical-align:middle">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="35" height="35" style="display:block;width:35px;height:35px">
  <rect x=".5" y=".5" width="35" height="35" rx="11" fill="#FBF8FF" stroke="#E8E2F5"/>
  <path d="M29 13v8h-8" fill="none" stroke="#7540F2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M28 20a10 10 0 1 0 1.2 8.6" fill="none" stroke="#7540F2" stroke-width="3" stroke-linecap="round"/>
</svg></td><td style="padding:5px 0"><div style="font-size:13.5px;line-height:17px;color:#111A3A;font-weight:800">Continue where you left off</div><div style="font-size:13.5px;line-height:17px;color:#6B7B98">Your items are saved and waiting</div></td></tr>
</table>

</td>

<td class="right" valign="middle" align="center" style="width:46%">
<div class="callout" style="font-size:16px;line-height:19px;color:#20318B;font-weight:900;font-style:italic;padding-bottom:0">Just a moment<br>and you're back!</div>
<div class="clockwrap" style="width:248px;max-width:100%;margin:0 auto">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 320" width="100%" height="auto" aria-label="Stopwatch">
  <defs>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#19A9FF"/>
      <stop offset=".48" stop-color="#5C43FF"/>
      <stop offset="1" stop-color="#F22ACF"/>
    </linearGradient>
    <linearGradient id="hand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2C8CFF"/>
      <stop offset="1" stop-color="#F229C8"/>
    </linearGradient>
    <radialGradient id="halo" cx=".55" cy=".55" r=".55">
      <stop offset="0" stop-color="#E6E0FF" stop-opacity=".72"/>
      <stop offset=".56" stop-color="#F7E9FD" stop-opacity=".26"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="drop" x="-25%" y="-25%" width="150%" height="170%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#5C38D6" flood-opacity=".22"/>
    </filter>
  </defs>

  <!-- soft blending halo, no rectangular image edge -->
  <ellipse cx="225" cy="195" rx="125" ry="105" fill="url(#halo)"/>

  <!-- speed streaks -->
  <g opacity=".62">
    <rect x="3" y="144" width="135" height="8" rx="4" fill="#75C7FF"/>
    <rect x="0" y="166" width="155" height="8" rx="4" fill="#B878FF"/>
    <rect x="7" y="188" width="148" height="8" rx="4" fill="#F36FD9"/>
    <rect x="18" y="210" width="132" height="8" rx="4" fill="#7AB9FF"/>
    <rect x="28" y="232" width="118" height="8" rx="4" fill="#AF70FF"/>
  </g>

  <!-- crown -->
  <g transform="translate(208 31) rotate(7)">
    <rect width="74" height="29" rx="11" fill="url(#rim)"/>
    <rect x="10" y="7" width="54" height="6" rx="3" fill="#FFF" opacity=".36"/>
  </g>

  <!-- body -->
  <g filter="url(#drop)">
    <circle cx="220" cy="188" r="106" fill="url(#rim)"/>
    <circle cx="220" cy="188" r="90" fill="#FAF9FF" stroke="#D7D1FF" stroke-width="4"/>
    <circle cx="220" cy="188" r="78" fill="#FFFFFF"/>
  </g>

  <!-- ticks -->
  <g stroke="#C1BBEF" stroke-width="5" stroke-linecap="round">
    <line x1="220" y1="121" x2="220" y2="131"/>
    <line x1="254" y1="130" x2="248" y2="139"/>
    <line x1="278" y1="154" x2="269" y2="159"/>
    <line x1="287" y1="188" x2="277" y2="188"/>
    <line x1="278" y1="222" x2="269" y2="217"/>
    <line x1="254" y1="246" x2="248" y2="237"/>
    <line x1="220" y1="255" x2="220" y2="245"/>
    <line x1="186" y1="246" x2="192" y2="237"/>
    <line x1="162" y1="222" x2="171" y2="217"/>
    <line x1="153" y1="188" x2="163" y2="188"/>
    <line x1="162" y1="154" x2="171" y2="159"/>
    <line x1="186" y1="130" x2="192" y2="139"/>
  </g>

  <!-- hands -->
  <line x1="220" y1="188" x2="185" y2="160" stroke="#2D89FF" stroke-width="10" stroke-linecap="round"/>
  <line x1="220" y1="188" x2="263" y2="153" stroke="url(#hand)" stroke-width="10" stroke-linecap="round"/>
  <circle cx="220" cy="188" r="12" fill="url(#rim)" stroke="#5034DF" stroke-width="2"/>

  <!-- accents -->
  <g stroke="#7B38F6" stroke-width="6" stroke-linecap="round">
    <line x1="112" y1="85" x2="102" y2="69"/>
    <line x1="131" y1="79" x2="128" y2="58"/>
    <line x1="317" y1="249" x2="338" y2="258"/>
    <line x1="311" y1="270" x2="327" y2="286"/>
  </g>
</svg>
</div>
</td>
</tr>
</table>

<!-- CTA — final compact version, no outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding-top:35px;padding-bottom:17px">
  <a href="${data.returnUrl}" class="cta-final" style="display:inline-block;width:248px;max-width:52%;background:#6737F2;border:1px solid #5B30DB;border-radius:14px;box-shadow:0 5px 10px rgba(71,38,178,.22),inset 0 1px 0 rgba(255,255,255,.18);text-decoration:none">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="middle" style="padding:9px 8px 8px 16px;text-align:left">
          <div style="font-size:15.5px;line-height:17px;color:#FFFFFF;font-weight:900;white-space:nowrap">Return to Checkout</div>
          <div style="padding-top:2px;font-size:12px;line-height:12px;color:#EEE9FF;font-weight:600;white-space:nowrap">Continue your saved order</div>
        </td>
        <td width="50" align="center" valign="middle" style="width:50px;padding:5px 7px 5px 1px">
          <span style="display:inline-block;width:40px;height:40px;line-height:38px;text-align:center;background:#FFFFFF;border:1px solid #E5DFFC;border-radius:50%;box-shadow:0 3px 5px rgba(42,25,112,.22),inset 0 -1px 0 #E9E4F8;color:#6534F4;font-size:25px;font-weight:900;font-family:Arial,sans-serif">→</span>
        </td>
      </tr>
    </table>
  </a>
</td>
</tr>
</table>

</td>
</tr>

<tr>
<td style="padding:16px 22px 10px;background:#F8FAFD;border-top:1px solid #E5EAF3;border-left:1px solid #E1E6F2;border-right:1px solid #E1E6F2">
<table role="presentation" width="100%">
<tr>
<td class="footer-left" valign="middle" style="width:44%;padding-right:20px;border-right:1px solid #DDE4EF"><img src="https://cloutflow.co/cloutflow-header-logo.png" width="155" alt="CloutFlow" class="footer-logo" style="width:155px;max-width:100%;height:auto"><div style="padding-top:6px;font-size:15px;line-height:20px;color:#60708C">Social Growth, Simplified.</div></td>
<td class="footer-right" valign="middle" style="width:56%;padding-left:20px"><table role="presentation" width="100%"><tr>
<td align="center" style="padding:0 7px"><img src="https://cloutflow.co/email/email-network-instagram.png" width="35" height="35" alt="Instagram"><div class="social-label" style="padding-top:5px;font-size:15px;line-height:17px;color:#60708C">Instagram</div></td>
<td align="center" style="padding:0 7px"><img src="https://cloutflow.co/email/email-network-tiktok.png" width="35" height="35" alt="TikTok"><div class="social-label" style="padding-top:5px;font-size:15px;line-height:17px;color:#60708C">TikTok</div></td>
<td align="center" style="padding:0 7px"><img src="https://cloutflow.co/email/email-network-x.png" width="35" height="35" alt="X"><div class="social-label" style="padding-top:5px;font-size:15px;line-height:17px;color:#60708C">X</div></td>
<td align="center" style="padding:0 7px"><img src="https://cloutflow.co/email/email-network-youtube.png" width="35" height="35" alt="YouTube"><div class="social-label" style="padding-top:5px;font-size:15px;line-height:17px;color:#60708C">YouTube</div></td>
</tr></table></td>
</tr>
</table>

<table role="presentation" width="100%" style="margin-top:14px">
<tr><td align="center" style="font-size:13px;line-height:18px;color:#667690">Grow Your Presence. Unlock New Opportunities.</td></tr>
<tr><td align="center" style="padding-top:4px;font-size:12px;line-height:17px;color:#7A89A2">© 2026 CloutFlow. All rights reserved.</td></tr>
<tr><td align="center" style="padding-top:7px;font-size:11px;line-height:16px;color:#8A97AD"><a href="${unsubscribeUrl}" style="color:#66738F;text-decoration:underline">Unsubscribe</a> from marketing communication.</td></tr>
</table>
</td>
</tr>

<tr><td style="padding:0;line-height:0;background:#FFF"><img src="https://cloutflow.co/email/cloutflow-email-footer-wave.png" width="600" alt="" style="width:100%;height:auto"></td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`
      };

    case 2:
      return {
        subject: "Still thinking it over?",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111827;">Still thinking it over?</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">
              Your order is still pending. CloutFlow offers fast, reliable service to boost your presence.
              It only takes a few seconds to finish checking out.
            </p>
            <div style="margin: 30px 0;">
              <a href="${data.returnUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Complete Your Order
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
              CloutFlow<br/>
              <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a> from these reminders.
            </p>
          </div>
        `
      };

    case 3:
    default:
      return {
        subject: "Your CloutFlow checkout is still waiting",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111827;">Your CloutFlow checkout is still waiting</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">
              This is our final reminder about your pending order. 
              We've saved your progress, so you can easily pick up right where you left off.
            </p>
            <div style="margin: 30px 0;">
              <a href="${data.returnUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Finish Checkout
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
              CloutFlow<br/>
              <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a> from these reminders.
            </p>
          </div>
        `
      };
  }
}
