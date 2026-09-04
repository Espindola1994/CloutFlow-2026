export interface DispatchableOrder {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  canonicalOfferId?: string | null;
  offerId?: string | null;
  platform?: string | null;
  service?: string | null;
  quantity?: number | null;
  socialUsername?: string | null;
  targetUrl?: string | null;
}

export interface DispatchableOffer {
  id: string;
  active: boolean;
}

/**
 * Strict fail-safe gate to determine if an order is eligible for provider fulfillment.
 * Rejects PENDING fulfillment status.
 * Rejects unmatched orders, inactive physical offers (when present), or missing targets according to service type.
 * Ausência de physical override NÃO pode ser motivo isolado para bloqueio se canonical identity / platform / service forem válidos.
 */
export function canDispatchOrder(order: DispatchableOrder, offer?: DispatchableOffer | null): boolean {
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return false;
  }

  // PENDING is strictly rejected as per Phase 2.8D rules; must be exactly NOT_DISPATCHED
  if (order.fulfillmentStatus !== 'NOT_DISPATCHED') {
    return false;
  }

  // Must have either canonicalOfferId or physical offerId (or both)
  if (!order.canonicalOfferId && !order.offerId) {
    return false;
  }

  // If a physical offer override is provided, it must be active
  if (offer && !offer.active) {
    return false;
  }

  if (!order.platform || !order.service) {
    return false;
  }

  if (!order.quantity || order.quantity <= 0) {
    return false;
  }

  const s = order.service.toLowerCase();

  // Target validation by service type
  if (s === 'followers') {
    return Boolean(order.socialUsername && order.socialUsername.trim().length > 0);
  }

  if (s === 'likes' || s === 'views' || s === 'comments') {
    return Boolean(order.targetUrl && order.targetUrl.trim().length > 0);
  }

  return false;
}
