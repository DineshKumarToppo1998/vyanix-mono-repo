"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your shopping cart.`,
    });
  };

  return (
    <Card className="group overflow-hidden border-none shadow-none bg-transparent flex flex-col h-full">
      <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden rounded-xl bg-secondary mb-3">
        <Image 
          src={product.images[0]} 
          alt={product.name} 
          fill 
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shadow-lg">
            <Heart className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-9 w-9 rounded-full shadow-lg"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground font-medium">Low Stock</Badge>
        )}
        {product.stock === 0 && (
          <Badge variant="destructive" className="absolute top-3 left-3 font-medium">Out of Stock</Badge>
        )}
      </Link>
      
      <div className="flex flex-col flex-1 px-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
          {product.category}
        </div>
        <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors">
          <h3 className="font-medium text-lg mb-1 leading-tight line-clamp-2">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3 w-3 fill-current ${i >= Math.floor(product.rating) ? 'text-muted' : ''}`} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.reviewsCount})</span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}