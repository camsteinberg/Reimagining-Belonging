// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { getSession } from '@/lib/getSession';
import sql from '@/lib/db';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: '500AcresOS',
  description: '500AcresOS Fellowship Dashboard',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let sidebarProps: {
    username: string;
    role: string | null;
    hasPhone: boolean;
  } | null = null;
  if (session) {
    const rows = (await sql`
      SELECT phone
      FROM "User"
      WHERE id = ${session.userId}
      LIMIT 1
    `) as { phone: string | null }[];

    const hasPhone = !!rows?.[0]?.phone;
    const username = session.username ?? session.email ?? 'Fellow';
    const role = session.role ?? null;

    sidebarProps = { username, role, hasPhone };
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppShell sidebarProps={sidebarProps}>{children}</AppShell>
      </body>
    </html>
  );
}
