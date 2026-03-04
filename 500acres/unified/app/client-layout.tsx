'use client';

// Put any client-only providers here (theme, toasts, etc). No NextAuth needed.
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
