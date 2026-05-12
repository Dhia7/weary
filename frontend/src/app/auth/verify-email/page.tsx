'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'ok' | 'err'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('err');
      setMessage('Missing verification token. Open the link from your email, or request a new one from the sign-in page.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setStatus('ok');
          setMessage(data.message || 'Email verified successfully.');
        } else {
          setStatus('err');
          setMessage(data.message || 'Verification failed.');
        }
      } catch {
        if (!cancelled) {
          setStatus('err');
          setMessage('Network error. Please try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-4"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email verification</h1>
        {status === 'loading' && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {status !== 'loading' && (
          <p
            className={
              status === 'ok'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {message}
          </p>
        )}
        <Link
          href="/auth/login"
          className="inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          Go to sign in
        </Link>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
