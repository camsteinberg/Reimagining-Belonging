// app/(dashboard)/dashboard/page.tsx  (server component)
import type { Metadata } from 'next';
import { getSession } from '@/lib/getSession';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardHome() {
  const session = await getSession();

  if (!session) redirect('/login?redirect=/dashboard');

  return (
    <div className="h-full flex flex-col justify-center items-center text-center px-4">
      <div className="max-w-xl space-y-4">
        <h1 className="font-serif text-4xl font-bold text-[var(--color-text)] flex items-center justify-center gap-2">
          <Sparkles className="text-[var(--color-warning)] w-8 h-8" />
          Welcome to 500AcresOS
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Signed in as <span className="font-semibold">{session.username}</span>
        </p>
      </div>
    </div>
  );
}
