import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Log In' };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mt-10 text-center text-[var(--color-text-muted)]">Loading login…</div>}>
      <LoginForm />
    </Suspense>
  );
}
