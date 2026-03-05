// app/realestate/page.tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import RealEstateDashboard from './DashboardLoader';

export const metadata: Metadata = { title: 'Real Estate' };

export default async function RealEstatePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/realestate');
  }
const displayName = session.username ?? session.email ?? 'Fellow';
  return (
    <RealEstateDashboard
      username={displayName}
      role={session.role ?? null}
    />
  );
}
