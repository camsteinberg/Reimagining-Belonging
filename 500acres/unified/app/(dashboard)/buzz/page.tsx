// app/buzz/page.tsx (pattern for all modules)
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import AcreBuzzDashboard from './Dashboard';

export const metadata: Metadata = { title: 'AcreBuzz' };

export default async function BuzzPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/buzz');

  const displayName = session.username ?? session.email ?? 'Fellow';

  return (
    <AcreBuzzDashboard username={displayName} role={session.role ?? null} />
  );
}
