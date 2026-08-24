import { describe, it, expect } from 'vitest';
import { getEffectiveOfferStatus, isOfferActive, formatOfferDateTime } from '../offer-status';
import { getPostPurchaseOfferTemplate } from '@/services/lifecycle/templates.service';

describe('Canonical Offer Expiration & Status Derivation', () => {
  const baseTime = new Date('2026-08-23T20:30:00.000Z');

  it('A. 5-minute duration = ~300 seconds', () => {
    const validHours = 0.08333333333333333;
    const createdAt = baseTime;
    const expiresAt = new Date(createdAt.getTime() + validHours * 60 * 60 * 1000);
    const durationSeconds = (expiresAt.getTime() - createdAt.getTime()) / 1000;
    expect(Math.round(durationSeconds)).toBe(300);
  });

  it('B. before expiration => ACTIVE', () => {
    const expiresAt = new Date(baseTime.getTime() + 5 * 60 * 1000);
    const status = getEffectiveOfferStatus(
      { status: 'ACTIVE', expiresAt },
      new Date(baseTime.getTime() + 2 * 60 * 1000)
    );
    expect(status).toBe('ACTIVE');
    expect(isOfferActive({ status: 'ACTIVE', expiresAt }, new Date(baseTime.getTime() + 2 * 60 * 1000))).toBe(true);
  });

  it('C. exactly at expiration => EXPIRED', () => {
    const expiresAt = new Date(baseTime.getTime() + 5 * 60 * 1000);
    const status = getEffectiveOfferStatus(
      { status: 'ACTIVE', expiresAt },
      expiresAt
    );
    expect(status).toBe('EXPIRED');
    expect(isOfferActive({ status: 'ACTIVE', expiresAt }, expiresAt)).toBe(false);
  });

  it('D. after expiration => EXPIRED even if persisted status is ACTIVE', () => {
    const expiresAt = new Date(baseTime.getTime() + 5 * 60 * 1000);
    const status = getEffectiveOfferStatus(
      { status: 'ACTIVE', expiresAt },
      new Date(baseTime.getTime() + 6 * 60 * 1000)
    );
    expect(status).toBe('EXPIRED');
  });

  it('E. redeemed beats expired => REDEEMED', () => {
    const expiresAt = new Date(baseTime.getTime() - 10000); // in past
    const statusWithDate = getEffectiveOfferStatus({
      status: 'ACTIVE',
      expiresAt,
      redeemedAt: new Date(baseTime.getTime() - 20000)
    }, baseTime);
    expect(statusWithDate).toBe('REDEEMED');

    const statusWithStatus = getEffectiveOfferStatus({
      status: 'REDEEMED',
      expiresAt
    }, baseTime);
    expect(statusWithStatus).toBe('REDEEMED');
  });

  it('H. Admin/email timezone display represents same instant (America/Sao_Paulo UTC-03:00)', () => {
    // 2026-08-23T23:31:36.000Z is 20:31:36 in America/Sao_Paulo (UTC-03)
    const testInstant = new Date('2026-08-23T23:31:36.000Z');
    
    const adminDisplay = formatOfferDateTime(testInstant, { includeSeconds: true, style: 'admin' });
    const emailDisplay = formatOfferDateTime(testInstant, { style: 'email' });

    expect(adminDisplay).toContain('20:31:36 (UTC-03)');
    expect(emailDisplay).toContain('8:31 PM (UTC-03)');
    expect(emailDisplay).toContain('Aug 23');

    // Test template rendering with email style
    const template = getPostPurchaseOfferTemplate({
      offerCode: 'TEST25',
      expiresAt: testInstant.toISOString()
    }, { customerEmail: 'test@example.com' });

    expect(template.html).toContain('Offer expires: Aug 23, 8:31 PM (UTC-03)');
    expect(template.html).toContain('/offer/TEST25');
  });
});
