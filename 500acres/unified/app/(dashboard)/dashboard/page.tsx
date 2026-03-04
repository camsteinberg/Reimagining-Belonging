// app/(dashboard)/dashboard/page.tsx  (server component)
import { getSession } from '@/lib/getSession';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default async function DashboardHome() {
  const session = await getSession();

  if (!session) redirect('/login?redirect=/dashboard');

  return (
    <div className="h-full flex flex-col justify-center items-center text-center px-4">
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Sparkles className="text-yellow-500 w-8 h-8" />
          Welcome to 500AcresOS
        </h1>
        <p className="text-gray-600 text-lg">

        </p>
        <p className="text-sm text-gray-500">
          Signed in as <span className="font-semibold">{session.username}</span>
        </p>
      </div>
    </div>
  );
}
