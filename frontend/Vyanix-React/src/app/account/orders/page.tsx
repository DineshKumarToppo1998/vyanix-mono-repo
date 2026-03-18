'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api/api-client';
import type { Order } from '@/lib/types';

export default function AccountOrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.getOrders();
        setOrders(response.data);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      void loadOrders();
    }
  }, [authLoading, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">Orders</p>
          <h1 className="text-4xl font-bold tracking-tight">Your Orders</h1>
          <p className="text-muted-foreground">Track checkout results and payment status from the live backend.</p>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-2xl border bg-secondary/20 p-8 text-center space-y-4">
            <p className="text-muted-foreground">Please sign in to see your orders.</p>
            <Button asChild>
              <Link href="/account">Go to account</Link>
            </Button>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border bg-secondary/20 p-8 text-center text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border bg-secondary/20 p-8 text-center space-y-4">
            <p className="text-muted-foreground">You have not placed any orders yet.</p>
            <Button asChild>
              <Link href="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
                    <p className="text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{order.status} / {order.payment?.status ?? 'PENDING'}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.items.map((item) => item.productName).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
