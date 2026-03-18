'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api/api-client';
import { useAuth } from '@/contexts/auth-context';
import type { Cart, CartItem, Product } from '@/lib/types';

interface CartContextValue {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (skuId: string, quantity?: number) => Promise<void>;
  addProductToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCart();
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setCart(null);
      setError(null);
      return;
    }

    void fetchCart();
  }, [authLoading, isAuthenticated, fetchCart]);

  const ensureAuthenticated = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to manage your cart.');
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (skuId: string, quantity = 1) => {
    ensureAuthenticated();

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.addToCart(skuId, quantity);
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuthenticated]);

  const addProductToCart = useCallback(async (product: Product, quantity = 1) => {
    const skuId = product.defaultSkuId ?? product.skus.find((sku) => sku.stock > 0)?.id;

    if (!skuId) {
      throw new Error('This product is currently unavailable.');
    }

    await addToCart(skuId, quantity);
  }, [addToCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    ensureAuthenticated();

    try {
      setLoading(true);
      setError(null);

      if (quantity <= 0) {
        const response = await apiClient.removeFromCart(itemId);
        setCart(response.data);
        return;
      }

      const response = await apiClient.updateCartItem(itemId, quantity);
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuthenticated]);

  const removeFromCart = useCallback(async (itemId: string) => {
    ensureAuthenticated();

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.removeFromCart(itemId);
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuthenticated]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.clearCart();
      setCart((currentCart) => currentCart ? { ...currentCart, subtotal: 0, itemCount: 0, items: [] } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const items = cart?.items ?? [];
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    items,
    itemCount,
    subtotal,
    loading,
    error,
    fetchCart,
    addToCart,
    addProductToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }), [cart, items, itemCount, subtotal, loading, error, fetchCart, addToCart, addProductToCart, updateQuantity, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
