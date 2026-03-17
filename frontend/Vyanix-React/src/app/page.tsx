import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product/product-card';
import { PRODUCTS, CATEGORIES } from '@/lib/mock-data';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, HeadphonesIcon } from 'lucide-react';

export default function Home() {
  const featuredProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center bg-accent/20 overflow-hidden">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center z-10">
            <div className="space-y-8">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm uppercase tracking-wider">
                New Summer Collection 2024
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                Quality that <span className="text-primary">defines</span> you.
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Discover Vyanix's curated selection of premium electronics and timeless fashion. Experience a new standard of online shopping.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" asChild>
                  <Link href="/category/electronics">Shop Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 rounded-full border-primary text-primary hover:bg-primary/10" asChild>
                  <Link href="/deals">View Deals</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block relative h-[500px] w-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl"></div>
              <Image 
                src="https://picsum.photos/seed/hero-elec/800/800"
                alt="Featured Product"
                fill
                className="object-contain relative z-10 drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 border-b bg-white dark:bg-card/50 transition-colors">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Free Shipping</h4>
                <p className="text-sm text-muted-foreground">Orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Secure Payment</h4>
                <p className="text-sm text-muted-foreground">100% Secure Transaction</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-primary">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Easy Returns</h4>
                <p className="text-sm text-muted-foreground">30-day money back</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-primary">
                <HeadphonesIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">24/7 Support</h4>
                <p className="text-sm text-muted-foreground">Always here to help</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24 container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
              <p className="text-muted-foreground">Explore our diverse collections across various departments.</p>
            </div>
            <Button variant="link" className="text-primary font-semibold p-0 h-auto" asChild>
              <Link href="/categories" className="flex items-center gap-1">
                View All Categories <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="group relative h-[300px] overflow-hidden rounded-3xl bg-secondary">
                {cat.image ? (
                  <Image 
                    src={cat.image} 
                    alt={cat.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex flex-col justify-end p-8 text-white">
                  <h3 className="text-2xl font-bold mb-1">{cat.name}</h3>
                  <p className="text-white/80 text-sm group-hover:translate-x-2 transition-transform">Explore Collection <ArrowRight className="inline-block h-4 w-4 ml-1" /></p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section className="py-24 bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-bold tracking-tight">Trending Now</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover the products our customers are loving right now. High-quality items selected specifically for you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-16 text-center">
              <Button size="lg" variant="outline" className="px-12 border-primary text-primary hover:bg-primary hover:text-white rounded-full" asChild>
                <Link href="/shop">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Promo Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="relative rounded-[3rem] overflow-hidden bg-primary p-12 md:p-24 text-primary-foreground">
              <div className="relative z-10 max-w-xl space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold leading-tight">Join our newsletter & get <span className="text-white">20% off</span></h2>
                <p className="text-lg opacity-80">
                  Stay updated with new arrivals, exclusive offers, and Vyanix community stories.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                  <Input 
                    placeholder="Your email address" 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 rounded-full"
                  />
                  <Button size="lg" className="h-14 px-8 bg-white text-primary hover:bg-white/90 rounded-full">
                    Subscribe
                  </Button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
                <Image 
                  src="https://picsum.photos/seed/promo/800/800"
                  alt="Promo Background"
                  fill
                  className="object-cover opacity-30 mix-blend-overlay"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
