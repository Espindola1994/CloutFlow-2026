import crypto from 'crypto';

export type PerfectPayNormalizedStatus =
  | 'pre_checkout'
  | 'pending'
  | 'approved'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'authorized'
  | 'charged_back'
  | 'chargeback'
  | 'completed'
  | 'checkout_error'
  | 'expired'
  | 'in_review'
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
  rawStatusDetail?: string;
  normalizedStatus: PerfectPayNormalizedStatus;
  productId?: string;
  productName?: string;
  planId?: string;
  planName?: string;
  planQuantity?: number;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerCountry?: string;
  customerState?: string;
  customerCity?: string;
  customerZipCode?: string;
  amountCents?: number;
  currency?: string;
  paymentMethod?: string;
  paymentMethodEnum?: number;
  paymentTypeEnum?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmPerfect?: string;
  src?: string;
  sck?: string;
  checkoutReference?: string;
  rawToken?: string;
  dateCreated?: string;
  dateApproved?: string;
  metadataSafe: Record<string, unknown>;
}

/**
 * Parses and normalizes incoming PerfectPay webhook payloads according to the
 * official PerfectPay Postback Contract, with defensive fallbacks for legacy aliases.
 */
export function normalizePerfectPayPayload(body: Record<string, unknown>): PerfectPayParsedEvent {
  // 0. Extract Token
  const rawToken = String(
    body.token ||
    body.public_token ||
    body.webhook_token ||
    body.api_token ||
    ''
  ).trim() || undefined;

  // 1. Extract Official Product and Plan nested objects
  const product = (typeof body.product === 'object' && body.product !== null ? body.product : {}) as Record<string, unknown>;
  const plan = (typeof body.plan === 'object' && body.plan !== null ? body.plan : {}) as Record<string, unknown>;
  const customer = (typeof body.customer === 'object' && body.customer !== null ? body.customer : {}) as Record<string, unknown>;
  const metadata = (typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}) as Record<string, unknown>;

  // 2. Extract Sale/Order ID (Official: `code`, Fallbacks: `sale_code`, `order_id`, `transaction_id`)
  const externalOrderId = String(
    body.code ||
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
    body.code ||
    ''
  ).trim() || undefined;

  // 3. Product & Plan IDs (Official: `product.code`, `plan.code`, Fallbacks: `product_id`, `plan_id`)
  const productId = String(
    product.code ||
    body.product_id ||
    body.product_code ||
    body.productId ||
    ''
  ).trim() || undefined;

  const productName = String(product.name || body.product_name || '').trim() || undefined;

  const planId = String(
    plan.code ||
    body.plan_id ||
    body.plan_code ||
    body.planId ||
    body.offer_id ||
    ''
  ).trim() || undefined;

  const planName = String(plan.name || body.plan_name || '').trim() || undefined;
  const planQuantity = plan.quantity !== undefined ? Number(plan.quantity) : undefined;

  // 4. Status Mapping via Official `sale_status_enum` or raw text fallback
  const saleStatusEnum = body.sale_status_enum !== undefined ? Number(body.sale_status_enum) : undefined;
  const saleStatusDetail = body.sale_status_detail ? String(body.sale_status_detail).trim() : undefined;
  const rawStatus = saleStatusDetail || String(body.status || body.sale_status || body.event || body.type || (saleStatusEnum !== undefined ? saleStatusEnum : '')).toLowerCase().trim();
  const rawEventType = String(body.event_type || body.event || body.type || 'webhook').toLowerCase().trim();

  let normalizedStatus: PerfectPayNormalizedStatus = 'unknown';

  if (saleStatusEnum !== undefined) {
    switch (saleStatusEnum) {
      case 1:
        normalizedStatus = 'pending';
        break;
      case 2:
        normalizedStatus = 'approved';
        break;
      case 3:
        normalizedStatus = 'in_process';
        break;
      case 4:
        normalizedStatus = 'in_mediation';
        break;
      case 5:
        normalizedStatus = 'rejected';
        break;
      case 6:
        normalizedStatus = 'cancelled';
        break;
      case 7:
        normalizedStatus = 'refunded';
        break;
      case 8:
        normalizedStatus = 'authorized';
        break;
      case 9:
        normalizedStatus = 'charged_back';
        break;
      case 10:
        normalizedStatus = 'completed';
        break;
      case 11:
        normalizedStatus = 'checkout_error';
        break;
      case 12:
        normalizedStatus = 'pre_checkout';
        break;
      case 13:
        normalizedStatus = 'expired';
        break;
      case 16:
        normalizedStatus = 'in_review';
        break;
      default:
        normalizedStatus = 'unknown';
    }
  } else {
    // Textual fallback
    if (
      rawStatus.includes('pre_checkout') ||
      rawStatus.includes('init_checkout') ||
      rawStatus.includes('abandonment') ||
      rawStatus.includes('abandono') ||
      rawEventType.includes('pre_checkout') ||
      rawEventType.includes('abandonment')
    ) {
      normalizedStatus = 'pre_checkout';
    } else if (rawStatus.includes('approved') || rawStatus.includes('aprovado') || rawStatus.includes('paid')) {
      normalizedStatus = 'approved';
    } else if (rawStatus.includes('completed') || rawStatus.includes('complete') || rawStatus.includes('completo')) {
      normalizedStatus = 'completed';
    } else if (rawStatus.includes('disputa') || rawStatus.includes('mediation')) {
      normalizedStatus = 'in_mediation';
    } else if (rawStatus.includes('chargeback') || rawStatus.includes('charge_back')) {
      normalizedStatus = 'charged_back';
    } else if (rawStatus.includes('refunded') || rawStatus.includes('devolvido')) {
      normalizedStatus = 'refunded';
    } else if (rawStatus.includes('refused') || rawStatus.includes('rejected') || rawStatus.includes('rejeitado')) {
      normalizedStatus = 'rejected';
    } else if (rawStatus.includes('cancelled') || rawStatus.includes('cancelado') || rawStatus.includes('expired')) {
      normalizedStatus = 'cancelled';
    } else if (rawStatus.includes('waiting') || rawStatus.includes('pending') || rawStatus.includes('pendente')) {
      normalizedStatus = 'pending';
    } else if (rawStatus.includes('error') || rawStatus.includes('fail')) {
      normalizedStatus = 'checkout_error';
    }
  }

  // 5. Extract Customer Data (Official: `customer.full_name`, `customer.email`, `customer.phone_area_code`, `customer.phone_number`)
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

  const areaCode = String(customer.phone_area_code || '').trim();
  const phoneNum = String(customer.phone_number || body.customer_phone || body.phone || '').trim();
  const customerPhone = (areaCode && phoneNum ? `${areaCode}${phoneNum}` : phoneNum || areaCode) || undefined;

  const customerCountry = String(customer.country || body.country || '').trim() || undefined;
  const customerState = String(customer.state || body.state || '').trim() || undefined;
  const customerCity = String(customer.city || body.city || '').trim() || undefined;
  const customerZipCode = String(customer.zip_code || body.zip_code || '').trim() || undefined;

  // 6. Extract Monetary Values (`sale_amount` as Decimal string or number -> converted safely to integer cents)
  let amountCents: number | undefined;
  const rawSaleAmount = body.sale_amount !== undefined ? body.sale_amount : body.amount;
  if (body.amount_cents !== undefined) {
    amountCents = Number(body.amount_cents);
  } else if (rawSaleAmount !== undefined) {
    const parsedNum = typeof rawSaleAmount === 'string' ? parseFloat(rawSaleAmount) : Number(rawSaleAmount);
    if (!isNaN(parsedNum)) {
      amountCents = Math.round(parsedNum * 100);
    }
  }

  const currency = String(body.currency_enum || body.currency || 'USD').toUpperCase();
  const paymentMethodEnum = body.payment_method_enum !== undefined ? Number(body.payment_method_enum) : undefined;
  const paymentTypeEnum = body.payment_type_enum !== undefined ? Number(body.payment_type_enum) : undefined;
  const paymentMethod = String(body.payment_method || body.paymentMethod || (paymentMethodEnum !== undefined ? `enum_${paymentMethodEnum}` : '')).toLowerCase() || undefined;

  // 7. Extract Attribution (Official: `metadata.src`, `metadata.utm_source`, etc., with fallbacks)
  const utmSource = String(metadata.utm_source || body.utm_source || metadata.src || body.src || '').trim() || undefined;
  const utmMedium = String(metadata.utm_medium || body.utm_medium || '').trim() || undefined;
  const utmCampaign = String(metadata.utm_campaign || body.utm_campaign || metadata.sck || body.sck || '').trim() || undefined;
  const utmContent = String(metadata.utm_content || body.utm_content || '').trim() || undefined;
  const utmTerm = String(metadata.utm_term || body.utm_term || '').trim() || undefined;
  const utmPerfect = String(metadata.utm_perfect || body.utm_perfect || '').trim() || undefined;
  const src = String(metadata.src || body.src || '').trim() || undefined;
  const sck = String(metadata.sck || body.sck || '').trim() || undefined;
  const checkoutReference = String(metadata.src || body.checkout_reference || body.custom_id || body.metadata_ref || '').trim() || undefined;

  // 8. Timestamps
  const dateCreated = body.date_created ? String(body.date_created).trim() : undefined;
  const dateApproved = body.date_approved ? String(body.date_approved).trim() : undefined;

  // 9. Build Sanitized Metadata (Strict stripping of token, password, cards, CVV, secrets, identification_number)
  const metadataSafe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const lower = key.toLowerCase();
    if (
      !lower.includes('token') &&
      !lower.includes('secret') &&
      !lower.includes('password') &&
      !lower.includes('auth') &&
      !lower.includes('authorization') &&
      !lower.includes('card_number') &&
      !lower.includes('cardnumber') &&
      !lower.includes('cvv') &&
      !lower.includes('api_key') &&
      !lower.includes('apikey') &&
      !lower.includes('identification_number')
    ) {
      metadataSafe[key] = value;
    }
  }

  // 10. External Event ID (Official contract has no independent event ID -> null)
  const rawEventId = String(body.event_id || body.id || '').trim();
  const externalEventId = rawEventId ? rawEventId : null;

  // 11. Deterministic Server-Side Deduplication Fingerprint based on stable official fields
  // Composed of: provider + code + sale_status_enum/rawStatus + product.code + plan.code + amountCents
  const fingerprintRaw = [
    'perfectpay',
    externalOrderId || 'no_code',
    saleStatusEnum !== undefined ? saleStatusEnum.toString() : rawStatus || 'no_status',
    productId || 'no_prod',
    planId || 'no_plan',
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
    rawStatusDetail: saleStatusDetail,
    normalizedStatus,
    productId,
    productName,
    planId,
    planName,
    planQuantity,
    customerEmail,
    customerName,
    customerPhone,
    customerCountry,
    customerState,
    customerCity,
    customerZipCode,
    amountCents,
    currency,
    paymentMethod,
    paymentMethodEnum,
    paymentTypeEnum,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    utmPerfect,
    src,
    sck,
    checkoutReference,
    rawToken,
    dateCreated,
    dateApproved,
    metadataSafe,
  };
}
