
"use client";

import Link from 'next/link';
import { ShoppingCart, Search, Heart, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { ModeToggle } from '@/components/mode-toggle';

export function Header() {
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold">V</span>
              <span className="hidden sm:inline tracking-tight">Vyanix</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/category/electronics" className="hover:text-primary transition-colors">Electronics</Link>
              <Link href="/category/fashion" className="hover:text-primary transition-colors">Fashion</Link>
              <Link href="/category/home" className="hover:text-primary transition-colors">Home</Link>
            </nav>
          </div>

          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search premium products..." 
                className="pl-9 bg-secondary/50 border-none focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            {isAuthenticated && user ? (
              <span className="hidden lg:inline text-sm text-muted-foreground">Hi, {user.firstName}</span>
            ) : null}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground border-none">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
