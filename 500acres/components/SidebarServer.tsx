// components/SidebarServer.tsx (Server Component)
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';
import Sidebar from './Sidebar';

export default async function SidebarServer() {
  const session = await getSession();
  if (!session) return null;

  const rows = (await sql`
    SELECT username, role, phone
    FROM "User"
    WHERE id = ${session.userId}
    LIMIT 1
  `) as { username: string | null; role: string | null; phone: string | null }[];

  const me = rows[0] || { username: null, role: null, phone: null };

  return (
    <Sidebar
      username={me.username ?? session.email ?? 'Fellow'}
      role={me.role ?? null}
      hasPhone={!!me.phone}
    />
  );
}
