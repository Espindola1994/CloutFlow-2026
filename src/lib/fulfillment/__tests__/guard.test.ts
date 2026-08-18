import { describe, it, expect } from 'vitest';
import { canDispatchOrder } from '../guard';

describe('Fulfillment Guard - canDispatchOrder', () => {
  it('A) unmatched order (offerId=null, platform=null, quantity=0) -> canDispatch = false', () => {
    const order = {
      id: 'ord_123',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: null,
      platform: null,
      service: null,
      quantity: 0,
      socialUsername: null,
    };
    expect(canDispatchOrder(order)).toBe(false);
  });

  it('B) matched order but socialUsername is null -> canDispatch = false', () => {
    const order = {
      id: 'ord_124',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: 'off_abc',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: null,
    };
    expect(canDispatchOrder(order)).toBe(false);
  });

  it('C) matched order with username but payment is pending -> canDispatch = false', () => {
    const order = {
      id: 'ord_125',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: 'off_abc',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'test_user',
    };
    expect(canDispatchOrder(order)).toBe(false);
  });

  it('D) perfect matched order -> canDispatch = true', () => {
    const order = {
      id: 'ord_126',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: 'off_abc',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'test_user',
    };
    expect(canDispatchOrder(order)).toBe(true);
  });

  it('E) perfect matched order but offer is inactive -> canDispatch = false', () => {
    const order = {
      id: 'ord_126',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: 'off_abc',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'test_user',
    };
    const offer = {
      id: 'off_abc',
      active: false,
    };
    expect(canDispatchOrder(order, offer)).toBe(false);
  });
});
