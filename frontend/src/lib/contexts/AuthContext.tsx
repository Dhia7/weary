'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getApiErrorMessage } from '@/lib/api';

interface UserAddress {
  id?: number;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  isAdmin?: boolean;
  role?: 'customer' | 'staff' | 'admin';
  twoFactorEnabled?: boolean;
  createdAt?: string;
  addresses?: UserAddress[];
  preferences?: {
    newsletter: boolean;
    marketingEmails: boolean;
    sizePreference: string;
    favoriteCategories: string[];
  };
}

interface AuthContextType {
  user: User | null;
  /** Present when a cookie session exists (value is opaque; do not send as Bearer). */
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ success: boolean; message: string; user?: User; code?: string }>;
  signup: (userData: SignupData) => Promise<{
    success: boolean;
    message: string;
    user?: User;
    requiresEmailVerification?: boolean;
    emailSent?: boolean;
  }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (credential: string) => Promise<{
    success: boolean;
    message: string;
    user?: User;
    code?: string;
    twoFactorToken?: string;
  }>;
  completeTwoFactorLogin: (
    twoFactorToken: string,
    twoFactorCode: string
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message: string }>;
  updateProfileComprehensive: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferences?: {
      newsletter?: boolean;
      marketingEmails?: boolean;
      sizePreference?: string;
      favoriteCategories?: string[];
    };
    addresses?: Array<{
      type: 'home' | 'work' | 'other';
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      isDefault: boolean;
    }>;
  }) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  toggleTwoFactorAuth: (
    enable: boolean,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
    data?: { otpauthUrl?: string; secret?: string; backupCodes?: string[]; pending?: boolean };
  }>;
  verifyTwoFactorCode: (
    code: string
  ) => Promise<{ success: boolean; message: string; data?: { backupCodes?: string[]; enabled?: boolean } }>;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const SESSION_FLAG = 'cookie-session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    // Clear legacy localStorage JWT if present
    localStorage.removeItem('token');
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiFetch('/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        setToken(SESSION_FLAG);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...(twoFactorCode ? { twoFactorCode } : {}),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        setToken(SESSION_FLAG);
        return { success: true, message: data.message, user: data.data.user };
      }
      return {
        success: false,
        message: getApiErrorMessage(response, data),
        code: data.code,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const payload = data.data;
        setUser(null);
        setToken(null);
        return {
          success: true,
          message: data.message,
          user: payload?.user,
          requiresEmailVerification: payload?.requiresEmailVerification,
          emailSent: payload?.emailSent,
        };
      }
      return { success: false, message: getApiErrorMessage(response, data) };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.data.user);
        setToken(SESSION_FLAG);
        return { success: true, message: data.message, user: data.data.user };
      }
      return {
        success: false,
        message: getApiErrorMessage(response, data),
        code: data.code,
        twoFactorToken: data.data?.twoFactorToken,
      };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const completeTwoFactorLogin = async (twoFactorToken: string, twoFactorCode: string) => {
    try {
      const response = await apiFetch('/auth/2fa/login', {
        method: 'POST',
        body: JSON.stringify({ twoFactorToken, twoFactorCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.data.user);
        setToken(SESSION_FLAG);
        return { success: true, message: data.message, user: data.data.user };
      }
      return { success: false, message: getApiErrorMessage(response, data) };
    } catch (error) {
      console.error('Complete 2FA login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || 'Request processed.' };
      }
      return { success: false, message: getApiErrorMessage(response, data) };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    void apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  const refreshUser = async () => {
    try {
      await fetchUserProfile();
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiFetch('/auth/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser(responseData.data.user);
        return { success: true, message: responseData.message };
      }

      return { success: false, message: responseData.message || 'Failed to upload profile image' };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, ...responseData.data.user } : null));
        return { success: true, message: responseData.message };
      }
      return { success: false, message: responseData.message || 'Update failed' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const updateProfileComprehensive = async (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferences?: {
      newsletter?: boolean;
      marketingEmails?: boolean;
      sizePreference?: string;
      favoriteCategories?: string[];
    };
    addresses?: Array<{
      type: 'home' | 'work' | 'other';
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      isDefault: boolean;
    }>;
  }) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await apiFetch('/auth/profile/update', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, ...responseData.data.user } : null));
        return { success: true, message: responseData.message };
      }
      return { success: false, message: responseData.message || 'Update failed' };
    } catch (error) {
      console.error('Update profile comprehensive error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const responseData = await response.json();

      if (response.ok) {
        try {
          await fetchUserProfile();
        } catch (profileError) {
          console.warn('Could not refresh user profile after password change:', profileError);
        }
        return { success: true, message: responseData.message };
      }
      if (response.status === 401) {
        logout();
        return { success: false, message: 'Session expired. Please log in again.' };
      }
      return { success: false, message: responseData.message || 'Password change failed' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  };

  const toggleTwoFactorAuth = async (enable: boolean, password: string) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await apiFetch('/auth/2fa', {
        method: 'PUT',
        body: JSON.stringify({ enable, password }),
      });

      const responseData = await response.json();

      if (response.ok) {
        if (!enable) {
          await refreshUser();
        }
        // Pending enable: do not mark twoFactorEnabled until verify
        return { success: true, message: responseData.message, data: responseData.data };
      }
      return { success: false, message: responseData.message || '2FA toggle failed' };
    } catch (error) {
      console.error('Toggle 2FA error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const verifyTwoFactorCode = async (code: string) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await apiFetch('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      const responseData = await response.json();

      if (response.ok) {
        await refreshUser();
        return {
          success: true,
          message: responseData.message,
          data: responseData.data,
        };
      }
      return { success: false, message: responseData.message || '2FA verification failed' };
    } catch (error) {
      console.error('Verify 2FA error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    signup,
    resendVerificationEmail,
    loginWithGoogle,
    completeTwoFactorLogin,
    logout,
    refreshUser,
    uploadAvatar,
    updateProfile,
    updateProfileComprehensive,
    changePassword,
    toggleTwoFactorAuth,
    verifyTwoFactorCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
