
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mocking some internal database behavior for the demo/ui development
const MOCK_CATEGORIES = [
  { id: '1', name: 'Electronics', slug: 'electronics', parentId: null },
  { id: '2', name: 'Clothing', slug: 'clothing', parentId: null },
  { id: '3', name: 'Shoes', slug: 'shoes', parentId: '2' },
  { id: '4', name: 'Smartphones', slug: 'smartphones', parentId: '1' },
];

const MOCK_PRODUCTS = [
  { id: '101', name: 'iPhone 15 Pro', category: 'Smartphones', status: 'ACTIVE', createdAt: '2023-11-01', totalStock: 150, priceRange: '$999 - $1299' },
  { id: '102', name: 'Canvas Sneakers', category: 'Shoes', status: 'DRAFT', createdAt: '2023-11-15', totalStock: 0, priceRange: '$45 - $65' },
];

export const apiClient = {
  // Products
  getProducts: async () => {
    // In a real app: return api.get('/admin/products');
    return MOCK_PRODUCTS;
  },
  createProduct: async (data: any) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    return { id: Math.random().toString(36).substr(2, 9), ...data };
  },
  updateProduct: async (id: string, data: any) => {
    return { id, ...data };
  },
  deleteProduct: async (id: string) => {
    return { success: true };
  },

  // Options & SKUs
  createOptions: async (productId: string, options: any[]) => {
    return { productId, options };
  },
  createSkus: async (productId: string, skus: any[]) => {
    return { productId, skus };
  },

  // Categories
  getCategories: async () => {
    return MOCK_CATEGORIES;
  },
  createCategory: async (data: any) => {
    return { id: Math.random().toString(36).substr(2, 9), ...data };
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    return {
      totalProducts: 452,
      totalCategories: 18,
      totalSKUs: 1240,
      activeProducts: 390,
    };
  },

  // AI Helpers (GenAI integration)
  generateDescription: async (prompt: string) => {
    // This would call a Next.js server action which wraps a GenKit flow
    return `Elevate your lifestyle with this premium quality product. Designed for durability and performance, it's the perfect choice for users seeking excellence. Features include modern design, high-grade materials, and unmatched comfort.`;
  }
};
