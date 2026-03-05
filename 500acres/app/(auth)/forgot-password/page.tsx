'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

const INPUT_CLASS =
  'w-full rounded-lg border border-charcoal/10 bg-warm-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-smoke focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      setSent(true);
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
              Forgot password
            </h1>
          </div>

          {sent ? (
            <div className="rounded-lg border border-sage/20 bg-sage/5 px-4 py-3 font-sans text-sm text-forest">
              If an account exists for that email, we sent a reset link. Check your inbox.
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={submit} className="space-y-5">
                <label className="font-sans text-sm font-medium text-charcoal">
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
                    'Send reset link'
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
