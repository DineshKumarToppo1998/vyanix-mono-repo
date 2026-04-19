import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProductCard } from '@/components/product/product-card';
import { fetchPublicProducts } from '@/lib/storefront';
import { apiClient } from '@/lib/api/api-client';

export const dynamic = 'force-dynamic';

interface ShopPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = params.q;

  const productsPage = query
    ? await apiClient.searchProducts(query, { size: 24 })
    : await fetchPublicProducts('?size=24');

  const products = query ? productsPage.data.content : productsPage.data.content;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-12">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">Catalog</p>
          <h1 className="text-4xl font-bold tracking-tight">
            {query ? `Search: "${query}"` : 'All Products'}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {query
              ? `Showing results for "${query}"`
              : 'Explore the full Vyanix catalog'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
