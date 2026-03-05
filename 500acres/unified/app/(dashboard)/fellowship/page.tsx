// app/fellowship/page.tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import FellowDashboard from '@/components/fellowship/FellowDashboard';

export const metadata: Metadata = { title: 'Fellowship' };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/fellowship');
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
