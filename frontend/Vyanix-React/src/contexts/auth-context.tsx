'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiClient, setAccessTokenInMemory, setRefreshCallback, setRefreshingState, isTokenRefreshing } from '@/lib/api/api-client';
import { clearQueryCache } from '@/lib/query-client';
import { authBroadcast } from '@/lib/auth-broadcast';
import type { LoginRequest, RegisterRequest, User, AuthSession } from '@/lib/types';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_LOCK_KEY = 'refreshTokenLock';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
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

function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
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
    // Clear auth state synchronously FIRST to prevent any in-flight queries from using stale state
    persistToken(null);
    setUser(null);
    clearQueryCache();

    // Broadcast logout to all tabs
    authBroadcast.broadcastLogout();

    // Fire and forget the API call - don't block UX
    try { await apiClient.logout(); } catch { /* ignore */ }

    refreshPromise = null;
    refreshQueue = [];
  }, [persistToken]);

  /**
   * Logout from all devices
   */
  const logoutFromAllDevices = useCallback(async () => {
    // Clear auth state synchronously FIRST
    persistToken(null);
    setUser(null);
    clearQueryCache();

    // Broadcast logout to all tabs
    authBroadcast.broadcastLogout();

    try { await apiClient.logoutFromAllDevices(); } catch { /* ignore */ }

    refreshPromise = null;
    refreshQueue = [];
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
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    if (hasBooted) return;
    setHasBooted(true);

    async function bootstrapAuth() {
      try {
        // Register refresh callback for 401 interceptor
        setRefreshCallback(() => refreshAccessToken());

        const response = await apiClient.refreshAccessToken();
        persistToken(response.data.accessToken);
        await refreshUser();
      } catch {
        persistToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
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
   * Proactive timer - schedule refresh before token expires
   */
  useEffect(() => {
    if (!accessToken) return;

    const expiry = getTokenExpiry(accessToken);
    if (!expiry) return;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    if (timeUntilExpiry <= 0) {
      // Token already expired, trigger refresh
      void refreshAccessToken();
      return;
    }

    // Fire refresh at 80% of token lifetime, or 2 minutes before expiry, whichever is earlier
    const refreshDelay = Math.min(timeUntilExpiry * 0.8, timeUntilExpiry - 2 * 60 * 1000);
    if (refreshDelay <= 0) {
      // Less than 2 minutes until expiry, refresh now
      void refreshAccessToken();
      return;
    }

    const timer = setTimeout(() => {
      if (!refreshPromise && !isTokenRefreshing()) {
        void refreshAccessToken();
      }
    }, refreshDelay);

    return () => clearTimeout(timer);
  }, [accessToken, refreshAccessToken]);

  /**
   * Visibility-triggered refresh - on tab focus, check token freshness
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && accessToken) {
      const expiry = getTokenExpiry(accessToken);
      if (expiry && Date.now() >= expiry && !isTokenRefreshing()) {
        // Token is stale, refresh silently
        void refreshAccessToken().catch(() => {
          // Refresh failed, logout
          void logout();
        });
      }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [accessToken, refreshAccessToken, logout]);

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
    initializing,
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
    initializing,
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
