import { describe, it, expect } from 'vitest';
import { extractDeviceTelemetry } from '../device';

describe('Server-Side Device Telemetry Helper', () => {
  it('1. Returns null for missing User-Agent', () => {
    const headers = new Headers();
    const dev = extractDeviceTelemetry(headers);

    expect(dev.deviceType).toBeNull();
    expect(dev.os).toBeNull();
    expect(dev.browser).toBeNull();
  });

  it('2. Detects iPhone / iOS / Safari mobile device', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    });
    const dev = extractDeviceTelemetry(headers);

    expect(dev.deviceType).toBe('mobile');
    expect(dev.os).toBe('iOS');
    expect(dev.browser).toBe('Safari');
  });

  it('3. Detects Android / Chrome mobile device', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    });
    const dev = extractDeviceTelemetry(headers);

    expect(dev.deviceType).toBe('mobile');
    expect(dev.os).toBe('Android');
    expect(dev.browser).toBe('Chrome');
  });

  it('4. Detects Windows / Edge desktop', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    });
    const dev = extractDeviceTelemetry(headers);

    expect(dev.deviceType).toBe('desktop');
    expect(dev.os).toBe('Windows');
    expect(dev.browser).toBe('Edge');
  });

  it('5. Detects macOS / Chrome desktop', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });
    const dev = extractDeviceTelemetry(headers);

    expect(dev.deviceType).toBe('desktop');
    expect(dev.os).toBe('macOS');
    expect(dev.browser).toBe('Chrome');
  });
});
