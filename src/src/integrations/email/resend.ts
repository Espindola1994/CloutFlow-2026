import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@instahub.com';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOrderConfirmation(email: string, orderData: Record<string, unknown>) {
  if (!resend) {
    console.log(`[Email Mock] Order confirmation sent to ${email} for order ${orderData.publicId}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: `Instahub <${fromEmail}>`,
      to: email,
      subject: `Order Received: ${orderData.publicId}`,
      html: `
        <div>
          <h1>Thank you for your order!</h1>
          <p>We've received your order <strong>${orderData.publicId}</strong> and are awaiting payment confirmation.</p>
          <p>Track your order status anytime <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${orderData.publicId}">here</a>.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendPaymentConfirmation(email: string, orderData: Record<string, unknown>) {
  if (!resend) {
    console.log(`[Email Mock] Payment confirmation sent to ${email} for order ${orderData.publicId}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: `Instahub <${fromEmail}>`,
      to: email,
      subject: `Payment Confirmed: ${orderData.publicId}`,
      html: `
        <div>
          <h1>Payment Successful!</h1>
          <p>Your payment for order <strong>${orderData.publicId}</strong> has been confirmed.</p>
          <p>We are now processing your order. This usually takes just a few minutes depending on the service.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    return { success: false, error };
  }
}
