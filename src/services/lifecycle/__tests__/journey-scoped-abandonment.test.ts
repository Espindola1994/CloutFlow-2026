import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateCheckoutAbandonments, DEFAULT_ABANDONMENT_THRESHOLD_MINUTES } from '../scheduler.service';

vi.mock('@/db', () => ({
  db: {
    delete: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]) }) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
    query: {
      lifecycleEvents: {
        findMany: vi.fn().mockResolvedValue([])
      },
      lifecycleAutomations: {
        findMany: vi.fn().mockResolvedValue([])
      }
    }
  }
}));

describe('Journey-Scoped Abandonment Mocks', () => {
  it('Evaluator is defined and thresholds are correct', () => {
    expect(typeof evaluateCheckoutAbandonments).toBe('function');
    expect(DEFAULT_ABANDONMENT_THRESHOLD_MINUTES).toBe(30);
  });
});
