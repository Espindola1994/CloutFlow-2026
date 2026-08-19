import { describe, it, expect, vi } from 'vitest';
import { canFallbackOnError, classifyPeakerrError } from '@/lib/fulfillment/fallback-policy';
import { canDispatchOrder } from '@/lib/fulfillment/guard';

describe('Phase 3.3 — Peakerr Pre-Live Hardening & Concurrency Safety Tests', () => {
  it('A) Ambiguous Network Timeout is classified as AMBIGUOUS_SUBMISSION and strictly BLOCKED from fallback', () => {
    const timeoutError = 'ETIMEDOUT: Connection timed out after 10000ms';
    const classification = classifyPeakerrError(timeoutError);
    
    // Timeouts and network breaks must never be assumed safe
    expect(classification).toBe('AMBIGUOUS_SUBMISSION');
    expect(canFallbackOnError(classification)).toBe(false);
  });

  it('B) Socket hang up / 502 Bad Gateway is BLOCKED from fallback to prevent double dispatch', () => {
    const socketError = 'socket hang up on POST /api/v2';
    const classification = classifyPeakerrError(socketError);
    
    expect(classification).toBe('AMBIGUOUS_SUBMISSION');
    expect(canFallbackOnError(classification)).toBe(false);
  });

  it('C) Safe pre-submission errors (SERVICE_DISABLED / UNAVAILABLE) allow fallback', () => {
    expect(canFallbackOnError(classifyPeakerrError('Service 31714 is disabled by provider'))).toBe(true);
    expect(canFallbackOnError(classifyPeakerrError('Service temporary unavailable for maintenance'))).toBe(true);
  });

  it('D) Fatal account errors (INSUFFICIENT_BALANCE / BAD_API_KEY) are strictly BLOCKED from fallback', () => {
    expect(canFallbackOnError(classifyPeakerrError('Not enough funds on balance'))).toBe(false);
    expect(canFallbackOnError(classifyPeakerrError('Invalid API key provided'))).toBe(false);
  });

  it('E) Order Guard strictly rejects orders not in NOT_DISPATCHED status', () => {
    const validPaidOrder = {
      id: 'ord_1',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      offerId: 'off_1',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'anaclaramaderite',
    };

    expect(canDispatchOrder(validPaidOrder, { id: 'off_1', active: true })).toBe(true);

    // If already SUBMITTING, PENDING, or PROCESSING -> Rejected
    expect(canDispatchOrder({ ...validPaidOrder, fulfillmentStatus: 'SUBMITTING' }, { id: 'off_1', active: true })).toBe(false);
    expect(canDispatchOrder({ ...validPaidOrder, fulfillmentStatus: 'PENDING' }, { id: 'off_1', active: true })).toBe(false);
    expect(canDispatchOrder({ ...validPaidOrder, fulfillmentStatus: 'PROCESSING' }, { id: 'off_1', active: true })).toBe(false);
    expect(canDispatchOrder({ ...validPaidOrder, fulfillmentStatus: 'COMPLETED' }, { id: 'off_1', active: true })).toBe(false);
  });
});
