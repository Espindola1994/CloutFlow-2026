export interface DispatchableOrder {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  offerId?: string | null;
  platform?: string | null;
  service?: string | null;
  quantity?: number | null;
  socialUsername?: string | null;
}

export interface DispatchableOffer {
  id: string;
  active: boolean;
}

/**
 * Strict fail-safe gate to determine if an order is eligible for provider fulfillment.
 * An unmatched order or an order without verified socialUsername can NEVER be dispatched.
 */
export function canDispatchOrder(order: DispatchableOrder, offer?: DispatchableOffer | null): boolean {
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
    return false;
  }

  if (order.fulfillmentStatus !== 'NOT_DISPATCHED' && order.fulfillmentStatus !== 'PENDING') {
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

  if (!order.socialUsername || order.socialUsername.trim().length === 0) {
    return false;
  }

  return true;
}
