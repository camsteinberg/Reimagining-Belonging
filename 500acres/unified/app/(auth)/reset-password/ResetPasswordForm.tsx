// app/(auth)/reset-password/ResetPasswordForm.tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

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
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl mb-4">Set a new password</h1>
      {ok ? (
        <p className="text-sm text-[#3d6b4f]">Password updated. Redirecting…</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">New password</label>
            <input
              className="w-full border p-2 rounded"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Confirm password</label>
            <input
              className="w-full border p-2 rounded"
              type="password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-[#c45d3e] text-sm">{error}</p>}
          <button disabled={loading || !token} className="w-full border p-2 rounded">
            {loading ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </div>
  );
}
