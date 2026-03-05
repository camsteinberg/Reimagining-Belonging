// app/account/add-phone/page.tsx
'use client';

import { useState } from 'react';

export default function AddPhonePage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'enter' | 'verify'>('enter');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function bounceToLogin() {
    const to = encodeURIComponent('/account/add-phone');
    window.location.href = `/login?redirect=${to}`;
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    try {
      const res = await fetch('/api/account/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.status === 401) return bounceToLogin();
      const data = await res.json();
      if (!data.ok) {
        setErr(
          data.error === 'invalid-phone' ? 'Enter a valid phone number' :
          data.error === 'in-use' ? 'That phone is already in use' :
          'Could not send code'
        );
        return;
      }
      setStage('verify');
      setMsg('We emailed a 6-digit code to your account email.');
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    try {
      const res = await fetch('/api/account/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) return bounceToLogin();
      const data = await res.json();
      if (!data.ok) {
        setErr(
          data.error === 'expired' ? 'Code expired. Start again.' :
          data.error === 'bad-code' ? 'Wrong code.' :
          data.error === 'start-first' ? 'Start verification first.' :
          data.error === 'in-use' ? 'That phone is already in use.' :
          'Verification failed.'
        );
        return;
      }
      setMsg('Phone verified and saved. You’re all set.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-semibold">Add your phone</h1>
      {msg && <p className="text-[#3d6b4f] text-sm">{msg}</p>}
      {err && <p className="text-[#c45d3e] text-sm">{err}</p>}

      {stage === 'enter' ? (
        <form onSubmit={start} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Phone number</label>
            <input
              className="w-full border p-2 rounded"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button disabled={loading} className="w-full border p-2 rounded">
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Enter 6-digit code</label>
            <input
              className="w-full border p-2 rounded"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
            />
          </div>
          <button disabled={loading} className="w-full border p-2 rounded">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      )}
    </div>
  );
}
