"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '@/lib/services/auth-service';
import { tokenManager } from '@/lib/api-client';
import type { User, LoginRequest, RegisterRequest } from '@/lib/api-types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenManager.hasTokens()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        tokenManager.clearTokens();
      }
    } catch {
      setUser(null);
      tokenManager.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      if (response.data) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error?.detail || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      if (response.data) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error?.detail || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
