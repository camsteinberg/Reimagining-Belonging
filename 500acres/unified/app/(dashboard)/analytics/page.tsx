import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/analytics');
  if (session.role !== 'admin') redirect('/dashboard');

  return <AnalyticsDashboard />;
}
