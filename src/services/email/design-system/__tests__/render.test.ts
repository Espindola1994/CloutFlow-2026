import { describe, it, expect } from 'vitest';
import { renderCloutFlowEmail } from '../render';

describe('CloutFlow Email Design System - renderCloutFlowEmail', () => {
  // 1. render transactional básico
  it('1. should render basic transactional email', () => {
    const result = renderCloutFlowEmail({
      category: 'transactional',
      title: 'Order Confirmed',
      bodyText: 'We have received your order and processing has begun.',
    });

    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
    expect(result.html).toContain('Order Confirmed');
    expect(result.html).toContain('We have received your order and processing has begun.');
    expect(result.text).toContain('Order Confirmed');
  });

  // 2. HTML contém CLOUTFLOW
  it('2. should contain CLOUTFLOW in HTML', () => {
    const result = renderCloutFlowEmail({
      title: 'Welcome',
      bodyText: 'Welcome to CloutFlow.',
    });

    expect(result.html).toContain('CLOUTFLOW');
  });

  // 3. HTML contém Social Growth, Simplified.
  it('3. should contain Social Growth, Simplified. in HTML', () => {
    const result = renderCloutFlowEmail({
      title: 'Welcome',
      bodyText: 'Welcome to CloutFlow.',
    });

    expect(result.html).toContain('Social Growth, Simplified.');
  });

  // 4. text/plain é produzido
  it('4. should produce valid text/plain output', () => {
    const result = renderCloutFlowEmail({
      title: 'Status Update',
      customerName: 'Guilherme',
      bodyText: 'Your order is currently processing.',
    });

    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.text).toContain('CLOUTFLOW');
    expect(result.text).toContain('Social Growth, Simplified.');
    expect(result.text).toContain('Hello Guilherme,');
    expect(result.text).toContain('Your order is currently processing.');
  });

  // 5. Instagram badge
  it('5. should render Instagram badge correctly', () => {
    const result = renderCloutFlowEmail({
      title: 'Instagram Order',
      network: 'instagram',
      bodyText: 'Your Instagram order is ready.',
    });

    expect(result.html).toContain('Instagram');
    expect(result.text).toContain('[INSTAGRAM]');
  });

  // 6. TikTok badge
  it('6. should render TikTok badge correctly', () => {
    const result = renderCloutFlowEmail({
      title: 'TikTok Order',
      network: 'tiktok',
      bodyText: 'Your TikTok order is ready.',
    });

    expect(result.html).toContain('TikTok');
    expect(result.text).toContain('[TIKTOK]');
  });

  // 7. X badge
  it('7. should render X badge correctly', () => {
    const result = renderCloutFlowEmail({
      title: 'X Order',
      network: 'x',
      bodyText: 'Your X order is ready.',
    });

    expect(result.html).toContain('X');
    expect(result.text).toContain('[X]');
  });

  // 8. YouTube badge
  it('8. should render YouTube badge correctly', () => {
    const result = renderCloutFlowEmail({
      title: 'YouTube Order',
      network: 'youtube',
      bodyText: 'Your YouTube order is ready.',
    });

    expect(result.html).toContain('YouTube');
    expect(result.text).toContain('[YOUTUBE]');
  });

  // 9. nenhuma ocorrência de YouTube Subscribers
  it('9. should NEVER contain YouTube Subscribers in catalog or copy', () => {
    const result = renderCloutFlowEmail({
      title: 'YouTube Order',
      network: 'youtube',
      bodyText: 'Your order is active.',
      order: {
        network: 'youtube',
        service: 'Views',
        quantity: 1000,
      },
    });

    expect(result.html).not.toContain('YouTube Subscribers');
    expect(result.text).not.toContain('YouTube Subscribers');
    expect(result.html).not.toMatch(/subscribers/i);
    expect(result.text).not.toMatch(/subscribers/i);
  });

  // 10. order summary completo
  it('10. should render complete order summary when provided', () => {
    const result = renderCloutFlowEmail({
      title: 'Order Confirmed',
      order: {
        publicId: 'CF-1194S63WJM',
        network: 'instagram',
        service: 'Followers',
        quantity: 2000,
        target: '@username',
        status: 'Payment confirmed',
      },
      bodyText: 'Thank you for your purchase.',
    });

    expect(result.html).toContain('Order Details');
    expect(result.html).toContain('CF-1194S63WJM');
    expect(result.html).toContain('Instagram');
    expect(result.html).toContain('Followers');
    expect(result.html).toContain('2,000');
    expect(result.html).toContain('@username');
    expect(result.html).toContain('Payment confirmed');

    expect(result.text).toContain('ORDER DETAILS');
    expect(result.text).toContain('Order ID: CF-1194S63WJM');
    expect(result.text).toContain('Network: Instagram');
    expect(result.text).toContain('Service: Followers');
    expect(result.text).toContain('Quantity: 2,000');
    expect(result.text).toContain('Target: @username');
    expect(result.text).toContain('Status: Payment confirmed');
  });

  // 11. campos opcionais ausentes são omitidos
  it('11. should omit optional rows when fields are missing', () => {
    const result = renderCloutFlowEmail({
      title: 'Order Updated',
      order: {
        publicId: 'CF-999',
        // target, quantity, status, service not provided
      },
    });

    expect(result.html).toContain('Order ID');
    expect(result.html).toContain('CF-999');
    expect(result.html).not.toContain('Target');
    expect(result.html).not.toContain('Quantity');
    expect(result.html).not.toContain('Status');
    expect(result.html).not.toContain('Service');

    expect(result.text).toContain('Order ID: CF-999');
    expect(result.text).not.toContain('Target:');
    expect(result.text).not.toContain('Quantity:');
  });

  // 12. não existe "undefined"
  it('12. should NEVER contain the string "undefined" anywhere in output', () => {
    const result = renderCloutFlowEmail({
      title: 'Notification',
      category: undefined,
      network: undefined,
      preheader: undefined,
      eyebrow: undefined,
      customerName: undefined,
      bodyText: undefined,
      body: undefined,
      order: undefined,
      cta: undefined,
      unsubscribeUrl: undefined,
      footerText: undefined,
    });

    expect(result.html).not.toContain('undefined');
    expect(result.text).not.toContain('undefined');
  });

  // 13. não existe "null"
  it('13. should NEVER contain the string "null" anywhere in output', () => {
    const result = renderCloutFlowEmail({
      title: 'Notification',
      network: null,
      customerName: undefined,
      order: undefined,
    });

    expect(result.html).not.toContain('null');
    expect(result.text).not.toContain('null');
  });

  // 14. não existe "Hello ,"
  it('14. should NEVER render "Hello ," when customerName is missing or empty', () => {
    const result = renderCloutFlowEmail({
      title: 'Notification',
      customerName: '',
      bodyText: 'We have an update for you.',
    });

    expect(result.html).not.toContain('Hello ,');
    expect(result.html).not.toContain('Hello');
    expect(result.text).not.toContain('Hello ,');
    expect(result.text).not.toContain('Hello');
  });

  // 15. não existe "()"
  it('15. should NEVER render empty parentheses "()"', () => {
    const result = renderCloutFlowEmail({
      title: 'Clean View',
      bodyText: 'Testing clean view without empty parens.',
    });

    expect(result.html).not.toContain('()');
    expect(result.text).not.toContain('()');
  });

  // 16. CTA aparece quando válido
  it('16. should render CTA button when label and URL are valid', () => {
    const result = renderCloutFlowEmail({
      title: 'Action Required',
      cta: {
        label: 'Track Order',
        url: 'https://cloutflow.co/track/CF-119',
      },
    });

    expect(result.html).toContain('Track Order');
    expect(result.html).toContain('https://cloutflow.co/track/CF-119');
    expect(result.text).toContain('Track Order:');
    expect(result.text).toContain('https://cloutflow.co/track/CF-119');
  });

  // 17. CTA é omitido quando incompleto
  it('17. should omit CTA when label or URL is missing or empty', () => {
    const resultNoUrl = renderCloutFlowEmail({
      title: 'No URL',
      cta: {
        label: 'Click Here',
        url: '',
      },
    });

    expect(resultNoUrl.html).not.toContain('Click Here');
    expect(resultNoUrl.text).not.toContain('Click Here');

    const resultNoLabel = renderCloutFlowEmail({
      title: 'No Label',
      cta: {
        label: '',
        url: 'https://cloutflow.co/custom-link-not-in-footer',
      },
    });

    expect(resultNoLabel.html).not.toContain('https://cloutflow.co/custom-link-not-in-footer');
  });

  // 18. marketing mostra unsubscribe quando URL fornecida
  it('18. should show unsubscribe link in marketing emails when URL is provided', () => {
    const result = renderCloutFlowEmail({
      category: 'marketing',
      title: 'Special Promotion',
      unsubscribeUrl: 'https://cloutflow.co/unsubscribe?token=xyz123',
    });

    expect(result.html).toContain('Unsubscribe');
    expect(result.html).toContain('https://cloutflow.co/unsubscribe?token=xyz123');
    expect(result.text).toContain('Unsubscribe: https://cloutflow.co/unsubscribe?token=xyz123');
  });

  // 19. transactional não mostra unsubscribe automaticamente
  it('19. should NOT show unsubscribe link in transactional emails even if url is omitted or present', () => {
    const result = renderCloutFlowEmail({
      category: 'transactional',
      title: 'Receipt',
      bodyText: 'Your receipt for payment.',
    });

    expect(result.html).not.toContain('Unsubscribe');
    expect(result.text).not.toContain('Unsubscribe');
  });

  // 20. support não mostra unsubscribe automaticamente
  it('20. should NOT show unsubscribe link in support emails', () => {
    const result = renderCloutFlowEmail({
      category: 'support',
      title: 'Support Response',
      bodyText: 'Here is an answer to your question.',
      supportReplyNotice: true,
    });

    expect(result.html).not.toContain('Unsubscribe');
    expect(result.text).not.toContain('Unsubscribe');
    expect(result.html).toContain('Need help? Simply reply directly to this email.');
    expect(result.text).toContain('Need help? Simply reply directly to this email.');
  });

  // 21. preheader existe
  it('21. should include hidden preheader when preheader option is provided', () => {
    const result = renderCloutFlowEmail({
      title: 'Order Status',
      preheader: 'Your order has been confirmed and is now processing.',
      bodyText: 'Details inside.',
    });

    expect(result.html).toContain('Your order has been confirmed and is now processing.');
    expect(result.html).toContain('mso-hide:all');
    expect(result.html).toContain('display:none');
  });

  // 22. caracteres especiais são escapados
  it('22. should escape special HTML characters safely in dynamic fields', () => {
    const result = renderCloutFlowEmail({
      title: 'Alert <script>alert("xss")</script> & More',
      customerName: 'Guilherme & "Friends" <test>',
      bodyText: 'Check out this <b>bold</b> claim & offer.',
      cta: {
        label: 'Click & Go >',
        url: 'https://cloutflow.co/test?a=1&b=2',
      },
      order: {
        target: '@user&<tag>',
      },
    });

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
    expect(result.html).toContain('Guilherme &amp; &quot;Friends&quot; &lt;test&gt;');
    expect(result.html).toContain('&lt;b&gt;bold&lt;/b&gt; claim &amp; offer.');
    expect(result.html).toContain('Click &amp; Go &gt;');
    expect(result.html).toContain('https://cloutflow.co/test?a=1&amp;b=2');
    expect(result.html).toContain('@user&amp;&lt;tag&gt;');
  });

  // 23. versão text não contém tags HTML
  it('23. should ensure text/plain contains no HTML tags', () => {
    const result = renderCloutFlowEmail({
      title: 'Clean Text Test',
      bodyText: 'Line 1\n\nLine 2',
      cta: {
        label: 'View Order',
        url: 'https://cloutflow.co/order',
      },
      order: {
        publicId: 'CF-12345',
        network: 'tiktok',
        service: 'Likes',
        quantity: 500,
        status: 'In Progress',
      },
      supportReplyNotice: true,
    });

    expect(result.text).not.toMatch(/<[^>]+>/);
  });

  // 24. render mínimo sem order funciona
  it('24. should render minimal email without order or cta', () => {
    const result = renderCloutFlowEmail({
      title: 'Minimal Message',
      bodyText: 'Just a short note.',
    });

    expect(result.html).toBeDefined();
    expect(result.text).toBeDefined();
    expect(result.html).toContain('Minimal Message');
    expect(result.html).toContain('Just a short note.');
    expect(result.html).not.toContain('Order Details');
    expect(result.text).not.toContain('ORDER DETAILS');
  });

  // 25. mobile-safe 600px/container existe
  it('25. should feature mobile-safe 600px container and Outlook conditionals', () => {
    const result = renderCloutFlowEmail({
      title: 'Responsive Design',
      bodyText: 'Mobile responsive verification.',
    });

    expect(result.html).toContain('max-width: 600px');
    expect(result.html).toContain('width="600"');
    expect(result.html).toContain('<!--[if (gte mso 9)|(IE)]>');
    expect(result.html).toContain('@media only screen and (max-width: 620px)');
  });

  // 26. Phase 2B.2 Premium Visual Elements Verification
  it('26. should render Phase 2B.2 Premium visual elements: logo, headline, badges, what happens next, and social footer', () => {
    const result = renderCloutFlowEmail({
      category: 'transactional',
      eyebrow: 'PAYMENT CONFIRMED',
      title: "We've received your order",
      preheader: 'Your payment was successfully received.',
      customerName: 'Alex',
      bodyText: 'Thank you for choosing CloutFlow. Your payment has been approved and your order is being prepared for delivery.',
      order: {
        publicId: 'CF-PREMIUM-101',
        network: 'instagram',
        service: 'Followers',
        quantity: 1000,
        target: '@alex_growth',
        status: 'Payment confirmed',
      },
      supportReplyNotice: true,
    });

    // 1. Logo, Hero Assets & Branding
    expect(result.html).toContain('https://cloutflow.co/email/cloutflow-payment-hero-desktop.png');
    expect(result.html).toContain('https://cloutflow.co/email/cloutflow-payment-hero-mobile.png');
    expect(result.html).toContain('CLOUTFLOW');
    expect(result.html).toContain('Social Growth, Simplified.');

    // 2. PAYMENT CONFIRMED badge
    expect(result.html).toContain('PAYMENT CONFIRMED');
    expect(result.text).toContain('PAYMENT CONFIRMED');

    // 3. Premium Hero alt text and text plain headline
    expect(result.html).toContain('Real People. Real Results. Growth Made Simple.');
    expect(result.text).toContain('Real People. Real Results.');
    expect(result.text).toContain('Growth Made Simple.');
    expect(result.text).toContain('More Reach');
    expect(result.text).toContain('More Engagement');
    expect(result.text).toContain('More Opportunities');

    // 4. Order Details
    expect(result.html).toContain('Order Details');
    expect(result.html).toContain('CF-PREMIUM-101');
    expect(result.html).toContain('Instagram');
    expect(result.html).toContain('Followers');
    expect(result.html).toContain('1,000');
    expect(result.html).toContain('@alex_growth');

    // 5. What happens next
    expect(result.html).toContain('What happens next?');
    expect(result.html).toContain('Our team is now preparing your order.');
    expect(result.html).toContain('delivery is completed.');
    expect(result.text).toContain('What happens next?');

    // 6. Support section
    expect(result.html).toContain('Need help?');
    expect(result.html).toContain('Simply reply directly to this email. Our support team will be happy to assist you.');
    expect(result.text).toContain('Need help?');

    // 7. Footer & Socials (Instagram, TikTok, X, YouTube)
    expect(result.html).toContain('Grow Your Presence. Unlock New Opportunities.');
    expect(result.html).toContain('Instagram');
    expect(result.html).toContain('TikTok');
    expect(result.html).toContain('X');
    expect(result.html).toContain('YouTube');
    expect(result.html).toContain('cloutflow.co');
    expect(result.html).toContain('&copy; 2026 CloutFlow. All rights reserved.');
    expect(result.text).toContain('© 2026 CloutFlow. All rights reserved.');

    // 8. Mobile responsive media query & classes
    expect(result.html).toContain('@media only screen and (max-width: 620px)');
    expect(result.html).toContain('email-container');
    expect(result.html).toContain('order-details-table');

    // 9. Absence of unrendered placeholders
    expect(result.html).not.toContain('undefined');
    expect(result.html).not.toContain('null');
    expect(result.html).not.toContain('()');
    expect(result.text).not.toContain('undefined');
    expect(result.text).not.toContain('null');
    expect(result.text).not.toContain('()');

    // 10. No fake CTAs or URLs
    expect(result.html).not.toContain('/track/');
    expect(result.text).not.toContain('/track/');

    // 11. No YouTube Subscribers in copy
    expect(result.html).not.toContain('YouTube Subscribers');
    expect(result.text).not.toContain('YouTube Subscribers');
  });
});
