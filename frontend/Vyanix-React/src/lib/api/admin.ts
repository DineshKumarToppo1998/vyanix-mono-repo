import type {
  ApiProduct,
  ApiResponse,
  Category,
  PageResponse,
} from '../types';
import { request, createUrl } from './api-client';

// Admin Product APIs

export interface AdminProductCreateRequest {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  imageUrls?: string[];
}

export interface AdminProductOptionCreateRequest {
  name: string;
  values: string[];
}

export interface SkuCreateRequest {
  skuCode: string;
  price: number;
  stock: number;
  optionValues: { optionId: string; value: string }[];
}

export interface AdminInventoryUpdateRequest {
  stock: number;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  parentId?: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export const adminApi = {
  // Product Management
  getProducts: async (params?: {
    categorySlug?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await request<PageResponse<ApiProduct>>(`/admin/products${createUrl('', params).search}`, { method: 'GET' });
    return response;
  },

  getProductById: async (id: string) => {
    const response = await request<ApiProduct>(`/admin/products/${id}`, { method: 'GET' });
    return response;
  },

  createProduct: async (payload: AdminProductCreateRequest) => {
    const response = await request<ApiProduct>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  },

  updateProduct: async (id: string, payload: Partial<AdminProductCreateRequest>) => {
    const response = await request<ApiProduct>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  },

  deleteProduct: async (id: string) => {
    return request<void>(`/admin/products/${id}`, { method: 'DELETE' });
  },

  // Product Options
  createOptions: async (productId: string, payloads: AdminProductOptionCreateRequest[]) => {
    const response = await request<ApiProduct>(`/admin/products/${productId}/options`, {
      method: 'POST',
      body: JSON.stringify(payloads),
    });
    return response;
  },

  updateOption: async (productId: string, optionId: string, payload: Partial<AdminProductOptionCreateRequest>) => {
    const response = await request<ApiProduct>(`/admin/products/${productId}/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  },

  deleteOption: async (productId: string, optionId: string) => {
    return request<void>(`/admin/products/${productId}/options/${optionId}`, { method: 'DELETE' });
  },

  // Product SKUs
  createSkus: async (productId: string, payloads: SkuCreateRequest[]) => {
    const response = await request<ApiProduct>(`/admin/products/${productId}/skus`, {
      method: 'POST',
      body: JSON.stringify(payloads),
    });
    return response;
  },

  updateSku: async (productId: string, skuId: string, payload: Partial<SkuCreateRequest>) => {
    const response = await request<ApiProduct>(`/admin/products/${productId}/skus/${skuId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  },

  deleteSku: async (productId: string, skuId: string) => {
    return request<void>(`/admin/products/${productId}/skus/${skuId}`, { method: 'DELETE' });
  },

  // Inventory Management
  updateInventory: async (skuId: string, stock: number) => {
    const response = await request<void>(`/admin/skus/${skuId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
    return response;
  },

  // Category Management
  getCategories: async () => {
    const response = await request<Category[]>('/admin/categories', { method: 'GET' });
    return response;
  },

  createCategory: async (payload: CategoryCreateRequest) => {
    const response = await request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  },

  updateCategory: async (id: string, payload: CategoryUpdateRequest) => {
    const response = await request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  },

  deleteCategory: async (id: string) => {
    return request<void>(`/admin/categories/${id}`, { method: 'DELETE' });
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await request<{
      totalProducts: number;
      totalOrders: number;
      totalRevenue: number;
      totalCustomers: number;
    }>('/admin/dashboard/stats', { method: 'GET' });
    return response;
  },

  getRecentOrders: async (limit: number = 10) => {
    const response = await request<any[]>(`/admin/dashboard/orders?limit=${limit}`, { method: 'GET' });
    return response;
  },

  getRecentProducts: async (limit: number = 10) => {
    const response = await request<ApiProduct[]>(`/admin/dashboard/products?limit=${limit}`, { method: 'GET' });
    return response;
  },

  // Order Management
  getAllOrders: async (params?: { page?: number; size?: number }) => {
    const response = await request<PageResponse<any>>(`/admin/orders${createUrl('', params).search}`, { method: 'GET' });
    return response;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await request<any>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response;
  },
};
