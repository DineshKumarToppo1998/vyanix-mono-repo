# AGENTS.md - Codebase Guidelines for Vyanix E-commerce Platform

## Build & Development Commands

### Frontend (Next.js 15.5.9, TypeScript 5)
- **Start dev server**: `cd frontend/Vyanix-React && npm run dev` (port 9002, Turbopack enabled)
- **Build**: `cd frontend/Vyanix-React && npm run build`
- **Lint**: `cd frontend/Vyanix-React && npm run lint`
- **Type check**: `cd frontend/Vyanix-React && npm run typecheck`

### Backend (Spring Boot 4.0.3, Java 25)
- **Start**: `cd backend/vyanix-webservice && ./mvnw spring-boot:run` (port 8080)
- **Test**: `cd backend/vyanix-webservice && ./mvnw test`
- **Test single class**: `./mvnw test -Dtest=VyanixWebserviceApplicationTests`
- **Package**: `cd backend/vyanix-webservice && ./mvnw clean package`

### Docker
- **Start all services**: `docker-compose up --build`
- **Stop**: `docker-compose down`

## Code Style Guidelines

### Frontend (TypeScript/React)

#### Imports
- Order: React/next imports → third-party → @/lib → @/hooks → @/components → @/app
- Use path alias: `@/*` maps to `./src/*`
- Default exports for components: `export default function ComponentName`
- Named exports for utilities

#### TypeScript
- Strict mode enabled (`"strict": true`)
- Use `type` for object shapes, `interface` for React props/state
- Use `React.FC` is deprecated; prefer explicit function declaration with typed props
- Use `React.ReactNode` for children props
- Use `React.ButtonHTMLAttributes<HTMLButtonElement>` for button props extensions
- Use proper generics for hooks: `useState<T[]>([])` 

#### Component Patterns
- All UI components in `src/components/ui/`, built on Radix UI primitives
- Use `cva()` from `class-variance-authority` for variant-based styles
- Use `cn()` utility from `@/lib/utils` to merge Tailwind classes
- Functional components with explicit return types
- Use `forwardRef` when exposing ref to parent component

#### Styling
- Tailwind CSS with custom configuration
- Use `className` with dynamic class merging: `cn(baseClasses, conditionalClasses)`
- Dark mode support via `next-themes` (use `useTheme` hook)
- Responsive: mobile-first with `sm:`, `md:`, `lg:` prefixes

#### Naming
- Component files: `PascalCase.tsx`
- Utility files: `camelCase.ts`
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Test files: `*.test.tsx` or `*.spec.tsx`

#### Error Handling
- Use `notFound()` from `next/navigation` for 404s in server components
- Try-catch in async server functions for error handling
- User feedback: use toast notifications via `use-toast` hook

### Backend (Java/Spring Boot)

#### Package Structure
- `in.vyanix.webservice` (root)
  - `entity/` - JPA entities with Lombok annotations
  - `repository/` - JPA repositories extending `JpaRepository<T, UUID>`
  - `service/` - Business logic
  - `controller/` - REST endpoints
  - `mapper/` - Entity ↔ DTO mappers
  - `dto/` - Data transfer objects with Lombok `@Builder`
  - `config/` - Spring configuration
  - `exception/` - Custom exceptions
  - `security/` - Security configuration

#### Java Conventions
- Java 25, use modern features (records, patterns, switch expressions)
- Lombok: `@Entity`, `@Getter`, `@Setter`, `@Builder`, `@Autowired`
- UUID primary keys: `@Id @GeneratedValue private UUID id;`
- Use `List.of()` for immutable lists (Java 9+)
- Use `stream()` for collection transformations

#### Controller Patterns
- `@RestController` with `@RequestMapping("/api/v1/...")`
- Response entities: use DTOs, not entities directly
- CRUD endpoints: `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
- Input validation: `@Valid` annotation with `@NotNull`, `@NotBlank`, `@Size`

#### Service Layer
- `@Service` components
- Use `Optional<T>` for find operations, throw exceptions if not found
- Exception classes in `service.exception/`:
  - `ResourceNotFoundException` - entity not found
  - `BadRequestException` - invalid input
  - `UnauthorizedException` - authentication failure

#### Repository Layer
- Extends `JpaRepository<T, UUID>`
- Custom queries via method naming (e.g., `findByEmail`)
- Use `@Transactional` for write operations

#### Exception Handling
- Custom exceptions for business rules
- Use `ResponseEntityExceptionHandler` for global exception handling
- Return HTTP status codes: 400, 401, 404, 500

## Security
- JWT authentication via `JwtTokenProvider`
- Password encoding: BCrypt via `PasswordEncoder`
- Request validation: `@Valid` with Zod-style validation
- SQL injection protection: use JPA parameters, never string concatenation

## Database
- PostgreSQL (Supabase in prod)
- Hibernate `ddl-auto: update` (development only)
- Cascade: ` orphanRemoval = true` for one-to-many relationships
- Lazy loading default; use `JOIN FETCH` for Eager loading

## Testing
- Backend: JUnit 5 with `@SpringBootTest`
- Frontend: Jest/Vitest not configured; test manual via dev server
- Test command: `./mvnw test` (runs all tests in `src/test/java/`)

## Deployment
- Backend port: 8080
- Frontend port: 9002 (dev), 3000 (Docker)
- Nginx proxies `/api/` to backend
- Environment variables for database/Redis endpoints

## Important Notes
- Do NOT commit secrets: database passwords, API keys
- Use `.env` for local environment config
- JPA `ddl-auto: update` can lose data in production
- Frontend uses localStorage for cart state (key: `commercehub-cart`)
- Next.js App Router: async server components by default
