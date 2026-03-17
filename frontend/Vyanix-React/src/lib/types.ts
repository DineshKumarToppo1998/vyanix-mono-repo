export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  options: { [key: string]: string };
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}