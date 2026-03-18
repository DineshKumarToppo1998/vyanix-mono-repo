export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMetadata;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  parentId?: string | null;
  children?: Category[];
}

export interface ApiProductImage {
  id: string;
  url: string;
  position: number | null;
}

export interface ApiProductOptionValue {
  id: string;
  value: string;
}

export interface ApiProductOption {
  id: string;
  name: string;
  values: ApiProductOptionValue[];
}

export interface ApiSkuOptionValue {
  id: string;
  optionName: string | null;
  optionValue: string | null;
}

export interface ApiSku {
  id: string;
  skuCode: string;
  price: number;
  stock: number;
  weight?: number | null;
  optionValues: ApiSkuOptionValue[];
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryName?: string | null;
  categoryId?: string | null;
  rating: number;
  reviewsCount: number;
  images: ApiProductImage[];
  options: ApiProductOption[];
  skus: ApiSku[];
  tags: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryId?: string | null;
  price: number;
  images: string[];
  stock: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  defaultSkuId?: string;
  skus: ApiSku[];
  options: ApiProductOption[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  tokenType: string;
}

export interface Address {
  id?: string;
  userId?: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  fullName?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  skuId: string;
  skuCode: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  optionValues: ApiSkuOptionValue[];
}

export interface Cart {
  id: string;
  userId: string;
  subtotal: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface Payment {
  id: string;
  orderId: string;
  paymentProvider: string;
  transactionId?: string | null;
  amount: number;
  status: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  skuId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  skuCode: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  shippingAddress?: Address | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  payment?: Payment | null;
  createdAt: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}
