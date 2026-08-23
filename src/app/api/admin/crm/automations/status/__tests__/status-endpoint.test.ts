import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-user', role: 'admin' }),
}));

describe('CRM Automations Status Endpoint API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('A. LIFECYCLE_EMAILS_ENABLED=true => Marketing LIVE', async () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'true';
    process.env.CRON_SECRET = 'cron-secret-value';
    process.env.RESEND_API_KEY = 're_test_123';
    process.env.LIFECYCLE_EMAILS_LIVE_FROM = '2026-08-23T00:30:00-03:00';

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.marketingAutomation).toBe('LIVE');
    expect(json.data.lifecycleEmailsEnabled).toBe(true);
  });

  it('B. LIFECYCLE_EMAILS_ENABLED=false => Marketing OFF', async () => {
    process.env.LIFECYCLE_EMAILS_ENABLED = 'false';
    process.env.CRON_SECRET = 'cron-secret-value';
    process.env.RESEND_API_KEY = 're_test_123';

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.marketingAutomation).toBe('OFF');
    expect(json.data.lifecycleEmailsEnabled).toBe(false);
  });

  it('C. LIFECYCLE_EMAILS_ENABLED missing => Marketing OFF', async () => {
    delete process.env.LIFECYCLE_EMAILS_ENABLED;

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.marketingAutomation).toBe('OFF');
    expect(json.data.lifecycleEmailsEnabled).toBe(false);
  });

  it('D. CRON configuration present => Worker ACTIVE', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.lifecycleWorker).toBe('ACTIVE');
  });

  it('E. required worker configuration missing => Worker ERROR', async () => {
    delete process.env.CRON_SECRET;

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.lifecycleWorker).toBe('ERROR');
  });

  it('F. RESEND_API_KEY present => Resend CONFIGURED', async () => {
    process.env.RESEND_API_KEY = 're_123456';

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.resend).toBe('CONFIGURED');
  });

  it('G. RESEND_API_KEY missing => Resend CONFIG ERROR', async () => {
    delete process.env.RESEND_API_KEY;

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.resend).toBe('CONFIG ERROR');
  });

  it('H. valid LIFECYCLE_EMAILS_LIVE_FROM => correctly returned', async () => {
    process.env.LIFECYCLE_EMAILS_LIVE_FROM = '2026-08-23T00:30:00-03:00';

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.liveSince).toBe('2026-08-23T00:30:00-03:00');
    expect(json.data.liveFromConfigured).toBe(true);
  });

  it('I. missing LIVE_FROM => liveSince null and liveFromConfigured false', async () => {
    delete process.env.LIFECYCLE_EMAILS_LIVE_FROM;

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.liveSince).toBeNull();
    expect(json.data.liveFromConfigured).toBe(false);
  });

  it('J. invalid LIVE_FROM => liveSince null and liveFromConfigured false', async () => {
    process.env.LIFECYCLE_EMAILS_LIVE_FROM = 'invalid-timestamp-value';

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.liveSince).toBeNull();
    expect(json.data.liveFromConfigured).toBe(false);
  });

  it('L. No secret values are included in endpoint JSON', async () => {
    process.env.RESEND_API_KEY = 'super_secret_resend_api_key_xyz';
    process.env.CRON_SECRET = 'super_secret_cron_secret_abc';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

    const response = await GET();
    const json = await response.json();

    const jsonString = JSON.stringify(json);
    expect(jsonString).not.toContain('super_secret_resend_api_key_xyz');
    expect(jsonString).not.toContain('super_secret_cron_secret_abc');
    expect(jsonString).not.toContain('postgresql');
    expect(jsonString).not.toContain('pass@localhost');
  });
});
