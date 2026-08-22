import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeHtml, extractTextSnippet } from '@/lib/email/sanitize';
import { isEmailInAllowlist, isMarketingSendAllowedForRecipient } from '@/integrations/email/transport';
import { interpolateTemplate, CANONICAL_EMAIL_TEMPLATES } from '@/services/crm/templates';

describe('Requirement W: Inbound & Outbound HTML Sanitization', () => {
  it('strips malicious script tags from HTML body', () => {
    const malicious = '<p>Hello support</p><script>alert("xss")</script><b>Order query</b>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert("xss")');
    expect(clean).toContain('<p>Hello support</p>');
    expect(clean).toContain('<b>Order query</b>');
  });

  it('strips onload/onerror event handlers and javascript: URIs', () => {
    const malicious = '<img src="x" onerror="alert(1)" /><a href="javascript:alert(2)">Click</a>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('javascript:');
  });

  it('extracts clean text snippets without HTML markup', () => {
    const html = '<div><h2>Order Update</h2><p>Your order is ready.</p></div>';
    const snippet = extractTextSnippet(html);
    expect(snippet).toBe('Order Update Your order is ready.');
  });
});

describe('Requirement D & E: Allowlist Controlled Lifecycle Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('Requirement D: allows sending to allowlisted email when LIFECYCLE_EMAILS_ENABLED=false', () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = 'test@example.com, developer@cloutflow.com';

    expect(isEmailInAllowlist('test@example.com')).toBe(true);
    expect(isEmailInAllowlist('TEST@EXAMPLE.COM')).toBe(true);
    expect(isEmailInAllowlist('DEVELOPER@CLOUTFLOW.COM')).toBe(true);
    expect(isMarketingSendAllowedForRecipient('test@example.com')).toBe(true);
  });

  it('Requirement E: blocks sending to non-allowlisted email when LIFECYCLE_EMAILS_ENABLED=false', () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.LIFECYCLE_EMAIL_ALLOWLIST = 'test@example.com';

    expect(isEmailInAllowlist('randomcustomer@gmail.com')).toBe(false);
    expect(isMarketingSendAllowedForRecipient('randomcustomer@gmail.com')).toBe(false);
  });
});

describe('Requirement O & P: Template Interpolation and Category Rules', () => {
  it('correctly interpolates customer name, target, and order ID', () => {
    const template = 'Hello {customer_name}, order {order_id} for {target} on {platform} is {status}';
    const result = interpolateTemplate(template, {
      customer_name: 'Guilherme',
      order_id: 'CF-1001',
      target: 'myhandle',
      platform: 'instagram',
      status: 'confirmed',
    });
    expect(result).toBe('Hello Guilherme, order CF-1001 for myhandle on instagram is confirmed');
  });

  it('has all canonical templates defined with appropriate categories', () => {
    const payment = CANONICAL_EMAIL_TEMPLATES.find((t) => t.id === 'PAYMENT_RECEIVED');
    const orderDelivered = CANONICAL_EMAIL_TEMPLATES.find((t) => t.id === 'ORDER_DELIVERED');
    const needUsername = CANONICAL_EMAIL_TEMPLATES.find((t) => t.id === 'NEED_CORRECT_USERNAME');
    const recovery = CANONICAL_EMAIL_TEMPLATES.find((t) => t.id === 'CART_RECOVERY');

    expect(payment?.category).toBe('transactional');
    expect(orderDelivered?.category).toBe('transactional');
    expect(needUsername?.category).toBe('support');
    expect(recovery?.category).toBe('marketing');
  });
});
