// app/governance/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import GovernanceDashboard from './Dashboard';

export default async function GovernancePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/governance');
  }
const displayName = session.username ?? session.email ?? 'Fellow';
  return (
    <GovernanceDashboard
      username={displayName}
      role={session.role ?? null}
    />
  );
}
