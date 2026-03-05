'use client';

import dynamic from 'next/dynamic';

const RealEstateDashboard = dynamic(() => import('./Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-text-muted)]">
      Loading dashboard...
    </div>
  ),
});

export default RealEstateDashboard;
