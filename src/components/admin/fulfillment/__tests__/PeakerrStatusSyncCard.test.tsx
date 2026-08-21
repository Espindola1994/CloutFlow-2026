import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { PeakerrStatusSyncCard } from '@/components/admin/fulfillment/PeakerrStatusSyncCard';
import { describe, it, expect, vi } from 'vitest';

describe('PeakerrStatusSyncCard DOM Render', () => {
  it('renders disabled state correctly', () => {
    const onRunSync = vi.fn();
    
    const html = ReactDOMServer.renderToString(
      <PeakerrStatusSyncCard
        enabled={false}
        loading={false}
        metrics={null}
        onRunSync={onRunSync}
        targetQueueAutoReleaseEnabled={false}
      />
    );

    // Ensure the main header is present with DISABLED status
    expect(html).toContain('AUTOMATIC STATUS SYNC');
    expect(html).toContain('DISABLED');
    expect(html).toContain('Provider status updates require manual Sync Now or another authorized trigger.');
    expect(html).toContain('GITHUB ACTIONS SCHEDULE / EXTERNAL');

    // Ensure manual run button is rendered
    expect(html).toContain('Sync Now');

    // Ensure metrics placeholders are rendered
    expect(html).toContain('Last Run');
    expect(html).toContain('Checked');
    expect(html).toContain('Updated');
    expect(html).toContain('Completed');
    expect(html).toContain('Queue Released');
    expect(html).toContain('Queue Blocked');
    expect(html).toContain('Errors');
  });

  it('renders enabled state correctly', () => {
    const onRunSync = vi.fn();
    
    const html = ReactDOMServer.renderToString(
      <PeakerrStatusSyncCard
        enabled={true}
        loading={false}
        metrics={null}
        onRunSync={onRunSync}
        targetQueueAutoReleaseEnabled={true}
      />
    );

    expect(html).toContain('AUTOMATIC STATUS SYNC');
    expect(html).toContain('ENABLED');
    expect(html).toContain('TARGET QUEUE AUTO RELEASE:');
    expect(html).toContain('Provider status synchronization may run automatically when an authorized scheduler/trigger invokes the sync endpoint.');
    expect(html).toContain('GITHUB ACTIONS SCHEDULE / EXTERNAL');
    expect(html).toContain('Sync Now may release the next queued order');
  });
});

