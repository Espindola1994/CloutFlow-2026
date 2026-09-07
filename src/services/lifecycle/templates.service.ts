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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111827;">You left something behind</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">
              We noticed you started checking out but didn't complete your order. 
              Your CloutFlow checkout is safely waiting for you.
            </p>
            <div style="margin: 30px 0;">
              <a href="${data.returnUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Return to Checkout
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
