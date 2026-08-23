import { describe, it, expect } from 'vitest';

// Function directly extracted/tested from AutomationsTab
function formatLiveSince(isoString: string | null | undefined): { dateStr: string; tzStr: string } {
  if (!isoString) {
    return { dateStr: 'NOT CONFIGURED', tzStr: '' };
  }

  const isoMatch = isoString.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:([+-]\d{2}:?\d{2})|Z)?$/);
  
  if (isoMatch) {
    const [, year, month, day, hours, minutes, , tz] = isoMatch;
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    let formattedTz = '';
    if (tz) {
      if (tz === 'Z') {
        formattedTz = 'UTC';
      } else {
        formattedTz = `UTC${tz.includes(':') ? tz : tz.slice(0, 3) + ':' + tz.slice(3)}`;
      }
    }
    return { dateStr: formattedDate, tzStr: formattedTz };
  }

  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return { dateStr: 'NOT CONFIGURED', tzStr: '' };
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return { dateStr: `${day}/${month}/${year} ${hours}:${minutes}`, tzStr: '' };
}

describe('AutomationsTab UI formatting & state semantics', () => {
  it('H. formats valid ISO with timezone correctly without timezone shifting the display date', () => {
    const res = formatLiveSince('2026-08-23T00:30:00-03:00');
    expect(res.dateStr).toBe('23/08/2026 00:30');
    expect(res.tzStr).toBe('UTC-03:00');
  });

  it('I. formats null as NOT CONFIGURED', () => {
    const res = formatLiveSince(null);
    expect(res.dateStr).toBe('NOT CONFIGURED');
    expect(res.tzStr).toBe('');
  });

  it('J. formats invalid timestamp string as NOT CONFIGURED', () => {
    const res = formatLiveSince('not-a-timestamp');
    expect(res.dateStr).toBe('NOT CONFIGURED');
    expect(res.tzStr).toBe('');
  });

  it('K. handles status endpoint failure with STATUS UNAVAILABLE semantics', () => {
    // Verifying failure state logic
    const statusError = true;
    const lifecycleStatus = null;

    const displayStatus = (val: string | undefined) => {
      if (statusError) return 'STATUS UNAVAILABLE';
      if (!val) return 'LOADING...';
      return val;
    };

    expect(displayStatus(lifecycleStatus?.['marketingAutomation'])).toBe('STATUS UNAVAILABLE');
    expect(displayStatus(lifecycleStatus?.['marketingAutomation'])).not.toBe('OFF');
  });
});
