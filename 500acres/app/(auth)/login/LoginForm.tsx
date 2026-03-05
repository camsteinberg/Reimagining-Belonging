'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SurfaceCard from '@/components/ui/SurfaceCard';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)] transition';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';
  const statusParam = params.get('status');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, remember }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || !data?.success) {
        setError(data?.message || 'Invalid credentials');
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
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
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Sign in to your account</h1>
          </div>

          {statusParam === 'pending' && (
            <div className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text)]">
              Your account is awaiting admin approval. You&apos;ll receive an email when approved.
            </div>
          )}
          {statusParam === 'suspended' && (
            <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-text)]">
              Your account has been suspended. Contact an administrator.
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="text-sm font-medium text-[var(--color-text)]">
                <span className="block">Email or phone</span>
                <input
                  className={`${INPUT_CLASS} mt-2`}
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@school.edu or (555) 123-4567"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="mt-4 text-sm font-medium text-[var(--color-text)]">
                <span className="block">Password</span>
                <input
                  className={`${INPUT_CLASS} mt-2`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="mt-2 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] text-[var(--color-primary)] focus:ring-[var(--color-primary-soft)] focus:ring-offset-0"
                  />
                  Remember me (30 days)
                </label>
                <Link href="/forgot-password" className="font-medium text-[var(--color-primary)] hover:underline">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-warm-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Create an account
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
