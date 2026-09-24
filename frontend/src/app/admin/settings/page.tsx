'use client';

import { useEffect, useState } from 'react';
import { Settings, Database, Shield, Bell, Save } from 'lucide-react';
import { useAuthorizedFetch } from '@/lib/admin';

type AdminSettings = {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  timezone: string;
  requireAdmin2FA: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  notifyNewUsers: boolean;
  notifyOrders: boolean;
  notifySystemAlerts: boolean;
};

const EMPTY_SETTINGS: AdminSettings = {
  siteName: 'Swisia',
  siteUrl: 'http://localhost:3000',
  contactEmail: '',
  timezone: 'UTC',
  requireAdmin2FA: true,
  sessionTimeoutMinutes: 30,
  passwordMinLength: 6,
  notifyNewUsers: true,
  notifyOrders: true,
  notifySystemAlerts: true,
};

export default function AdminSettingsPage() {
  const fetcher = useAuthorizedFetch();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(true);
  const [settings, setSettings] = useState<AdminSettings>(EMPTY_SETTINGS);
  const [stats, setStats] = useState({
    databaseType: 'PostgreSQL',
    connected: false,
    totalUsers: '—',
    databaseSize: '—',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetcher('/admin/settings');
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Could not load settings');
        }
        if (cancelled) return;
        setSettings({ ...EMPTY_SETTINGS, ...data.data.settings });
        if (data.data.stats) {
          setStats({
            databaseType: data.data.stats.databaseType || 'PostgreSQL',
            connected: Boolean(data.data.stats.connected),
            totalUsers: String(data.data.stats.totalUsers ?? '—'),
            databaseSize: data.data.stats.databaseSize || '—',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setMessageOk(false);
          setMessage(error instanceof Error ? error.message : 'Could not load settings');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  const update = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetcher('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not save settings');
      }
      setSettings({ ...EMPTY_SETTINGS, ...data.data.settings });
      setMessageOk(true);
      setMessage('Settings saved.');
    } catch (error) {
      setMessageOk(false);
      setMessage(error instanceof Error ? error.message : 'Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'database', name: 'Database', icon: Database },
  ];

  const inputClass =
    'mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          messageOk
            ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Name</label>
                <input id="site-name" type="text" value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="site-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site URL</label>
                <input id="site-url" type="url" value={settings.siteUrl} onChange={(e) => update('siteUrl', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label>
                <input id="contact-email" type="email" value={settings.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                <select id="timezone" value={settings.timezone} onChange={(e) => update('timezone', e.target.value)} className={inputClass}>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for all admin accounts</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="Require 2FA for all admin accounts"
                  checked={settings.requireAdmin2FA}
                  onChange={(e) => update('requireAdmin2FA', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Session Timeout</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically log out inactive users</p>
                </div>
                <select
                  aria-label="Session Timeout"
                  value={String(settings.sessionTimeoutMinutes)}
                  onChange={(e) => update('sessionTimeoutMinutes', Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Password Policy</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Minimum password requirements</p>
                </div>
                <select
                  aria-label="Password Policy"
                  value={String(settings.passwordMinLength)}
                  onChange={(e) => update('passwordMinLength', Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="6">6 characters</option>
                  <option value="8">8 characters</option>
                  <option value="12">12 characters</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h3>
            <div className="space-y-4">
              {([
                ['notifyNewUsers', 'New User Registration', 'Get notified when new users register'],
                ['notifyOrders', 'Order Notifications', 'Get notified of new orders'],
                ['notifySystemAlerts', 'System Alerts', 'Get notified of system issues'],
              ] as const).map(([key, title, description]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label={title}
                    checked={settings[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Database Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Database Type</label>
                <input type="text" value={stats.databaseType} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-600`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Connection Status</label>
                <div className="mt-1 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${stats.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-sm ${stats.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                    {stats.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Users</label>
                <input type="text" value={stats.totalUsers} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-600`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Database Size</label>
                <input type="text" value={stats.databaseSize} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-600`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
