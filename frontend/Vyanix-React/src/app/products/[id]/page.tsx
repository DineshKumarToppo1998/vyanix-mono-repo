import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { PRODUCTS } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/product-card';
import { Star, ShieldCheck, Truck, RefreshCw, ShoppingCart, Heart, Share2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';

// Simple helper to find product as it's a server component
async function getProduct(id: string) {
  const product = PRODUCTS.find(p => p.id === id);
  return product;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/category/${product.category}`} className="hover:text-primary transition-colors capitalize">{product.category}</Link>
            <span>/</span>
            <span className="text-primary font-medium line-clamp-1">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary border">
                <Image 
                  src={product.images[0]} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`relative aspect-square rounded-xl overflow-hidden bg-secondary border cursor-pointer hover:border-accent transition-colors ${i === 0 ? 'border-accent ring-2 ring-accent/20' : ''}`}>
                    <Image 
                      src={product.images[0]} 
                      alt={`${product.name} view ${i + 1}`} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="space-y-6">
                <div>
                  <Badge className="mb-4 bg-accent/10 text-accent border-none font-semibold uppercase tracking-widest text-xs px-3 py-1">
                    {product.category}
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight leading-tight mb-4">{product.name}</h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 fill-current ${i >= Math.floor(product.rating) ? 'text-muted' : ''}`} />
                      ))}
                      <span className="ml-2 text-sm font-bold text-primary">{product.rating}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-muted-foreground hover:underline cursor-pointer">{product.reviewsCount} Reviews</span>
                  </div>
                </div>

                <div className="text-4xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.description}
                </p>

                <div className="space-y-4 py-6 border-y">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm uppercase tracking-wider w-24">Quantity</span>
                    <div className="flex items-center border rounded-lg h-12">
                      <Button variant="ghost" size="icon" className="h-12 w-12">-</Button>
                      <span className="px-6 font-bold">1</span>
                      <Button variant="ghost" size="icon" className="h-12 w-12">+</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm uppercase tracking-wider w-24">Availability</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 5 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <span className={`text-sm font-medium ${product.stock > 5 ? 'text-green-600' : 'text-orange-600'}`}>
                        {product.stock > 5 ? `In Stock (${product.stock} units)` : `Low Stock (Only ${product.stock} left)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="flex-1 h-16 bg-primary text-lg font-bold gap-3 rounded-2xl group">
                    <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 w-full sm:w-16 rounded-2xl">
                    <Heart className="h-6 w-6" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 w-full sm:w-16 rounded-2xl">
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                  <div className="flex flex-col items-center p-4 rounded-2xl bg-secondary/50 text-center space-y-2">
                    <Truck className="h-6 w-6 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Free Delivery</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-2xl bg-secondary/50 text-center space-y-2">
                    <RefreshCw className="h-6 w-6 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">30 Days Return</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-2xl bg-secondary/50 text-center space-y-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">2 Year Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-24">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-14 bg-transparent p-0 gap-8">
                <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-lg font-bold">Description</TabsTrigger>
                <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-lg font-bold">Specifications</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-lg font-bold">Reviews ({product.reviewsCount})</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="py-12 prose max-w-none text-muted-foreground leading-relaxed">
                <p>Designed with excellence in mind, {product.name} brings together premium materials and cutting-edge technology. Whether you're at home, in the office, or on the move, this product delivers exceptional performance and comfort.</p>
                <p>The sleek design is not just about looks; it's engineered to provide the best user experience. Every detail has been carefully considered to ensure durability and style go hand-in-hand.</p>
                <ul className="grid md:grid-cols-2 gap-4 mt-8 list-none p-0">
                  <li className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>Premium high-grade materials</span>
                  </li>
                  <li className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>User-centric ergonomic design</span>
                  </li>
                  <li className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>Advanced efficiency technology</span>
                  </li>
                  <li className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>Long-lasting reliable performance</span>
                  </li>
                </ul>
              </TabsContent>
              <TabsContent value="specs" className="py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border rounded-2xl overflow-hidden">
                  <div className="bg-secondary/50 p-4 font-bold">Weight</div>
                  <div className="bg-white p-4">1.2 lbs</div>
                  <div className="bg-secondary/50 p-4 font-bold">Dimensions</div>
                  <div className="bg-white p-4">6.5" x 4.2" x 1.8"</div>
                  <div className="bg-secondary/50 p-4 font-bold">Material</div>
                  <div className="bg-white p-4">Brushed Aluminum, Premium Polymer</div>
                  <div className="bg-secondary/50 p-4 font-bold">Battery Life</div>
                  <div className="bg-white p-4">Up to 40 hours</div>
                  <div className="bg-secondary/50 p-4 font-bold">Connectivity</div>
                  <div className="bg-white p-4">Bluetooth 5.2, USB-C</div>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="py-12 space-y-8">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                  <div className="w-full md:w-64 space-y-4">
                    <div className="text-center p-8 bg-secondary/50 rounded-3xl space-y-2">
                      <div className="text-5xl font-bold text-primary">{product.rating}</div>
                      <div className="flex justify-center text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">{product.reviewsCount} reviews</div>
                    </div>
                    <Button className="w-full h-12 bg-accent text-accent-foreground font-bold">Write a Review</Button>
                  </div>
                  <div className="flex-1 space-y-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-4 border-b pb-8 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">JD</div>
                            <div>
                              <div className="font-bold">John Doe</div>
                              <div className="text-xs text-muted-foreground">October 12, 2023</div>
                            </div>
                          </div>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">"I am absolutely in love with this product! The quality is top-notch and it exceeds all my expectations. Definitely worth every penny. Fast shipping was a huge plus too!"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">You Might Also Like</h2>
                <p className="text-muted-foreground mt-2">Recommended products based on your interest.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
