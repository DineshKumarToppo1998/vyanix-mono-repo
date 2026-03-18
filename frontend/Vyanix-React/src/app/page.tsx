import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product/product-card';
import { fetchPublicCategories, fetchPublicProducts } from '@/lib/storefront';
import type { Product, Category } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, HeadphonesIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [productsPage, categories] = await Promise.all([
    fetchPublicProducts('/products?size=8'),
    fetchPublicCategories(),
  ]);

  const featuredProducts = productsPage.data.content.slice(0, 4) as Product[];
  const categoryList = categories.slice(0, 4) as Category[];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-background to-secondary py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Premium Products for Your Lifestyle
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover our curated collection of high-quality products designed to elevate your everyday experiences.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/shop">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/shop">View All</Link>
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Features Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: ShieldCheck, title: 'Secure Payment', desc: 'Safe and encrypted transactions' },
                { icon: Truck, title: 'Free Shipping', desc: 'On all orders over $100' },
                { icon: RefreshCw, title: '30-Day Returns', desc: 'Hassle-free return policy' },
                { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Dedicated customer support' },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Products</h2>
                <p className="text-muted-foreground">Handpicked favorites from our collection</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/shop">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categoryList.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group relative overflow-hidden rounded-lg aspect-[4/3] transition-all hover:scale-105"
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-4 left-4 right-4 text-white font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Stay in the Loop</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and more.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                className="max-w-md"
              />
              <Button size="lg" className="max-w-[140px]">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
