import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/fulfillment/peakerr/inspect/route';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin_1', email: 'admin@cloutflow.co' }),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 'chain_1',
            platform: 'instagram',
            service: 'followers',
            variant: 'standard',
            name: 'Instagram Followers (Standard)',
          },
        ]),
      })),
    })),
  },
}));

describe('Peakerr Inspection & Read-Only Catalog Audit API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A) Successfully fetches balance & services in read-only and maps slots correctly', async () => {
    vi.spyOn(peakerrClient, 'isConfigured').mockReturnValue(true);
    vi.spyOn(peakerrClient, 'isLiveEnabled').mockReturnValue(false);

    vi.spyOn(peakerrClient, 'getBalance').mockResolvedValue({
      balance: '250.00',
      currency: 'USD',
    });

    const mockCatalog = [
      {
        service: '31714',
        name: 'Instagram Followers High Quality',
        type: 'Default',
        category: 'Instagram Followers',
        rate: '0.95',
        min: '10',
        max: '1000000',
        refill: true,
        cancel: false,
      },
      {
        service: '31849',
        name: 'Instagram Followers Real Active',
        type: 'Default',
        category: 'Instagram Followers',
        rate: '1.20',
        min: '10',
        max: '1000000',
        refill: true,
        cancel: false,
      },
      {
        service: '31850',
        name: 'Instagram Followers Instant',
        type: 'Default',
        category: 'Instagram Followers',
        rate: '1.40',
        min: '10',
        max: '1000000',
        refill: false,
        cancel: true,
      },
    ];

    vi.spyOn(peakerrClient, 'getServices').mockResolvedValue(mockCatalog);

    // Mock DB services for chain
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation((table: any) => {
        return {
          orderBy: vi.fn().mockResolvedValue([
            {
              id: 'chain_1',
              platform: 'instagram',
              service: 'followers',
              variant: 'standard',
              name: 'Instagram Followers (Standard)',
            },
          ]),
          then: vi.fn().mockImplementation((fn: any) => {
            return fn([
              {
                id: 'slot_1',
                chainId: 'chain_1',
                providerServiceId: '31714',
                priority: 1,
                minQuantity: 10,
                maxQuantity: 1000000,
              },
              {
                id: 'slot_2',
                chainId: 'chain_1',
                providerServiceId: '31849',
                priority: 2,
                minQuantity: 10,
                maxQuantity: 1000000,
              },
              {
                id: 'slot_3',
                chainId: 'chain_1',
                providerServiceId: '31850',
                priority: 3,
                minQuantity: 10,
                maxQuantity: 1000000,
              },
            ]);
          }),
        };
      }),
    }));

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.connection.connected).toBe(true);
    expect(json.connection.balance).toBe('250.00');
    expect(json.connection.servicesCount).toBe(3);
    expect(json.runtime.apiKeyPresent).toBe(true);
    expect(json.runtime.liveFulfillment).toBe(false);
  });
});
