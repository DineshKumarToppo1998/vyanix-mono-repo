"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, CreditCard, Truck, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const router = useRouter();

  if (items.length === 0 && step < 3) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePlaceOrder = () => {
    // Simulate order placement
    clearCart();
    router.push('/order-confirmation');
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8 text-sm overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">Cart</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 1 ? "font-bold text-primary" : "text-muted-foreground"}>Shipping Information</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className={step === 2 ? "font-bold text-primary" : "text-muted-foreground"}>Payment Details</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Order Review</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                  <h2 className="text-2xl font-bold">Shipping Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Store Lane" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Metropolis" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="NY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="10001" />
                  </div>
                </div>
                <Button 
                  className="w-full h-12 bg-primary text-primary-foreground" 
                  onClick={() => setStep(2)}
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                  <h2 className="text-2xl font-bold">Payment Details</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" className="pr-12" />
                    <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handlePlaceOrder}>
                    Place Order - ${(subtotal + 12.99).toFixed(2)}
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
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>$12.99</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total</span>
                  <span>${(subtotal + 12.99).toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon">Coupon Code</Label>
                <div className="flex gap-2">
                  <Input id="coupon" placeholder="CODE20" />
                  <Button variant="secondary">Apply</Button>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
              <Truck className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Fast Delivery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Most orders arrive within 3-5 business days. You'll receive a tracking number once your order is shipped.
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