# Vyanix E-Commerce Platform - Developer Guide

A full-stack e-commerce platform with Next.js frontend and Spring Boot backend, featuring production-grade JWT authentication with refresh tokens.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Authentication System](#authentication-system)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** React Context + Custom Hooks
- **Authentication:** Memory-only JWT tokens

### Backend
- **Framework:** Spring Boot 4.0.3
- **Language:** Java 21
- **Security:** Spring Security, JWT (JJWT)
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Search:** Meilisearch
- **Rate Limiting:** Bucket4j
- **Migrations:** Flyway

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Web Server:** nginx
- **Database:** PostgreSQL (Supabase or local)
- **Cache:** Redis

---

## 📦 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or 20.x | Frontend runtime |
| npm | 9.x or 10.x | Package manager |
| Java | 21 | Backend runtime |
| Maven | 3.8+ | Build tool (included via mvnw) |
| Docker | 20.x+ | Containerization |
| PostgreSQL | 15.x | Database (or use Docker) |
| Redis | 7.x | Cache (or use Docker) |

### Verify Installation

```bash
# Check Node.js
node --version  # Should be v18.x or v20.x
npm --version   # Should be 9.x or 10.x

# Check Java
java --version  # Should be Java 21

# Check Docker
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

Start all services with one command:

```bash
# Clone the repository
cd vyanix-mono-repo

# Copy environment file
cp .env.local .env

# Start all services
docker-compose up -d --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# nginx: http://localhost:80
```

### Option 2: Local Development

```bash
# 1. Start infrastructure (PostgreSQL, Redis, Meilisearch)
docker-compose up -d postgres redis meilisearch

# 2. Start backend
cd backend/vyanix-webservice
./mvnw spring-boot:run

# 3. Start frontend (new terminal)
cd frontend/Vyanix-React
npm install
npm run dev

# Access the application
# Frontend: http://localhost:9002
# Backend API: http://localhost:8080
```

---

## ⚙️ Environment Configuration

### Create Environment File

```bash
# Copy the local development template
cp .env.local .env
```

### Required Environment Variables

```bash
# JWT Configuration
JWT_SECRET=mysupersecretmysupersecretmysupersecret123456
JWT_EXPIRATION_MS=900000              # 15 minutes
JWT_REFRESH_EXPIRATION_MS=604800000   # 7 days
JWT_REFRESH_INACTIVITY_TIMEOUT_MS=2592000000  # 30 days
JWT_REFRESH_MAX_LIFETIME_MS=7776000000        # 90 days

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/vyanix
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
REFRESH_TOKEN_PEPPER=my-super-secret-pepper-at-least-32-characters-long
ENABLE_TOKEN_BLOCKLIST=true
MAX_CONCURRENT_SESSIONS=5
GRACE_PERIOD_SECONDS=30

# CORS
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:9002

# Rate Limiting
RATE_LIMIT_ENABLED=true
REFRESH_PER_IP_LIMIT=10
REFRESH_PER_USER_LIMIT=12
REFRESH_PER_USER_BURST=3

# Migration
APP_MIGRATION_LEGACY_TOKEN_MIGRATION_ENDED=false
```

### ⚠️ Security Warning

**NEVER commit `.env` file to version control!**

The `.env` file contains sensitive credentials and should only exist locally. The `.env.local` template is safe to commit as it contains example values.

---

## 🗄️ Database Setup

### Option 1: Docker PostgreSQL (Recommended)

```bash
# Start PostgreSQL container
docker run -d \
  --name vyanix-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=vyanix \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v vyanix-postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine

# Verify it's running
docker ps | grep vyanix-postgres
```

### Option 2: Local PostgreSQL Installation

```bash
# Create database
psql -U postgres
CREATE DATABASE vyanix;
\q

# Verify connection
psql -U postgres -d vyanix -c "SELECT version();"
```

### Database Migrations

Flyway automatically runs migrations on application startup:

- **V1__Add_Indexes.sql** - Initial schema
- **V2__add_refresh_token_security_fields.sql** - JWT refresh token system

To view migration status:
```bash
curl http://localhost:8080/actuator/flyway
```

---

## 🏃 Running the Application

### Backend

```bash
cd backend/vyanix-webservice

# Run with Maven wrapper
./mvnw spring-boot:run

# Or compile and run
./mvnw clean package
java -jar target/vyanix-webservice-0.0.1-SNAPSHOT.jar
```

**Backend will start on:** `http://localhost:8080`

**Health check:**
```bash
curl http://localhost:8080/actuator/health
```

### Frontend

```bash
cd frontend/Vyanix-React

# Install dependencies (first time only)
npm install

# Run development server
npm run dev
```

**Frontend will start on:** `http://localhost:9002`

### Verify Setup

```bash
# Test backend health
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Test frontend
curl http://localhost:9002
# Expected: HTML response
```

---

## 💻 Development Workflow

### Frontend Commands

```bash
cd frontend/Vyanix-React

# Development
npm run dev          # Start dev server (port 9002)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Cleanup
npm run clean        # Clean build artifacts (Unix)
npm run clean-windows # Clean build artifacts (Windows)
```

### Backend Commands

```bash
cd backend/vyanix-webservice

# Development
./mvnw spring-boot:run              # Run application
./mvnw compile                      # Compile only
./mvnw clean package                # Build JAR

# Testing
./mvnw test                         # Run all tests
./mvnw test -Dtest=ClassName        # Run specific test class
./mvnw test -Dtest=Class#method     # Run specific test method

# Skip tests (when necessary)
./mvnw clean package -DskipTests
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend
docker-compose up -d frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Clean up (removes volumes)
docker-compose down -v
```

---

## 🔐 Authentication System

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LOGIN                                                   │
│  1. POST /api/auth/login                                │
│  2. Backend returns:                                    │
│     - Access Token (15 min, memory-only)                │
│     - Refresh Token (7 days, HttpOnly cookie)           │
│  3. Frontend stores access token in memory              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  API REQUESTS                                            │
│  1. Frontend includes:                                  │
│     Authorization: Bearer <access_token>                │
│  2. Backend validates JWT signature & version           │
│  3. If 401: Auto-trigger refresh                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  TOKEN REFRESH                                           │
│  1. Frontend calls POST /api/auth/refresh               │
│  2. Backend validates refresh token from cookie         │
│  3. Rotates refresh token (revoke old, create new)      │
│  4. Returns new access token                            │
│  5. Frontend retries original request                   │
└─────────────────────────────────────────────────────────┘
```

### Security Features

✅ **Memory-only access tokens** - No localStorage XSS vulnerability  
✅ **HttpOnly refresh cookies** - Not accessible to JavaScript  
✅ **Token rotation** - New refresh token on every refresh  
✅ **Grace period (30s)** - Prevents race conditions  
✅ **Theft detection** - Reused tokens trigger session revocation  
✅ **Rate limiting** - 10/min per IP, 12/min per user + 3 burst  
✅ **Token versioning** - Bulk invalidation on password/role change  
✅ **Redis blocklist** - Immediate revocation of access tokens  

### Testing Authentication

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Response includes accessToken in body
# Refresh token set in HttpOnly cookie

# 2. Get current user
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <access_token_from_step_1>"

# 3. Refresh token
curl -X POST http://localhost:8080/api/auth/refresh \
  -b "refresh_token=<cookie_from_login>"

# 4. Logout
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -b "refresh_token=<cookie>"
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/refresh` | Refresh access token | No (uses cookie) |
| POST | `/api/auth/logout` | Logout | Yes |
| POST | `/api/auth/logout/all` | Logout all devices | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/sessions` | Get active sessions | Yes |
| DELETE | `/api/auth/sessions/:id` | Revoke session | Yes |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/slug/:slug` | Get product by slug |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:slug/products` | Get category products |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |

### Actuator Endpoints

| Endpoint | Description |
|----------|-------------|
| `/actuator/health` | Application health |
| `/actuator/info` | Application info |
| `/actuator/metrics` | Application metrics |
| `/actuator/migration/refresh-tokens` | Token migration status |

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error: `password authentication failed for user "postgres"`**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify credentials in .env match PostgreSQL setup
# Default: postgres/postgres

# Test connection
psql -h localhost -U postgres -d vyanix
```

**Error: `BeanDefinitionOverrideException: rateLimitFilter`**

```bash
# Clean and rebuild
cd backend/vyanix-webservice
./mvnw clean compile

# Restart application
```

**Error: `Circular placeholder reference`**

```bash
# Check application.yaml for correct property format
# Should be: app.migration.legacy-token-migration-ended
# NOT: LEGACY_TOKEN_MIGRATION_ENDED
```

### Frontend Won't Start

**Error: `Module not found`**

```bash
cd frontend/Vyanix-React
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Error: `Port 9002 already in use`**

```bash
# Kill process on port 9002 (Unix/Mac)
lsof -ti:9002 | xargs kill -9

# Or change port
npm run dev -- -p 9003
```

### Authentication Issues

**Error: `401 Unauthorized` on `/api/auth/me` after login**

Check that access token is being set in memory:

```typescript
// In browser console after login:
// (If you have access to internal state)
```

**Fix:** Ensure `setAccessTokenInMemory()` is called in `persistToken()`:

```typescript
// auth-context.tsx
const persistToken = useCallback((nextToken: string | null) => {
  setAccessToken(nextToken);              // React state
  setAccessTokenInMemory(nextToken);      // API client module
}, []);
```

**Error: `Token version outdated`**

This is expected after:
- Password change
- Role change
- Token theft detected

**Solution:** User must log in again.

### Database Migration Issues

**Error: `Flyway validation failed`**

```bash
# Check migration scripts are in correct location
ls backend/vyanix-webservice/src/main/resources/db/migration/

# Expected: V1__*.sql, V2__*.sql

# If baseline needed (existing database):
# Add to application.yaml:
spring:
  flyway:
    baseline-on-migrate: true
```

### Docker Issues

**Error: `Container exited with code 1`**

```bash
# View container logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env | grep SPRING

# Restart specific service
docker-compose restart backend
```

**Error: `Port already in use`**

```bash
# Stop all containers
docker-compose down

# Check what's using the port
netstat -ano | findstr ":8080"  # Windows
lsof -i :8080                   # Unix/Mac

# Kill process or change port
```

---

## 📝 Code Style & Conventions

### Frontend

- **TypeScript:** Strict mode enabled
- **Components:** PascalCase, function components
- **Files:** kebab-case (e.g., `auth-context.tsx`)
- **Imports:** Use `@/` alias for `src/`
- **Styling:** Tailwind CSS, mobile-first

### Backend

- **Java:** Java 21 features encouraged
- **Classes:** PascalCase
- **Methods:** camelCase
- **DTOs:** Use records where appropriate
- **Validation:** Jakarta validation annotations

---

## 🚀 Deployment

### Production Build

```bash
# Frontend
cd frontend/Vyanix-React
npm run build
npm run start  # Production server

# Backend
cd backend/vyanix-webservice
./mvnw clean package -DskipTests
java -jar target/vyanix-webservice-0.0.1-SNAPSHOT.jar
```

### Docker Production

```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review error logs in `backend/vyanix-webservice/logs/`
3. Check browser console for frontend errors
4. Review actuator endpoints for backend health

---

**Last Updated:** March 20, 2026  
**Version:** 2.0.0 (JWT Refresh Token Implementation)
