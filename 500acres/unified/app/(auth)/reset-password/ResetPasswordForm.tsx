// app/(auth)/reset-password/ResetPasswordForm.tsx
'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)] transition';

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Invalid or expired link.');
        return;
      }
      setOk(true);
      setTimeout(() => router.push('/login'), 1200);
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
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Set a new password</h1>
          </div>

          {ok ? (
            <div className="rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-4 py-3 text-sm text-[var(--color-success)]">
              Password updated. Redirecting...
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={submit} className="space-y-5">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  <span className="block">New password</span>
                  <input
                    className={`${INPUT_CLASS} mt-2`}
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                    required
                  />
                </label>

                <label className="text-sm font-medium text-[var(--color-text)]">
                  <span className="block">Confirm password</span>
                  <input
                    className={`${INPUT_CLASS} mt-2`}
                    type="password"
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Match your password"
                    autoComplete="new-password"
                    required
                  />
                </label>

                {error && (
                  <div className="rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-warm-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {loading ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                  ) : (
                    'Save new password'
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
