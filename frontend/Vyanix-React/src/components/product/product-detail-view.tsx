'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Minus, Plus, Share2, ShoppingCart, Star } from 'lucide-react';

import { ProductCard } from '@/components/product/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const defaultSku = useMemo(() => product.skus.find((sku) => sku.stock > 0) ?? product.skus[0], [product.skus]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initialOptions: Record<string, string> = {};
    for (const optionValue of defaultSku?.optionValues ?? []) {
      if (optionValue.optionName && optionValue.optionValue) {
        initialOptions[optionValue.optionName] = optionValue.optionValue;
      }
    }
    return initialOptions;
  });

  const selectedSku = useMemo(() => {
    if (Object.keys(selectedOptions).length === 0) {
      return defaultSku;
    }

    return product.skus.find((sku) =>
      sku.optionValues.every((optionValue) =>
        optionValue.optionName
          ? selectedOptions[optionValue.optionName] === optionValue.optionValue
          : true
      )
    ) ?? defaultSku;
  }, [defaultSku, product.skus, selectedOptions]);

  const handleAddToCart = async () => {
    if (!selectedSku) {
      toast({
        title: 'Unavailable product',
        description: 'No purchasable SKU is available for this product.',
        variant: 'destructive',
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in before checking out.',
      });
      router.push('/account');
      return;
    }

    try {
      await addToCart(selectedSku.id, quantity);
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: 'Unable to add item',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stock = selectedSku?.stock ?? product.stock;
  const price = selectedSku?.price ?? product.price;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary border">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={image}
                type="button"
                className={`relative aspect-square rounded-xl overflow-hidden bg-secondary border ${selectedImage === image ? 'border-accent ring-2 ring-accent/20' : 'hover:border-accent/50'}`}
                onClick={() => setSelectedImage(image)}
              >
                <Image src={image} alt={`${product.name} image ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="space-y-6">
            <div>
              <Badge className="mb-4 bg-accent/10 text-accent border-none font-semibold uppercase tracking-widest text-xs px-3 py-1">
                {product.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight leading-tight mb-4">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className={`h-5 w-5 fill-current ${index >= Math.floor(product.rating) ? 'text-muted' : ''}`} />
                  ))}
                  <span className="ml-2 text-sm font-bold text-primary">{product.rating.toFixed(1)}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">{product.reviewsCount} Reviews</span>
              </div>
            </div>

            <div className="text-4xl font-bold text-primary">${price.toFixed(2)}</div>

            <p className="text-lg text-muted-foreground leading-relaxed">{product.description}</p>

            {product.options.length > 0 ? (
              <div className="space-y-4">
                {product.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <span className="font-bold text-sm uppercase tracking-wider">{option.name}</span>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedOptions[option.name] === value.value;
                        return (
                          <Button
                            key={value.id}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => setSelectedOptions((current) => ({ ...current, [option.name]: value.value }))}
                          >
                            {value.value}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-4 py-6 border-y">
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm uppercase tracking-wider w-24">Quantity</span>
                <div className="flex items-center border rounded-lg h-12">
                  <Button variant="ghost" size="icon" className="h-12 w-12" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-6 font-bold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setQuantity((current) => Math.min(stock > 0 ? stock : 1, current + 1))}
                    disabled={stock <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-sm uppercase tracking-wider w-24">Availability</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stock > 5 ? 'bg-green-500' : stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${stock > 5 ? 'text-green-600' : stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {stock > 5 ? `In Stock (${stock} units)` : stock > 0 ? `Low Stock (Only ${stock} left)` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {selectedSku ? (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider w-24">SKU</span>
                  <span>{selectedSku.skuCode}</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="flex-1 h-16 bg-primary text-lg font-bold gap-3 rounded-2xl group" disabled={!selectedSku || stock <= 0} onClick={handleAddToCart}>
                <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button size="lg" variant="outline" className="h-16 w-full sm:w-16 rounded-2xl">
                <Heart className="h-6 w-6" />
              </Button>
              <Button size="lg" variant="outline" className="h-16 w-full sm:w-16 rounded-2xl">
                <Share2 className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-24">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-14 bg-transparent p-0 gap-8">
            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-lg font-bold">Description</TabsTrigger>
            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-lg font-bold">Details</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-lg font-bold">Reviews ({product.reviewsCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-12 prose max-w-none text-muted-foreground leading-relaxed">
            <p>{product.description}</p>
            <p>Selected variant inventory and pricing are synchronized with the backend in real time.</p>
          </TabsContent>
          <TabsContent value="details" className="py-12 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border rounded-2xl overflow-hidden">
              <div className="bg-secondary/50 p-4 font-bold">Category</div>
              <div className="bg-white p-4">{product.category}</div>
              <div className="bg-secondary/50 p-4 font-bold">Tags</div>
              <div className="bg-white p-4">{product.tags.length > 0 ? product.tags.join(', ') : 'None'}</div>
              <div className="bg-secondary/50 p-4 font-bold">Available SKUs</div>
              <div className="bg-white p-4">{product.skus.length}</div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="py-12">
            <p className="text-muted-foreground">Customer reviews are not connected yet, but ratings are being served from the backend catalog.</p>
          </TabsContent>
        </Tabs>
      </div>

      {relatedProducts.length > 0 ? (
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">You Might Also Like</h2>
            <p className="text-muted-foreground mt-2">Recommended products based on this category.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="mt-12 rounded-2xl border bg-secondary/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ready to buy? <Link href="/account" className="font-semibold text-primary">Sign in to sync your cart and place orders</Link>.
          </p>
        </div>
      ) : null}
    </>
  );
}
