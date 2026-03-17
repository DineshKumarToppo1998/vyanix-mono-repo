import { Product, Category } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getPlaceholder = (id: string) => PlaceHolderImages.find(i => i.id === id)?.imageUrl || `https://picsum.photos/seed/${id}/600/400`;

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', image: getPlaceholder('cat-electronics') },
  { id: '2', name: 'Fashion', slug: 'fashion', image: getPlaceholder('cat-fashion') },
  { id: '3', name: 'Home & Living', slug: 'home', image: getPlaceholder('cat-home') },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'AcousticZen Wireless Headphones',
    slug: 'acousticzen-headphones',
    description: 'Experience pure sound with our noise-cancelling wireless headphones. Crafted for comfort and clarity.',
    price: 249.99,
    category: 'electronics',
    images: [getPlaceholder('product-1')],
    stock: 12,
    rating: 4.8,
    reviewsCount: 128,
    tags: ['premium', 'audio', 'wireless'],
  },
  {
    id: 'p2',
    name: 'ChronoMax Smartwatch V2',
    slug: 'chronomax-smartwatch',
    description: 'Track your fitness, health, and notifications in style. A minimalist companion for your wrist.',
    price: 189.00,
    category: 'electronics',
    images: [getPlaceholder('product-2')],
    stock: 5,
    rating: 4.5,
    reviewsCount: 84,
    tags: ['wearable', 'tech', 'fitness'],
  },
  {
    id: 'p3',
    name: 'Lumina Mirrorless Camera',
    slug: 'lumina-camera',
    description: 'Capture life’s moments with stunning precision. 4K video and pro-level photography in a compact body.',
    price: 899.00,
    category: 'electronics',
    images: [getPlaceholder('product-3')],
    stock: 2,
    rating: 4.9,
    reviewsCount: 42,
    tags: ['camera', 'pro', 'photography'],
  },
  {
    id: 'p4',
    name: 'Classic Linen Shirt',
    slug: 'classic-linen-shirt',
    description: 'Breathable, sustainable, and timeless. The perfect shirt for warm days and relaxed evenings.',
    price: 65.00,
    category: 'fashion',
    images: [getPlaceholder('product-4')],
    stock: 50,
    rating: 4.2,
    reviewsCount: 210,
    tags: ['apparel', 'eco-friendly', 'summer'],
  },
];
