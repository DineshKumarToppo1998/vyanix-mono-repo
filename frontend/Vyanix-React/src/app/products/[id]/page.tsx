import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductDetailView } from '@/components/product/product-detail-view';
import { fetchPublicCategories, fetchPublicCategoryProducts, fetchPublicProducts } from '@/lib/storefront';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const productsPage = await fetchPublicProducts(`/slug/${id}`);
  const product = productsPage.data.content[0];

  if (!product) {
    return {
      title: 'Product Not Found | Vyanix',
    };
  }

  return {
    title: `${product.name} | Vyanix`,
    description: product.description ? product.description.slice(0, 155) : '',
    openGraph: {
      title: product.name,
      description: product.description ? product.description.slice(0, 155) : '',
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const productsPage = await fetchPublicProducts(`/slug/${id}`);
  const product = productsPage.data.content[0];

  if (!product) {
    notFound();
  }

  const categories = await fetchPublicCategories();
  const category = categories.find((item: any) => item.id === product.categoryId) ?? categories.find((item: any) => item.name === product.category);
  const categorySlug = category?.slug ?? product.category.toLowerCase().replace(/\s+/g, '-');

  const relatedProducts = (await fetchPublicCategoryProducts(categorySlug))
    .filter((candidate: any) => candidate.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/category/${categorySlug}`} className="hover:text-primary transition-colors capitalize">{product.category}</Link>
            <span>/</span>
            <span className="text-primary font-medium line-clamp-1">{product.name}</span>
          </div>

          <ProductDetailView product={product} relatedProducts={relatedProducts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
