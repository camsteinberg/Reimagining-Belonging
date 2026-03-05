// app/fellowship-admin/page.tsx
import type { Metadata } from 'next';
import AdminDashboard from '@/components/fellowship/AdminDashboard';

export const metadata: Metadata = { title: 'Fellowship Admin' };

export default function Page() {
  return (
    <main className="p-6">
      <AdminDashboard />
    </main>
  );
}
