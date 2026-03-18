import type {
  Address,
  ApiProduct,
  ApiResponse,
  AuthSession,
  Cart,
  Category,
  LoginRequest,
  Order,
  PageResponse,
  Product,
  RegisterRequest,
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

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('authToken');
}

function createHeaders(headers?: HeadersInit) {
  const resolvedHeaders = new Headers(headers);
  const token = getAuthToken();

  if (token) {
    resolvedHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (!resolvedHeaders.has('Content-Type')) {
    resolvedHeaders.set('Content-Type', 'application/json');
  }

  return resolvedHeaders;
}

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

export async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: createHeaders(init?.headers),
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json()) as ApiResponse<T>) : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed');
  }

  return payload ?? ({ success: true, data: null as T } satisfies ApiResponse<T>);
}

export const apiClient = {
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

  register: async (payload: RegisterRequest) => {
    const response = await request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...response, data: normalizeUser(response.data) } satisfies ApiResponse<User>;
  },

  login: async (payload: LoginRequest) => {
    return request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCurrentUser: async () => {
    const response = await request<User>('/auth/me', { method: 'GET' });
    return { ...response, data: normalizeUser(response.data) } satisfies ApiResponse<User>;
  },

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
};
