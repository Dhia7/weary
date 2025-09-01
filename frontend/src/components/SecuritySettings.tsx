'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'Current password is required'),
  newPassword: z.string().trim().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().trim().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password cannot be the same as your current password",
  path: ["newPassword"],
});

const twoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers')
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export default function SecuritySettings() {
  const { user, changePassword, toggleTwoFactorAuth, verifyTwoFactorCode } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTwoFactorPassword, setShowTwoFactorPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isValid: isPasswordFormValid },
    reset: resetPasswordForm,
    watch: watchPassword
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange'
  });

  const {
    register: register2FA,
    handleSubmit: handle2FASubmit,
    formState: { errors: twoFactorErrors },
    reset: reset2FAForm
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema)
  });

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    // Additional validation check
    if (!data.currentPassword?.trim() || !data.newPassword?.trim() || !data.confirmPassword?.trim()) {
      setError('❌ All fields are required. Please fill in all password fields.');
      return;
    }

    if (data.newPassword.length < 6) {
      setError('❌ New password must be at least 6 characters long.');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      setError('❌ New passwords do not match. Please make sure both passwords are identical.');
      return;
    }

    if (data.currentPassword === data.newPassword) {
      setError('❌ New password cannot be the same as your current password. Please choose a different password.');
      return;
    }

    setIsChangingPassword(true);
    setError('');
    setSuccess('');

    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      
      if (result.success) {
        setSuccess(`✅ ${result.message}`);
        // Clear all password fields
        resetPasswordForm();
        // Reset password visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        // Enhanced error handling for specific cases
        if (result.message.includes('Current password is incorrect')) {
          setError('❌ Current password is incorrect. Please enter your current password correctly.');
        } else if (result.message.includes('New password cannot be the same as your current password')) {
          setError('❌ New password cannot be the same as your current password. Please choose a different password.');
        } else if (result.message.includes('Password must be at least 6 characters')) {
          setError('❌ New password must be at least 6 characters long.');
        } else if (result.message.includes('Password must contain at least one number')) {
          setError('❌ New password must contain at least one number.');
        } else if (result.message.includes('Current password is required')) {
          setError('❌ Please enter your current password.');
        } else {
          setError(`❌ ${result.message}`);
        }
      }
    } catch (err) {
      setError('❌ Network error. Please check your connection and try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onToggleTwoFactor = async (enable: boolean) => {
    setIsToggling2FA(true);
    setError('');
    setSuccess('');

    try {
      const result = await toggleTwoFactorAuth(enable, '');
      
      if (result.success) {
        if (enable && result.data) {
          setTwoFactorSecret(result.data.secret);
          setBackupCodes(result.data.backupCodes);
          setShowTwoFactorSetup(true);
        } else {
          setSuccess(`✅ ${result.message}`);
        }
      } else {
        // Enhanced error handling for 2FA
        if (result.message.includes('Password is incorrect')) {
          setError('❌ Password is incorrect. Please enter your current password to enable/disable 2FA.');
        } else if (result.message.includes('Password is required')) {
          setError('❌ Password is required to enable/disable two-factor authentication.');
        } else {
          setError(`❌ ${result.message}`);
        }
      }
    } catch (err) {
      setError('❌ Network error. Please check your connection and try again.');
    } finally {
      setIsToggling2FA(false);
    }
  };

  const onVerifyTwoFactor = async (data: TwoFactorFormData) => {
    setIsVerifying2FA(true);
    setError('');
    setSuccess('');

    try {
      const result = await verifyTwoFactorCode(data.code);
      
      if (result.success) {
        setSuccess('✅ Two-factor authentication verified successfully!');
        setShowTwoFactorSetup(false);
        reset2FAForm();
      } else {
        // Enhanced error handling for 2FA verification
        if (result.message.includes('Invalid two-factor authentication code')) {
          setError('❌ Invalid verification code. Please enter the 6-digit code from your authenticator app.');
        } else if (result.message.includes('Two-factor authentication is not enabled')) {
          setError('❌ Two-factor authentication is not enabled. Please enable it first.');
        } else if (result.message.includes('Code must be 6 digits')) {
          setError('❌ Verification code must be exactly 6 digits.');
        } else {
          setError(`❌ ${result.message}`);
        }
      }
    } catch (err) {
      setError('❌ Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Change Password
            </h2>
          </div>

                     <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  {...registerPassword('currentPassword')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  {...registerPassword('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  {...registerPassword('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !isPasswordFormValid}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              {isChangingPassword ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Change Password</span>
            </button>
          </form>
        </div>
      </motion.div>

      {/* Two-Factor Authentication Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  {user?.twoFactorEnabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 dark:text-green-400">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Disabled</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => onToggleTwoFactor(!user?.twoFactorEnabled)}
                disabled={isToggling2FA}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  user?.twoFactorEnabled
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {isToggling2FA ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  user?.twoFactorEnabled ? 'Disable' : 'Enable'
                )}
              </button>
            </div>

            {/* 2FA Setup Modal */}
            {showTwoFactorSetup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Set Up Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Use an authenticator app (like Google Authenticator or Authy) to scan this QR code or enter the secret manually.
                    </p>

                    <div className="space-y-4">
                      {/* Secret Key */}
                      <div>
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Secret Key
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={twoFactorSecret}
                            readOnly
                            className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 font-mono text-sm"
                          />
                          <button
                            onClick={() => copyToClipboard(twoFactorSecret)}
                            className="px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Backup Codes */}
                      <div>
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Backup Codes
                        </label>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-300 dark:border-blue-700">
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {backupCodes.map((code, index) => (
                              <div key={index} className="font-mono text-sm text-blue-900 dark:text-blue-100">
                                {code}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={downloadBackupCodes}
                            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-sm">Download Backup Codes</span>
                          </button>
                        </div>
                      </div>

                      {/* Verification Form */}
                      <form onSubmit={handle2FASubmit(onVerifyTwoFactor)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Verification Code
                          </label>
                          <input
                            {...register2FA('code')}
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            className="block w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {twoFactorErrors.code && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {twoFactorErrors.code.message}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={isVerifying2FA}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                          >
                            {isVerifying2FA ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            <span>Verify & Enable</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTwoFactorSetup(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error and Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Security Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Success</p>
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
