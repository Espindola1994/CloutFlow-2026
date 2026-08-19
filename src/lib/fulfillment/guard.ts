export interface DispatchableOrder {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: string;
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
 * Rejects unmatched orders, inactive offers, or missing targets according to service type.
 */
export function canDispatchOrder(order: DispatchableOrder, offer?: DispatchableOffer | null): boolean {
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return false;
  }

  // PENDING is strictly rejected as per Phase 2.8D rules; must be exactly NOT_DISPATCHED
  if (order.fulfillmentStatus !== 'NOT_DISPATCHED') {
    return false;
  }

  if (!order.offerId) {
    return false;
  }

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
