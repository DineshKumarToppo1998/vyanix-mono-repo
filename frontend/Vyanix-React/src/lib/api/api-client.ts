import { Product, Category, Cart, CartItem, Order, Address } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

interface ApiResponse<T> {
  requestId: string;
  statusCode: number;
  message: string;
  data: T;
}

export const apiClient = {
  // Products
  getProducts: async (params?: {
    categorySlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
  }) => {
    const url = new URL(`${API_BASE_URL}/products`, window.location.origin);
    if (params?.categorySlug) url.searchParams.set('categorySlug', params.categorySlug);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.minPrice !== undefined) url.searchParams.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) url.searchParams.set('maxPrice', params.maxPrice.toString());
    if (params?.page) url.searchParams.set('page', params.page.toString());
    if (params?.size) url.searchParams.set('size', params.size.toString());

    const response = await fetch(url.toString());
    const data = await response.json();
    return data as ApiResponse<{ content: Product[]; totalPages: number }>;
  },

  getProductById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    const data = await response.json();
    return data as ApiResponse<Product>;
  },

  getProductBySlug: async (slug: string) => {
    const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
    const data = await response.json();
    return data as ApiResponse<Product>;
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const data = await response.json();
    return data as ApiResponse<Category[]>;
  },

  getCategoryProducts: async (slug: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${slug}/products`);
    const data = await response.json();
    return data as ApiResponse<Product[]>;
  },

  searchProducts: async (query: string, params?: { page?: number; size?: number }) => {
    const url = new URL(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`, window.location.origin);
    if (params?.page) url.searchParams.set('page', params.page.toString());
    if (params?.size) url.searchParams.set('size', params.size.toString());

    const response = await fetch(url.toString());
    const data = await response.json();
    return data as ApiResponse<Product[]>;
  },

  // Cart
  getCart: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`);
    const data = await response.json();
    return data as ApiResponse<Cart>;
  },

  addToCart: async (userId: string, skuId: string, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/cart/items?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skuId, quantity }),
    });
    const data = await response.json();
    return data as ApiResponse<Cart>;
  },

  updateCartItem: async (userId: string, itemId: string, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}?userId=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    return data as ApiResponse<Cart>;
  },

  removeFromCart: async (userId: string, itemId: string) => {
    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}?userId=${userId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data as ApiResponse<Cart>;
  },

  // Orders
  createOrder: async (userId: string, address: Address, items: { skuId: string; quantity: number }[]) => {
    const response = await fetch(`${API_BASE_URL}/orders?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingAddress: address,
        items,
      }),
    });
    const data = await response.json();
    return data as ApiResponse<Order>;
  },

  getOrders: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders?userId=${userId}`);
    const data = await response.json();
    return data as ApiResponse<Order[]>;
  },

  getOrderById: async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    const data = await response.json();
    return data as ApiResponse<Order>;
  },

  // Addresses
  getAddresses: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/addresses?userId=${userId}`);
    const data = await response.json();
    return data as ApiResponse<Address[]>;
  },

  addAddress: async (userId: string, address: Omit<Address, 'id' | 'userId'>) => {
    const response = await fetch(`${API_BASE_URL}/addresses?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    const data = await response.json();
    return data as ApiResponse<Address>;
  },

  updateAddress: async (addressId: string, address: Omit<Address, 'id' | 'userId'>) => {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    const data = await response.json();
    return data as ApiResponse<Address>;
  },

  deleteAddress: async (addressId: string) => {
    await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },
};
