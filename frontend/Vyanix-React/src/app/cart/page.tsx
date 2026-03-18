'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error) {
      toast({
        title: 'Cart update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      toast({
        title: 'Unable to remove item',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">Cart</p>
          <h1 className="text-4xl font-bold tracking-tight">Your Shopping Cart</h1>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-2xl border bg-secondary/20 p-8 text-center space-y-4">
            <p className="text-muted-foreground">Sign in to access your persistent backend cart.</p>
            <Button asChild>
              <Link href="/account">Go to account</Link>
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-secondary/20 p-8 text-center space-y-4">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button asChild>
              <Link href="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-white p-4 flex gap-4 shadow-sm">
                  <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{item.name}</h2>
                        <p className="text-sm text-muted-foreground">{item.skuCode}</p>
                      </div>
                      <Button variant="ghost" onClick={() => void handleRemove(item.id)}>Remove</Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => void handleQuantityChange(item.id, item.quantity - 1)}>-</Button>
                      <span className="min-w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => void handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                    </div>
                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm h-fit space-y-4">
              <h2 className="text-xl font-semibold">Summary</h2>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <Button className="w-full" asChild>
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
