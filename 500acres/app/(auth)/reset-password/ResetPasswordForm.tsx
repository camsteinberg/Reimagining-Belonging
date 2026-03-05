'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const INPUT_CLASS =
  'w-full rounded-lg border border-charcoal/10 bg-warm-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-smoke focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition';

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return setError('Missing reset token. Please use the link from your email.');
    if (password !== confirm) return setError('Passwords do not match.');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Invalid or expired link.');
        return;
      }
      setOk(true);
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
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
            <h1 className="font-serif text-[clamp(1.875rem,4vw,2.25rem)] font-semibold leading-tight text-charcoal">
              Set a new password
            </h1>
          </div>

          {ok ? (
            <div className="rounded-lg border border-sage/20 bg-sage/5 px-4 py-3 font-sans text-sm text-forest">
              Password updated. Redirecting...
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={submit} className="space-y-5">
                <label className="font-sans text-sm font-medium text-charcoal">
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

                <label className="font-sans text-sm font-medium text-charcoal">
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
                  <div className="rounded-lg border border-red-700/20 bg-red-700/5 px-4 py-3 font-sans text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="inline-flex w-full items-center justify-center rounded-full bg-charcoal px-4 py-3 font-serif text-sm font-bold text-cream shadow-sm transition hover:bg-night disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {loading ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cream/60 border-t-transparent" />
                  ) : (
                    'Save new password'
                  )}
                </button>
              </form>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-charcoal/15 px-4 py-3 font-serif text-sm font-bold text-charcoal transition hover:bg-charcoal/5"
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
