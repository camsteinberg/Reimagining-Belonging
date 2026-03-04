// app/(auth)/reset-password/page.tsx
'use client';
import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-sm mx-auto mt-10">
          <h1 className="text-xl mb-4">Set a new password</h1>
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
