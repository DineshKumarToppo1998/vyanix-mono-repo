# Frontend-Backend Sync Document

This document outlines the backend API endpoints required for the Vyanix e-commerce platform, based on frontend analysis.

## Current Frontend State

The frontend (`frontend/Vyanix-React`) is currently a **static/client-side only implementation**:
- Uses mock data from `src/lib/mock-data.ts`
- Cart state managed via localStorage (key: `commercehub-cart`)
- No actual backend API calls present
- Fully functional for demonstration purposes

---

## Required Backend API Endpoints

### 1. Product APIs

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/api/products` | List all products (with pagination, filters) | Query: `page`, `limit`, `category`, `search`, `sort` | `Product[]` with pagination metadata |
| GET | `/api/products/:id` | Get product by ID | - | `Product` |
| GET | `/api/products/slug/:slug` | Get product by slug | - | `Product` |
| GET | `/api/categories` | List all categories | - | `Category[]` |

**Product Response Structure:**
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "categoryName": "string",
  "images": ["string"],
  "stock": "number",
  "rating": "number",
  "reviewsCount": "number",
  "tags": ["string"]
}
```

**Category Response Structure:**
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "image": "string"
}
```

---

### 2. Cart APIs (Authentication Required)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/api/cart` | Get current user's cart | - | `Cart` |
| POST | `/api/cart/items` | Add item to cart | `{ productId, quantity, variantId? }` | `Cart` |
| PUT | `/api/cart/items/:itemId` | Update cart item quantity | `{ quantity }` | `CartItem` |
| DELETE | `/api/cart/items/:itemId` | Remove item from cart | - | `Cart` |

**Cart Response Structure:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "productId": "string",
      "productName": "string",
      "productSlug": "string",
      "productImage": "string",
      "price": "number",
      "quantity": "number",
      "variantId": "uuid|null"
    }
  ],
  "subtotal": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### 3. Order APIs (Authentication Required)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| POST | `/api/orders` | Place a new order | `{ shippingAddressId, paymentMethod, items }` | `Order` |
| GET | `/api/orders` | Get user's orders | - | `Order[]` |
| GET | `/api/orders/:id` | Get order details | - | `Order` |
| GET | `/api/orders/user` | Get current user's orders | - | `Order[]` |

**Order Request Body:**
```json
{
  "shippingAddress": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "zip": "string"
  },
  "paymentMethod": "string",
  "items": [
    {
      "productId": "string",
      "skuId": "string",
      "quantity": "number",
      "price": "number"
    }
  ]
}
```

**Order Response Structure:**
```json
{
  "id": "uuid",
  "orderNumber": "string",
  "userId": "uuid",
  "status": "PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED",
  "subtotal": "number",
  "tax": "number",
  "shippingCost": "number",
  "totalAmount": "number",
  "shippingAddress": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "zip": "string"
  },
  "items": [
    {
      "id": "uuid",
      "productId": "string",
      "productName": "string",
      "skuId": "string",
      "price": "number",
      "quantity": "number"
    }
  ],
  "payment": {
    "id": "uuid",
    "paymentProvider": "string",
    "transactionId": "string",
    "amount": "number",
    "status": "PENDING|COMPLETED|FAILED|REFUNDED"
  },
  "createdAt": "timestamp"
}
```

---

### 4. Auth APIs

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| POST | `/api/auth/register` | User registration | `{ email, password, firstName, lastName, phone }` | `{ token, user }` |
| POST | `/api/auth/login` | User login | `{ email, password }` | `{ token, user }` |
| POST | `/api/auth/logout` | User logout (JWT invalidation) | - | `{ message }` |
| GET | `/api/auth/me` | Get current user | - | `User` |

**Auth Response Structure:**
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "createdAt": "timestamp"
  }
}
```

---

### 5. User Address APIs (Authentication Required)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/api/users/addresses` | Get user's addresses | - | `Address[]` |
| POST | `/api/users/addresses` | Add new address | `{ firstName, lastName, email, address, city, state, zip }` | `Address` |
| PUT | `/api/users/addresses/:id` | Update address | `{ ...address }` | `Address` |
| DELETE | `/api/users/addresses/:id` | Delete address | - | `{ message }` |

---

## Recommended Next Steps

### Phase 1: Backend Setup
1. Create JPA Repositories for existing entities
2. Create Service layer classes
3. Implement product-related endpoints first (GET /api/products, GET /api/products/:id)

### Phase 2: Cart Integration
4. Implement authentication (Spring Security + JWT)
5. Create Cart API endpoints
6. Link cart to authenticated user

### Phase 3: Order Processing
7. Implement Order API endpoints
8. Add order status tracking
9. Integrate payment provider (Stripe/PayPal)

### Phase 4: Search & Recommendations
10. Configure Meilisearch for product search
11. Implement search endpoint
12. Add "related products" logic

---

## Important Notes

1. **Backend structure should NOT be altered** unless absolutely required
2. The frontend expects UUID-based IDs for all entities
3. Currency is always USD (format: `$X.XX`)
4. Images are currently using placeholder URLs - backend should provide actual image URLs
5. The frontend uses `slug` for product/category URLs (important for SEO)
