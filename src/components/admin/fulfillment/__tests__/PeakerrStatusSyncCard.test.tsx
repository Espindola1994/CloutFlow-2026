import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { PeakerrStatusSyncCard } from '@/components/admin/fulfillment/PeakerrStatusSyncCard';
import { describe, it, expect, vi } from 'vitest';

describe('PeakerrStatusSyncCard DOM Render', () => {
  it('renders unconditionally regardless of API or Simulation state', () => {
    const onRunSync = vi.fn();
    
    const html = ReactDOMServer.renderToString(
      <PeakerrStatusSyncCard
        enabled={false}
        loading={false}
        metrics={null}
        onRunSync={onRunSync}
      />
    );

    // Ensure the main header is present
    expect(html).toContain('AUTOMATIC STATUS SYNC');
    expect(html).toContain('Read-only monitoring of provider order synchronization.');

    // Ensure manual run button is rendered
    expect(html).toContain('Sync Now');

    // Ensure metrics placeholders are rendered
    expect(html).toContain('Last Manual Run');
    expect(html).toContain('Checked');
    expect(html).toContain('Updated');
    expect(html).toContain('Completed');
    expect(html).toContain('Partial');
    expect(html).toContain('Canceled');
    expect(html).toContain('Errors');
  });
});
