import type {
  Address,
  ApiProduct,
  ApiResponse,
  AuthSession,
  AuthRefreshResponse,
  Cart,
  Category,
  LoginRequest,
  Order,
  PageResponse,
  Product,
  RegisterRequest,
  SessionInfo,
  User,
} from '../types';
import {
  getApiBaseUrl,
  normalizeAddress,
  normalizeCart,
  normalizeCategory,
  normalizeOrder,
  normalizeProduct,
  normalizeUser,
} from '../storefront';

const AUTH_TOKEN_KEY = 'authToken';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Module-level variable to store access token in memory
 * This allows the api-client to access the token without relying on React state
 * Updated by auth-context.tsx via setAccessTokenInMemory()
 */
let accessTokenInMemory: string | null = null;

/**
 * Get the current access token from memory
 * Called by request interceptor on every request to get fresh token
 */
export function getAccessTokenInMemory(): string | null {
  return accessTokenInMemory;
}

/**
 * Set the access token in memory
 * Called by auth-context.tsx after login/refresh
 */
export function setAccessTokenInMemory(token: string | null): void {
  accessTokenInMemory = token;
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`));

  return match ? match.split('=')[1] : null;
}

/**
 * Get auth token from memory
 * Always reads fresh value at request time - never cached
 * 
 * SECURITY: Memory-only storage (no localStorage)
 * - Prevents XSS token theft
 * - After page refresh, token is restored via /auth/refresh endpoint
 * - Uses HttpOnly refresh token cookie (not accessible to JavaScript)
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Read from module-level memory variable (set by auth-context)
  return accessTokenInMemory;
}

/**
 * Create headers with auth and CSRF tokens
 */
function createHeaders(headers?: HeadersInit, includeAuth = true, includeCsrf = true) {
  const resolvedHeaders = new Headers(headers);
  
  // Include auth token if requested and available
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      resolvedHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  // Include CSRF token for state-changing requests
  if (includeCsrf) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      resolvedHeaders.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  if (!resolvedHeaders.has('Content-Type')) {
    resolvedHeaders.set('Content-Type', 'application/json');
  }

  return resolvedHeaders;
}

/**
 * API error with code for frontend handling
 */
export interface ApiError extends Error {
  status?: number;
  code?: string;
  payload?: ApiResponse<unknown>;
}

/**
 * Make API request with error handling
 */
export async function request<T>(
  path: string,
  init?: RequestInit,
  includeAuth = true,
  includeCsrf = true
): Promise<ApiResponse<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: createHeaders(init?.headers, includeAuth, includeCsrf),
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json()) as ApiResponse<T>) : undefined;

  if (!response.ok) {
    const error = new Error(payload?.message ?? 'Request failed') as ApiError;
    error.status = response.status;
    error.payload = payload;
    error.code = (payload as any)?.code;  // Extract error code
    throw error;
  }

  return payload ?? ({ success: true, data: null as T } satisfies ApiResponse<T>);
}

/**
 * API client with all endpoints
 */
export const apiClient = {
  // ============ Product Endpoints ============
  
  getProducts: async (params?: {
    categorySlug?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await request<PageResponse<ApiProduct>>(`/products${createUrl('', params).search}`, { method: 'GET' });
    return {
      success: response.success,
      data: {
        ...response.data,
        content: response.data.content.map(normalizeProduct),
      },
    } satisfies ApiResponse<PageResponse<Product>>;
  },

  getProductById: async (id: string) => {
    const response = await request<ApiProduct>(`/products/${id}`, { method: 'GET' });
    return { ...response, data: normalizeProduct(response.data) } satisfies ApiResponse<Product>;
  },

  getProductBySlug: async (slug: string) => {
    const response = await request<ApiProduct>(`/products/slug/${slug}`, { method: 'GET' });
    return { ...response, data: normalizeProduct(response.data) } satisfies ApiResponse<Product>;
  },

  getCategories: async () => {
    const response = await request<Category[]>('/categories', { method: 'GET' });
    return {
      ...response,
      data: response.data.map(normalizeCategory),
    } satisfies ApiResponse<Category[]>;
  },

  getCategoryProducts: async (slug: string) => {
    const response = await request<ApiProduct[]>(`/categories/${slug}/products`, { method: 'GET' });
    return { ...response, data: response.data.map(normalizeProduct) } satisfies ApiResponse<Product[]>;
  },

  searchProducts: async (query: string, params?: { page?: number; size?: number }) => {
    const queryString = createUrl('', {
      q: query,
      page: params?.page,
      size: params?.size,
    }).search;
    const response = await request<PageResponse<ApiProduct>>(`/products/search${queryString}`, { method: 'GET' });
    return {
      success: response.success,
      data: {
        ...response.data,
        content: response.data.content.map(normalizeProduct),
      },
    } satisfies ApiResponse<PageResponse<Product>>;
  },

  // ============ Auth Endpoints ============

  register: async (payload: RegisterRequest) => {
    return request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false, false);  // No auth, no CSRF for register
  },

  login: async (payload: LoginRequest) => {
    return request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false, false);  // No auth, no CSRF for login
  },

  /**
   * Refresh access token using refresh token cookie
   */
  refreshAccessToken: async () => {
    return request<AuthRefreshResponse>('/auth/refresh', {
      method: 'POST',
    }, false, true);  // No auth header, but include CSRF
  },

  /**
   * Logout - revoke refresh token and clear cookie
   */
  logout: async () => {
    return request<null>('/auth/logout', {
      method: 'POST',
    }, true, true);
  },

  /**
   * Logout from all devices
   */
  logoutFromAllDevices: async () => {
    return request<null>('/auth/logout/all', {
      method: 'POST',
    }, true, true);
  },

  getCurrentUser: async () => {
    const response = await request<User>('/auth/me', { method: 'GET' });
    return { ...response, data: normalizeUser(response.data) } satisfies ApiResponse<User>;
  },

  /**
   * Get active sessions for current user
   */
  getActiveSessions: async () => {
    return request<SessionInfo[]>('/auth/sessions', { method: 'GET' });
  },

  /**
   * Revoke specific session
   */
  revokeSession: async (sessionId: string) => {
    return request<null>(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  },

  // ============ Cart Endpoints ============

  getCart: async () => {
    const response = await request<any>('/cart', { method: 'GET' });
    return { ...response, data: normalizeCart(response.data) } satisfies ApiResponse<Cart>;
  },

  addToCart: async (skuId: string, quantity: number) => {
    const response = await request<any>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ skuId, quantity }),
    });
    return { ...response, data: normalizeCart(response.data) } satisfies ApiResponse<Cart>;
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await request<any>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    return { ...response, data: normalizeCart(response.data) } satisfies ApiResponse<Cart>;
  },

  removeFromCart: async (itemId: string) => {
    const response = await request<any>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    return { ...response, data: normalizeCart(response.data) } satisfies ApiResponse<Cart>;
  },

  clearCart: async () => {
    return request<null>('/cart/clear', { method: 'DELETE' });
  },

  // ============ Order Endpoints ============

  createOrder: async (
    address: Address,
    items: { skuId: string; quantity: number }[],
    idempotencyKey: string
  ) => {
    const response = await request<any>('/orders', {
      method: 'POST',
      headers: createHeaders({ 'Idempotency-Key': idempotencyKey }),
      body: JSON.stringify({
        shippingAddress: address,
        items,
      }),
    });
    return { ...response, data: normalizeOrder(response.data) } satisfies ApiResponse<Order>;
  },

  getOrders: async () => {
    const response = await request<any[]>('/orders', { method: 'GET' });
    return { ...response, data: response.data.map(normalizeOrder) } satisfies ApiResponse<Order[]>;
  },

  getOrderById: async (orderId: string) => {
    const response = await request<any>(`/orders/${orderId}`, { method: 'GET' });
    return { ...response, data: normalizeOrder(response.data) } satisfies ApiResponse<Order>;
  },

  // ============ Address Endpoints ============

  getAddresses: async () => {
    const response = await request<any[]>('/addresses', { method: 'GET' });
    return { ...response, data: response.data.map(normalizeAddress) } satisfies ApiResponse<Address[]>;
  },

  addAddress: async (address: Omit<Address, 'id'>) => {
    const response = await request<any>('/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
    return { ...response, data: normalizeAddress(response.data) } satisfies ApiResponse<Address>;
  },

  updateAddress: async (addressId: string, address: Omit<Address, 'id'>) => {
    const response = await request<any>(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
    return { ...response, data: normalizeAddress(response.data) } satisfies ApiResponse<Address>;
  },

  deleteAddress: async (addressId: string) => {
    return request<null>(`/addresses/${addressId}`, { method: 'DELETE' });
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    const authHeader = localStorage.getItem('authToken');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const response = await request<void>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
      headers: { 'Authorization': authHeader },
    });
    return response;
  },
};

/**
 * Create URL with query params
 */
export function createUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  if (!params) {
    return url;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}
