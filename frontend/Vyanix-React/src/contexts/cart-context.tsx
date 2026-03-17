'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '../lib/api/api-client';
import type { Cart, CartItem, Product } from '../lib/types';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  
  fetchCart: (userId: string) => Promise<void>;
  addToCart: (skuId: string, quantity: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCart(userId);
      setCart(response.data);
    } catch (err) {
      setError('Failed to fetch cart');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (skuId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('currentUserId') || 'guest-123';
      const response = await apiClient.addToCart(userId, skuId, quantity);
      setCart(response.data);
    } catch (err) {
      setError('Failed to add item to cart');
      console.error('Error adding to cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('currentUserId') || 'guest-123';
      const response = await apiClient.updateCartItem(userId, itemId, quantity);
      setCart(response.data);
    } catch (err) {
      setError('Failed to update cart item');
      console.error('Error updating cart item:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('currentUserId') || 'guest-123';
      const response = await apiClient.removeFromCart(userId, itemId);
      setCart(response.data);
    } catch (err) {
      setError('Failed to remove item from cart');
      console.error('Error removing from cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
