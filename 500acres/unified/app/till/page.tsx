// server component (no "use client")
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import TillDashboard from './TillDashboard';

export default async function TillPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/till');
  }
const displayName = session.username ?? session.email ?? 'Fellow';
  return (
    <TillDashboard
      username={displayName}
      role={session.role ?? null}
    />
  );
}
