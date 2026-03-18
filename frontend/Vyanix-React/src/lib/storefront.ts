import type {
  Address,
  ApiProduct,
  ApiResponse,
  Cart,
  Category,
  Order,
  PageResponse,
  Payment,
  Product,
  User,
} from './types';

export function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
}

export function getFallbackCategoryImage(slug: string) {
  return `https://picsum.photos/seed/category-${slug}/800/600`;
}

export function getProductImages(product: ApiProduct) {
  const images = [...(product.images ?? [])]
    .sort((left, right) => {
      const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
      const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;
      return leftPosition - rightPosition;
    })
    .map((image) => image.url)
    .filter(Boolean);

  return images.length > 0 ? images : [`https://picsum.photos/seed/product-${product.slug}/800/800`];
}

export function normalizeProduct(product: ApiProduct): Product {
  const defaultSku = product.skus.find((sku) => sku.stock > 0) ?? product.skus[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.categoryName ?? 'General',
    categoryId: product.categoryId ?? null,
    price: Number(product.minPrice ?? defaultSku?.price ?? 0),
    images: getProductImages(product),
    stock: product.stock,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    tags: product.tags ?? [],
    minPrice: product.minPrice ? Number(product.minPrice) : null,
    maxPrice: product.maxPrice ? Number(product.maxPrice) : null,
    defaultSkuId: defaultSku?.id,
    skus: product.skus,
    options: product.options,
  };
}

export function normalizeCategory(category: any): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image ?? getFallbackCategoryImage(category.slug),
    parentId: category.parentId ?? null,
    children: category.children?.map(normalizeCategory) ?? [],
  };
}

export function normalizeUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function normalizeCart(cart: any): Cart {
  return {
    id: cart.id,
    userId: cart.userId,
    subtotal: cart.subtotal ? Number(cart.subtotal) : 0,
    itemCount: cart.items?.length ?? 0,
    createdAt: cart.createdAt ?? new Date().toISOString(),
    updatedAt: cart.updatedAt ?? new Date().toISOString(),
    items: cart.items?.map((item: any) => ({
      id: item.id,
      skuId: item.skuId,
      quantity: item.quantity,
      price: Number(item.price),
    })) ?? [],
  };
}

export function normalizeAddress(address: any): Address {
  return {
    id: address.id,
    userId: address.userId,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode,
    fullName: address.fullName,
    phone: address.phone,
    isDefault: address.isDefault,
  };
}

export function normalizeOrder(order: any): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber ?? '',
    userId: order.userId,
    status: order.status,
    shippingAddress: order.shippingAddress ? normalizeAddress(order.shippingAddress) : null,
    items: order.orderItems?.map((item: any) => ({
      id: item.id,
      orderId: order.id,
      productId: item.productId ?? item.skuId,
      skuId: item.skuId,
      productName: item.productName ?? '',
      productSlug: item.productSlug ?? '',
      productImage: item.productImage ?? '',
      skuCode: item.skuCode ?? '',
      price: Number(item.price),
      quantity: item.quantity,
      subtotal: Number(item.subtotal ?? item.price * item.quantity),
    })) ?? [],
    subtotal: order.subtotal ? Number(order.subtotal) : 0,
    tax: order.tax ? Number(order.tax) : 0,
    shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
    payment: order.payment ? {
      id: order.payment.id,
      orderId: order.id,
      amount: Number(order.payment.amount),
      status: order.payment.status,
      transactionId: order.payment.transactionId,
      paymentProvider: order.payment.paymentProvider ?? 'unknown',
      createdAt: order.payment.createdAt ?? new Date().toISOString(),
    } : null,
    createdAt: order.createdAt,
  };
}

export async function fetchPublicProducts(query?: string) {
  const base = getApiBaseUrl();
  const url = query ? `${base}/products${query}` : `${base}/products`;
  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();
  return {
    success: data.success,
    data: {
      content: (data.data?.content ?? []).map(normalizeProduct),
      page: data.data?.page,
    },
  };
}

export async function fetchPublicCategories() {
  const response = await fetch(`${getApiBaseUrl()}/categories`, { method: 'GET' });
  const data = await response.json();
  return (data.data ?? []).map(normalizeCategory);
}

export async function fetchPublicCategoryProducts(slug: string) {
  const response = await fetch(`${getApiBaseUrl()}/categories/${slug}/products`, { method: 'GET' });
  const data = await response.json();
  return (data.data ?? []).map(normalizeProduct);
}
