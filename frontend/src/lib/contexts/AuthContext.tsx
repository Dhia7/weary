'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  isEmailVerified: boolean;
  isAdmin?: boolean;
  twoFactorEnabled?: boolean;
  preferences?: {
    newsletter: boolean;
    marketingEmails: boolean;
    sizePreference: string;
    favoriteCategories: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
  toggleTwoFactorAuth: (enable: boolean, password: string) => Promise<{ success: boolean; message: string; data?: { secret?: string; backupCodes?: string[] } }>; 
  verifyTwoFactorCode: (code: string) => Promise<{ success: boolean; message: string }>;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      console.log('fetchUserProfile: Fetching user profile from:', `${API_BASE_URL}/auth/me`);
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('fetchUserProfile: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('fetchUserProfile: Received user data:', data.data.user);
        setUser(data.data.user);
      } else {
        console.log('fetchUserProfile: Response not ok, removing token');
        // Token is invalid, remove it
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        setToken(data.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.data.token);
        }
        return { success: true, message: data.message, user: data.data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        setToken(data.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.data.token);
        }
        return { success: true, message: data.message, user: data.data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  const refreshUser = async () => {
    if (!token) {
      console.log('refreshUser: No token available');
      return;
    }
    
    console.log('refreshUser: Starting user profile refresh...');
    try {
      await fetchUserProfile(token);
      console.log('refreshUser: User profile refreshed successfully');
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser(prev => prev ? { ...prev, ...responseData.data.user } : null);
        return { success: true, message: responseData.message };
      } else {
        return { success: false, message: responseData.message || 'Update failed' };
      }
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
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser(prev => prev ? { ...prev, ...responseData.data.user } : null);
        return { success: true, message: responseData.message };
      } else {
        return { success: false, message: responseData.message || 'Update failed' };
      }
    } catch (error) {
      console.error('Update profile comprehensive error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Password changed successfully, refresh user profile to ensure everything is in sync
        try {
          await fetchUserProfile(token);
        } catch (profileError) {
          console.warn('Could not refresh user profile after password change:', profileError);
          // This is not critical, the password change was successful
        }
        
        return { success: true, message: responseData.message };
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          // Token might be invalid, clear it
          logout();
          return { success: false, message: 'Session expired. Please log in again.' };
        }
        return { success: false, message: responseData.message || 'Password change failed' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  };

  const toggleTwoFactorAuth = async (enable: boolean, password: string) => {
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enable, password }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Update user state with 2FA status
        setUser(prev => prev ? { ...prev, twoFactorEnabled: enable } : null);
        return { success: true, message: responseData.message, data: responseData.data };
      } else {
        return { success: false, message: responseData.message || '2FA toggle failed' };
      }
    } catch (error) {
      console.error('Toggle 2FA error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const verifyTwoFactorCode = async (code: string) => {
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const responseData = await response.json();

      if (response.ok) {
        return { success: true, message: responseData.message };
      } else {
        return { success: false, message: responseData.message || '2FA verification failed' };
      }
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
    logout,
    refreshUser,
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

