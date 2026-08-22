export interface EmailTemplateDefinition {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'support';
  defaultSubject: string;
  defaultBody: string;
  description: string;
}

export const CANONICAL_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    id: 'PAYMENT_RECEIVED',
    name: 'Payment received',
    category: 'transactional',
    defaultSubject: 'Payment received for order {order_id}',
    description: 'Sent when a payment is received and confirmed.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We have successfully received your payment for order <strong>{order_id}</strong>.</p>
<p>Plan details: <strong>{quantity} {service}</strong> for <strong>{target}</strong> on {platform}.</p>
<p>Our team is already preparing your delivery.</p>
<p>Best regards,<br/>CloutFlow Team</p>`
  },
  {
    id: 'ORDER_PROCESSING',
    name: 'Your order is being processed',
    category: 'transactional',
    defaultSubject: 'Your order {order_id} is being processed',
    description: 'Notifies the customer that fulfillment has started.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>Your order <strong>{order_id}</strong> is currently being processed and queued for delivery.</p>
<p>Target: <strong>{target}</strong><br/>Service: <strong>{quantity} {service}</strong></p>
<p>You can check status updates anytime directly through your tracking page.</p>
<p>Best regards,<br/>CloutFlow Team</p>`
  },
  {
    id: 'ORDER_DELIVERED',
    name: 'Your order has been delivered',
    category: 'transactional',
    defaultSubject: 'Your order {order_id} has been delivered!',
    description: 'Notifies customer of completed order delivery.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>Great news! Your order <strong>{order_id}</strong> ({quantity} {service} for {target}) has been fully completed.</p>
<p>Thank you for choosing CloutFlow to grow your social presence.</p>
<p>Best regards,<br/>CloutFlow Team</p>`
  },
  {
    id: 'CART_RECOVERY',
    name: 'Complete your order',
    category: 'marketing',
    defaultSubject: 'Complete your CloutFlow order for {target}',
    description: 'Cart recovery reminder for abandoned checkout.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We noticed you didn't finish checking out for <strong>{target}</strong> ({quantity} {service}).</p>
<p>Your items are safely waiting for you. Return to your checkout now to secure your growth boost.</p>
<p>Best regards,<br/>CloutFlow Team</p>`
  },
  {
    id: 'NEED_CORRECT_USERNAME',
    name: 'We need the correct profile username',
    category: 'support',
    defaultSubject: 'Action needed: Update username for order {order_id}',
    description: 'Requested when the provided username could not be located.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We tried to process your order <strong>{order_id}</strong>, but we were unable to find the profile <strong>{target}</strong> on {platform}.</p>
<p>Please reply to this email with your exact profile username so we can continue your delivery without delay.</p>
<p>Best regards,<br/>CloutFlow Support</p>`
  },
  {
    id: 'NEED_POST_LINK',
    name: 'We need your post/reel link',
    category: 'support',
    defaultSubject: 'Action needed: Post link required for order {order_id}',
    description: 'Requested when a post or reel URL is required for delivery.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>Your order <strong>{order_id}</strong> requires a valid post or reel link to start delivery.</p>
<p>Please reply to this email with the direct link to the post or reel you want boosted.</p>
<p>Best regards,<br/>CloutFlow Support</p>`
  },
  {
    id: 'PROFILE_PRIVATE',
    name: 'Please make your profile public',
    category: 'support',
    defaultSubject: 'Action needed: Profile is private for order {order_id}',
    description: 'Requested when customer account is locked/private.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We noticed that your account <strong>{target}</strong> is currently set to private.</p>
<p>To safely deliver your order <strong>{order_id}</strong>, please temporarily switch your account to public. Once public, reply to this email and we will resume immediately.</p>
<p>Best regards,<br/>CloutFlow Support</p>`
  },
  {
    id: 'DELIVERY_DELAY',
    name: 'Update about your order',
    category: 'support',
    defaultSubject: 'Update regarding your order {order_id}',
    description: 'Status update when delivery encounters a delay.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We are writing to give you a quick update regarding order <strong>{order_id}</strong>.</p>
<p>Our automated systems detected a small platform delay. Rest assured our team is monitoring your order closely and delivery is progressing.</p>
<p>Thank you for your patience,<br/>CloutFlow Support</p>`
  },
  {
    id: 'PARTIAL_DELIVERY',
    name: 'Update regarding your delivery',
    category: 'support',
    defaultSubject: 'Important update regarding your delivery ({order_id})',
    description: 'Notice regarding partial delivery or adjustments.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We wanted to update you on order <strong>{order_id}</strong>.</p>
<p>Part of your order has already been delivered to <strong>{target}</strong>. We are actively finalizing the remainder.</p>
<p>If you have any questions, feel free to reply directly to this email.</p>
<p>Best regards,<br/>CloutFlow Support</p>`
  },
  {
    id: 'SUPPORT_CUSTOM',
    name: 'Blank / Custom message',
    category: 'support',
    defaultSubject: 'Message regarding your CloutFlow account',
    description: 'Blank template for custom support communication.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>We are reaching out regarding your account.</p>
<p>Best regards,<br/>CloutFlow Support</p>`
  },
  {
    id: 'IMPROVE_YOUR_CONTENT',
    name: 'Improve your content engagement',
    category: 'support',
    defaultSubject: 'Tips to get maximum results with CloutFlow',
    description: 'Helpful tips for customer success.',
    defaultBody: `<p>Hello {customer_name},</p>
<p>Here are 3 tips to get the highest retention and engagement from your recent boost on <strong>{target}</strong>:</p>
<ol>
  <li>Post consistently during peak active hours.</li>
  <li>Use targeted reels and stories with clear calls to action.</li>
  <li>Engage with your comments within the first 30 minutes of posting.</li>
</ol>
<p>We are here to support your growth journey!</p>
<p>Best regards,<br/>CloutFlow Team</p>`
  }
];

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  if (!template) return '';
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const val = variables[key];
    if (val === undefined || val === null || val === '') {
      return '';
    }
    return String(val);
  });
}
