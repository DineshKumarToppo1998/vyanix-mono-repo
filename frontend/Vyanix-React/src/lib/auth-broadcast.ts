/**
 * Cross-tab authentication broadcast utility.
 * 
 * Uses BroadcastChannel API for modern browsers with localStorage fallback
 * for older browsers (iOS Safari < 15.4, Android WebView < 96).
 * 
 * Features:
 * - BroadcastChannel for modern browsers (efficient, event-based)
 * - localStorage storage event fallback for older browsers
 * - Tab ID tracking to prevent self-triggering
 * - Ephemeral storage (localStorage key removed immediately after broadcast)
 * - No tokens stored - only broadcast events
 * 
 * Usage:
 * ```typescript
 * // Broadcast logout
 * authBroadcast.broadcastLogout();
 * 
 * // Listen for logout
 * authBroadcast.onLogout(() => {
 *   // Clear auth state
 * });
 * ```
 */

const AUTH_CHANNEL_NAME = 'vyanix-auth';
const AUTH_STORAGE_KEY = 'vyanix-auth-broadcast';

export interface AuthBroadcastEvent {
  type: 'LOGOUT' | 'LOGIN' | 'TOKEN_REFRESH';
  timestamp: number;
  userId?: string;
  tabId?: string;  // Prevent self-triggering
}

export class AuthBroadcastChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: AuthBroadcastEvent) => void> = [];
  private tabId: string;
  private storageHandler: ((event: StorageEvent) => void) | null = null;

  constructor() {
    this.tabId = this.generateTabId();
    
    // Try BroadcastChannel first (modern browsers)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.listeners.forEach(listener => listener(event.data));
        };
        console.log('[AuthBroadcast] Using BroadcastChannel for cross-tab auth');
      } catch (error) {
        console.warn('[AuthBroadcast] BroadcastChannel failed, falling back to localStorage:', error);
        this.setupStorageFallback();
      }
    } else {
      // Fallback to localStorage storage events (older browsers)
      this.setupStorageFallback();
      console.log('[AuthBroadcast] Using localStorage fallback for cross-tab auth');
    }
  }

  /**
   * Generate unique tab ID to prevent self-triggering
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Setup localStorage storage event fallback
   * This is used when BroadcastChannel is not available
   */
  private setupStorageFallback() {
    this.storageHandler = (event: StorageEvent) => {
      // Only handle our auth broadcast key
      if (event.key !== AUTH_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const broadcastEvent: AuthBroadcastEvent = JSON.parse(event.newValue);
        
        // Ignore events from this tab (prevent self-triggering)
        if (broadcastEvent.tabId === this.tabId) {
          return;
        }

        // Notify listeners
        this.listeners.forEach(listener => listener(broadcastEvent));
        
        // Clean up the key immediately (it's just a signal, not persistent storage)
        // Use setTimeout to avoid interfering with the storage event
        setTimeout(() => {
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {
            // Ignore cleanup errors
          }
        }, 0);
        
      } catch (error) {
        console.error('[AuthBroadcast] Failed to parse auth broadcast event:', error);
      }
    };

    window.addEventListener('storage', this.storageHandler);
  }

  /**
   * Broadcast event to all tabs
   */
  broadcast(event: Omit<AuthBroadcastEvent, 'tabId'>) {
    const fullEvent: AuthBroadcastEvent = {
      ...event,
      tabId: this.tabId,
    };

    if (this.channel) {
      // BroadcastChannel method (modern browsers)
      try {
        this.channel.postMessage(fullEvent);
      } catch (error) {
        console.warn('[AuthBroadcast] BroadcastChannel postMessage failed:', error);
        // Fallback to localStorage
        this.broadcastViaStorage(fullEvent);
      }
    } else {
      // localStorage fallback method (older browsers)
      this.broadcastViaStorage(fullEvent);
    }
  }

  /**
   * Broadcast via localStorage (fallback method)
   */
  private broadcastViaStorage(event: AuthBroadcastEvent) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(event));
      // Key will be removed by other tabs via storage event handler
      // Our own tab ignores the event (tabId check)
    } catch (error) {
      console.error('[AuthBroadcast] Failed to broadcast via localStorage:', error);
    }
  }

  /**
   * Broadcast logout event to all tabs
   */
  broadcastLogout(userId?: string) {
    this.broadcast({
      type: 'LOGOUT',
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Broadcast login event to all tabs
   */
  broadcastLogin(userId: string) {
    this.broadcast({
      type: 'LOGIN',
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Listen for auth events from other tabs
   */
  onLogout(callback: () => void) {
    this.listeners.push((event) => {
      if (event.type === 'LOGOUT') {
        callback();
      }
    });
  }

  /**
   * Listen for login events
   */
  onLogin(callback: (userId: string) => void) {
    this.listeners.push((event) => {
      if (event.type === 'LOGIN' && event.userId) {
        callback(event.userId);
      }
    });
  }

  /**
   * Close the channel (cleanup)
   * Call this when unmounting the app
   */
  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
    this.listeners = [];
  }
}

// Singleton instance
export const authBroadcast = new AuthBroadcastChannel();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authBroadcast.close();
  });
}
