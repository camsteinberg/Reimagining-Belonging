import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import UserManagement from './UserManagement';

export const metadata: Metadata = { title: 'User Management' };

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/users');
  if (session.role !== 'admin') redirect('/dashboard');

  return <UserManagement />;
}
