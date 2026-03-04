

// app/buzz/page.tsx (pattern for all modules)
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import AcreBuzzDashboard from './Dashboard';

export default async function BuzzPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/buzz');

  const displayName = session.username ?? session.email ?? 'Fellow';

  return (
    <AcreBuzzDashboard username={displayName} role={session.role ?? null} />
  );
}
