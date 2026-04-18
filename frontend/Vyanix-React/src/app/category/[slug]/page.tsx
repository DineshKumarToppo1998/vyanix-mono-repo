import type { Metadata } from 'next';
import type { Product } from '@/lib/types';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProductCard } from '@/components/product/product-card';
import { fetchPublicCategories, fetchPublicCategoryProducts } from '@/lib/storefront';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [categories] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicCategoryProducts(slug),
  ]);
  const category = categories.find((item: any) => item.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found | Vyanix',
    };
  }

  return {
    title: `${category.name} | Vyanix`,
    description: `${category.name} products at Vyanix`,
    openGraph: {
      title: category.name,
      description: `${category.name} products at Vyanix`,
      type: 'website',
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [categories, products] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicCategoryProducts(slug),
  ]);

  const category = categories.find((item: any) => item.slug === slug);
  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{category.name}</h1>
          <p className="text-xl text-muted-foreground">
            {products.length} products
          </p>
        </section>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
