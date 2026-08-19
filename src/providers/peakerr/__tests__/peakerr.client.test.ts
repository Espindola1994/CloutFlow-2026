import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';

describe('Peakerr Official API v2 Client Tests', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PEAKERR_LIVE_FULFILLMENT;
    delete process.env.PEAKERR_API_KEY;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it('A) Live fulfillment disabled (flag absent or false) -> Blocks createOrder before fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const res = await peakerrClient.createOrder({
      service: '31714',
      link: 'https://instagram.com/test',
      quantity: 2000,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errorKind).toBe('LIVE_FULFILLMENT_DISABLED');
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('B) Live fulfillment enabled -> Sends application/x-www-form-urlencoded with key, action=add, service, link, quantity', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'test_secret_peakerr_key_123';

    const client = new (peakerrClient.constructor as any)();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ order: 987654 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await client.createOrder({
      service: '31714',
      link: 'https://instagram.com/anaclaramaderite',
      quantity: 2000,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://peakerr.com/api/v2');
    expect(init?.method).toBe('POST');
    const headers = init?.headers as Record<string, string>;
    expect(headers?.['Content-Type']).toBe('application/x-www-form-urlencoded');

    const params = new URLSearchParams(init?.body as string);
    expect(params.get('key')).toBe('test_secret_peakerr_key_123');
    expect(params.get('action')).toBe('add');
    expect(params.get('service')).toBe('31714');
    expect(params.get('link')).toBe('https://instagram.com/anaclaramaderite');
    expect(params.get('quantity')).toBe('2000');

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.order).toBe(987654);
      // Key must not be leaked into return object
      expect((res.rawResponse as any).key).toBeUndefined();
    }
  });

  it('C, D) API key is stripped from return payloads and error responses', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'super_secret_key';

    const client = new (peakerrClient.constructor as any)();

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Incorrect request', key: 'super_secret_key' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await client.createOrder({
      service: '123',
      link: 'https://test.com',
      quantity: 100,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Incorrect request');
      expect((res.rawResponse as any)?.key).toBeUndefined();
    }
  });

  it('E) Official action=services endpoint parses service list correctly', async () => {
    process.env.PEAKERR_API_KEY = 'test_key';
    const client = new (peakerrClient.constructor as any)();

    const mockServices = [
      {
        service: '31714',
        name: 'Instagram Followers High Quality',
        type: 'Default',
        category: 'Instagram Followers',
        rate: '0.90',
        min: '10',
        max: '1000000',
        refill: true,
        cancel: false,
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockServices), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const services = await client.getServices();
    expect(Array.isArray(services)).toBe(true);
    expect(services[0].service).toBe('31714');
    expect(services[0].min).toBe('10');
    expect(services[0].max).toBe('1000000');
  });

  it('F) Official action=status parses order status response correctly', async () => {
    process.env.PEAKERR_API_KEY = 'test_key';
    const client = new (peakerrClient.constructor as any)();

    const mockStatusResponse = {
      charge: '1.80',
      start_count: '12400',
      status: 'In progress',
      remains: '1500',
      currency: 'USD',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockStatusResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const status = await client.getStatus(987654);
    expect(status.status).toBe('In progress');
    expect(status.charge).toBe('1.80');
    expect(status.remains).toBe('1500');
  });

  it('G) Official action=balance parses account balance response correctly', async () => {
    process.env.PEAKERR_API_KEY = 'test_key';
    const client = new (peakerrClient.constructor as any)();

    const mockBalanceResponse = {
      balance: '145.20',
      currency: 'USD',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockBalanceResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const balance = await client.getBalance();
    expect(balance.balance).toBe('145.20');
    expect(balance.currency).toBe('USD');
  });
});
