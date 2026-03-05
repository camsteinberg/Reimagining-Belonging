import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import ErrorBoundary from '@/components/public/shared/ErrorBoundary';
import AnalyticsDashboard from './AnalyticsDashboard';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/analytics');
  if (session.role !== 'admin') redirect('/dashboard');

  return (
    <ErrorBoundary inline label="Analytics">
      <AnalyticsDashboard />
    </ErrorBoundary>
  );
}
