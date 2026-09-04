import { getTransactionalEmailTransport } from './transport';

export async function sendOrderConfirmation(email: string, orderData: Record<string, unknown>) {
  const transport = getTransactionalEmailTransport(email, false);
  
  const result = await transport.send({
    to: email,
    subject: `Order Received: ${orderData.publicId}`,
    html: `
      <div>
        <h1>Thank you for your order!</h1>
        <p>We've received your order <strong>${orderData.publicId}</strong> and are awaiting payment confirmation.</p>
        <p>Track your order status anytime <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${orderData.publicId}">here</a>.</p>
      </div>
    `,
    category: 'transactional'
  });

  return result;
}

export async function sendPaymentConfirmation(email: string, orderData: Record<string, unknown>) {
  const transport = getTransactionalEmailTransport(email, false);

  const result = await transport.send({
    to: email,
    subject: `Payment Confirmed: ${orderData.publicId}`,
    html: `
      <div>
        <h1>Payment Successful!</h1>
        <p>Your payment for order <strong>${orderData.publicId}</strong> has been confirmed.</p>
        <p>We are now processing your order. This usually takes just a few minutes depending on the service.</p>
      </div>
    `,
    category: 'transactional'
  });

  return result;
}

