// app/forgot-password/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)] transition';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true); // always success message
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4 py-12 text-[var(--color-text)]">
      <SurfaceCard className="w-full max-w-xl">
        <div className="space-y-8">
          <div className="space-y-4 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              500AcresOS
            </span>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Forgot password</h1>
          </div>

          {sent ? (
            <div className="rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-4 py-3 text-sm text-[var(--color-success)]">
              If an account exists for that email, we sent a reset link. Check your inbox.
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={submit} className="space-y-5">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  <span className="block">Email</span>
                  <input
                    className={`${INPUT_CLASS} mt-2`}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    autoComplete="email"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-warm-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {loading ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
