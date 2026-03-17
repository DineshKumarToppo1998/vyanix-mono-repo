# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

This is an e-commerce platform with a Java/Spring Boot backend and a Next.js frontend.

### Backend Development

```bash
cd backend/vyanix-webservice
./mvnw spring-boot:run          # Start the application
./mvnw test                     # Run tests
./mvnw clean package            # Build JAR
```

### Frontend Development

```bash
cd frontend/Vyanix-React
npm run dev         # Start dev server on port 9002
npm run build       # Build for production
npm run typecheck   # Run TypeScript type checking
```

### Docker Compose

```bash
docker-compose up --build
```

Services: `nginx`, `frontend`, `backend`, `postgres`, `redis`, `meilisearch`

## Architecture

### Backend (`backend/vyanix-webservice`)
- Spring Boot 4.0.3 with Java 25
- REST API with JPA/Hibernate for data persistence
- Spring Security for authentication
- Redis for session/cache storage
- Meilisearch for product search

### Database Schema
Main entities:
- **User** - Customer accounts
- **Product** - Product catalog with slugs, ratings, images
- **Category** - Hierarchical categories (parent-child)
- **Sku** - Product variations with pricing/stock
- **Cart/CartItem** - User shopping cart
- **Order/OrderItem/OrderAddress** - Order processing
- **Payment** - Payment tracking

### Frontend (`frontend/Vyanix-React`)
- Next.js 15.5.9 with App Router
- TypeScript 5
- Radix UI primitives for components
- Tailwind CSS for styling
- React Hook Form with Zod validation
- Firebase integration
- localStorage for cart state

## Configuration

### Backend
- `backend/vyanix-webservice/src/main/resources/application.yaml` - Main application config
- Database: Supabase PostgreSQL (production)
- Redis: Session/cache storage
- Meilisearch: Search endpoint at `http://meilisearch:7700`

### Frontend
- Environment variables loaded via `.env` file
- API URL configured via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`)

## Important Notes

- Lombok is configured for annotation processing in backend
- JPA `ddl-auto: update` is set (use carefully in production)
- UUID primary keys across all backend entities
- Backend runs on port 8080, nginx proxies `/api/` to backend
- Frontend runs on port 9002 in development (TurboPack enabled)
- Path alias `@/*` maps to `./src/*` in frontend
