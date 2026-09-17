'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MobileDiagnosticsInspector = dynamic(
  () => import('@/components/diagnostics/MobileDiagnosticsInspector').then((m) => m.MobileDiagnosticsInspector),
  { ssr: false }
);

export function DiagnosticsConditionalMount() {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('mobileDiagnostics=1')) {
        setShouldMount(true);
      }
    }
  }, []);

  if (!shouldMount) {
    return null;
  }

  return <MobileDiagnosticsInspector />;
}
