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
        buildMarker="02bf761-fase39b"
      />
    );

    // Ensure the main header is present
    expect(html).toContain('AUTOMATIC STATUS SYNC (READ-ONLY MONITORING)');

    // Ensure the build marker is present
    expect(html).toContain('STATUS SYNC UI BUILD:');
    expect(html).toContain('02bf761-fase39b');

    // Ensure manual run button is rendered
    expect(html).toContain('Run Status Sync Now');

    // Ensure metrics placeholders are rendered
    expect(html).toContain('Automatic Sync:');
    expect(html).toContain('DISABLED');
    expect(html).toContain('Last Manual Run');
    expect(html).toContain('—');
  });
});
