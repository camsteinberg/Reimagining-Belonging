// app/fellowship/page.tsx
import type { Metadata } from 'next';
import { getSession } from '@/lib/getSession';
import FellowDashboard from '@/components/fellowship/FellowDashboard';

export const metadata: Metadata = { title: 'Fellowship' };

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  return (
    <main className="p-6">
      <FellowDashboard
        userId={session.userId}
        role={session.role || 'fellow'}
        username={session.username ?? undefined}
        email={session.email ?? undefined}
      />
    </main>
  );
}
