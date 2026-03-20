/**
 * Authentication error handler with user-friendly messages.
 * 
 * Maps backend error codes to user-friendly messages for display.
 * 
 * Usage:
 * ```typescript
 * try {
 *   await apiClient.someProtectedEndpoint();
 * } catch (error) {
 *   const message = getAuthErrorMessage(error.code);
 *   showToast(message);
 * }
 * ```
 */

/**
 * Get user-friendly error message from error code
 */
export function getAuthErrorMessage(code: string | undefined): string {
  const messages: Record<string, string> = {
    // Session management
    SESSION_LIMIT_EXCEEDED: 'You were signed out because you exceeded the maximum number of active devices (5).',
    SESSION_REVOKED: 'Your session has been revoked.',
    
    // Security events
    SECURITY_THEFT_DETECTED: 'Your session was revoked due to suspicious activity. Please log in again.',
    
    // Permission changes
    PERMISSIONS_CHANGED: 'Your permissions have changed. Please log in again.',
    TOKEN_INVALIDATED: 'Your session is no longer valid. Please log in again.',
    
    // Password changes
    PASSWORD_CHANGED: 'Your password was changed. Please log in again.',
    INVALID_PASSWORD: 'Current password is incorrect.',
    
    // Token expiration
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    SESSION_EXPIRED: 'Your session has expired due to inactivity. Please log in again.',
    
    // Account status
    ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
    
    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
    
    // Token issues
    TOKEN_MISSING: 'Authentication token is missing.',
    TOKEN_INVALID: 'Authentication token is invalid.',
    TOKEN_NOT_FOUND: 'Session not found.',
    
    // Validation errors
    VALIDATION_ERROR: 'Please check your input and try again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    
    // Generic errors
    UNAUTHORIZED: 'Please log in to continue.',
    ACCESS_DENIED: 'You do not have permission to access this resource.',
    RESOURCE_NOT_FOUND: 'The requested resource was not found.',
    
    // System errors
    SERVICE_BUSY: 'Service is temporarily busy. Please try again.',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  };

  return messages[code ?? ''] ?? 'An authentication error occurred. Please log in again.';
}

/**
 * Handle authentication error and show toast
 */
export function handleAuthError(
  error: any,
  showToast: (message: string, type?: 'error' | 'warning' | 'info') => void
) {
  const code = error?.code;
  const userMessage = getAuthErrorMessage(code);
  
  // Determine toast type based on error severity
  let type: 'error' | 'warning' | 'info' = 'error';
  
  if (code === 'SESSION_LIMIT_EXCEEDED') {
    type = 'warning';
  } else if (code === 'RATE_LIMIT_EXCEEDED') {
    type = 'info';
  } else if (code === 'SECURITY_THEFT_DETECTED') {
    type = 'error';
  }
  
  showToast(userMessage, type);
}

/**
 * Check if error requires logout
 */
export function requiresLogout(error: any): boolean {
  const logoutCodes = [
    'SECURITY_THEFT_DETECTED',
    'TOKEN_INVALIDATED',
    'PERMISSIONS_CHANGED',
    'PASSWORD_CHANGED',
    'ACCOUNT_DISABLED',
    'SESSION_EXPIRED',
    'TOKEN_EXPIRED',
    'SESSION_LIMIT_EXCEEDED',
  ];
  
  return logoutCodes.includes(error?.code);
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error?.code === 'RATE_LIMIT_EXCEEDED' || error?.status === 429;
}

/**
 * Get retry-after seconds from rate limit error
 */
export function getRetryAfterSeconds(error: any): number | null {
  if (error?.payload?.retryAfterSeconds) {
    return error.payload.retryAfterSeconds;
  }
  return null;
}
