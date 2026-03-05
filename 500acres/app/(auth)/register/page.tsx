'use client';

import Link from 'next/link';
import { useState } from 'react';

type StatusState = { tone: 'error' | 'success'; message: string } | null;

type FormState = {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  role: 'fellow';
};

const INPUT_CLASS =
  'w-full rounded-lg border border-charcoal/10 bg-warm-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-smoke focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition';

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    role: 'fellow',
  });
  const [status, setStatus] = useState<StatusState>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (form.password.length < 8) {
      setStatus({ tone: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (form.password !== form.confirm) {
      setStatus({ tone: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setStatus({ tone: 'error', message: data?.error || data?.message || 'Something went wrong.' });
        return;
      }

      setStatus({ tone: 'success', message: data?.message || 'Registered! Check your email to continue.' });
    } catch {
      setStatus({ tone: 'error', message: 'Server error. Try again.' });
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
              Create your account
            </h1>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="font-sans text-sm font-medium text-charcoal">
                  <span className="block">Username</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="username"
                    autoComplete="username"
                  />
                </label>
                <label className="font-sans text-sm font-medium text-charcoal">
                  <span className="block">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="you@500acres.org"
                    autoComplete="email"
                  />
                </label>
                <label className="font-sans text-sm font-medium text-charcoal sm:col-span-2">
                  <span className="block">Phone (optional)</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </label>
                <input type="hidden" name="role" value="fellow" />
                <label className="font-sans text-sm font-medium text-charcoal">
                  <span className="block">Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="********"
                    autoComplete="new-password"
                  />
                </label>
                <label className="font-sans text-sm font-medium text-charcoal">
                  <span className="block">Confirm password</span>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    required
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="Match your password"
                    autoComplete="new-password"
                  />
                </label>
              </div>

              {status && (
                <div
                  className={`rounded-lg border px-4 py-3 font-sans text-sm ${
                    status.tone === 'success'
                      ? 'border-sage/20 bg-sage/5 text-forest'
                      : 'border-red-700/20 bg-red-700/5 text-red-700'
                  }`}
                >
                  {status.message}
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
                  'Create account'
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-charcoal/15 px-4 py-3 font-serif text-sm font-bold text-charcoal transition hover:bg-charcoal/5"
            >
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
