import crypto from 'crypto';

export type PerfectPayNormalizedStatus =
  | 'pre_checkout'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'chargeback'
  | 'completed'
  | 'checkout_error'
  | 'unknown';

export interface PerfectPayRawPayload {
  [key: string]: unknown;
}

export interface PerfectPayParsedEvent {
  externalEventId: string | null;
  deduplicationKey: string;
  externalOrderId?: string;
  externalPaymentId?: string;
  rawEventType?: string;
  rawStatus?: string;
  normalizedStatus: PerfectPayNormalizedStatus;
  productId?: string;
  planId?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  amountCents?: number;
  currency?: string;
  paymentMethod?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  src?: string;
  sck?: string;
  checkoutReference?: string;
  metadataSafe: Record<string, unknown>;
}

/**
 * Defensively parses and normalizes incoming PerfectPay webhook payloads.
 * Computes deterministic deduplicationKey when externalEventId is absent.
 */
export function normalizePerfectPayPayload(body: Record<string, unknown>): PerfectPayParsedEvent {
  // 1. Extract raw identifiers
  const rawStatus = String(
    body.status ||
    body.sale_status ||
    body.event ||
    body.type ||
    ''
  ).toLowerCase().trim();

  const rawEventType = String(body.event_type || body.event || body.type || 'webhook').toLowerCase().trim();

  // 2. Map raw status to standardized CloutFlow status
  let normalizedStatus: PerfectPayNormalizedStatus = 'unknown';

  if (
    rawStatus.includes('pre_checkout') ||
    rawStatus.includes('init_checkout') ||
    rawStatus.includes('abandonment') ||
    rawEventType.includes('pre_checkout') ||
    rawEventType.includes('abandonment')
  ) {
    normalizedStatus = 'pre_checkout';
  } else if (
    rawStatus.includes('approved') ||
    rawStatus.includes('paid') ||
    rawStatus === '1' ||
    rawStatus === 'approved'
  ) {
    normalizedStatus = 'approved';
  } else if (
    rawStatus.includes('completed') ||
    rawStatus.includes('complete')
  ) {
    normalizedStatus = 'completed';
  } else if (
    rawStatus.includes('waiting') ||
    rawStatus.includes('pending') ||
    rawStatus.includes('billet_printed') ||
    rawStatus.includes('pix_generated')
  ) {
    normalizedStatus = 'pending';
  } else if (
    rawStatus.includes('refused') ||
    rawStatus.includes('rejected') ||
    rawStatus.includes('denied')
  ) {
    normalizedStatus = 'rejected';
  } else if (
    rawStatus.includes('cancelled') ||
    rawStatus.includes('expired')
  ) {
    normalizedStatus = 'cancelled';
  } else if (
    rawStatus.includes('refunded') ||
    rawStatus.includes('returned')
  ) {
    normalizedStatus = 'refunded';
  } else if (
    rawStatus.includes('chargeback') ||
    rawStatus.includes('dispute')
  ) {
    normalizedStatus = 'chargeback';
  } else if (
    rawStatus.includes('error') ||
    rawStatus.includes('fail')
  ) {
    normalizedStatus = 'checkout_error';
  }

  // 3. Extract Customer Data
  const customer = (body.customer || {}) as Record<string, unknown>;
  const customerEmail = String(
    customer.email ||
    body.customer_email ||
    body.email ||
    ''
  ).trim() || undefined;

  const customerName = String(
    customer.full_name ||
    customer.name ||
    body.customer_name ||
    body.name ||
    ''
  ).trim() || undefined;

  const customerPhone = String(
    customer.phone_number ||
    customer.phone ||
    body.customer_phone ||
    body.phone ||
    ''
  ).trim() || undefined;

  // 4. Extract Product & Plan
  const productId = String(
    body.product_id ||
    body.product_code ||
    body.productId ||
    ''
  ).trim() || undefined;

  const planId = String(
    body.plan_id ||
    body.plan_code ||
    body.planId ||
    body.offer_id ||
    ''
  ).trim() || undefined;

  // 5. Transaction IDs
  const externalOrderId = String(
    body.sale_code ||
    body.order_id ||
    body.orderId ||
    body.transaction_id ||
    ''
  ).trim() || undefined;

  const externalPaymentId = String(
    body.payment_id ||
    body.transaction_id ||
    body.tid ||
    ''
  ).trim() || undefined;

  const rawEventId = String(
    body.event_id ||
    body.id ||
    ''
  ).trim();

  const externalEventId = rawEventId ? rawEventId : null;

  // 6. Monetary values
  let amountCents: number | undefined;
  if (body.amount_cents !== undefined) {
    amountCents = Number(body.amount_cents);
  } else if (body.sale_amount !== undefined) {
    amountCents = Math.round(Number(body.sale_amount) * 100);
  } else if (body.amount !== undefined) {
    const rawVal = Number(body.amount);
    amountCents = rawVal > 1000 ? Math.round(rawVal) : Math.round(rawVal * 100);
  }

  const currency = String(body.currency || 'USD').toUpperCase();
  const paymentMethod = String(body.payment_method || body.paymentMethod || '').toLowerCase() || undefined;

  // 7. Attribution & Custom references
  const utmSource = String(body.utm_source || body.src || '').trim() || undefined;
  const utmMedium = String(body.utm_medium || '').trim() || undefined;
  const utmCampaign = String(body.utm_campaign || body.sck || '').trim() || undefined;
  const utmContent = String(body.utm_content || '').trim() || undefined;
  const utmTerm = String(body.utm_term || '').trim() || undefined;
  const src = String(body.src || '').trim() || undefined;
  const sck = String(body.sck || '').trim() || undefined;
  const checkoutReference = String(body.checkout_reference || body.custom_id || body.metadata_ref || '').trim() || undefined;

  // 8. Build Sanitized Metadata
  const metadataSafe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const lower = key.toLowerCase();
    if (
      !lower.includes('secret') &&
      !lower.includes('token') &&
      !lower.includes('card_number') &&
      !lower.includes('cvv') &&
      !lower.includes('password') &&
      !lower.includes('auth') &&
      !lower.includes('authorization')
    ) {
      metadataSafe[key] = value;
    }
  }

  // 9. Deterministic Server-Side Deduplication Fingerprint
  // Composed of: provider + order/sale_code + rawStatus + paymentId + productId + amountCents
  const fingerprintRaw = [
    'perfectpay',
    externalOrderId || 'no_order',
    rawStatus || 'no_status',
    externalPaymentId || 'no_payment',
    productId || 'no_prod',
    amountCents !== undefined ? amountCents.toString() : 'no_amt',
  ].join('|');

  const deduplicationKey = crypto.createHash('sha256').update(fingerprintRaw).digest('hex');

  return {
    externalEventId,
    deduplicationKey,
    externalOrderId,
    externalPaymentId,
    rawEventType,
    rawStatus,
    normalizedStatus,
    productId,
    planId,
    customerEmail,
    customerName,
    customerPhone,
    amountCents,
    currency,
    paymentMethod,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    src,
    sck,
    checkoutReference,
    metadataSafe,
  };
}
