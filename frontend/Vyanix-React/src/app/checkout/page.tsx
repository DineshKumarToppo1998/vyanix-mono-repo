'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, CreditCard, ShieldCheck, Truck } from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/api-client';

const INITIAL_SHIPPING = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  fullName: '',
  phone: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { items, subtotal, loading: cartLoading, fetchCart } = useCart();
  const [step, setStep] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    ...INITIAL_SHIPPING,
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    phone: user?.phone ?? '',
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setShippingAddress((current) => ({
      ...current,
      fullName: current.fullName || `${user.firstName} ${user.lastName}`.trim(),
      phone: current.phone || user.phone || '',
    }));
  }, [user]);

  const shippingCost = 12.99;
  const tax = subtotal * 0.1;
  const total = subtotal + shippingCost + tax;

  const isShippingValid = useMemo(() => {
    return Boolean(
      shippingAddress.fullName.trim() &&
      shippingAddress.line1.trim() &&
      shippingAddress.city.trim() &&
      shippingAddress.state.trim() &&
      shippingAddress.country.trim() &&
      shippingAddress.postalCode.trim()
    );
  }, [shippingAddress]);

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      router.push('/account');
      return;
    }

    if (!isShippingValid) {
      toast({
        title: 'Missing shipping details',
        description: 'Please complete your shipping address before placing the order.',
        variant: 'destructive',
      });
      setStep(1);
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await apiClient.createOrder(
        shippingAddress,
        items.map((item) => ({ skuId: item.skuId, quantity: item.quantity })),
        crypto.randomUUID()
      );

      await fetchCart();
      toast({
        title: 'Order placed successfully',
        description: `Order ${response.data.orderNumber} has been paid through the mock payment provider.`,
      });
      router.push(`/order-confirmation?orderId=${response.data.id}`);
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg rounded-3xl border bg-secondary/20 p-10 text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Sign in to continue checkout</h1>
            <p className="text-muted-foreground">
              Your cart and orders are stored in your account so you can complete checkout securely.
            </p>
            <Button asChild>
              <Link href="/account">Go to account</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cartLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8 text-sm overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">Cart</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 1 ? 'font-bold text-primary' : 'text-muted-foreground'}>Shipping Information</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 2 ? 'font-bold text-primary' : 'text-muted-foreground'}>Payment Review</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {step === 1 ? (
              <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                  <h2 className="text-2xl font-bold">Shipping Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={shippingAddress.fullName} onChange={(event) => setShippingAddress((current) => ({ ...current, fullName: event.target.value }))} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={shippingAddress.phone} onChange={(event) => setShippingAddress((current) => ({ ...current, phone: event.target.value }))} placeholder="9876543210" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={shippingAddress.line1} onChange={(event) => setShippingAddress((current) => ({ ...current, line1: event.target.value }))} placeholder="123 Store Lane" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input id="address2" value={shippingAddress.line2 ?? ''} onChange={(event) => setShippingAddress((current) => ({ ...current, line2: event.target.value }))} placeholder="Apartment, suite, landmark" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={shippingAddress.city} onChange={(event) => setShippingAddress((current) => ({ ...current, city: event.target.value }))} placeholder="Ranchi" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={shippingAddress.state} onChange={(event) => setShippingAddress((current) => ({ ...current, state: event.target.value }))} placeholder="Jharkhand" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={shippingAddress.country} onChange={(event) => setShippingAddress((current) => ({ ...current, country: event.target.value }))} placeholder="India" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Postal Code</Label>
                    <Input id="zip" value={shippingAddress.postalCode} onChange={(event) => setShippingAddress((current) => ({ ...current, postalCode: event.target.value }))} placeholder="834001" />
                  </div>
                </div>
                <Button className="w-full h-12 bg-primary text-primary-foreground" onClick={() => setStep(2)} disabled={!isShippingValid}>
                  Continue to Payment Review
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                  <h2 className="text-2xl font-bold">Payment Review</h2>
                </div>
                <Alert variant="info">
                  <AlertDescription>
                    <strong>DEMO MODE</strong> — Payments are simulated. No real charges will be made.
                  </AlertDescription>
                </Alert>
                <div className="rounded-2xl border bg-secondary/20 p-6 flex items-start gap-4">
                  <CreditCard className="h-6 w-6 text-primary mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Mock payment provider</h3>
                    <p className="text-sm text-muted-foreground">
                      This checkout uses the backend mock payment service. The order will be created, a payment record will be stored, and the payment will be marked successful immediately.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border p-6 space-y-2 text-sm">
                  <p><span className="font-semibold">Ship to:</span> {shippingAddress.fullName}</p>
                  <p>{shippingAddress.line1}</p>
                  {shippingAddress.line2 ? <p>{shippingAddress.line2}</p> : null}
                  <p>{shippingAddress.city}, {shippingAddress.state}, {shippingAddress.country} - {shippingAddress.postalCode}</p>
                  {shippingAddress.phone ? <p>{shippingAddress.phone}</p> : null}
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handlePlaceOrder} disabled={placingOrder}>
                    {placingOrder ? 'Processing...' : `Place Order - ₹${total.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
              <h3 className="text-xl font-bold border-b pb-4">Order Summary</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <h4 className="font-medium line-clamp-1">{item.name}</h4>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-muted-foreground">SKU: {item.skuCode}</p>
                      <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>₹{shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
              <Truck className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Fast Delivery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Orders are created in the backend immediately. Mock payments mark the order as paid right away so you can verify the full ecommerce flow end to end.
                </p>
              </div>
            </div>

            <div className="bg-secondary/40 rounded-2xl p-6 border flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Idempotent Checkout</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Each checkout request uses a unique idempotency key so retrying the call does not create duplicate orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
