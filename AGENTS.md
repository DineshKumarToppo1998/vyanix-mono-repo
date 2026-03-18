# AGENTS.md - Vyanix Monorepo Guide for Coding Agents

## Scope
- Repository type: monorepo with a Next.js frontend and Spring Boot backend.
- Working directory root: `C:\Users\Dinesh Kumar Toppo\Documents\Coding\Full-Stack\vyanix-mono-repo`.
- Frontend app: `frontend/Vyanix-React`.
- Backend app: `backend/vyanix-webservice`.
- Infra entrypoint: `docker-compose.yml`.

## Rule Files Discovered
- Existing repo guidance: `AGENTS.md`, `CLAUDE.md`, and `frontend/Vyanix-React/CLAUDE.md`.
- Cursor rules: none found in `.cursor/rules/` or `.cursorrules`.
- Copilot rules: none found in `.github/copilot-instructions.md`.
- If new Cursor or Copilot rule files are added later, merge their instructions into this document.

## Stack Snapshot
- Frontend: Next.js 15.5.9, React 19, TypeScript 5, Tailwind CSS 3, Radix UI.
- Backend: Spring Boot 4.0.3, Java 25, Spring Security, JPA, Redis, PostgreSQL.
- Supporting services in Docker: nginx, postgres, redis, meilisearch.

## Build, Lint, and Test Commands

### Frontend Commands
- Install deps: `npm install` in `frontend/Vyanix-React`.
- Dev server: `npm run dev` in `frontend/Vyanix-React`.
- Production build: `npm run build` in `frontend/Vyanix-React`.
- Production start: `npm start` in `frontend/Vyanix-React`.
- Lint: `npm run lint` in `frontend/Vyanix-React`.
- Type check: `npm run typecheck` in `frontend/Vyanix-React`.
- Clean on Unix-like shells: `npm run clean` in `frontend/Vyanix-React`.
- Clean on Windows CMD/PowerShell: `npm run clean-windows` in `frontend/Vyanix-React`.
- Frontend automated tests: none configured right now.
- Single frontend test: not available until a test runner is added.

### Backend Commands
- Start app: `./mvnw spring-boot:run` in `backend/vyanix-webservice`.
- Run all tests: `./mvnw test` in `backend/vyanix-webservice`.
- Run a single test class: `./mvnw test -Dtest=ClassName`.
- Run a single test method: `./mvnw test -Dtest=ClassName#methodName`.
- Package app: `./mvnw clean package` in `backend/vyanix-webservice`.
- Skip tests only when necessary for packaging: `./mvnw clean package -DskipTests`.
- Current backend test files: none found under `src/test`; use the single-test commands when tests are added.

### Docker Commands
- Start all services: `docker-compose up --build` from repo root.
- Start in background: `docker-compose up -d --build` from repo root.
- Stop all services: `docker-compose down` from repo root.

## Service Defaults
- Frontend dev port: `9002`.
- Frontend Docker port: `3000`.
- Backend port: `8080`.
- nginx port: `80`.
- PostgreSQL port: `5432`.
- Redis port: `6379`.
- Meilisearch port: `7700`.

## Directory Map
- `frontend/Vyanix-React/src/app`: App Router pages and layouts.
- `frontend/Vyanix-React/src/components/ui`: Radix-based reusable UI primitives.
- `frontend/Vyanix-React/src/components/*`: feature and layout components.
- `frontend/Vyanix-React/src/hooks`: custom React hooks.
- `frontend/Vyanix-React/src/lib`: utilities, shared types, API client helpers.
- `backend/vyanix-webservice/src/main/java/in/vyanix/webservice/controller`: REST controllers.
- `backend/vyanix-webservice/src/main/java/in/vyanix/webservice/service`: business logic.
- `backend/vyanix-webservice/src/main/java/in/vyanix/webservice/repository`: JPA repositories.
- `backend/vyanix-webservice/src/main/java/in/vyanix/webservice/entity`: JPA entities.
- `backend/vyanix-webservice/src/main/java/in/vyanix/webservice/dto`: request and response DTOs.
- `backend/vyanix-webservice/src/main/java/in/vyanix/webservice/mapper`: entity/DTO mapping.
- `backend/vyanix-webservice/src/main/resources/application.yaml`: app config.

## Frontend Code Style

### Imports and Modules
- Prefer `@/*` aliases for imports from `src`; `tsconfig.json` maps `@/*` to `./src/*`.
- Keep import groups stable: framework/runtime, third-party, internal aliases, relative imports.
- Use type-only imports where appropriate, especially for Next metadata and shared types.
- Components in `src/components/ui` usually export named symbols; match existing file exports.

### TypeScript and React
- `strict` mode is enabled; do not introduce `any` unless unavoidable.
- Prefer `interface` for component props and extend DOM prop types when wrapping elements.
- Prefer explicit prop typing and function parameters over `React.FC`.
- Use `React.ReactNode` for children props.
- Use generics with hooks, for example `useState<CartItem[]>([])`.
- Mark client components with `'use client';` only when hooks, browser APIs, or client interactivity are required.

### Components and State
- Follow the existing split between `app`, `components`, `hooks`, `contexts`, and `lib`.
- Reusable primitives belong in `src/components/ui`.
- Shared class merging should use `cn()` from `@/lib/utils`.
- Variant-heavy UI components should use `cva()` from `class-variance-authority`.
- Existing cart behavior relies on localStorage key `commercehub-cart`; preserve compatibility unless intentionally migrating.
- Theme behavior uses `next-themes`; preserve `ThemeProvider` usage in `src/app/layout.tsx`.

### Styling and Formatting
- Tailwind is the default styling approach.
- Prefer composition with utility classes over custom CSS unless styles are truly global.
- Preserve the current file-local formatting style when editing; the frontend is not fully uniform yet.
- Common patterns include semicolon-based files in `app/*` and semicolon-free UI primitive files from shadcn/Radix scaffolding.
- Keep JSX readable: break long prop lists over multiple lines.
- Favor mobile-first responsive classes.

### Naming
- Route files follow Next.js conventions: `page.tsx`, `layout.tsx`.
- Component files are mostly lowercase kebab-case or framework-standard names in this repo; follow the surrounding directory style instead of renaming broadly.
- Exported React components use PascalCase.
- Hooks use `useX` naming.
- Shared constants use `UPPER_SNAKE_CASE` when they are true constants.

### Frontend Error Handling
- Handle async failures around fetches and browser APIs.
- Show user-facing feedback with the toast system when an action fails or succeeds.
- Use `notFound()` for missing server-rendered resources when implementing App Router pages.
- Avoid silent failures for cart, checkout, or auth flows.

## Backend Code Style

### Java Structure
- Base package: `in.vyanix.webservice`.
- Keep controller, service, repository, entity, mapper, dto, config, security, and exception concerns separated.
- Prefer DTOs for API boundaries; do not expose JPA entities directly from controllers.

### Java Conventions
- Use Java 25 language features when they improve clarity, but stay consistent with the surrounding code.
- The codebase already uses both records and Lombok-backed classes; keep using the established local pattern.
- DTO request models often use `record` plus Jakarta validation annotations.
- Entities typically use Lombok `@Getter` and `@Setter` with JPA annotations.
- UUID is the default identifier type across entities and APIs.
- Repository interfaces should extend `JpaRepository<..., UUID>` where applicable.

### Controllers and Services
- Controllers use `@RestController` and versioned routes under `/api/v1/...`.
- Validate request bodies with `@Valid`.
- Build consistent `ApiResponse<T>` wrappers for success responses.
- Put business rules in services, not controllers.
- Use repository lookups that throw domain-specific exceptions when records are missing.

### Persistence and Mapping
- Prefer JPA relationships and repository methods over manual SQL.
- Use mapper classes to convert entities to response DTOs.
- Preserve `orphanRemoval = true` and cascade settings where already modeled.
- Use immutable collections like `List.of()` when returning fixed lists.

### Backend Error Handling
- Prefer `BadRequestException`, `ResourceNotFoundException`, and `UnauthorizedException` for domain errors.
- Centralize HTTP error translation in `GlobalExceptionHandler`.
- Preserve structured error payloads using `ApiErrorResponse`.
- Add validation annotations instead of manual null checks when possible.

## Security and Secrets
- Never commit new secrets, API keys, database credentials, or tokens.
- Treat `backend/vyanix-webservice/src/main/resources/application.yaml` as sensitive because it currently contains real-looking credentials; prefer environment-based configuration for future changes.
- Keep JWT, database, Redis, and third-party credentials out of source control when modifying config.
- Do not weaken auth, password encoding, or request validation without a clear requirement.

## Agent Workflow Expectations
- Before editing, inspect nearby files and match their conventions.
- Prefer minimal, targeted changes over broad refactors.
- Do not rename files solely for style consistency unless required for the task.
- When adding tests later, prefer focused backend unit or slice tests before full integration coverage.
- For frontend changes, run at least `npm run typecheck`; run `npm run lint` when the touched area could affect lint rules.
- For backend changes, run `./mvnw test` when feasible; if tests do not exist, at least ensure the code compiles via `./mvnw clean package` when the task warrants it.

## Known Gaps
- No Cursor or Copilot instruction files are present today.
- No automated frontend test runner is configured today.
- No backend test sources are present today despite Maven test dependencies being configured.
- Frontend formatting is not fully standardized, so preserve local style when editing.
