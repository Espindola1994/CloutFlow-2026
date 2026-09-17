import { describe, it, expect } from 'vitest';
import { getEffectiveOfferStatus, isOfferActive, formatOfferDateTime, formatOfferCountdown, formatOfferExpirationClock } from '../offer-status';
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

    expect(template.html).toContain(emailDisplay);
    expect(template.html).toContain('/offer/TEST25');
  });

  describe('formatOfferCountdown - US Natural Format for Countdown Badge', () => {
    it('>= 24 hours: formats as {days} day/days + {hours} hr/hrs', () => {
      // 28 hours = 28 * 3600 * 1000 ms -> "1 day 4 hrs"
      const ms28h = 28 * 3600 * 1000;
      expect(formatOfferCountdown(ms28h)).toBe('1 day 4 hrs');

      // 49 hours = 49 * 3600 * 1000 ms -> "2 days 1 hr"
      const ms49h = 49 * 3600 * 1000;
      expect(formatOfferCountdown(ms49h)).toBe('2 days 1 hr');

      // 72 hours + 8 hours = 3 days 8 hrs
      const ms80h = (3 * 24 + 8) * 3600 * 1000;
      expect(formatOfferCountdown(ms80h)).toBe('3 days 8 hrs');

      // Exactly 24 hours = 1 day 0 hrs
      const ms24h = 24 * 3600 * 1000;
      expect(formatOfferCountdown(ms24h)).toBe('1 day 0 hrs');

      // 48 hours = 2 days 0 hrs
      const ms48h = 48 * 3600 * 1000;
      expect(formatOfferCountdown(ms48h)).toBe('2 days 0 hrs');
    });

    it('< 24 hours and >= 1 hour: formats as {hours} hr/hrs + {minutes} min', () => {
      // 23h59m
      const ms23h59m = (23 * 3600 + 59 * 60) * 1000;
      expect(formatOfferCountdown(ms23h59m)).toBe('23 hrs 59 min');

      // 4h30m
      const ms4h30m = (4 * 3600 + 30 * 60) * 1000;
      expect(formatOfferCountdown(ms4h30m)).toBe('4 hrs 30 min');

      // 1h05m
      const ms1h5m = (1 * 3600 + 5 * 60) * 1000;
      expect(formatOfferCountdown(ms1h5m)).toBe('1 hr 5 min');

      // Exactly 1 hour = 1 hr 0 min
      const ms1h = 3600 * 1000;
      expect(formatOfferCountdown(ms1h)).toBe('1 hr 0 min');
    });

    it('< 1 hour and >= 1 minute: formats as {minutes} min + {seconds} sec', () => {
      // 59m32s
      const ms59m32s = (59 * 60 + 32) * 1000;
      expect(formatOfferCountdown(ms59m32s)).toBe('59 min 32 sec');

      // 15m08s
      const ms15m8s = (15 * 60 + 8) * 1000;
      expect(formatOfferCountdown(ms15m8s)).toBe('15 min 8 sec');

      // 1m05s
      const ms1m5s = (1 * 60 + 5) * 1000;
      expect(formatOfferCountdown(ms1m5s)).toBe('1 min 5 sec');

      // Exactly 1 minute = 1 min 0 sec
      const ms1m = 60 * 1000;
      expect(formatOfferCountdown(ms1m)).toBe('1 min 0 sec');
    });

    it('< 1 minute: formats as {seconds} sec', () => {
      // 45s
      const ms45s = 45 * 1000;
      expect(formatOfferCountdown(ms45s)).toBe('45 sec');

      // 1s
      const ms1s = 1000;
      expect(formatOfferCountdown(ms1s)).toBe('1 sec');

      // 0s
      expect(formatOfferCountdown(0)).toBe('0 sec');
    });

    it('handles negative or invalid values without crashing or negative numbers', () => {
      expect(formatOfferCountdown(-5000)).toBe('0 sec');
      expect(formatOfferCountdown(-1)).toBe('0 sec');
      expect(formatOfferCountdown(NaN)).toBe('0 sec');
    });

    it('validates unit boundary transitions without 60 min or 60 sec', () => {
      // Transition from 24h to 23h59m59s
      const ms24h = 24 * 3600 * 1000;
      expect(formatOfferCountdown(ms24h)).toBe('1 day 0 hrs');
      const ms23h59m59s = (23 * 3600 + 59 * 60 + 59) * 1000;
      expect(formatOfferCountdown(ms23h59m59s)).toBe('23 hrs 59 min');

      // Transition from 1h to 59m59s
      const ms1h = 3600 * 1000;
      expect(formatOfferCountdown(ms1h)).toBe('1 hr 0 min');
      const ms59m59s = (59 * 60 + 59) * 1000;
      expect(formatOfferCountdown(ms59m59s)).toBe('59 min 59 sec');

      // Transition from 1m to 59s
      const ms1m = 60 * 1000;
      expect(formatOfferCountdown(ms1m)).toBe('1 min 0 sec');
      const ms59s = 59 * 1000;
      expect(formatOfferCountdown(ms59s)).toBe('59 sec');
    });
  });

  describe('formatOfferExpirationClock - US 12h Format with AM/PM', () => {
    it('formats exact hours and minutes without seconds or date', () => {
      // 00:00 UTC -> 12:00 AM
      expect(formatOfferExpirationClock('2026-09-17T00:00:00.000Z', 'UTC')).toBe('12:00 AM');

      // 05:10 UTC -> 5:10 AM
      expect(formatOfferExpirationClock('2026-09-17T05:10:00.000Z', 'UTC')).toBe('5:10 AM');

      // 12:00 UTC -> 12:00 PM
      expect(formatOfferExpirationClock('2026-09-17T12:00:00.000Z', 'UTC')).toBe('12:00 PM');

      // 17:10 UTC -> 5:10 PM
      expect(formatOfferExpirationClock('2026-09-17T17:10:00.000Z', 'UTC')).toBe('5:10 PM');

      // 21:45 UTC -> 9:45 PM
      expect(formatOfferExpirationClock('2026-09-17T21:45:00.000Z', 'UTC')).toBe('9:45 PM');
    });

    it('returns null for null, undefined, or invalid inputs', () => {
      expect(formatOfferExpirationClock(null)).toBeNull();
      expect(formatOfferExpirationClock(undefined)).toBeNull();
      expect(formatOfferExpirationClock('invalid-date')).toBeNull();
    });

    it('uses local environment timezone when timeZone override is not provided', () => {
      const date = new Date('2026-09-17T17:10:00.000Z');
      const formatted = formatOfferExpirationClock(date);
      expect(formatted).not.toBeNull();
      // Must match h:mm AM/PM pattern
      expect(formatted).toMatch(/^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/);
    });
  });
});
