// app/forgot-password/page.tsx
'use client';
import { useState } from 'react';

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
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl mb-4">Forgot password</h1>
      {sent ? (
        <p className="text-sm text-[#3d6b4f]">
          If an account exists for that email, we sent a reset link. Check your inbox.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input
              className="w-full border p-2 rounded"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button disabled={loading} className="w-full border p-2 rounded">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  );
}
