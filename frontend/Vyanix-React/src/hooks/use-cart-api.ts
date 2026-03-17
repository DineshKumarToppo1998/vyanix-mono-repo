import { create } from 'zustand';
import { apiClient } from '../lib/api/api-client';
import type { Cart, CartItem, Product } from '../lib/types';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCart: (userId: string) => Promise<void>;
  addToCart: (skuId: string, quantity: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
  setError: (error: string | null) => void;
}

export const useCartApi = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  fetchCart: async (userId) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.getCart(userId);
      set({ cart: response.data, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Failed to fetch cart' });
      console.error('Error fetching cart:', error);
    }
  },

  addToCart: async (skuId, quantity) => {
    const userId = 'user-123'; // In production, get from auth context
    try {
      set({ loading: true, error: null });
      const response = await apiClient.addToCart(userId, skuId, quantity);
      set({ cart: response.data, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Failed to add item to cart' });
      console.error('Error adding to cart:', error);
    }
  },

  updateCartItem: async (itemId, quantity) => {
    const userId = 'user-123';
    try {
      set({ loading: true, error: null });
      const response = await apiClient.updateCartItem(userId, itemId, quantity);
      set({ cart: response.data, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Failed to update cart item' });
      console.error('Error updating cart item:', error);
    }
  },

  removeFromCart: async (itemId) => {
    const userId = 'user-123';
    try {
      set({ loading: true, error: null });
      const response = await apiClient.removeFromCart(userId, itemId);
      set({ cart: response.data, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Failed to remove item from cart' });
      console.error('Error removing from cart:', error);
    }
  },

  clearCart: () => {
    set({ cart: null });
  },
}));
