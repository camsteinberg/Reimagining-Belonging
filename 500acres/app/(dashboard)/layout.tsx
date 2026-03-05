import type { ReactNode } from 'react';
import { getSession } from '@/lib/getSession';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import AppShell from '@/components/AppShell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const rows = (await sql`
    SELECT phone FROM "User" WHERE id = ${session.userId} LIMIT 1
  `) as { phone: string | null }[];

  const sidebarProps = {
    username: session.username ?? session.email ?? 'Fellow',
    role: session.role ?? null,
    hasPhone: !!rows?.[0]?.phone,
  };

  return <AppShell sidebarProps={sidebarProps}>{children}</AppShell>;
}
