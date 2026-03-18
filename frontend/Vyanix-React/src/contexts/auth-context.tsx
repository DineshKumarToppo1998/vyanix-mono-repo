'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api/api-client';
import type { LoginRequest, RegisterRequest, User } from '@/lib/types';

const AUTH_TOKEN_KEY = 'authToken';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((nextToken: string | null) => {
    setToken(nextToken);

    if (typeof window === 'undefined') {
      return;
    }

    if (nextToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);
        await refreshUser();
      } finally {
        setLoading(false);
      }
    }

    void bootstrapAuth();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.login(payload);
      persistToken(response.data.token);
      const me = await apiClient.getCurrentUser();
      setUser(me.data);
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  const register = useCallback(async (payload: RegisterRequest) => {
    setLoading(true);
    try {
      await apiClient.register(payload);
      await login({ email: payload.email, password: payload.password });
    } finally {
      setLoading(false);
    }
  }, [login]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, loading, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
