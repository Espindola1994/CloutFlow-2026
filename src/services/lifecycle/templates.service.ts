import { buildUnsubscribeUrl } from './unsubscribe.service';

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
    const expiresAt = new Date(expiresAtStr);
    formattedDate = expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cloutflow.co';
  const ctaUrl = `${baseUrl}?offer=${encodeURIComponent(offerCode)}`;

  return {
    subject: "Thanks for your order — here’s 25% off your next one",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="color: #111827; margin-bottom: 16px;">Your next boost is 25% off</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
          Thanks for choosing CloutFlow.
        </p>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          As a returning customer, you have <strong>25% off</strong> your next eligible order.
        </p>
        <div style="margin: 28px 0;">
          <a href="${ctaUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Use My 25% Off
          </a>
        </div>
        <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
          Offer code: <strong>${offerCode}</strong><br/>
          Offer expires: ${formattedDate}
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0 20px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          CloutFlow<br/>
          <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a> from marketing communication.
        </p>
      </div>
    `
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
