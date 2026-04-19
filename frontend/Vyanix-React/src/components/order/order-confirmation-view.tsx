'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShoppingBag, Truck } from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api/api-client';
import type { Order } from '@/lib/types';

export function OrderConfirmationView({ orderId }: { orderId?: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.getOrderById(orderId);
        setOrder(response.data);
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-20 bg-secondary/20">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-sm border text-center space-y-8">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Thank you for your order!</h1>
            {loading ? (
              <p className="text-muted-foreground">Loading your order details...</p>
            ) : order ? (
              <p className="text-muted-foreground">
                Your order <span className="font-bold text-primary">{order.orderNumber}</span> has been placed and the mock payment was processed successfully.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Your order was created successfully. Open your orders page to view the latest status.
              </p>
            )}
          </div>

          <Alert variant="info">
            <AlertDescription>
              <strong>DEMO MODE</strong> — Payments are simulated. No real charges were made.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-6 rounded-2xl bg-secondary/50 space-y-3">
              <Truck className="h-6 w-6 text-primary" />
              <h3 className="font-bold">Payment Status</h3>
              <p className="text-sm text-muted-foreground">
                {order?.payment?.status ?? 'SUCCESS'} via {order?.payment?.paymentProvider ?? 'mock-provider'}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/50 space-y-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h3 className="font-bold">Order Total</h3>
              <p className="text-sm text-muted-foreground">
                {order ? `₹${order.totalAmount.toFixed(2)}` : 'See order details'}
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-4">
            <Button size="lg" className="w-full bg-primary text-primary-foreground h-14" asChild>
              <Link href="/account/orders">Track My Order</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full h-14" asChild>
              <Link href="/shop" className="flex items-center gap-2">
                Continue Shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
