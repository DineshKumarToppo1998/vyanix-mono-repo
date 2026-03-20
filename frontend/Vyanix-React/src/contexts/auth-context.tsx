'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiClient, setAccessTokenInMemory } from '@/lib/api/api-client';
import { authBroadcast } from '@/lib/auth-broadcast';
import type { LoginRequest, RegisterRequest, User, AuthSession } from '@/lib/types';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_LOCK_KEY = 'refreshTokenLock';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutFromAllDevices: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getActiveSessions: () => Promise<SessionInfo[]>;
  revokeSession: (sessionId: string) => Promise<void>;
}

interface SessionInfo {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Refresh token queue management (prevent race conditions)
let refreshPromise: Promise<string> | null = null;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Acquire refresh lock to prevent multiple tabs from refreshing simultaneously
 */
async function acquireRefreshLock(): Promise<boolean> {
  const now = Date.now();
  const lockExpiry = 5000; // 5 second lock timeout
  
  try {
    const lockData = localStorage.getItem(REFRESH_LOCK_KEY);
    if (lockData) {
      const { timestamp } = JSON.parse(lockData);
      if (now - timestamp < lockExpiry) {
        return false; // Lock held by another tab
      }
    }
    
    localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ timestamp: now }));
    return true;
  } catch {
    return true;
  }
}

/**
 * Release refresh lock
 */
function releaseRefreshLock() {
  try {
    localStorage.removeItem(REFRESH_LOCK_KEY);
  } catch {
    // Ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Persist access token in memory ONLY (not localStorage)
   * Refresh token is stored in HTTP-only cookie by backend
   * 
   * CRITICAL: Must update both React state AND api-client module
   * so subsequent API requests include the Authorization header
   */
  const persistToken = useCallback((nextToken: string | null) => {
    // 1. Update React state (for UI components)
    setAccessToken(nextToken);
    
    // 2. Update api-client module (for API requests)
    // This MUST happen synchronously before any API calls
    setAccessTokenInMemory(nextToken);
    
    // Intentionally NOT storing in localStorage for security
    // Access tokens are memory-only to prevent XSS theft
  }, []);

  /**
   * Logout and broadcast to all tabs
   */
  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      persistToken(null);
      setUser(null);
      
      // Broadcast logout to all tabs
      authBroadcast.broadcastLogout();
      
      refreshPromise = null;
      refreshQueue = [];
    }
  }, [persistToken]);

  /**
   * Logout from all devices
   */
  const logoutFromAllDevices = useCallback(async () => {
    try {
      await apiClient.logoutFromAllDevices();
    } catch (error) {
      console.error('Logout all devices error:', error);
    } finally {
      persistToken(null);
      setUser(null);
      
      // Broadcast logout to all tabs
      authBroadcast.broadcastLogout();
      
      refreshPromise = null;
      refreshQueue = [];
    }
  }, [persistToken]);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      await logout();
      throw error;
    }
  }, [logout]);

  /**
   * Refresh access token using refresh token cookie
   * Implements queue to prevent multiple simultaneous refresh requests
   */
  const refreshAccessToken = useCallback(async (): Promise<string> => {
    // If refresh already in progress, queue this request
    if (refreshPromise) {
      return refreshPromise;
    }

    // Create new refresh promise
    refreshPromise = (async () => {
      try {
        setRefreshing(true);
        const response = await apiClient.refreshAccessToken();
        const newToken = response.data.accessToken;
        persistToken(newToken);
        
        // Resolve all queued requests
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];
        
        return newToken;
      } catch (error) {
        // Reject all queued requests
        refreshQueue.forEach(({ reject }) => reject(error as Error));
        refreshQueue = [];
        await logout();
        throw error;
      } finally {
        setRefreshing(false);
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }, [persistToken, logout]);

  /**
   * Handle API requests with automatic token refresh on 401
   */
  const handleRequestWithRetry = useCallback(async <T,>(
    requestFn: () => Promise<T>,
    isRetry = false
  ): Promise<T> => {
    try {
      return await requestFn();
    } catch (error: any) {
      // Check if it's a 401 error
      if (error?.status === 401 || error?.message?.includes('401')) {
        if (isRetry) {
          // Already retried, force logout
          await logout();
          throw error;
        }

        try {
          // Refresh token
          await refreshAccessToken();
          // Retry original request
          return await requestFn();
        } catch (refreshError) {
          // Refresh failed, logout
          await logout();
          throw refreshError;
        }
      }
      throw error;
    }
  }, [refreshAccessToken, logout]);

  /**
   * Listen for logout events from other tabs
   */
  useEffect(() => {
    const handleLogoutBroadcast = () => {
      console.log('[AuthContext] Received logout broadcast from another tab');
      persistToken(null);
      setUser(null);
    };

    authBroadcast.onLogout(handleLogoutBroadcast);

    return () => {
      authBroadcast.close();
    };
  }, [persistToken]);

  /**
   * Bootstrap authentication on mount
   * Access token is memory-only, so we refresh from cookie on page load
   */
  useEffect(() => {
    async function bootstrapAuth() {
      try {
        // No access token in memory - refresh from HttpOnly cookie
        // This is expected behavior after page refresh
        try {
          const response = await apiClient.refreshAccessToken();
          // Use persistToken to update both state and api-client module
          persistToken(response.data.accessToken);
          await refreshUser();
        } catch (refreshError: any) {
          // No valid refresh cookie - user is logged out
          // Check for specific error codes to show appropriate message
          if (refreshError?.code === 'SESSION_LIMIT_EXCEEDED') {
            console.log('Session limit exceeded - user was evicted');
          } else if (refreshError?.code === 'SECURITY_THEFT_DETECTED') {
            console.log('Security: token theft detected');
          }
          persistToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    void bootstrapAuth();
  }, [refreshUser, persistToken]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (payload: LoginRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.login(payload);
      // Access token in response body (memory only)
      persistToken(response.data.accessToken);
      const me = await apiClient.getCurrentUser();
      setUser(me.data);
      
      // Broadcast login to other tabs (optional - for multi-tab sync)
      // authBroadcast.broadcastLogin(me.data.id);
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  /**
   * Register new user
   */
  const register = useCallback(async (payload: RegisterRequest) => {
    setLoading(true);
    try {
      await apiClient.register(payload);
      await login({ email: payload.email, password: payload.password });
    } finally {
      setLoading(false);
    }
  }, [login]);

  /**
   * Get active sessions for current user
   */
  const getActiveSessions = useCallback(async () => {
    const response = await apiClient.getActiveSessions();
    return response.data as SessionInfo[];
  }, []);

  /**
   * Revoke specific session
   */
  const revokeSession = useCallback(async (sessionId: string) => {
    await apiClient.revokeSession(sessionId);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    loading,
    login,
    register,
    logout,
    logoutFromAllDevices,
    refreshUser,
    getActiveSessions,
    revokeSession,
  }), [
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    logoutFromAllDevices,
    refreshUser,
    getActiveSessions,
    revokeSession,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
