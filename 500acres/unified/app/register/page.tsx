'use client';

import Link from 'next/link';
import { useState } from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';

type StatusState = { tone: 'error' | 'success'; message: string } | null;

type FormState = {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  role: 'admin' | 'fellow';
};

const INPUT_CLASS =
  'w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)] transition';

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4 py-12 text-[var(--color-text)]">
      <SurfaceCard className="w-full max-w-xl">
        <div className="space-y-8">
          <div className="space-y-4 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              500AcresOS
            </span>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Create your account</h1>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
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
                <label className="text-sm font-medium text-[var(--color-text)]">
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
                <label className="text-sm font-medium text-[var(--color-text)] sm:col-span-2">
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
                <label className="text-sm font-medium text-[var(--color-text)] sm:col-span-2">
                  <span className="block">Role</span>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}
                    className={`${INPUT_CLASS} mt-2`}
                  >
                    <option value="fellow">Fellow</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-[var(--color-text)]">
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
                <label className="text-sm font-medium text-[var(--color-text)]">
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
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    status.tone === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-600'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Sign in instead
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
