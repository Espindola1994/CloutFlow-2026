import { buildUnsubscribeUrl } from './unsubscribe.service';

interface CartRecoveryTemplateData {
  returnUrl: string;
  customerEmail: string;
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
