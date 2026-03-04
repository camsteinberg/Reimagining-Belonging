import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import UserManagement from './UserManagement';

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/users');
  if (session.role !== 'admin') redirect('/dashboard');

  return <UserManagement />;
}
