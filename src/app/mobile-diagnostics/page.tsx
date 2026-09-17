import type { Metadata } from 'next';
import { MobileDiagnosticsDashboard } from '@/components/diagnostics/MobileDiagnosticsDashboard';

export const metadata: Metadata = {
  title: 'Mobile Diagnostics | CloutFlow',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MobileDiagnosticsPage() {
  return <MobileDiagnosticsDashboard />;
}
