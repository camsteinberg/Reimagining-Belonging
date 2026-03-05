'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const INPUT_CLASS =
  'w-full rounded-lg border border-charcoal/10 bg-warm-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-smoke focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition';

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
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, remember }),
        signal: controller.signal,
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
      if ((err as Error).name === 'AbortError') return;
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl bg-warm-white p-8 sm:p-10 shadow-lg">
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.32em] text-smoke">
              500 Acres
            </span>
            <h1 className="font-serif text-3xl font-semibold leading-tight text-charcoal md:text-4xl">
              Sign in to your account
            </h1>
          </div>

          {statusParam === 'pending' && (
            <div className="rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 font-sans text-sm text-charcoal">
              Your account is awaiting admin approval. You&apos;ll receive an email when approved.
            </div>
          )}
          {statusParam === 'suspended' && (
            <div className="rounded-lg border border-red-700/30 bg-red-700/10 px-4 py-3 font-sans text-sm text-charcoal">
              Your account has been suspended. Contact an administrator.
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="font-sans text-sm font-medium text-charcoal">
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

              <label className="mt-4 font-sans text-sm font-medium text-charcoal">
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

              <div className="mt-2 flex flex-col gap-3 font-sans text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-charcoal">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-charcoal/15 bg-warm-white text-forest accent-forest focus:ring-sage/20 focus:ring-offset-0"
                  />
                  Remember me (30 days)
                </label>
                <Link href="/forgot-password" className="font-medium text-forest hover:underline">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="rounded-lg border border-red-700/20 bg-red-700/5 px-4 py-3 font-sans text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-charcoal px-4 py-3 font-serif text-sm font-bold text-cream shadow-sm transition hover:bg-night disabled:cursor-not-allowed disabled:opacity-75"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cream/60 border-t-transparent" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-full border border-charcoal/15 px-4 py-3 font-serif text-sm font-bold text-charcoal transition hover:bg-charcoal/5"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
