import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProductCard } from '@/components/product/product-card';
import { fetchPublicProducts } from '@/lib/storefront';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const productsPage = await fetchPublicProducts('/products?size=24');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-12">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">Catalog</p>
          <h1 className="text-4xl font-bold tracking-tight">All Products</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore the full Vyanix catalog with live inventory and pricing from the backend.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {productsPage.data.content.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
