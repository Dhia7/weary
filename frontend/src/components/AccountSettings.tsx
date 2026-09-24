'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

type NotificationKey = 'orderEmails' | 'stockEmails' | 'newsletter' | 'marketingEmails';

const NOTIFICATION_OPTIONS: Array<{ key: NotificationKey; title: string; description: string }> = [
  {
    key: 'orderEmails',
    title: 'Order emails',
    description: 'Confirmation and cancellation messages for your orders.',
  },
  {
    key: 'stockEmails',
    title: 'Back-in-stock emails',
    description: 'A message when a piece you are waiting for is available again.',
  },
  {
    key: 'newsletter',
    title: 'Newsletter',
    description: 'Occasional news from the shop.',
  },
  {
    key: 'marketingEmails',
    title: 'Marketing emails',
    description: 'Offers and new arrivals.',
  },
];

export default function AccountSettings() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const googleOnly = user?.hasLocalPassword === false;
  const needsCode = googleOnly && !!user?.twoFactorEnabled;

  const isOn = (key: NotificationKey) => user?.preferences?.[key] !== false;

  const toggleNotification = async (key: NotificationKey) => {
    setSavingKey(key);
    setError('');
    setSuccess('');
    const next = !isOn(key);
    const result = await updateProfile({
      preferences: {
        newsletter: true,
        marketingEmails: true,
        orderEmails: true,
        stockEmails: true,
        sizePreference: user?.preferences?.sizePreference || 'M',
        favoriteCategories: user?.preferences?.favoriteCategories || [],
        ...user?.preferences,
        [key]: next,
      },
    });
    setSavingKey(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSuccess('Notification settings saved.');
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({
          confirmation,
          ...(password ? { password } : {}),
          ...(code ? { code } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || 'Could not delete the account.');
        return;
      }
      logout();
      router.push('/auth/login');
    } catch {
      setError('Could not delete the account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose which emails you receive, or delete this account.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
      )}

      <section className="space-y-3">
        <h3 className="font-medium text-gray-900 dark:text-white">Email notifications</h3>
        {NOTIFICATION_OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{option.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOn(option.key)}
              disabled={savingKey === option.key}
              onClick={() => toggleNotification(option.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                isOn(option.key) ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white mt-0.5 transition ${
                  isOn(option.key) ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Password reset and email verification messages are always sent.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-gray-900 dark:text-white">Privacy</h3>
        <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Delete my account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Removes your profile, addresses, cart, and wishlist. Past orders stay in the shop records so they can still be fulfilled.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDelete((open) => !open)}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              Delete
            </button>
          </div>

          {showDelete && (
            <div className="space-y-3">
              {user?.isAdmin ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Admin accounts cannot be deleted here.
                </p>
              ) : (
                <>
                  {!googleOnly && (
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Current password"
                      autoComplete="current-password"
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  )}
                  {needsCode && (
                    <input
                      type="text"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Authenticator or backup code"
                      autoComplete="one-time-code"
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  )}
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={deleteAccount}
                    disabled={deleting || confirmation !== 'DELETE'}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg"
                  >
                    {deleting ? 'Deleting…' : 'Delete account permanently'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
