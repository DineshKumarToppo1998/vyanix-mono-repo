import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const orderId = "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();

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
            <p className="text-muted-foreground">
              Your order <span className="font-bold text-primary">{orderId}</span> has been placed successfully. 
              We've sent a confirmation email to your registered address.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-6 rounded-2xl bg-secondary/50 space-y-3">
              <Truck className="h-6 w-6 text-primary" />
              <h3 className="font-bold">Shipping Status</h3>
              <p className="text-sm text-muted-foreground">
                Your package is being prepared and will be shipped within 24-48 hours.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/50 space-y-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h3 className="font-bold">Estimated Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Wednesday, Oct 24 - Friday, Oct 26
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-4">
            <Button size="lg" className="w-full bg-primary text-primary-foreground h-14" asChild>
              <Link href="/account/orders">Track My Order</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full h-14" asChild>
              <Link href="/" className="flex items-center gap-2">
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