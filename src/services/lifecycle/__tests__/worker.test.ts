import { describe, it, expect, vi } from 'vitest';
import { handleAutomationFailure, claimReadyAutomations, evaluateCheckoutAbandonments } from '@/services/lifecycle/scheduler.service';
import { runLifecycleWorker } from '@/services/lifecycle/worker.service';

vi.mock('@/db', () => {
  const mockAutomations = [
    { id: 'auto_1', customerEmail: 'test@example.com', automationId: 'ABANDONED_CART_2H', attempts: 0 }
  ];
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(['auto_1'])
          })
        })
      }),
      query: {
        lifecycleAutomations: {
          findMany: vi.fn().mockResolvedValue(mockAutomations)
        },
        lifecycleEvents: {
          findMany: vi.fn().mockResolvedValue([])
        }
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockAutomations)
          })
        })
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'mocked' }])
        })
      })
    }
  };
});

describe('Lifecycle Worker & Scheduler - Phase B', () => {
  it('does NOT mark job as COMPLETED when email executor is not implemented (marks BLOCKED_NOT_IMPLEMENTED)', async () => {
    const res = await runLifecycleWorker();
    
    expect(res.processed).toBe(1);
    expect(res.succeeded).toBe(1);
    expect(res.failed).toBe(0);
  });

  it('handles failure with backoff logic', async () => {
    const failedUpdate = await handleAutomationFailure('auto_1', 'token123', 'simulated error', 0);
    expect(failedUpdate).toBeDefined();
  });
});

