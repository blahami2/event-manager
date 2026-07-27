# Execution Backlog (Layer B)

> **Purpose**: Atomic, measurable tickets for agentic development.
> Each ticket is designed to be completed in under 1 hour.
> Agents MUST read `docs/ARCHITECTURE_RULES.md` before starting any ticket.

---

# Dependency Graph

```
PHASE 1: Bootstrap
  T-001 → T-002 → T-038 (CI foundation)
  T-002 → T-003 → T-039 (Prisma client singleton)
  T-003 → T-004 → T-005 → T-006
  T-006 → T-040 (shared types)
  T-006 + T-003 → T-043 (seed data population)

PHASE 2: Core Infrastructure
  T-006 → T-007 (error types)
  T-007 → T-041 (API response utility)
  T-007 → T-036 (error boundaries) [moved early]
  T-006 → T-008 (logger)
  T-006 → T-009 (token utility)
  T-008 + T-006 → T-010 (rate limiter)

PHASE 3: Data Layer
  T-039 + T-040 + T-007 → T-011 (registration repository)
  T-039 + T-040 + T-009 → T-012 (token repository)
  T-039 + T-040 → T-013 (admin repository)

PHASE 4: Application Layer
  T-011 + T-012 + T-009 → T-014 (register use case)
  T-012 + T-011 → T-015 (manage registration use case)
  T-012 + T-011 → T-016 (resend link use case)
  T-013 + T-004 → T-017 (admin auth guard)
  T-013 + T-011 → T-018 (admin actions use case)
  T-009 → T-042 (CI coverage gates)

PHASE 5: Email
  T-014 → T-019 (email service)
  T-019 → T-020 (email templates)

PHASE 6: API Routes
  T-014 + T-010 + T-041 → T-025 (register API route)
  T-015 + T-010 + T-041 → T-026 (manage API route)
  T-016 + T-010 + T-041 → T-027 (resend link API route)
  T-017 + T-018 + T-041 → T-044 (admin mutation API routes)

PHASE 7: UI – Public Pages
  T-036 + T-025 + T-019 → T-021 (event landing page)
  T-036 + T-025 → T-022 (registration form)
  T-036 + T-026 → T-023 (manage page)
  T-036 + T-027 → T-024 (resend link page)

PHASE 8: Admin UI
  T-017 → T-028 (admin layout + auth)
  T-018 + T-028 → T-029 (admin dashboard)
  T-044 + T-028 → T-030 (admin registration list)
  T-018 → T-031 (admin CSV export)

PHASE 9: Security Hardening
  T-025..T-027 → T-032 (rate limiting integration)
  T-032 → T-033 (token logging audit)
  T-033 → T-034 (security headers)
  T-033 → T-045 (CI security & architecture suites)

PHASE 10: Observability & Polish
  T-008 → T-035 (health endpoint)
  T-035 → T-037 (data retention)
  T-037 → T-046 (README)

PHASE 11: Enhancements
  T-006 → T-047 (ICS calendar invite generator)
  T-047 + T-019 + T-020 → T-048 (attach ICS to email)
  T-006 → T-049 (i18n infrastructure)
  T-049 + T-021..T-024 → T-050 (translate public UI)
  T-049 + T-020 → T-051 (translate email templates)
  T-049 → T-052 (language switcher component)
  T-049 + T-028..T-031 → T-053 (translate admin UI)
  T-003 + T-040 + T-014 + T-022 → T-054 (registration field migration)
```

**Visual dependency tree:**

```
T-001 (Init Next.js)
  └─ T-002 (TypeScript strict, Tailwind, Vitest)
      ├─ T-038 (CI foundation)
      └─ T-003 (Prisma + schema)
          ├─ T-039 (Prisma client singleton)
          │   ├─ T-011 (Registration repo) ←[+T-040, +T-007]
          │   ├─ T-012 (Token repo) ←[+T-040, +T-009]
          │   └─ T-013 (Admin repo) ←[+T-040]
          ├─ T-043 (Seed data population) ←[+T-006]
          └─ T-004 (Supabase Auth)
              └─ T-005 (Resend setup)
                  └─ T-006 (Env config + folder structure)
                      ├─ T-040 (Shared types)
                      ├─ T-007 (Error types)
                      │   ├─ T-041 (API response utility)
                      │   └─ T-036 (Error boundaries) [moved early]
                      ├─ T-008 (Logger)
                      │   ├─ T-010 (Rate limiter) ←[+T-008]
                      │   └─ T-035 (Health endpoint)
                      │       └─ T-037 (Data retention)
                      │           └─ T-046 (README)
                      └─ T-009 (Token utility)
                          └─ T-042 (CI coverage gates)

  T-011 + T-012 + T-009 → T-014 (Register use case)
    └─ T-019 (Email service)
        └─ T-020 (Email templates)
  T-012 + T-011 → T-015 (Manage use case)
  T-012 + T-011 → T-016 (Resend use case)
  T-013 + T-004 → T-017 (Admin auth guard)
  T-013 + T-011 → T-018 (Admin actions)

  T-014 + T-010 + T-041 → T-025 (Register API)
  T-015 + T-010 + T-041 → T-026 (Manage API)
  T-016 + T-010 + T-041 → T-027 (Resend API)
  T-017 + T-018 + T-041 → T-044 (Admin mutation API)

  T-036 + T-025 + T-019 → T-021 (Landing page)
  T-036 + T-025 → T-022 (Registration form)
  T-036 + T-026 → T-023 (Manage page)
  T-036 + T-027 → T-024 (Resend page)

  T-017 → T-028 (Admin layout)
  T-018 + T-028 → T-029 (Admin dashboard)
  T-044 + T-028 → T-030 (Admin reg list)
  T-018 → T-031 (CSV export)

  T-025..T-027 → T-032 (Rate limit integration)
    └─ T-033 (Token logging audit)
        ├─ T-034 (Security headers)
        └─ T-045 (CI security suites)

  T-047 (ICS generator)
    └─ T-048 (Attach ICS to email) ←[+T-019, +T-020]

  T-049 (i18n infrastructure)
    ├─ T-050 (Translate public UI) ←[+T-021..T-024]
    ├─ T-051 (Translate email templates) ←[+T-020]
    ├─ T-052 (Language switcher)
    └─ T-053 (Translate admin UI) ←[+T-028..T-031]
```

---

# Phase 1: Project Bootstrap

## T-001: Initialize Next.js Project

**Input:** Empty project directory
**Output:**
- `package.json` with Next.js 14+, React 18+, TypeScript 5+
- `next.config.js` with base configuration
- `tsconfig.json` (strict mode NOT yet configured – see T-002)
- `src/app/layout.tsx` with minimal root layout
- `src/app/page.tsx` with placeholder content

**Files created:**
- `package.json`
- `next.config.js`
- `.gitignore` (via `create-next-app`)
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

**Acceptance criteria:**
- [x] `npm run dev` starts without errors
- [x] Navigating to `localhost:3000` shows the placeholder page
- [x] No TypeScript compilation errors
- [x] `.gitignore` includes: `node_modules/`, `.env.local`, `.next/`, `.vercel/`

**Non-goals:**
- Do not configure Tailwind yet (T-002)
- Do not set up testing yet (T-002)
- Do not create any business logic

---

## T-002: Configure TypeScript Strict Mode, Tailwind, and Testing

**Input:** Next.js project from T-001
**Output:**
- `tsconfig.json` updated with strict mode settings
- Tailwind CSS configured
- Vitest configured with Testing Library
- ESLint configured with custom rules
- `package.json` scripts verified

**Files created/modified:**
- `tsconfig.json` (modified)
- `tailwind.config.ts` (created)
- `vitest.config.ts` (created)
- `.eslintrc.json` (created)
- `src/app/globals.css` (modified – add Tailwind directives)
- `package.json` (modified – verify scripts)

**Acceptance criteria:**
- [x] `tsconfig.json` has `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitReturns": true`
- [x] `npx tailwindcss --help` runs without error
- [x] `npx vitest run` executes with 0 tests (no failures)
- [x] `npm run lint` passes with no errors
- [x] `npm run build` succeeds
- [x] `package.json` has scripts: `dev`, `build`, `start`, `lint`, `test` (alias for `vitest run`)

**Non-goals:**
- Do not write any tests yet
- Do not create components
- Do not set up CI yet (T-038)

---

## T-038: CI Pipeline – Foundation

**Input:** T-002 (TypeScript, ESLint, Vitest configured)
**Output:**
- GitHub Actions workflow that runs on every push/PR
- Runs: type check, lint, test, secret scan, build

**Files created:**
- `.github/workflows/ci.yml`

**Acceptance criteria:**
- [x] Workflow triggers on push to `main`/`master` and on PRs
- [x] Steps: checkout → setup Node 20 → `npm ci` → `npx tsc --noEmit` → `npm run lint` → `npx vitest run` → gitleaks secret scan → `npm run build`
- [x] Gitleaks step uses `gitleaks/gitleaks-action@v2`
- [x] Build step uses placeholder environment variables (see `docs/VERIFICATION_RULES.md` Section 9)
- [x] Workflow runs successfully (all steps pass with the current empty project)
- [x] YAML is valid (no syntax errors)

**Non-goals:**
- Do not add coverage thresholds yet (T-042)
- Do not add security or architecture checks yet (T-045)
- Do not configure deployment

---

## T-003: Configure Prisma and Database Schema

**Input:** Project from T-002
**Output:**
- Prisma installed and configured
- Database schema with all models from `docs/ARCHITECTURE.md` Section 8
- Initial migration generated

**Files created:**
- `prisma/schema.prisma`
- `prisma/migrations/YYYYMMDD_init/migration.sql` (auto-generated)

**Acceptance criteria:**
- [x] `prisma/schema.prisma` contains models: `Registration`, `RegistrationToken`, `AdminUser`
- [x] `Registration` model has fields: `id` (UUID), `name`, `email`, `guestCount`, `dietaryNotes`, `status` (enum: CONFIRMED/CANCELLED), `createdAt`, `updatedAt`
- [x] `RegistrationToken` model has fields: `id` (UUID), `registrationId` (FK), `tokenHash` (unique, indexed), `expiresAt`, `isRevoked`, `createdAt`
- [x] `AdminUser` model has fields: `id` (UUID), `supabaseUserId` (unique), `email`, `createdAt`
- [x] `npx prisma validate` passes
- [x] `npx prisma generate` succeeds

**Non-goals:**
- Do not create seed data yet (T-043)
- Do not create repositories yet (T-011)
- Do not create the Prisma singleton yet (T-039)
- Do not run migrations against production

---

## T-039: Prisma Client Singleton

**Input:** T-003 (Prisma schema configured)
**Output:**
- Shared PrismaClient instance with Next.js dev-safe singleton pattern

**Files created:**
- `src/repositories/prisma.ts`

**Acceptance criteria:**
- [x] Exports a singleton `prisma` instance of `PrismaClient`
- [x] Uses the standard Next.js pattern: stores instance on `globalThis` in development to prevent connection pool exhaustion during hot reloads
- [x] In production: creates a single instance
- [x] TypeScript compiles without errors
- [x] All repository files will import from `./prisma` (not `@prisma/client` directly)

**Non-goals:**
- Do not create repositories (T-011, T-012, T-013)
- Do not add connection pooling configuration

---

## T-004: Integrate Supabase Auth

**Input:** Project from T-003
**Output:**
- Supabase client libraries installed
- Supabase client wrapper created

**Files created:**
- `src/lib/auth/supabase-client.ts` (server-side Supabase client factory)

**Files modified:**
- `package.json` (add `@supabase/supabase-js`, `@supabase/ssr`)

**Acceptance criteria:**
- [x] `supabase-client.ts` exports `createServerClient()` function
- [x] Client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from environment
- [x] Server client uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- [x] TypeScript compiles without errors
- [x] No secrets are hardcoded

**Non-goals:**
- Do not create login UI
- Do not create admin guard middleware (T-017)

---

## T-005: Integrate Resend

**Input:** Project from T-004
**Output:**
- Resend SDK installed
- Email service abstraction created

**Files created:**
- `src/lib/email/send-manage-link.ts` (stub: accepts registrationId and email, returns success/failure)

**Files modified:**
- `package.json` (add `resend`)

**Acceptance criteria:**
- [x] `send-manage-link.ts` exports async function with signature: `(params: { to: string; manageUrl: string; guestName: string }) => Promise<{ success: boolean; error?: string }>`
- [x] Function uses `RESEND_API_KEY` from environment
- [x] TypeScript compiles without errors
- [x] No API key hardcoded

**Non-goals:**
- Do not create email templates (T-020)
- Do not send actual emails in tests

---

## T-006: Environment Configuration and Folder Structure

**Input:** Project from T-005
**Output:**
- `.env.example` with all required variables documented
- Config modules created
- Seed script skeleton
- Full folder structure created (empty index files where needed)

**Files created:**
- `.env.example`
- `src/config/event.ts` (event name, date, location – configurable constants)
- `src/config/limits.ts` (rate limits, token expiry constants)
- `prisma/seed.ts` (skeleton with fixed UUID constants, no actual data yet – see T-043)
- `tests/fixtures/seed-data.ts` (re-exports seed constants)

**Acceptance criteria:**
- [x] `.env.example` lists ALL variables from `docs/ARCHITECTURE.md` Section 10.3
- [x] `src/config/limits.ts` exports: `MAX_REGISTRATION_ATTEMPTS_PER_HOUR = 5`, `MAX_TOKEN_LOOKUPS_PER_HOUR = 10`, `MAX_RESEND_ATTEMPTS_PER_HOUR = 3`, `MAX_ADMIN_LOGIN_ATTEMPTS_PER_15MIN = 5`, `TOKEN_EXPIRY_DAYS = 90`
- [x] `src/config/event.ts` exports: `EVENT_NAME`, `EVENT_DATE`, `EVENT_LOCATION`, `EVENT_DESCRIPTION`
- [x] `prisma/seed.ts` contains fixed UUID constants
- [x] All directories from `docs/ARCHITECTURE.md` Section 2 exist
- [x] `.env.example` has comments explaining each variable

**Non-goals:**
- Do not populate seed data with actual records yet (T-043)

---

## T-040: Shared TypeScript Types

**Input:** T-006 (folder structure exists)
**Output:**
- All shared type definitions used across layers
- Types defined before repositories and use cases need them

**Files created:**
- `src/types/registration.ts`
- `src/types/api.ts`

**Acceptance criteria:**
- [x] `src/types/registration.ts` exports: `RegistrationInput`, `RegistrationOutput`, `RegistrationStatus` (enum), `RegistrationFilters`, `PaginatedResult<T>`, `TokenData`
- [x] `RegistrationInput` has: `name: string`, `email: string`, `guestCount: number`, `dietaryNotes?: string`
- [x] `RegistrationOutput` has: `id: string`, `name: string`, `email: string`, `guestCount: number`, `dietaryNotes: string | null`, `status: RegistrationStatus`, `createdAt: Date`, `updatedAt: Date`
- [x] `src/types/api.ts` exports: `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>` (union)
- [x] `ApiSuccessResponse<T>` shape: `{ data: T; message: string }`
- [x] `ApiErrorResponse` shape: `{ error: { code: string; message: string; fields?: Record<string, string> } }`
- [x] TypeScript compiles without errors
- [x] No circular imports

**Non-goals:**
- Do not create Zod schemas (T-014)
- Do not create runtime validation

---

## T-043: Seed Data Population

**Input:** T-006 (seed skeleton), T-003 (Prisma schema)
**Output:**
- Fully populated seed script with test data
- Shared fixture constants for tests

**Files modified:**
- `prisma/seed.ts` (populate with actual records)
- `tests/fixtures/seed-data.ts` (add complete fixture data)

**Files modified:**
- `package.json` (add `prisma.seed` config)

**Acceptance criteria:**
- [x] Seed creates 1 admin user with fixed UUID
- [x] Seed creates 3 test registrations: 1 confirmed, 1 confirmed with dietary notes, 1 cancelled
- [x] All seed records use fixed UUIDs from `tests/fixtures/seed-data.ts`
- [ ] `npx prisma db seed` runs without errors (when DB is available)
- [x] `tests/fixtures/seed-data.ts` exports all fixed UUIDs and test data objects
- [x] Seed script is idempotent (can run multiple times without duplicates via `upsert`)

**Non-goals:**
- Do not create token records in seed (tokens are generated at runtime)
- Do not seed against production

---

# Phase 2: Core Infrastructure

## T-007: Implement Error Types

**Input:** Project from T-006
**Output:**
- Custom error class hierarchy as defined in `docs/ARCHITECTURE.md` Section 5.1
- Unit tests for error classes

**Files created:**
- `src/lib/errors/app-errors.ts`
- `tests/unit/lib/errors/app-errors.test.ts`

**Acceptance criteria:**
- [x] `AppError` base class with: `message`, `code`, `statusCode`, `isOperational`
- [x] Subclasses: `ValidationError` (400), `NotFoundError` (404), `RateLimitError` (429), `AuthenticationError` (401), `AuthorizationError` (403)
- [x] `ValidationError` accepts `fields: Record<string, string>`
- [x] All errors extend `Error` (proper prototype chain)
- [x] Unit tests cover all error types with correct status codes
- [x] `npx vitest run` passes

**Non-goals:**
- Do not create error-handling middleware
- Do not create API error response utility (T-041)

---

## T-041: API Response Utility

**Input:** T-007 (error types)
**Output:**
- Shared utility for formatting consistent API responses
- Unit tests

**Files created:**
- `src/lib/api-response.ts`
- `tests/unit/lib/api-response.test.ts`

**Acceptance criteria:**
- [x] Exports `successResponse<T>(data: T, message: string, status?: number): NextResponse`
- [x] Exports `errorResponse(error: AppError): NextResponse`
- [x] Exports `handleApiError(error: unknown): NextResponse` (catches unknown errors, returns 500)
- [x] `successResponse` returns JSON matching `ApiSuccessResponse<T>` from `src/types/api.ts`
- [x] `errorResponse` returns JSON matching `ApiErrorResponse` from `src/types/api.ts`
- [x] `handleApiError` maps `AppError` subclasses to correct status codes
- [x] `handleApiError` returns generic 500 for non-`AppError` errors (no internal details leaked)
- [x] `ValidationError` includes `fields` in response body
- [x] Unit test: success response format
- [x] Unit test: each error type maps to correct status code and JSON shape
- [x] Unit test: unknown error returns 500 with generic message

**Non-goals:**
- Do not handle streaming responses
- Do not add logging (route handlers log before calling this)

---

## T-036: Error Boundaries

> **Moved from Phase 10 to Phase 2.** Error boundaries must exist before any UI pages are built.

**Input:** T-007 (error types)
**Output:**
- React error boundaries for graceful error handling

**Files created:**
- `src/app/error.tsx` (root error boundary)
- `src/app/not-found.tsx` (404 page)
- `src/app/admin/error.tsx` (admin error boundary)

**Acceptance criteria:**
- [x] Root error boundary shows user-friendly message: "Something went wrong. Please try again."
- [x] Root error boundary has "Try again" button that resets error state
- [x] 404 page shows "Page not found" with link to home
- [x] Admin error boundary shows admin-specific error message
- [x] No stack traces shown to users
- [x] Error boundary components are Client Components (`'use client'`)

**Non-goals:**
- Do not implement error reporting to external service (Sentry, etc.)
- Do not add structured logging here (that happens in API routes)

---

## T-008: Implement Structured Logger

**Input:** Project from T-006
**Output:**
- Logging utility wrapper
- Unit tests

**Files created:**
- `src/lib/logger.ts`
- `tests/unit/lib/logger.test.ts`

**Acceptance criteria:**
- [x] Exports `logger` object with methods: `info()`, `warn()`, `error()`, `debug()`
- [x] Each method accepts `(message: string, context?: Record<string, unknown>)`
- [x] Output is structured JSON: `{ "level", "message", "context", "timestamp" }`
- [x] In development: pretty-printed to console
- [x] Exports `maskEmail('john@example.com')` → returns `j***@example.com`
- [x] Exports `hashIp('192.168.1.1')` → returns consistent SHA-256 hash
- [x] Unit test verifies log output structure
- [x] Unit test verifies email masking
- [x] Unit test verifies IP hashing

**Non-goals:**
- Do not integrate with external logging service
- Do not create log rotation

---

## T-009: Implement Capability Token Utility

**Input:** Project from T-006
**Output:**
- Token generation and hashing utility
- Comprehensive unit tests

**Files created:**
- `src/lib/token/capability-token.ts`
- `tests/unit/lib/token/capability-token.test.ts`

**Acceptance criteria:**
- [x] `generateToken()` returns `{ raw: string; hash: string }` where `raw` is base64url-encoded 32+ bytes
- [x] `hashToken(raw: string)` returns SHA-256 hex digest
- [x] `generateToken().raw` decoded length >= 32 bytes
- [x] `hashToken(token)` produces same hash for same input (deterministic)
- [x] `hashToken(tokenA) !== hashToken(tokenB)` for different tokens
- [x] Raw token is URL-safe (matches `/^[A-Za-z0-9_-]+$/`)
- [x] Unit test: token length >= 32 bytes when decoded
- [x] Unit test: hash is deterministic
- [x] Unit test: different tokens produce different hashes
- [x] Unit test: raw token is URL-safe
- [x] `npx vitest run` passes

**Non-goals:**
- Do not create token storage (T-012)
- Do not create token lookup logic (T-012)

---

## T-010: Implement Rate Limiter

**Input:** T-008 (logger – for `hashIp`), T-006 (config – for limits)
**Output:**
- In-memory rate limiter (upgradeable to Redis/DB later)
- Unit tests

**Files created:**
- `src/lib/rate-limit/limiter.ts`
- `tests/unit/lib/rate-limit/limiter.test.ts`

**Acceptance criteria:**
- [x] Exports `createRateLimiter(config: { windowMs: number; maxAttempts: number })`
- [x] Returns object with `check(identifier: string): { allowed: boolean; remaining: number; resetAt: Date }`
- [x] Correctly tracks attempts within sliding window
- [x] Resets counter after window expires
- [x] Respects `RATE_LIMIT_DISABLED` env var for development
- [x] Uses hashed IP as identifier (calls `hashIp` from `src/lib/logger.ts`)
- [x] Unit test: allows requests within limit
- [x] Unit test: blocks requests exceeding limit
- [x] Unit test: resets after window expires
- [x] `npx vitest run` passes

**Non-goals:**
- Do not integrate with API routes (T-032)
- Do not implement persistent storage for rate limits

---

## T-042: CI Pipeline – Coverage Gates

**Input:** T-038 (CI foundation), T-009 (first meaningful tests exist)
**Output:**
- CI pipeline updated with coverage thresholds

**Files modified:**
- `.github/workflows/ci.yml`
- `vitest.config.ts`

**Acceptance criteria:**
- [x] `vitest.config.ts` updated with coverage configuration from `docs/VERIFICATION_RULES.md` Section 4
- [x] Coverage thresholds: 80% lines, 80% functions, 75% branches, 80% statements
- [x] Coverage includes `src/lib/**` and `src/repositories/**`
- [x] Coverage excludes `src/lib/auth/supabase-client.ts` and `src/config/**`
- [x] CI step changed from `npx vitest run` to `npx vitest run --coverage`
- [x] CI fails if coverage drops below thresholds
- [x] `npx vitest run --coverage` passes locally

**Non-goals:**
- Do not add security or architecture test suites yet (T-045)

---

# Phase 3: Data Layer

## T-011: Implement Registration Repository

**Input:** T-039 (Prisma singleton), T-040 (shared types), T-007 (error types)
**Output:**
- Registration data access layer
- Unit tests with mocked Prisma

**Files created:**
- `src/repositories/registration-repository.ts`
- `tests/unit/repositories/registration-repository.test.ts`

**Acceptance criteria:**
- [x] Imports `prisma` from `./prisma` (the singleton, NOT from `@prisma/client`)
- [x] Exports: `createRegistration(data)`, `findRegistrationById(id)`, `findRegistrationByEmail(email)`, `updateRegistration(id, data)`, `cancelRegistration(id)`, `listRegistrations(filters)`, `countRegistrations()`
- [x] All methods use typed input/output from `src/types/registration.ts`
- [x] `cancelRegistration` sets status to `CANCELLED`, does not delete
- [x] `listRegistrations` supports filtering by status and pagination
- [x] Unit tests mock Prisma client
- [x] Unit tests cover: create, find, update, cancel, list, not-found scenarios

**Non-goals:**
- Do not implement business logic (validation, token handling)
- Do not call external services

---

## T-012: Implement Token Repository

**Input:** T-039 (Prisma singleton), T-040 (shared types), T-009 (token utility)
**Output:**
- Token data access layer
- Unit tests

**Files created:**
- `src/repositories/token-repository.ts`
- `tests/unit/repositories/token-repository.test.ts`

**Acceptance criteria:**
- [x] Imports `prisma` from `./prisma` (the singleton)
- [x] Exports: `createToken(registrationId, tokenHash, expiresAt)`, `findByTokenHash(hash)`, `revokeToken(tokenId)`, `revokeAllTokensForRegistration(registrationId)`, `findActiveTokenForRegistration(registrationId)`
- [x] `findByTokenHash` returns `null` for revoked or expired tokens
- [x] `revokeAllTokensForRegistration` marks all tokens as revoked (batch update)
- [x] All methods accept/return typed interfaces, not raw Prisma types
- [x] Unit tests mock Prisma client
- [x] Unit tests cover: create, find valid, find expired (null), find revoked (null), revoke

**Non-goals:**
- Do not implement token generation (that's in T-009)
- Do not implement token rotation logic (that's in T-015)

---

## T-013: Implement Admin Repository

**Input:** T-039 (Prisma singleton), T-040 (shared types)
**Output:**
- Admin user data access layer
- Unit tests

**Files created:**
- `src/repositories/admin-repository.ts`
- `tests/unit/repositories/admin-repository.test.ts`

**Acceptance criteria:**
- [x] Imports `prisma` from `./prisma` (the singleton)
- [x] Exports: `findAdminBySupabaseId(supabaseUserId)`, `isAdmin(supabaseUserId)`, `listAdmins()`
- [x] `isAdmin` returns boolean
- [x] `findAdminBySupabaseId` returns `null` if not found
- [x] Unit tests mock Prisma client
- [x] Unit tests cover: found, not found, isAdmin true/false

**Non-goals:**
- Do not create admin CRUD (admins are seeded or managed via DB directly)
- Do not implement auth logic

---

# Phase 4: Application Layer

## T-014: Implement Register Use Case

**Input:** T-011, T-012, T-009
**Output:**
- Registration use case orchestrator
- Zod validation schema
- Unit tests

**Files created:**
- `src/lib/usecases/register.ts`
- `src/lib/validation/registration.ts` (Zod schema)
- `tests/unit/lib/usecases/register.test.ts`

**Acceptance criteria:**
- [x] `registerGuest(input)` validates with Zod, creates registration, generates token, stores hash, triggers email
- [x] Zod schema validates: `name` (1-200 chars), `email` (valid format), `guestCount` (1-10), `dietaryNotes` (optional, max 500)
- [x] Returns `{ registrationId: string }` on success
- [x] Throws `ValidationError` with field-level details on invalid input
- [x] Does NOT return raw token to caller (token goes only to email)
- [x] Unit tests mock repository and email service
- [x] Unit test: successful registration
- [x] Unit test: validation failure (each field)
- [x] Unit test: duplicate email handling (succeeds – allows re-registration)

**Non-goals:**
- Do not implement the API route (T-025)
- Do not implement rate limiting (T-032)

---

## T-015: Implement Manage Registration Use Case

**Input:** T-011, T-012
**Output:**
- Manage registration use case (view, edit, cancel via token)
- Unit tests

**Files created:**
- `src/lib/usecases/manage-registration.ts`
- `tests/unit/lib/usecases/manage-registration.test.ts`

**Acceptance criteria:**
- [x] `getRegistrationByToken(rawToken)` → hashes token, looks up, returns registration data or throws `NotFoundError`
- [x] `updateRegistrationByToken(rawToken, data)` → validates, updates registration, rotates token, returns `{ newManageUrl: string }`
- [x] `cancelRegistrationByToken(rawToken)` → cancels registration, revokes all tokens
- [x] Token rotation: on update, old token is revoked, new token generated and stored, new manage URL returned
- [x] Failed lookup returns generic `NotFoundError` with message "Link not found or expired" (no info leakage)
- [x] Unit test: successful view, edit, cancel
- [x] Unit test: invalid token returns NotFoundError
- [x] Unit test: expired token returns NotFoundError
- [x] Unit test: token rotation occurs on edit

**Non-goals:**
- Do not implement the API route (T-026)
- Do not implement rate limiting

---

## T-016: Implement Resend Link Use Case

**Input:** T-011, T-012
**Output:**
- Resend manage link use case
- Unit tests

**Files created:**
- `src/lib/usecases/resend-link.ts`
- `tests/unit/lib/usecases/resend-link.test.ts`

**Acceptance criteria:**
- [x] `resendManageLink(email: string)` looks up registration by email
- [x] If found: generates new token, revokes old tokens, sends email with new manage link
- [x] If NOT found: does nothing, returns success (no error, no info leakage)
- [x] Always returns `{ success: true }` regardless of email existence
- [x] Unit test: email exists → new token generated, email sent
- [x] Unit test: email does not exist → no error, no email sent, returns success
- [x] Unit test: cancelled registration → no token generated, returns success

**Non-goals:**
- Do not implement the API route (T-027)
- Do not reveal email existence in any code path

---

## T-017: Implement Admin Auth Guard

**Input:** T-004 (Supabase Auth), T-013 (Admin repository)
**Output:**
- Middleware/guard for admin routes
- Unit tests

**Files created:**
- `src/lib/auth/admin-guard.ts`
- `src/lib/auth/middleware.ts` (Next.js middleware for `/admin/*`)
- `tests/unit/lib/auth/admin-guard.test.ts`

**Acceptance criteria:**
- [x] `verifyAdmin(request)` extracts Supabase session, verifies against `AdminUser` table
- [x] Returns `{ authenticated: true, adminId: string }` or throws `AuthenticationError`/`AuthorizationError`
- [x] No session → `AuthenticationError` (401)
- [x] Session valid but not in AdminUser table → `AuthorizationError` (403)
- [x] Next.js middleware redirects unauthenticated users from `/admin/*` to login
- [x] Unit test: valid admin session → passes
- [x] Unit test: no session → 401
- [x] Unit test: non-admin user → 403

**Non-goals:**
- Do not create login UI
- Do not create admin management CRUD

---

## T-018: Implement Admin Actions Use Case

**Input:** T-011, T-013
**Output:**
- Admin registration management use case
- Unit tests

**Files created:**
- `src/lib/usecases/admin-actions.ts`
- `tests/unit/lib/usecases/admin-actions.test.ts`

**Acceptance criteria:**
- [x] `listRegistrations(filters)` returns paginated list with total count
- [x] `getRegistrationStats()` returns `{ total, confirmed, cancelled }`
- [x] `adminCancelRegistration(registrationId, adminId)` cancels and logs admin action
- [x] `adminEditRegistration(registrationId, data, adminId)` updates and logs admin action
- [x] `exportRegistrationsCsv()` returns CSV string with columns: name, email, guestCount, dietaryNotes, status, createdAt
- [x] All admin actions log with `adminUserId`, `action`, `targetId` (structured logging)
- [x] Unit test: list with pagination
- [x] Unit test: stats calculation
- [x] Unit test: admin cancel
- [x] Unit test: CSV export format

**Non-goals:**
- Do not implement admin UI
- Do not implement CSV file download endpoint (that's UI layer)

---

# Phase 5: Email

## T-019: Complete Email Service

**Input:** T-005 (Resend stub), T-014 (register use case)
**Output:**
- Full email service implementation
- Unit tests

**Files modified:**
- `src/lib/email/send-manage-link.ts` (implement fully)

**Files created:**
- `tests/unit/lib/email/send-manage-link.test.ts`

**Acceptance criteria:**
- [x] Sends email via Resend API with: recipient, subject, HTML body
- [x] Email contains manage link URL: `{BASE_URL}/manage/{raw_token}`
- [x] Email contains guest name and event details
- [x] Returns `{ success: true }` on successful send
- [x] Returns `{ success: false, error: string }` on failure (does not throw)
- [x] Logs email send with `registrationId` and `emailType` (never logs recipient email unmasked)
- [x] Unit test mocks Resend API
- [x] Unit test: successful send
- [x] Unit test: API failure handling

**Non-goals:**
- Do not create HTML email templates (T-020)
- Do not handle email bounces

---

## T-020: Create Email Templates

**Input:** T-019
**Output:**
- HTML email template for manage link
- Unit tests

**Files created:**
- `src/lib/email/templates/manage-link-template.ts`
- `tests/unit/lib/email/templates/manage-link-template.test.ts`

**Acceptance criteria:**
- [x] Exports `renderManageLinkEmail(params: { guestName: string; eventName: string; eventDate: string; manageUrl: string }): string`
- [x] Returns valid HTML string
- [x] HTML contains: guest name, event name, event date, manage link as clickable anchor
- [x] HTML is responsive (inline styles, max-width container)
- [x] No raw tokens in template debug output or comments
- [x] Unit test: all parameters appear in output HTML
- [x] Unit test: manage URL is in an `<a href="...">`

**Non-goals:**
- Do not create email preview UI
- Do not implement multiple email types

---

# Phase 6: API Routes

> **Moved before UI pages.** UI pages depend on API routes existing.

## T-025: Register API Route

**Input:** T-014 (register use case), T-010 (rate limiter), T-041 (API response utility)
**Output:**
- `POST /api/register` route handler

**Files created:**
- `src/app/api/register/route.ts`

**Acceptance criteria:**
- [x] Accepts `POST` with JSON body: `{ name, email, guestCount, dietaryNotes? }`
- [x] Delegates to `registerGuest()` use case
- [x] Uses `successResponse()` / `handleApiError()` from API response utility
- [x] On success: returns `201` with `{ "data": { "registrationId": "..." }, "message": "Registration successful. Check your email." }`
- [x] On validation failure: returns `400` with structured error response
- [x] On rate limit: returns `429` with `Retry-After` header
- [x] On server error: returns `500` with `{ "error": { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred" } }`
- [x] Rate limiter applied: 5 attempts per IP per hour
- [x] No raw tokens in response body

**Non-goals:**
- Do not implement CORS headers (Next.js handles same-origin)
- Do not add authentication (public endpoint)

---

## T-026: Manage API Route

**Input:** T-015 (manage use case), T-010 (rate limiter), T-041 (API response utility)
**Output:**
- `PUT /api/manage` route handler for edits
- `DELETE /api/manage` route handler for cancellation

**Files created:**
- `src/app/api/manage/route.ts`

**Acceptance criteria:**
- [x] `PUT /api/manage` accepts `{ token, name, email, guestCount, dietaryNotes? }`
- [x] Uses `successResponse()` / `handleApiError()` from API response utility
- [x] On success: returns `200` with `{ "data": { "registration": {...} }, "message": "Updated successfully" }`
- [x] `DELETE /api/manage` accepts `{ token }`
- [x] On success: returns `200` with `{ "message": "Registration cancelled" }`
- [x] On invalid token: returns `404` with generic message "Link not found or expired"
- [x] Rate limiter applied: 10 lookups per IP per hour
- [x] Token passed in request body, NOT in URL query params for mutations

**Non-goals:**
- Do not return new raw token in API response (it's emailed)

---

## T-027: Resend Link API Route

**Input:** T-016 (resend use case), T-010 (rate limiter), T-041 (API response utility)
**Output:**
- `POST /api/resend-link` route handler

**Files created:**
- `src/app/api/resend-link/route.ts`

**Acceptance criteria:**
- [x] Accepts `POST` with `{ email: string }`
- [x] ALWAYS returns `200` with `{ "message": "If this email is registered, a manage link has been sent." }`
- [x] Response body is IDENTICAL for existing and non-existing emails
- [x] Response timing must not differ significantly (add artificial delay if needed for timing safety)
- [x] Rate limiter applied: 3 attempts per IP per hour
- [x] No information leakage in headers, timing, or body

**Non-goals:**
- Do not add any conditional response logic visible to client

---

## T-044: Admin Mutation API Routes

**Input:** T-017 (admin auth guard), T-018 (admin actions), T-041 (API response utility)
**Output:**
- Admin API routes for registration management (list, edit, cancel)

**Files created:**
- `src/app/api/admin/registrations/route.ts`

**Acceptance criteria:**
- [x] `GET /api/admin/registrations` returns paginated list with filters (query params: `status`, `search`, `page`, `pageSize`)
- [x] `PUT /api/admin/registrations` accepts `{ registrationId, name, email, guestCount, dietaryNotes? }` – admin edit
- [x] `DELETE /api/admin/registrations` accepts `{ registrationId }` – admin cancel
- [x] All endpoints verify admin auth via `verifyAdmin()` guard
- [x] All endpoints use `successResponse()` / `handleApiError()` from API response utility
- [x] Unauthenticated requests return `401`
- [x] Non-admin users return `403`
- [x] All mutation actions logged with `adminUserId`, `action`, `targetId`

**Non-goals:**
- Do not implement CSV export here (T-031 handles that separately)
- Do not implement bulk operations

---

# Phase 7: UI – Public Pages

> **Moved after API routes.** UI pages submit to API routes that must already exist.

## T-021: Event Landing Page

**Input:** T-036 (error boundaries), T-025 (register API exists), T-019 (email service)
**Output:**
- Public event landing page
- Responsive design

**Files created:**
- `src/app/(public)/page.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`

**Acceptance criteria:**
- [x] Page displays: event name, date, location, description (from `src/config/event.ts`)
- [x] "Register" CTA button links to `/register`
- [x] "Already registered?" link to `/resend-link`
- [x] Responsive layout: looks correct at 320px, 768px, 1280px widths
- [x] Uses Tailwind CSS; no inline styles except in email templates
- [x] Server Component (no `'use client'`)
- [x] No business logic in component

**Non-goals:**
- Do not implement registration form (T-022)
- Do not implement theming system

---

## T-022: Registration Form

**Input:** T-036 (error boundaries), T-025 (register API)
**Output:**
- Registration form page with client-side and server-side validation

**Files created:**
- `src/app/(public)/register/page.tsx`
- `src/components/forms/RegistrationForm.tsx` (Client Component)
- `src/components/ui/Input.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/ui/FormField.tsx`

**Acceptance criteria:**
- [x] Form fields: name (required), email (required), guestCount (required, 1-10 dropdown), dietaryNotes (optional textarea)
- [x] Client-side validation matches Zod schema (immediate feedback)
- [x] Submits to `POST /api/register`
- [x] On success: shows confirmation message "Registration successful! Check your email for your manage link."
- [x] On validation error (400): shows field-level errors
- [x] On rate limit (429): shows "Too many attempts. Please try again later."
- [x] On server error (500): shows "An unexpected error occurred. Please try again."
- [x] Submit button shows loading state during submission
- [x] No business logic in component (delegates to API)

**Non-goals:**
- Do not implement CAPTCHA
- Do not implement duplicate submission prevention (server handles idempotency)

---

## T-023: Manage Registration Page

**Input:** T-036 (error boundaries), T-026 (manage API)
**Output:**
- Token-based registration management page

**Files created:**
- `src/app/(public)/manage/[token]/page.tsx`

**Acceptance criteria:**
- [x] URL: `/manage/{token}` – token extracted from route param
- [x] On valid token: displays registration details with edit form and cancel button
- [x] Edit form pre-populated with current registration data
- [x] On save: calls manage API, shows success message with updated manage link notice
- [x] On cancel: confirmation dialog → calls cancel API → shows "Registration cancelled" message
- [x] On invalid/expired token: shows "This link is not valid or has expired." (generic message)
- [x] On rate limit: shows rate limit message
- [x] No token logged anywhere in client-side code

**Non-goals:**
- Do not implement undo for cancellation
- Do not show token in UI

---

## T-024: Resend Link Page

**Input:** T-036 (error boundaries), T-027 (resend API)
**Output:**
- Email submission form to resend manage link

**Files created:**
- `src/app/(public)/resend-link/page.tsx`
- `src/components/forms/ResendLinkForm.tsx`

**Acceptance criteria:**
- [x] Form with single field: email
- [x] Submits to `POST /api/resend-link`
- [x] On ANY response (200): shows "If this email is registered, a manage link has been sent."
- [x] Response message is IDENTICAL regardless of email existence (matches API contract)
- [x] No loading state difference between found/not-found (timing-safe)
- [x] Submit button shows loading state
- [x] Client-side email format validation

**Non-goals:**
- Do not reveal whether email exists
- Do not implement multiple resend protection on client side

---

# Phase 8: Admin UI

## T-028: Admin Layout and Auth

**Input:** T-017 (admin guard)
**Output:**
- Admin layout with authentication wrapper
- Login page

**Files created:**
- `src/app/admin/layout.tsx`
- `src/app/admin/login/page.tsx`
- `src/components/admin/AdminNav.tsx`

**Acceptance criteria:**
- [x] Admin layout checks auth on every request; redirects to `/admin/login` if unauthenticated
- [x] Login page with email + password form
- [x] Login delegates to Supabase Auth `signInWithPassword`
- [x] On success: redirect to `/admin`
- [x] On failure: show "Invalid credentials" (generic message)
- [x] Admin nav shows: Dashboard, Registrations, Logout
- [x] Logout clears Supabase session and redirects to `/admin/login`

**Non-goals:**
- Do not implement password reset
- Do not implement admin registration (seeded)

---

## T-029: Admin Dashboard

**Input:** T-018 (admin actions), T-028 (admin layout)
**Output:**
- Admin dashboard with aggregate statistics

**Files created:**
- `src/app/admin/page.tsx`
- `src/components/admin/StatsCard.tsx`

**Acceptance criteria:**
- [x] Shows: total registrations, confirmed count, cancelled count, total guests
- [x] Data fetched via admin actions use case
- [x] Quick links to registration list and CSV export
- [x] Server Component with data fetching
- [x] Auth check (guard) applied

**Non-goals:**
- Do not implement charts or graphs
- Do not implement real-time updates

---

## T-030: Admin Registration List

**Input:** T-044 (admin API routes), T-028 (admin layout)
**Output:**
- Filterable, paginated registration list

**Files created:**
- `src/app/admin/registrations/page.tsx`
- `src/components/admin/RegistrationTable.tsx`
- `src/components/admin/RegistrationFilters.tsx`

**Acceptance criteria:**
- [x] Table columns: name, email, guestCount, status, createdAt, actions
- [x] Filter by status: All, Confirmed, Cancelled
- [x] Search by name or email (server-side filtering via admin API)
- [x] Pagination: 20 items per page with page navigation
- [x] Actions per row: Edit, Cancel (with confirmation dialog)
- [x] Cancel action calls `DELETE /api/admin/registrations` and refreshes list
- [x] Edit action calls `PUT /api/admin/registrations` and refreshes list
- [x] All admin actions logged with structured logging

**Non-goals:**
- Do not implement inline editing (use separate edit form/modal)
- Do not implement bulk actions

---

## T-031: Admin CSV Export

**Input:** T-018 (admin actions)
**Output:**
- CSV export endpoint and download button

**Files created:**
- `src/app/api/admin/registrations/export/route.ts`

**Acceptance criteria:**
- [x] `GET /api/admin/registrations/export` returns CSV file
- [x] Response headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename=registrations-{date}.csv`
- [x] CSV columns: name, email, guestCount, dietaryNotes, status, createdAt
- [x] Auth guard applied (admin only)
- [x] CSV properly escapes commas and quotes in field values
- [x] Download button added to admin registration list page

**Non-goals:**
- Do not implement filtered export
- Do not implement Excel format

---

# Phase 9: Security Hardening

## T-032: Rate Limiting Integration

**Input:** T-010 (rate limiter), T-025..T-027 (API routes)
**Output:**
- Rate limiters connected to all public API routes
- Integration tests

**Files modified:**
- `src/app/api/register/route.ts`
- `src/app/api/manage/route.ts`
- `src/app/api/resend-link/route.ts`

**Files created:**
- `tests/integration/rate-limiting.test.ts`

**Acceptance criteria:**
- [x] Registration: 5 attempts/IP/hour
- [x] Manage lookup: 10 attempts/IP/hour
- [x] Resend link: 3 attempts/IP/hour
- [x] Admin login: 5 attempts/IP/15min
- [x] All rate-limited responses include `Retry-After` header
- [x] Rate limit trigger logged as `warn` with hashed IP
- [x] Integration test: exceed limit → 429

**Non-goals:**
- Do not implement distributed rate limiting (in-memory is acceptable for V1)

---

## T-033: Token Logging Audit

**Input:** T-009 (token utility), all route handlers
**Output:**
- Audit all code paths to ensure no raw tokens are logged
- Add automated check

**Files created:**
- `tests/security/no-token-logging.test.ts`

**Acceptance criteria:**
- [x] Grep-based test: no `console.log` calls in production code that could log tokens
- [x] No `req.url` logging on manage routes
- [x] No `token` variable logged anywhere
- [x] Test scans `src/` directory for forbidden patterns (from `docs/ARCHITECTURE_RULES.md` F1-F3)
- [x] Test passes

**Non-goals:**
- Do not implement runtime token leak detection

---

## T-034: Security Headers

**Input:** T-032
**Output:**
- Security headers configured via Next.js

**Files modified:**
- `next.config.js`

**Acceptance criteria:**
- [x] Headers set: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] `Strict-Transport-Security` set for production
- [x] Content-Security-Policy configured (allow self, Supabase, Resend)
- [x] Headers verified via curl or test

**Non-goals:**
- Do not implement CSP report-uri
- Do not implement subresource integrity

---

## T-045: CI Pipeline – Security & Architecture Suites

**Input:** T-038 (CI foundation), T-033 (token logging audit, which creates security tests)
**Output:**
- CI pipeline extended with security and architecture test suites

**Files modified:**
- `.github/workflows/ci.yml`

**Files created:**
- `tests/security/forbidden-patterns.test.ts` (from `docs/VERIFICATION_RULES.md` Section 5)
- `tests/architecture/boundaries.test.ts` (from `docs/VERIFICATION_RULES.md` Section 6)

**Acceptance criteria:**
- [x] CI installs ripgrep (`sudo apt-get install -y ripgrep`) before running security tests
- [x] CI step added: `npx vitest run tests/security/`
- [x] CI step added: `npx vitest run tests/architecture/`
- [x] Forbidden pattern tests cover: F1 (token logging), F2 (URL logging), F3 (env secret logging), F6 (any type), F8 (empty catch), F9 (hardcoded secrets)
- [x] Architecture boundary tests cover: L1 (UI→repo), L4 (usecase→component), L5 (repo→usecase), L6 (PrismaClient imports)
- [x] All tests pass locally
- [ ] CI passes with new steps

**Non-goals:**
- Do not add runtime monitoring
- Do not implement pre-commit hooks (future enhancement)

---

# Phase 10: Observability & Polish

## T-035: Health Endpoint

**Input:** T-008 (logger)
**Output:**
- Health check API endpoint

**Files created:**
- `src/app/api/health/route.ts`
- `tests/unit/api/health.test.ts`

**Acceptance criteria:**
- [x] `GET /api/health` returns `200` with `{ "status": "ok", "timestamp": "...", "version": "1.0.0" }`
- [x] Verifies database connectivity via `prisma.$queryRaw`
- [x] Returns `503` with `{ "status": "error", "timestamp": "..." }` if DB unreachable
- [x] No authentication required
- [x] Unit test: healthy response
- [x] Unit test: DB failure response

**Non-goals:**
- Do not implement detailed component health checks
- Do not expose internal metrics

---

## T-037: Data Retention Implementation

**Input:** All repositories
**Output:**
- Data retention policy implementation
- Documentation

**Files created:**
- `src/lib/usecases/data-retention.ts`
- `tests/unit/lib/usecases/data-retention.test.ts`

**Acceptance criteria:**
- [x] `purgeExpiredTokens()` removes tokens where `expiresAt < now` and `isRevoked = true`
- [x] `purgeCancelledRegistrations(olderThan: Date)` removes cancelled registrations older than specified date
- [x] Default retention: cancelled registrations purged after 180 days
- [x] Functions are idempotent and safe to run repeatedly
- [x] Admin-callable via admin actions (manual trigger)
- [x] Unit test: correct records purged
- [x] Unit test: active records not affected

**Non-goals:**
- Do not implement scheduled/cron execution (manual or Vercel cron added later)
- Do not implement GDPR export (future extension)

---

## T-046: README

**Input:** All prior tickets completed
**Output:**
- Comprehensive project README

**Files created:**
- `README.md`

**Acceptance criteria:**
- [x] Project title and description
- [x] Tech stack summary
- [x] Prerequisites (Node 20+, Supabase account, Resend account)
- [x] Setup instructions: clone, `npm install`, copy `.env.example` → `.env.local`, configure variables, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`
- [x] Available scripts: `dev`, `build`, `start`, `lint`, `test`
- [x] Folder structure overview (link to `docs/ARCHITECTURE.md`)
- [x] Environment variables table (link to `docs/ARCHITECTURE.md` Section 10.3)
- [x] Data retention policy summary
- [x] Links to all `docs/` files
- [x] No secrets or credentials in README

**Non-goals:**
- Do not duplicate full architecture docs (link to them)
- Do not write user-facing documentation (this is developer-facing)

---

# Ticket Index

| ID    | Title                             | Phase | Dependencies               |
| ----- | --------------------------------- | ----- | -------------------------- |
| T-001 | Initialize Next.js Project        | 1     | None                       |
| T-002 | TypeScript, Tailwind, Testing     | 1     | T-001                      |
| T-038 | CI Pipeline – Foundation          | 1     | T-002                      |
| T-003 | Prisma and Database Schema        | 1     | T-002                      |
| T-039 | Prisma Client Singleton           | 1     | T-003                      |
| T-004 | Supabase Auth Integration         | 1     | T-003                      |
| T-005 | Resend Integration                | 1     | T-004                      |
| T-006 | Env Config and Folder Structure   | 1     | T-005                      |
| T-040 | Shared TypeScript Types           | 1     | T-006                      |
| T-043 | Seed Data Population              | 1     | T-006, T-003               |
| T-007 | Error Types                       | 2     | T-006                      |
| T-041 | API Response Utility              | 2     | T-007                      |
| T-036 | Error Boundaries                  | 2     | T-007                      |
| T-008 | Structured Logger                 | 2     | T-006                      |
| T-009 | Capability Token Utility          | 2     | T-006                      |
| T-010 | Rate Limiter                      | 2     | T-008, T-006               |
| T-042 | CI Pipeline – Coverage Gates      | 2     | T-038, T-009               |
| T-011 | Registration Repository           | 3     | T-039, T-040, T-007        |
| T-012 | Token Repository                  | 3     | T-039, T-040, T-009        |
| T-013 | Admin Repository                  | 3     | T-039, T-040               |
| T-014 | Register Use Case                 | 4     | T-011, T-012, T-009        |
| T-015 | Manage Registration Use Case      | 4     | T-012, T-011               |
| T-016 | Resend Link Use Case              | 4     | T-012, T-011               |
| T-017 | Admin Auth Guard                  | 4     | T-004, T-013               |
| T-018 | Admin Actions Use Case            | 4     | T-013, T-011               |
| T-019 | Email Service                     | 5     | T-014                      |
| T-020 | Email Templates                   | 5     | T-019                      |
| T-025 | Register API Route                | 6     | T-014, T-010, T-041        |
| T-026 | Manage API Route                  | 6     | T-015, T-010, T-041        |
| T-027 | Resend Link API Route             | 6     | T-016, T-010, T-041        |
| T-044 | Admin Mutation API Routes         | 6     | T-017, T-018, T-041        |
| T-021 | Event Landing Page                | 7     | T-036, T-025, T-019        |
| T-022 | Registration Form                 | 7     | T-036, T-025               |
| T-023 | Manage Page                       | 7     | T-036, T-026               |
| T-024 | Resend Link Page                  | 7     | T-036, T-027               |
| T-028 | Admin Layout and Auth             | 8     | T-017                      |
| T-029 | Admin Dashboard                   | 8     | T-018, T-028               |
| T-030 | Admin Registration List           | 8     | T-044, T-028               |
| T-031 | Admin CSV Export                  | 8     | T-018                      |
| T-032 | Rate Limiting Integration         | 9     | T-025, T-026, T-027        |
| T-033 | Token Logging Audit               | 9     | T-032                      |
| T-034 | Security Headers                  | 9     | T-033                      |
| T-045 | CI Pipeline – Security Suites     | 9     | T-038, T-033               |
| T-035 | Health Endpoint                   | 10    | T-008                      |
| T-037 | Data Retention                    | 10    | T-035                      |
| T-046 | README                            | 10    | T-037                      |
| T-047 | ICS Calendar Invite Utility       | 11    | T-006                      |
| T-048 | Attach Calendar Invite to Email   | 11    | T-047, T-019, T-020        |
| T-049 | i18n Infrastructure Setup         | 11    | T-006                      |
| T-050 | Translate Public UI Pages         | 11    | T-049, T-021..T-024        |
| T-051 | Translate Email Templates         | 11    | T-049, T-020               |
| T-052 | Language Switcher Component       | 11    | T-049                      |
| T-053 | Translate Admin UI                | 11    | T-049, T-028..T-031        |
| T-054 | Registration Form Field Migration | 11    | T-003, T-040, T-014, T-022 |

**Total tickets: 53** (37 original + 8 Phase 1-10 additions + 8 Phase 11)

---

# Phase 11: Enhancements

## T-047: ICS Calendar Invite Utility

**Input:** T-006 (event config)
**Output:**
- Utility to generate iCalendar (.ics) files per RFC 5545
- Unit tests

**Files created:**
- `src/lib/email/ics-generator.ts`
- `tests/unit/lib/email/ics-generator.test.ts`

**Context:**
The iCalendar format (.ics, RFC 5545) is the universal standard for calendar events. When an .ics file is attached to an email, all major clients (Gmail, Outlook, Apple Mail, Thunderbird) recognize it as a calendar event and offer to add it to the user's calendar. The MIME type is `text/calendar; method=REQUEST`.

**Acceptance criteria:**
- [x] Exports `generateIcsEvent(params: { eventName: string; eventDate: Date; eventEndDate: Date; eventLocation: string; eventDescription: string; organizerEmail: string }): string`
- [x] Output is a valid iCalendar string (starts with `BEGIN:VCALENDAR`, ends with `END:VCALENDAR`)
- [x] Includes `VTIMEZONE` component or uses UTC
- [x] Contains required fields: `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION`, `DESCRIPTION`, `UID`, `DTSTAMP`
- [x] `UID` is unique per generation (use UUID + domain)
- [x] `METHOD:REQUEST` is set so email clients treat it as an event invitation
- [x] Line folding follows RFC 5545 (max 75 octets per line)
- [x] Special characters in text fields are properly escaped
- [x] Unit test: output is valid iCalendar format
- [x] Unit test: all event details appear in output
- [x] Unit test: UID is unique across invocations

**Non-goals:**
- Do not handle recurring events
- Do not implement RSVP/attendee tracking via calendar protocol
- Do not add external library dependency (iCalendar format is simple enough to generate directly)

---

## T-048: Attach Calendar Invite to Registration Email

**Input:** T-047 (ICS generator), T-019 (email service), T-020 (email templates)
**Output:**
- Registration confirmation email includes .ics calendar invite as attachment
- Unit tests

**Files modified:**
- `src/lib/email/send-manage-link.ts` (add ICS attachment)
- `src/lib/email/templates/manage-link-template.ts` (add calendar note to email body)

**Files created:**
- `tests/unit/lib/email/ics-attachment.test.ts`

**Acceptance criteria:**
- [x] Registration confirmation email includes .ics file as attachment
- [x] Attachment MIME type: `text/calendar; method=REQUEST`
- [x] Attachment filename: `event.ics`
- [x] ICS content uses event details from `src/config/event.ts`
- [x] Email HTML body includes a note: "A calendar invite is attached to this email."
- [x] Resend API call includes attachment in correct format
- [x] Unit test: email service passes ICS attachment to Resend
- [x] Unit test: ICS content matches event configuration
- [x] Existing email tests still pass

**Non-goals:**
- Do not send calendar updates on registration edit/cancel (future enhancement)
- Do not add ICS to resend-link emails (only initial registration)

---

## T-049: i18n Infrastructure Setup

**Input:** T-006 (folder structure)
**Output:**
- i18n library installed and configured
- Translation files for English, Czech, and Slovak
- Middleware for automatic locale detection from `Accept-Language` header
- Locale persisted in cookie for subsequent requests

**Files created:**
- `src/i18n/config.ts` (supported locales, default locale)
- `src/i18n/messages/en.json` (English translations)
- `src/i18n/messages/cs.json` (Czech translations)
- `src/i18n/messages/sk.json` (Slovak translations)
- `src/i18n/get-locale.ts` (locale detection logic)

**Files modified:**
- `package.json` (add `next-intl` or chosen i18n library)
- `src/lib/auth/middleware.ts` (extend with locale detection)

**Acceptance criteria:**
- [x] i18n library installed (recommended: `next-intl` for App Router compatibility)
- [x] Three locale files created: `en.json`, `cs.json`, `sk.json` with initial keys for common UI strings (nav, buttons, form labels, error messages)
- [x] Locale detection middleware reads `Accept-Language` header and maps to closest supported locale
- [x] Fallback chain: exact match → language match (e.g., `cs-CZ` → `cs`) → default (`en`)
- [x] Selected locale stored in cookie (`NEXT_LOCALE`) for subsequent requests
- [x] Manual locale override (via cookie or URL parameter) takes precedence over auto-detection
- [x] TypeScript types for translation keys (type-safe translations)
- [x] `npm run build` succeeds with i18n configured

**Non-goals:**
- Do not translate all pages yet (T-050, T-051, T-053)
- Do not create the language switcher UI component yet (T-052)
- Do not implement URL-based locale routing (e.g., `/en/register`) — use cookie-based approach

---

## T-050: Translate Public UI Pages

**Input:** T-049 (i18n infrastructure), T-021 (landing page), T-022 (registration form), T-023 (manage page), T-024 (resend link page)
**Output:**
- All public-facing pages use translation strings
- All three languages fully translated

**Files modified:**
- `src/app/(public)/page.tsx`
- `src/app/(public)/register/page.tsx`
- `src/components/forms/RegistrationForm.tsx`
- `src/app/(public)/manage/[token]/page.tsx`
- `src/app/(public)/resend-link/page.tsx`
- `src/components/forms/ResendLinkForm.tsx`
- `src/i18n/messages/en.json` (add page-specific keys)
- `src/i18n/messages/cs.json` (add page-specific keys)
- `src/i18n/messages/sk.json` (add page-specific keys)

**Acceptance criteria:**
- [x] All user-visible text on public pages comes from translation files (no hardcoded strings)
- [x] Landing page: event name, description, CTA buttons translated
- [x] Registration form: labels, placeholders, validation messages, success/error messages translated
- [x] Manage page: all labels, buttons, confirmation dialogs translated
- [x] Resend link page: all text translated
- [x] Error boundary messages translated
- [x] All three languages (EN, CS, SK) have complete translations for public pages
- [x] Switching locale (via cookie) correctly renders the page in the selected language

**Non-goals:**
- Do not translate admin pages (T-053)
- Do not translate email templates (T-051)

---

## T-051: Translate Email Templates

**Input:** T-049 (i18n infrastructure), T-020 (email templates)
**Output:**
- Email templates rendered in the recipient's preferred language
- All three languages fully translated

**Files modified:**
- `src/lib/email/templates/manage-link-template.ts`
- `src/lib/email/send-manage-link.ts` (accept locale parameter)
- `src/i18n/messages/en.json` (add email-specific keys)
- `src/i18n/messages/cs.json` (add email-specific keys)
- `src/i18n/messages/sk.json` (add email-specific keys)

**Acceptance criteria:**
- [x] `renderManageLinkEmail` accepts a `locale` parameter
- [x] Email subject line is translated
- [x] Email body text is translated (greeting, instructions, event details labels)
- [x] The manage link itself is language-independent (URL doesn't change)
- [x] Calendar invite note text is translated (if T-048 is completed)
- [x] Locale is determined from the user's session/cookie at the time of registration
- [x] Fallback to English if locale is not available
- [x] Unit test: email rendered in each of the three languages contains correct translated strings

**Non-goals:**
- Do not create separate HTML templates per language (use translation keys within single template)

---

## T-052: Language Switcher Component

**Input:** T-049 (i18n infrastructure)
**Output:**
- UI component for manually switching between languages
- Persists selection

**Files created:**
- `src/components/ui/LanguageSwitcher.tsx`
- `tests/unit/components/LanguageSwitcher.test.ts`

**Acceptance criteria:**
- [ ] Dropdown or button group showing: English, Čeština, Slovenčina
- [ ] Displays current language with flag emoji or language code
- [ ] On selection: updates the `NEXT_LOCALE` cookie and reloads/refreshes the page
- [ ] Integrated into the public page layout (header/nav area)
- [ ] Responsive: works on mobile and desktop
- [ ] Accessible: keyboard navigable, proper ARIA labels
- [ ] Unit test: renders all three language options
- [ ] Unit test: selecting a language triggers locale change

**Non-goals:**
- Do not implement per-page language memory (global setting only)
- Do not add language selection to the registration flow itself

---

## T-053: Translate Admin UI

**Input:** T-049 (i18n infrastructure), T-028 (admin layout), T-029 (admin dashboard), T-030 (admin reg list), T-031 (CSV export)
**Output:**
- All admin pages use translation strings
- All three languages fully translated

**Files modified:**
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/registrations/page.tsx`
- `src/components/admin/AdminNav.tsx`
- `src/components/admin/StatsCard.tsx`
- `src/components/admin/RegistrationTable.tsx`
- `src/components/admin/RegistrationFilters.tsx`
- `src/i18n/messages/en.json` (add admin-specific keys)
- `src/i18n/messages/cs.json` (add admin-specific keys)
- `src/i18n/messages/sk.json` (add admin-specific keys)

**Acceptance criteria:**
- [ ] All user-visible text on admin pages comes from translation files
- [ ] Login page: labels, buttons, error messages translated
- [ ] Dashboard: stats labels, navigation translated
- [ ] Registration list: table headers, filter labels, action buttons, confirmation dialogs translated
- [ ] CSV export: button label translated (CSV content stays in original language)
- [ ] Language switcher present in admin layout
- [ ] All three languages have complete translations for admin pages

**Non-goals:**
- Do not translate CSV export data content (data stays as entered by users)
- Do not translate log messages (logs stay in English)

---

## T-054: Registration Form Field Migration

**Input:** T-003 (Prisma schema), T-040 (shared types), T-014 (register use case), T-022 (registration form)
**Output:**
- Updated domain model: replace `guestCount` + `dietaryNotes` with `stay` + `adultsCount` + `childrenCount` + `notes`
- Database migration
- All affected layers updated end-to-end

**Context:**
The registration form is changing from `{ name, email, guestCount, dietaryNotes? }` to `{ name, email, stay, adultsCount, childrenCount, notes? }`. This is a cross-cutting change that touches the schema, types, validation, use cases, repositories, API routes, UI forms, admin views, CSV export, seed data, and tests.

**Schema changes (Prisma):**
- Remove: `guestCount (Int)`, `dietaryNotes (String?)`
- Add: `stay (StayOption enum: FRI_SAT, SAT_SUN, FRI_SUN)`, `adultsCount (Int)`, `childrenCount (Int)`, `notes (String?)`

**Files modified:**
- `prisma/schema.prisma` (add `StayOption` enum, update `Registration` model)
- `prisma/seed.ts` (update seed records)
- `src/types/registration.ts` (update `RegistrationInput`, `RegistrationOutput`)
- `src/lib/validation/registration.ts` (update Zod schema)
- `src/repositories/registration-repository.ts`
- `src/lib/usecases/register.ts`
- `src/lib/usecases/manage-registration.ts`
- `src/lib/usecases/admin-actions.ts` (update CSV columns)
- `src/app/api/register/route.ts`
- `src/app/api/manage/route.ts`
- `src/app/api/admin/registrations/route.ts`
- `src/app/api/admin/registrations/export/route.ts` (CSV columns)
- `src/components/forms/RegistrationForm.tsx`
- `src/app/(public)/manage/[token]/ManageForm.tsx`
- `src/components/admin/RegistrationTable.tsx`
- `src/components/admin/EditRegistrationModal.tsx`
- `src/app/admin/registrations/page.tsx`
- `tests/fixtures/seed-data.ts`
- `src/i18n/messages/en.json`, `cs.json`, `sk.json` (update field labels)
- All affected test files

**Files created:**
- `prisma/migrations/YYYYMMDD_update_registration_fields/migration.sql` (auto-generated)

**Acceptance criteria:**
- [ ] `StayOption` enum added to Prisma schema with values: `FRI_SAT`, `SAT_SUN`, `FRI_SUN`
- [ ] `Registration` model updated: `stay (StayOption)`, `adultsCount (Int)`, `childrenCount (Int)`, `notes (String?)`
- [ ] Old fields `guestCount` and `dietaryNotes` removed from schema
- [ ] Zod schema validates: `name` (1-200 chars), `email` (valid format), `stay` (one of three options), `adultsCount` (0-10), `childrenCount` (0-10), `notes` (optional, max 500)
- [ ] At least one of `adultsCount` or `childrenCount` must be > 0 (Zod refinement)
- [ ] `RegistrationInput` type updated: `{ name, email, stay, adultsCount, childrenCount, notes? }`
- [ ] `RegistrationOutput` type updated accordingly
- [ ] Registration form UI: name (text), email (text), stay (dropdown: "Friday to Saturday", "Saturday to Sunday", "Friday to Sunday"), adults (dropdown 0-10), children (dropdown 0-10), notes (textarea)
- [ ] Manage form updated with same fields
- [ ] Admin table columns updated: name, email, stay, adults, children, status, createdAt, actions
- [ ] Admin edit modal updated with new fields
- [ ] CSV export columns updated: name, email, stay, adultsCount, childrenCount, notes, status, createdAt
- [ ] API request/response bodies updated in all routes
- [ ] Seed data updated with new field values
- [ ] All existing tests updated and passing
- [ ] Migration generated: `npx prisma migrate dev --name update_registration_fields`
- [ ] `npx prisma validate` passes
- [ ] `npm run build` succeeds
- [ ] `npx vitest run` passes
- [ ] Translation files updated with labels for new fields (stay options, adults, children)

**Non-goals:**
- Do not implement data migration for existing production records (this is a pre-launch change)
- Do not add price calculation based on stay duration

---

## T-055: Visual Redesign – Apply Design System from v1 Reference

**Input:** T-021 (landing page), T-022 (registration form), T-023 (manage page), T-024 (resend link page), T-036 (error boundaries)
**Output:**
- Complete visual redesign of all public pages following the design reference in `docs/designs/v1/`
- Tailwind CSS theme configuration matching the design's color palette, typography, and spacing
- Reusable React UI components implementing the design patterns
- Hero background image integration

**Design reference:** `docs/designs/v1/index.html` and `docs/designs/v1/main.jpg`

**Design language summary:**
- **Color palette:** Black primary (`#0a0a0a`), dark secondary (`#141414`), blood-red accent (`#c71f1f`), white text (`#ffffff`), gray text (`#a1a1a1`)
- **Typography:** Anton (headings – massive, uppercase, letter-spaced) + Montserrat (body – weights 400/700/900)
- **Visual style:** Dark/dramatic, concert/rock aesthetic, red accent borders and dividers, dark textured backgrounds
- **Hero section:** Full-viewport with background image + dark gradient overlay, huge responsive heading (`clamp(4rem, 10vw, 8rem)`), red subtitle, bold CTA button
- **Cards/sections:** Dark backgrounds, `2px solid #333` borders, red bottom-border accents on cards, grayscale-to-color hover effect on images
- **Buttons:** Red background, uppercase Anton font, 3px red border, transparent on hover with red text
- **Forms:** Dark input backgrounds (`#222`), `#333` borders, red border on focus, uppercase labels, contained in red-bordered card
- **Layout:** Responsive grid/flex, 90% width with 1200px max, 80px section padding
- **Footer:** Black with red top border

**Files modified:**
- `tailwind.config.ts` (extend theme: custom colors, fonts, spacing)
- `src/app/globals.css` (Google Fonts import for Anton + Montserrat, base styles)
- `src/app/(public)/page.tsx` (hero section with background image, event details grid, CTA)
- `src/app/(public)/register/page.tsx` (styled registration form page)
- `src/app/(public)/manage/[token]/page.tsx` (styled manage page)
- `src/app/(public)/manage/[token]/ManageForm.tsx`
- `src/app/(public)/resend-link/page.tsx` (styled resend page)
- `src/components/forms/RegistrationForm.tsx`
- `src/components/forms/ResendLinkForm.tsx`
- `src/app/error.tsx` (styled error boundary)
- `src/app/not-found.tsx` (styled 404 page)

**Files created/modified (UI components):**
- `src/components/ui/Button.tsx` – Red accent button with hover-to-outline transition, Anton font, uppercase. Variants: `primary` (filled red), `outline` (transparent with red border). Full-width option for forms.
- `src/components/ui/Card.tsx` – Dark card (`#141414` bg) with `#333` border and optional red bottom-accent border.
- `src/components/ui/Input.tsx` – Dark input (`#222` bg), `#333` border, red focus ring, Montserrat font. Variants for text input, select dropdown, and textarea.
- `src/components/ui/FormField.tsx` – Label (uppercase, bold, Montserrat 700) + input wrapper with error message slot.
- `src/components/ui/Hero.tsx` – Full-viewport section with background image slot, gradient overlay (`rgba(0,0,0,0.6)` to `rgba(0,0,0,0.8)`), centered content, red bottom border. Responsive heading using `clamp()`.
- `src/components/ui/SectionHeading.tsx` – Anton uppercase heading with letter-spacing, optional red accent text.
- `src/components/ui/DetailBox.tsx` – Info box with label (gray, uppercase, small) + value (white, bold, large), used for event details grid.
- `src/components/ui/Footer.tsx` – Black footer with red top border, centered content.
- `src/components/layout/PublicLayout.tsx` – Shared layout wrapper for all public pages (includes footer, consistent spacing).

**Acceptance criteria:**
- [x] Tailwind config extends theme with design tokens: `colors.accent` (`#c71f1f`), `colors.bg.main` (`#0a0a0a`), `colors.bg.secondary` (`#141414`), `colors.text.gray` (`#a1a1a1`)
- [x] Google Fonts (Anton + Montserrat) loaded via `next/font/google` or `globals.css` `@import`
- [x] Font families configured in Tailwind: `fontFamily.heading` (Anton), `fontFamily.body` (Montserrat)
- [x] Landing page has full-viewport hero with `main.jpg` background image, gradient overlay, event title in Anton, red subtitle, and CTA button
- [x] Hero heading uses responsive sizing: `clamp(4rem, 10vw, 8rem)` or equivalent Tailwind classes
- [x] Event details section uses flex/grid layout with dark bordered boxes, label/value pairs
- [x] Registration form is contained in a dark card with red border, dark inputs, red focus states
- [x] All buttons use Anton font, uppercase, red background with hover-to-outline transition
- [x] All form inputs use dark background, gray border, red focus border
- [x] Manage page and resend-link page follow the same visual language
- [x] Error boundary and 404 pages styled consistently with dark theme
- [x] Footer on all public pages with red top border
- [x] Responsive: all pages look correct at 320px, 768px, and 1280px widths
- [x] No inline styles in React components – all styling via Tailwind utility classes
- [x] All UI components are properly typed with TypeScript props interfaces
- [x] Components accept `className` prop for composition (using `clsx` or `cn` utility)
- [x] Background image (`main.jpg`) served from `public/images/` directory (copied from design reference)
- [x] No external CDN image dependencies (unlike the HTML reference which uses Unsplash URLs)
- [x] Dark theme applied globally – no white/light backgrounds on any public page
- [x] `npm run build` succeeds
- [x] Existing functionality unchanged – form submissions, validation, error handling all still work

**Non-goals:**
- Do not implement the "headliners" photo grid section from the design reference (that's specific to the design example, not the registration app)
- Do not implement a concrete wall texture background (keep solid dark colors for performance)
- Do not style admin pages (admin keeps its own visual style)
- Do not add animations beyond the button hover transition
- Do not add a dark/light mode toggle (app is dark-only)

---

# Phase 11 Dependency Graph

```
PHASE 11: Enhancements

  Calendar Invite:
    T-006 → T-047 (ICS generator)
    T-047 + T-019 + T-020 → T-048 (attach ICS to email)

  Multilingual (i18n):
    T-006 → T-049 (i18n infrastructure)
    T-049 + T-021..T-024 → T-050 (translate public UI)
    T-049 + T-020 → T-051 (translate email templates)
    T-049 → T-052 (language switcher component)
    T-049 + T-028..T-031 → T-053 (translate admin UI)

  Registration Form Redesign:
    T-003 + T-040 + T-014 + T-022 → T-054 (registration field migration)

  Visual Redesign:
    T-021..T-024 + T-036 → T-055 (apply v1 design system)
```

```
T-047 (ICS generator)
  └─ T-048 (attach ICS to email) ←[+T-019, +T-020]

T-049 (i18n infrastructure)
  ├─ T-050 (translate public UI) ←[+T-021..T-024]
  ├─ T-051 (translate email templates) ←[+T-020]
  ├─ T-052 (language switcher)
  └─ T-053 (translate admin UI) ←[+T-028..T-031]

T-054 (Registration field migration) ←[T-003, T-040, T-014, T-022]

T-055 (Visual redesign) ←[T-021..T-024, T-036]
```

---

# Updated Ticket Index (Phase 11)

| ID    | Title                              | Phase | Dependencies               |
| ----- | ---------------------------------- | ----- | -------------------------- |
| T-047 | ICS Calendar Invite Utility        | 11    | T-006                      |
| T-048 | Attach Calendar Invite to Email    | 11    | T-047, T-019, T-020        |
| T-049 | i18n Infrastructure Setup          | 11    | T-006                      |
| T-050 | Translate Public UI Pages          | 11    | T-049, T-021..T-024        |
| T-051 | Translate Email Templates          | 11    | T-049, T-020               |
| T-052 | Language Switcher Component        | 11    | T-049                      |
| T-053 | Translate Admin UI                 | 11    | T-049, T-028..T-031        |
| T-054 | Registration Form Field Migration  | 11    | T-003, T-040, T-014, T-022 |
| T-055 | Visual Redesign – v1 Design System | 11    | T-021..T-024, T-036        |

**Total tickets: 55** (37 original + 8 Phase 1-10 additions + 10 Phase 11)

---

## M05: Dynamic ICS Calendar Dates Based on Stay Option

**Type:** Minor fix
**Date:** 2026-02-15
**Status:** Done

**Problem:** The `sendManageLink` function in `src/lib/email/send-manage-link.ts` had hardcoded (and incorrect) event start/end dates for the ICS calendar invite attachment.

**Solution:**
- Added `EVENT_DATES_BY_STAY` mapping to `src/config/event.ts` that maps each `StayOption` (FRI_SAT, SAT_SUN, FRI_SUN) to the correct start/end dates
- Added `stay: StayOption` to `SendManageLinkParams` interface in `send-manage-link.ts`
- Replaced hardcoded dates with dynamic lookup: `EVENT_DATES_BY_STAY[stay]`
- Updated `register.ts`, `resend-link.ts`, and `manage-registration.ts` to pass `stay` to `sendManageLink`
- Updated all affected tests to include `stay` parameter and verify correct ICS dates per stay option

**Files changed:**
- `src/config/event.ts` (added `EVENT_DATES_BY_STAY`)
- `src/lib/email/send-manage-link.ts` (added `stay` param, dynamic date lookup)
- `src/lib/usecases/register.ts` (pass `stay` to `sendManageLink`)
- `src/lib/usecases/resend-link.ts` (pass `stay` to `sendManageLink`)
- `src/lib/usecases/manage-registration.ts` (pass `stay` to `sendManageLink`)
- `tests/unit/lib/email/send-manage-link.test.ts` (added `stay` to test params)
- `tests/unit/lib/email/ics-attachment.test.ts` (added `stay` to test params, added per-stay-option date verification tests)
- `tests/unit/lib/usecases/register.test.ts` (added `stay` assertion on `sendManageLink` call)
- `tests/unit/lib/usecases/resend-link.test.ts` (added `stay` assertion on `sendManageLink` call)
- `tests/unit/lib/usecases/manage-registration.test.ts` (added `stay` assertion on `sendManageLink` call)

**Verification:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` -- all pass (400 tests).

---

## M06: Localize Email Event Details via i18n

**Type:** Enhancement
**Date:** 2026-02-15
**Status:** Done

**Problem:** The email system used hardcoded `EVENT_NAME`, `EVENT_DATE`, `EVENT_LOCATION`, `EVENT_DESCRIPTION` constants from `src/config/event.ts`. These values were not localized, meaning all emails were sent with English-only event details regardless of the recipient's locale.

**Solution:**
- Added `eventName`, `eventDate`, `eventLocation`, `eventDescription` keys to the `email` namespace in all three locale files (`en.json`, `cs.json`, `sk.json`)
- Updated `renderManageLinkEmail()` to resolve `eventName` and `eventDate` from i18n translations instead of accepting them as parameters
- Updated `sendManageLink()` to resolve `eventName`, `eventLocation`, `eventDescription` from i18n for ICS generation, removing imports of `EVENT_NAME`, `EVENT_LOCATION`, `EVENT_DESCRIPTION`
- Removed `eventName` and `eventDate` from `SendManageLinkParams` and `ManageLinkEmailParams` interfaces
- Updated all three use cases (`register.ts`, `resend-link.ts`, `manage-registration.ts`) to stop passing `eventName`/`eventDate` to `sendManageLink()`
- Cleaned up `src/config/event.ts`: removed `EVENT_NAME`, `EVENT_DATE`, `EVENT_LOCATION`, `EVENT_DESCRIPTION` constants and the TODO comment; only `EVENT_DATES_BY_STAY` remains
- Updated all affected tests to reflect the new interfaces

**Files changed:**
- `src/i18n/messages/en.json` (added email event detail keys)
- `src/i18n/messages/cs.json` (added email event detail keys)
- `src/i18n/messages/sk.json` (added email event detail keys)
- `src/config/event.ts` (removed unused constants, kept `EVENT_DATES_BY_STAY`)
- `src/lib/email/templates/manage-link-template.ts` (removed `eventName`/`eventDate` params, resolve from i18n)
- `src/lib/email/send-manage-link.ts` (removed `eventName`/`eventDate` params, resolve ICS details from i18n)
- `src/lib/usecases/register.ts` (removed `EVENT_NAME`/`EVENT_DATE` import and usage)
- `src/lib/usecases/resend-link.ts` (removed `EVENT_NAME`/`EVENT_DATE` import and usage)
- `src/lib/usecases/manage-registration.ts` (removed `EVENT_NAME`/`EVENT_DATE` import and usage)
- `tests/unit/lib/email/templates/manage-link-template.test.ts` (updated for new interface)
- `tests/unit/lib/email/send-manage-link.test.ts` (updated for new interface, added i18n mock)
- `tests/unit/lib/email/ics-attachment.test.ts` (updated for new interface, added i18n mock)
- `tests/unit/lib/usecases/register.test.ts` (removed `eventName`/`eventDate` assertions)
- `tests/unit/lib/usecases/resend-link.test.ts` (removed `eventName`/`eventDate` assertions)
- `tests/unit/lib/usecases/manage-registration.test.ts` (removed `eventName`/`eventDate` assertions)

**Verification:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` -- all pass (401 tests).

---

## M07: Add Contribution Information to Main Page

**Type:** Enhancement
**Date:** 2026-02-23
**Status:** Done

**Problem:** The user requested "information (main page) about recommended contribution for the 'tickets' being an envelope, somehow that it fits into the whole design and idea, concept".

**Solution:**
- Added `contributionHeader` and `detailsInfoContribution` localization keys to `en.json`, `cs.json`, `sk.json`.
- Modified `src/app/(public)/page.tsx` to display this information in the Details segment right next to Dress Code and Catering, visually matching the existing template.

**Files changed:**
- `src/i18n/messages/en.json`
- `src/i18n/messages/cs.json`
- `src/i18n/messages/sk.json`
- `src/app/(public)/page.tsx`

---

## M08: Add Notes Column to Admin Registrations Overview

**Type:** Enhancement
**Date:** 2026-02-23
**Status:** Done

**Problem:** The admin registrations overview table did not display the "notes" field that guests fill in during registration. Administrators had no visibility into guest notes without opening individual registrations.

**Solution:**
- Added a "Notes" column to the `RegistrationTable` component, positioned between the "Children" and "Status" columns
- Notes are displayed with `max-w-xs truncate` for long text, with a `title` attribute for hover tooltip showing full content
- Null notes are rendered as an em dash for clean visual presentation
- Added `"notes"` translation key to all three locale files (EN: "Notes", CS: "Poznamky", SK: "Poznamky")
- Added 3 new unit tests covering: notes text display, null notes rendering, mixed notes across multiple registrations

**Files changed:**
- `src/components/admin/RegistrationTable.tsx` (added Notes column header and data cell)
- `src/components/admin/__tests__/RegistrationTable.test.tsx` (added 3 new tests, updated header test)
- `src/i18n/messages/en.json` (added `admin.registrations.table.notes` key)
- `src/i18n/messages/cs.json` (added `admin.registrations.table.notes` key)
- `src/i18n/messages/sk.json` (added `admin.registrations.table.notes` key)

**Verification:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` -- all pass (438 tests).

---

## M09: Admin Resend Registration Email

**Type:** Feature
**Date:** 2026-03-11
**Status:** Done

**Problem:** Administrators had no way to resend the registration confirmation email (with manage link) to a guest from the admin interface. If a guest lost their email or the original delivery failed, the admin had no recourse other than asking the guest to use the public resend-link flow.

**Solution:**
- Added `adminResendEmail` use case function to `src/lib/usecases/admin-actions.ts`
  - Finds registration by ID, validates it is CONFIRMED (not CANCELLED)
  - Revokes all existing tokens, generates a new capability token, stores the hash
  - Sends manage link email via `sendManageLink()`
  - Logs admin action with `adminUserId`, `action: "resend_email"`, `targetId`, masked email
  - Throws `NotFoundError` if registration not found, `InvalidStatusError` if cancelled
- Added `InvalidStatusError` to `src/lib/errors/app-errors.ts` (code: `INVALID_STATUS`, status: 400)
- Added `POST` handler to `src/app/api/admin/registrations/route.ts`
  - Validates input with Zod schema (registrationId must be UUID)
  - Delegates to `adminResendEmail` use case
  - Returns consistent API response shape
- Added "Resend Email" button to `src/components/admin/RegistrationTable.tsx`
  - Only shown for CONFIRMED registrations
  - Includes confirmation dialog before sending (same pattern as cancel)
  - Shows loading state while sending
- Wired up resend handler in `src/app/admin/registrations/page.tsx`
  - Success/error feedback displayed above the table
- Added translation keys to all three locale files (EN, CS, SK):
  - `admin.registrations.table.resendEmail`
  - `admin.registrations.table.confirmResend`
  - `admin.registrations.table.resendSuccess`
  - `admin.registrations.table.resendError`
- Added 6 unit tests for the new use case in `tests/unit/lib/usecases/admin-resend-email.test.ts`:
  - Happy path (confirmed registration, email sent successfully)
  - Registration not found (throws NotFoundError)
  - Registration is cancelled (throws InvalidStatusError)
  - Email sending fails (returns error result)
  - Proper logging with masked email
  - Correct manage URL construction from BASE_URL

**Files changed:**
- `src/lib/usecases/admin-actions.ts` (added `adminResendEmail` function and imports)
- `src/lib/errors/app-errors.ts` (added `InvalidStatusError` class)
- `src/app/api/admin/registrations/route.ts` (added POST handler with Zod validation)
- `src/components/admin/RegistrationTable.tsx` (added resend button with confirmation)
- `src/app/admin/registrations/page.tsx` (wired up resend handler and feedback)
- `src/i18n/messages/en.json` (added 4 translation keys)
- `src/i18n/messages/cs.json` (added 4 translation keys)
- `src/i18n/messages/sk.json` (added 4 translation keys)
- `tests/unit/lib/usecases/admin-resend-email.test.ts` (new, 6 tests)

**Verification:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` -- all pass (444 tests). Security and architecture checks pass.

---

## T-EXT-001: Rows Per Page Selector for Admin Registrations Table

**Status:** DONE

**Description:** Add a UI control (dropdown) in the admin registrations table that lets the user choose how many rows to display per page (10, 20, 50, 100). Default remains 20. Selection persists for the session via React state.

**Files Changed:**
- `src/components/admin/PageSizeSelector.tsx` (new component)
- `src/components/admin/Pagination.tsx` (added `onPageSizeChange` prop, embedded `PageSizeSelector`)
- `src/app/admin/registrations/page.tsx` (added `pageSize` state, `handlePageSizeChange` callback, wired to `Pagination`)
- `src/i18n/messages/en.json` (added `admin.registrations.pagination.rowsPerPage` key)
- `src/i18n/messages/cs.json` (added `admin.registrations.pagination.rowsPerPage` key)
- `src/i18n/messages/sk.json` (added `admin.registrations.pagination.rowsPerPage` key)
- `src/components/admin/__tests__/PageSizeSelector.test.tsx` (new, 5 tests)
- `src/components/admin/__tests__/Pagination.test.tsx` (updated, 8 tests — added page size selector tests)

**Verification:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` -- all pass (452 tests). Security and architecture checks pass.

---

## T-NEW-01: Add Accommodation Dropdown + Registration Deadline

**Status:** DONE

### Description

Two features implemented:

1. **Accommodation dropdown** — Full-stack field added to registration: Prisma enum (`AccommodationOption`), types, validation, repository, use cases, API routes, public forms (RegistrationForm, ManageForm), admin (EditRegistrationModal, RegistrationTable), and CSV export. Options: Private Room, Common Room, Own Tent, Anywhere, None. Defaults to "Anywhere" for overnight stays, auto-selects "None" for Saturday-only. All three locales (EN, CS, SK) updated.

2. **Registration deadline** — Deadline of April 19, 2026 configured in `src/config/event.ts`. Displayed on landing page (RSVP section + Details section), register page, and manage page. After deadline: forms are hidden and replaced with "closed" message directing guests to contact administrators. API-level enforcement added in both `registerGuest` and `updateRegistrationByToken` use cases. Date formatting is locale-aware.

### Files Modified

- `prisma/schema.prisma` (new `AccommodationOption` enum + field)
- `prisma/migrations/20260323_add_accommodation/migration.sql` (new)
- `src/types/registration.ts` (new enum + interface fields)
- `src/lib/validation/registration.ts` (new Zod field)
- `src/config/event.ts` (new `REGISTRATION_DEADLINE` constant)
- `src/repositories/registration-repository.ts` (accommodation in toOutput, create, update)
- `src/lib/usecases/register.ts` (accommodation passthrough + deadline check)
- `src/lib/usecases/manage-registration.ts` (accommodation passthrough + deadline check)
- `src/lib/usecases/admin-actions.ts` (CSV column)
- `src/app/api/manage/route.ts` (accommodation in PUT)
- `src/app/api/admin/registrations/route.ts` (accommodation in PUT)
- `src/components/forms/RegistrationForm.tsx` (accommodation dropdown + useEffect)
- `src/app/(public)/manage/[token]/ManageForm.tsx` (accommodation dropdown + useEffect)
- `src/components/admin/EditRegistrationModal.tsx` (accommodation dropdown)
- `src/components/admin/RegistrationTable.tsx` (accommodation column + formatAccommodation)
- `src/app/(public)/page.tsx` (deadline display in RSVP + Details sections)
- `src/app/(public)/register/page.tsx` (deadline display + closed state)
- `src/app/(public)/manage/[token]/page.tsx` (deadline display + closed state)
- `src/app/admin/registrations/page.tsx` (handleSave type updated)
- `src/i18n/messages/en.json`, `cs.json`, `sk.json` (accommodation + deadline keys)
- 8 test files updated with `accommodation` field

**Verification:** `npx tsc --noEmit` passes. Pre-existing test environment issues (58 test suites fail on clean main) are unrelated.

---

## T-NEW-02: Admin "Add Reservation" GUI

**Status:** DONE

### Description

Added an admin-only GUI that allows administrators to manually create a
registration from the admin registrations page. A new "Add reservation"
button in the page header opens a modal dialog styled to match the existing
admin aesthetic (dark theme, accent-colored primary action, border/backdrop
conventions). The modal reuses the existing public `POST /api/register`
endpoint — no new backend endpoint was introduced, per scope constraint.

The modal mirrors the field set accepted by the endpoint's Zod
`registrationSchema` (name, email, stay, accommodation, adultsCount,
childrenCount, optional notes), applies the same client-side validation
used by the public `RegistrationForm`, enforces the same stay/accommodation
coupling rules (SAT_ONLY forces `NONE`), surfaces server-side validation
errors field-by-field, and shows dedicated messages for rate-limit (429)
and generic failure responses.

On success: the modal closes, a success feedback banner is shown above the
table, and the registrations list is re-fetched so the newly-created row
appears immediately. All new UI strings are localized across `en`, `cs`,
`sk` (identical key sets).

### Endpoint Decision

The user explicitly requested reuse of the existing endpoint. The only
existing endpoint that creates a registration is `POST /api/register`;
the admin routes at `POST/PUT/DELETE /api/admin/registrations` only
resend-email / edit / cancel existing registrations. The modal therefore
targets `POST /api/register`. This preserves all server-side invariants
(Zod validation, capability-token creation, manage-link email) without
duplicating logic.

### Files Added

- `src/components/admin/AddRegistrationModal.tsx` — new admin modal
- `src/components/admin/__tests__/AddRegistrationModal.test.tsx` — 12 unit tests
- `src/app/admin/registrations/__tests__/page.test.tsx` — 4 integration tests for page wiring

### Files Modified

- `src/app/admin/registrations/page.tsx` — "Add reservation" button, modal wiring, success banner, list refresh
- `src/i18n/messages/en.json` — `addReservation`, `addSuccess`, full `admin.registrations.add.*` subtree
- `src/i18n/messages/cs.json` — same keys translated
- `src/i18n/messages/sk.json` — same keys translated

### Tests Added (16 total)

- Modal renders with all required form fields.
- Cancel button invokes `onClose`.
- Empty-form submission triggers client-side validation (no fetch).
- Valid submission POSTs the correct payload to `/api/register`.
- Notes are included in the payload when provided.
- Submit button is disabled and shows the "submitting" label while the request is pending.
- Server 400 with `fields` surfaces field-level errors.
- Server 429 surfaces the rate-limit message.
- Server 500 surfaces the generic error.
- Network failure surfaces the generic error.
- `onCreated` is not called on validation error.
- SAT_ONLY stay forces accommodation to NONE in the payload.
- Page renders the "Add reservation" button.
- Clicking it opens the modal (dialog present).
- Cancel inside the modal closes it.
- Successful creation refetches `/api/admin/registrations` and closes the modal.

### Verification

- `npx tsc --noEmit` — passes (0 errors).
- `npm run lint` — passes (0 errors; 1 pre-existing warning in `src/app/layout.tsx` unrelated to this change).
- `npx vitest run` — 447 passed (+16 over baseline); the 23 pre-existing failures are all related to the registration deadline having already passed in the test environment and are unrelated to this change (delta verified by stashing the change and re-running the suite on a clean tree).
- `npx vitest run tests/security/ tests/architecture/` — 24 passed.

---

## T-NEW-03: Admin "Add Reservation" Bypasses Registration Deadline

**Status:** DONE

### Description

Follow-up to T-NEW-02. The admin "Add reservation" modal previously
targeted the public `POST /api/register` endpoint, which enforces the
registration deadline. After the deadline passed (2026-04-19), the
modal became unusable for its primary purpose — allowing administrators
to register late guests on their behalf.

This ticket introduces a dedicated admin endpoint that bypasses the
deadline check while preserving every other invariant (Zod validation,
capability-token generation, manage-link email delivery, admin action
logging). The bypass is strictly server-side: the admin handler passes
`bypassDeadline: true` to the use case, and the public handler passes
`bypassDeadline: false`. A client cannot opt into bypass by adding a
field to the body — the public route ignores any `bypassDeadline` key
in the body and always passes `false` to the use case (covered by a
dedicated test).

### Design Decision: New Endpoint, Not Reused POST

`POST /api/admin/registrations` is already taken by the admin "resend
email" action (see `route.ts`). Rather than overload that verb with a
second responsibility, the new handler lives at
`POST /api/admin/registrations/create`. This mirrors the existing
`/api/admin/registrations/export` subpath convention for admin-only
actions that do not fit the base resource verbs.

### Auth Pattern

The handler reuses `verifyAdmin` from `@/lib/auth/admin-guard` — the
same guard used by `GET/PUT/DELETE /api/admin/registrations` and
`GET /api/admin/registrations/export`. It follows the exact pattern:
destructure `{ adminId }` from `await verifyAdmin(request)`, then rely
on `handleApiError` to map `AuthenticationError` → 401 and
`AuthorizationError` → 403.

### Files Added

- `src/app/api/admin/registrations/create/route.ts` — new admin handler
- `src/app/api/admin/registrations/create/route.test.ts` — 8 route tests

### Files Modified

- `src/lib/usecases/register.ts` — added `RegisterGuestOptions`
  interface and optional second argument to `registerGuest`; the
  deadline check at step 0 is skipped when `bypassDeadline: true`.
- `src/app/api/register/route.ts` — now explicitly passes
  `{ bypassDeadline: false }` to make the invariant visible at the
  call site.
- `src/components/admin/AddRegistrationModal.tsx` — POST target switched
  from `/api/register` to `/api/admin/registrations/create`; JSDoc
  updated.
- `tests/unit/lib/usecases/register.test.ts` — 4 new tests covering the
  `bypassDeadline` option (default behaviour, explicit `false`,
  explicit `true` past the deadline, invalid input still rejected).
- `tests/unit/api/register/route.test.ts` — 2 existing tests updated
  to assert the new second argument; 1 new test guarantees the public
  endpoint ignores a client-supplied `bypassDeadline: true`.
- `src/app/admin/registrations/__tests__/page.test.tsx` — URL assertion
  updated to the new endpoint; the refetch detection was tightened to
  avoid matching the create POST itself.
- `src/components/admin/__tests__/AddRegistrationModal.test.tsx` — URL
  assertion updated to the new endpoint.

### Tests Added (13 net new)

Use-case tests (4):
- Throws `ValidationError` past the deadline when `bypassDeadline` is
  not provided.
- Throws `ValidationError` past the deadline when `bypassDeadline:
  false`.
- Creates the registration past the deadline when `bypassDeadline:
  true`.
- Still validates input when `bypassDeadline: true` (invalid payload
  rejected).

Route tests (8):
- Returns 201 with `{ registrationId }` on success.
- Logs admin-initiated creation with masked email at info level
  (matching `LOG4`/`LOG5`).
- Returns 401 when unauthenticated.
- Returns 403 when the caller is not an admin.
- Returns 400 with field errors when the use case throws
  `ValidationError`.
- Returns 201 past the deadline because `bypassDeadline` is set
  server-side.
- Ignores a client-supplied `bypassDeadline: false` in the body and
  still passes `true` to the use case.
- Returns 500 on unexpected errors.

Public-route hardening (1):
- The public `/api/register` route ignores a body `bypassDeadline:
  true` and always passes `false` to the use case.

### Follow-up Flagged (Not Done Here)

The 23 pre-existing test failures listed in T-NEW-02 are all caused by
the real wall-clock time being past `REGISTRATION_DEADLINE`
(2026-04-19). Several of them live in files this ticket did not
touch: `tests/unit/lib/usecases/manage-registration.test.ts` (5
failures), `src/app/(public)/__tests__/page.test.tsx > HomePage` (1
failure). Others live in `tests/unit/lib/usecases/register.test.ts`
and `tests/unit/api/register/route.test.ts`. These tests should
either pin a fixed `vi.setSystemTime(...)` before each case, or — for
the admin paths that now have a bypass option — call
`registerGuest(input, { bypassDeadline: true })`. Out of scope here:
to keep the diff focused, only the tests directly in files modified
by this ticket were updated. The remaining deadline-related failures
are a separate, clearly-scoped cleanup ticket.

### Verification

- `npx tsc --noEmit` — passes (0 errors).
- `npm run lint` — passes (0 errors; the same 1 pre-existing warning
  in `src/app/layout.tsx` unrelated to this change).
- `npx vitest run` — 460 passed (+13 over the T-NEW-02 baseline of
  447); 23 pre-existing failures unchanged.
- `npx vitest run tests/security/ tests/architecture/` — 24 passed.

---

## T-ADMIN-A: Admin UI Tier A — Consolidate Labels and Extract Primitives

**Status:** DONE

### Description

A prior audit of the admin UI surfaced three categories of pain:

1. **Duplicated enum labels.** Accommodation and stay labels lived in
   four divergent forms (`form.*`, `admin.registrations.edit.*`,
   `admin.registrations.add.*`, and hardcoded `formatAccommodation` /
   `formatStay` functions in `RegistrationTable`). Status values were
   rendered as raw `"CONFIRMED"` / `"CANCELLED"` enums, never
   translated.
2. **Overflow bugs.** The notes cell used `truncate + title` so users
   did not realize long notes were cut off. The email column used
   `whitespace-nowrap` without a max-width. The search input was
   constrained by `sm:max-w-xs` inside a `flex-1` container.
3. **Inlined styling.** Every button was a unique 150-char Tailwind
   string; every input/select repeated the same 6-line snippet.
   Modals duplicated the same overlay/panel markup three times.

Tier A eliminates the duplication and overflow without touching the
visual design system — that's Tier B.

### Files Added

- `src/i18n/labels.ts` — canonical translator helpers
  (`accommodationLabel`, `stayLabel`, `statusLabel`) plus pure key
  helpers (`accommodationEnumKey`, etc.) and ordered option lists
  (`ACCOMMODATION_OPTIONS`, `CURRENT_STAY_OPTIONS`,
  `LEGACY_STAY_OPTIONS`).
- `src/components/ui/admin/Badge.tsx` — semantic badge
  (`success|warning|danger|neutral`).
- `src/components/ui/admin/Button.tsx` — the single button primitive
  (`primary|secondary|ghost|danger`, `sm|md`, `loading`).
- `src/components/ui/admin/ConfirmDialog.tsx` — ConfirmDialog built on
  Modal.
- `src/components/ui/admin/Input.tsx` — label + control + helper /
  error / counter with accessible wiring; also exports
  `shouldShowCounter`.
- `src/components/ui/admin/Modal.tsx` — focus-trapped dialog with
  Escape-to-close, backdrop-to-close, focus restoration on close,
  body-scroll lock, `createPortal` mount.
- `src/components/ui/admin/Select.tsx` — dropdown primitive.
- `src/components/ui/admin/Spinner.tsx` — sm/md spinner with
  `role="status"`.
- `src/components/ui/admin/Textarea.tsx` — multi-line input with
  counter.
- `src/components/ui/admin/field-classes.ts` — shared class strings
  for form fields so focus ring / invalid state stays consistent.
- `src/components/ui/admin/index.ts` — barrel.
- `tests/unit/i18n/labels.test.ts` — 7 tests for the label helpers.
- `src/components/ui/admin/__tests__/` — 41 tests across 8 primitives
  (render, interactions, focus trap, error/loading states, variant
  markers).

### Files Modified (call sites swapped to primitives)

- `src/i18n/messages/{en,cs,sk}.json` — added `enums.accommodation.*`,
  `enums.stay.*`, `enums.status.*`, and `admin.pagination.*` keys.
  Removed the duplicated `form.accommodation*`, `form.stay*`,
  `admin.registrations.edit.accommodation*`,
  `admin.registrations.edit.stay*`,
  `admin.registrations.add.accommodation*`, and
  `admin.registrations.add.stay*` keys. All three locales kept in
  lockstep (enforced by `tests/unit/i18n/messages.test.ts`).
- `src/components/admin/RegistrationTable.tsx` — dropped
  `formatAccommodation` / `formatStay` helpers; reads from
  `accommodationLabel` / `stayLabel` / `statusLabel`; replaces the
  inline ConfirmDialog with the shared primitive; replaces status
  pill with `Badge`; notes cell now shows short notes inline and a
  `notesExpand` toggle for long notes (no more `truncate + title`);
  email column wraps (`break-all`) so no horizontal scroll at
  1280px.
- `src/components/admin/RegistrationFilters.tsx` — removed
  `sm:max-w-xs` from the search input so it fills available space;
  status filter fixed at `sm:w-48`.
- `src/components/admin/Pagination.tsx` — every string localized
  (`admin.pagination.*`); buttons use `Button variant="secondary"`.
- `src/components/admin/EditRegistrationModal.tsx` — rewritten on
  `Modal + Input + Select + Textarea + Button`; form state typed
  with proper enums (no more `as string` casting); notes textarea
  height unified to 4 rows with a 500-char counter.
- `src/components/admin/AddRegistrationModal.tsx` — same treatment;
  notes height also 4 rows with counter.
- `src/components/admin/ChangePasswordForm.tsx` — swapped to `Input`
  + `Button`.
- `src/app/admin/registrations/page.tsx` — top-right action buttons
  use `Button`.
- `src/app/admin/login/page.tsx` — swapped to `Input` + `Button`.
- `src/app/admin/page.tsx` — removed the hardcoded `"Admins"` card
  that read `value={4}` (it never reflected real data); buttons use
  the admin styling.
- `src/components/forms/RegistrationForm.tsx` — public registration
  form now reads from `stayLabel` / `accommodationLabel`.
- `src/app/(public)/manage/[token]/ManageForm.tsx` — same treatment
  on the manage page.

### Test Updates

- `src/components/admin/__tests__/Pagination.test.tsx` — mock translator
  now handles ICU-style values for `pageOfPages`; navigation buttons
  queried by role + accessible name.
- `src/components/admin/__tests__/RegistrationTable.test.tsx` — asserts
  canonical enum keys (`enums.stay.FRI_SUN` etc.); updated notes
  assertions for the new expand/collapse affordance.

### Verification

- `npx tsc --noEmit` — passes (0 errors).
- `npm run lint` — passes (0 errors; the same 1 pre-existing warning
  in `src/app/layout.tsx` unrelated to this change).
- `npx vitest run` — **531 passed** (+48 over the 483 baseline).
- `npx vitest run tests/security/ tests/architecture/` — 24 passed.
- `npx prisma validate` — passes (with placeholder env vars).

### Intentional Deviations

- **`Admins` stat card removed from dashboard.** The previous
  `AdminDashboardPage` rendered a `value={4}` hardcoded card labelled
  `"Admins"`. It was not localized, was not driven by data, and is
  out of scope for this admin overhaul. Rather than carry over a
  placeholder, it was removed. If admin-count display is desired,
  it should be a real ticket with a real query.

---

## T-101: Arbitrary Stay Date Range on Admin Registration Edit

**Status:** DONE
**Issue:** #101

### Description

Administrators could only express a registration's dates by picking one
of the four predefined `StayOption` values. Real bookings do not always
fit that grid: a guest arriving on the Thursday, staying the following
week, or visiting for one day outside the weekend had no representation.
The admin's only options were to pick the closest stay option (wrong
dates in the calendar invite) or to write the real dates into the free
text notes (invisible to every other surface).

This ticket lets an administrator pin an **arbitrary** date range on a
registration while keeping every existing convenience intact:

- `stay` remains required and unchanged. It is still what tables,
  filters and the CSV `stay` column show. The custom range overrides the
  **calendar dates only**.
- The stay dropdown in the edit modal still offers all four predefined
  options, and enabling the custom range seeds the date inputs from the
  selected option — the predefined dates are the starting point, not a
  cage.
- Public behaviour is untouched. The registration form and the guest
  manage form neither show nor send the new fields, and a guest editing
  their own registration cannot clear a range an admin set for them
  (omitted fields mean "leave alone", not "clear").

### Domain Rules

Any range is accepted, including ranges far outside the event weekend.
The only constraints are:

| Rule | Behaviour |
|------|-----------|
| Completeness | Both endpoints or neither; one alone is a `400` |
| Calendar validity | Strict `YYYY-MM-DD`; `2026-02-30` and `2027-02-29` are rejected |
| Ordering | End must not precede start |
| Single day | Start equal to end is valid and means a day visit (14:00–22:00 local in the invite) |
| Clearing | Explicit `null` on both fields restores the stay-option dates |

### Files Added

- `src/lib/date/iso-date.ts` — strict calendar-date parse/format
  helpers. Anchors to UTC midnight so "arrives 10 July" cannot drift a
  day with the reader's timezone, and rejects the rollover that
  `new Date()` would silently perform on `2026-04-31`.
- `src/lib/date/timezone.ts` — IANA-zone conversions between
  venue-local wall time and instants (`Intl`-based, no dependency).
  Resolves the offset in force *on the date being converted*, so a
  winter range is not built with the summer offset.
- `src/lib/event/stay-dates.ts` — `resolveEventDates` (custom range wins
  over `EVENT_DATES_BY_STAY`, with fallback on partial/malformed data)
  and `defaultDateRangeForStay` (prefill source for the admin form).
- `prisma/migrations/20260727090000_add_custom_stay_dates/migration.sql`
  — two nullable `DATE` columns; every existing row is unaffected.
- `src/components/admin/__tests__/RegistrationDrawer.test.tsx` — first
  test coverage for the drawer, added with the range display.
- `tests/unit/lib/date/iso-date.test.ts`,
  `tests/unit/lib/date/timezone.test.ts`,
  `tests/unit/lib/event/stay-dates.test.ts`,
  `tests/unit/lib/validation/stay-date-range.test.ts`.

### Files Changed

- `prisma/schema.prisma` — `stayStartDate` / `stayEndDate` (`@db.Date`).
- `src/types/registration.ts` — the two optional fields on
  `RegistrationInput` / `RegistrationOutput`, with the three-state
  (`undefined` / `null` / date pair) contract documented.
- `src/lib/validation/registration.ts` — `stayDateRangeSchema`.
- `src/repositories/registration-repository.ts` — `toStayDateRangeData`
  maps the three states onto Prisma; `toOutput` maps the columns back to
  `YYYY-MM-DD`.
- `src/lib/usecases/admin-actions.ts` — `adminEditRegistration` validates
  the range (throws `ValidationError` with field details); CSV export
  gains appended `stayStartDate` / `stayEndDate` columns.
- `src/lib/email/send-manage-link.ts` — resolves the ICS window through
  `resolveEventDates`, and now takes a single `stayDates: StayDatesSource`
  object instead of a loose `stay` field.
- `src/lib/usecases/{register,resend-link,manage-registration}.ts` and
  `adminResendEmail` — all four `sendManageLink` call sites pass the
  registration itself, so every email path carries the custom range.
- `src/config/event.ts` — `EVENT_TIMEZONE` (IANA) replaces the fixed
  offset; only the two day-visit time constants remain.
- `src/app/admin/registrations/page.tsx` — routes a `400`'s `fields` map
  back into the edit modal and keeps the modal open.
- `src/app/api/admin/registrations/route.ts` — `PUT` forwards the two
  fields verbatim, preserving absent-vs-null (L3: validation stays in
  the use case).
- `src/components/admin/EditRegistrationModal.tsx` — "Custom date range"
  toggle with arrival/departure date inputs, prefill from the selected
  stay option (tracking it until the admin types), inline field-level
  errors, and a `serverFieldErrors` channel for server rejections.
- `src/components/admin/RegistrationDrawer.tsx` — read-only range field.
- `src/i18n/messages/{en,cs,sk}.json` — six new edit keys and two new
  table keys per locale.
- `docs/ARCHITECTURE.md` — Section 8.1.1 (domain rules), 12.3
  (`PUT /api/admin/registrations` contract + example), 14.3 (event
  window resolution).

### Design Decisions

- **Calendar dates, not instants.** The range is stored in `DATE`
  columns and travels as `YYYY-MM-DD` strings. A `DateTime` would have
  made "arrives on the 10th" timezone-dependent for no benefit, since
  no time of day is ever captured.
- **Three-state input contract.** `undefined` (leave alone) is
  deliberately distinct from `null` (clear). Without it, the public
  manage form — which sends a full `RegistrationInput` without the range
  fields — would silently wipe an admin's range on every guest edit.
- **`stay` kept required.** Making it nullable would have rippled through
  filters, stats, the CSV export and every fixture for no gain; the
  range is an override, not a replacement.
- **Invite times come from the stay option, not constants.** Only dates
  are captured, so the times of day are derived from
  `EVENT_DATES_BY_STAY`. A fixed 20:00 → 12:00 pair looked simpler but
  silently shortened a `FRI_SAT` invite by 8 hours when an admin ticked
  the toggle (prefilled) and saved without changing anything, because
  `FRI_SAT` departs at 20:00, not noon. Deriving the times makes the
  prefill → save round-trip lossless for all four options, which the
  test suite now asserts per option. The single-day case still falls
  back to day-visit times, since an overnight option's 20:00 → 12:00
  would invert on one date.
- **IANA zone, not a fixed UTC offset.** Arbitrary ranges are allowed
  anywhere in the calendar, so a hardcoded `+02:00` would put every
  winter range an hour out. `EVENT_TIMEZONE` plus `Intl` resolves the
  offset per date, including on DST-transition days.
- **Toggle instead of always-visible date inputs.** An empty pair of
  date fields cannot distinguish "no custom range" from "not filled in
  yet". The checkbox makes the state explicit, and enabling it prefills
  from the current stay option so the predefined dates stay one click
  away.
- **`sendManageLink` takes an object, not loose fields.** The first
  implementation added optional `stayStartDate` / `stayEndDate`
  parameters alongside `stay`, and three of four call sites were
  updated — the public resend-link path was missed, so a guest who
  asked for a new link received an invite for the predefined weekend,
  overwriting the correct entry in their calendar. Collapsing the
  parameters into one `stayDates: StayDatesSource` object (which a
  `RegistrationOutput` satisfies structurally) turns that class of
  omission into a compile error.
- **CSV columns appended, not grouped.** Placing them next to `stay`
  read better but shifted every later column, silently breaking any
  position-keyed consumer of the export. Appending is backwards
  compatible.

### Verification (initial implementation)

- `npx vitest run` — **637 passed** (+106 over the 531 baseline).
- `npx vitest run --coverage` — 92.23% statements / 87.86% branches,
  above the 80% / 75% gates. New modules: `iso-date.ts` 100%,
  `stay-dates.ts` 100%, `timezone.ts` 93.93%, validation 100%.
- `npx tsc --noEmit` — passes (0 errors).
- `npm run lint` — passes (0 errors; the same 1 pre-existing warning in
  `src/app/layout.tsx`).
- `npx prisma validate` — passes (with placeholder env vars).
- `npm run build` — passes.

### Security Review Remediation

Three findings from the security review of the work above, all sharing a root
cause: an unbounded input met a partial function on a code path that had already
destroyed state it could not restore.

**S1 — An out-of-window date destroyed the guest's manage link.**
The range accepted any calendar date ("Bounds: None"), and `zoneOffsetMinutes`
parsed `Intl`'s `longOffset` with `/^GMT([+-])(\d{2}):(\d{2})$/`. For any date
before 1891 the tz database reports `Europe/Bratislava` as `GMT+00:57:44`, which
that pattern cannot read, so the function threw. It is called from
`resolveEventDates`, which is called from `sendManageLink`, which both resend
paths reach *after* revoking the guest's tokens and issuing a replacement. An
admin typing `1850-01-01` therefore left the guest with a dead link, no email,
and a `500` — irrecoverable without an admin noticing. Fixed in three
independent layers:

- **Bounded input.** `SUPPORTED_STAY_DATE_MIN`/`_MAX` (`2000-01-01`…
  `2100-12-31`) — the window in which every date has a whole-minute UTC offset —
  enforced by `stayDateRangeSchema` and mirrored as `min`/`max` on the form's
  date inputs, with a matching client-side check for typed input.
- **Total conversion.** Every function in `src/lib/date/timezone.ts` now returns
  `null` instead of throwing (unknown zone, invalid instant, sub-minute offset),
  and `resolveEventDates` is documented and tested as total: any failure falls
  back to the stay-option dates. `instantFromZonedDateTime` also builds its
  instant from validated components rather than parsing `${date}T${time}Z`,
  which silently rolled `2026-02-30` over to 2 March.
- **Ordered rotation** (below), so even a throw cannot cost a guest their link.

**S2 — Rotation preceded delivery.** `adminResendEmail` and `resendManageLink`
revoked every existing token, issued a new one, then sent the email. Any send
failure — a Resend outage, a conversion throw — left the guest locked out with
nothing to show for it. `resendManageLink` additionally discarded the send
result entirely and logged "Manage link resent" regardless, so the failure was
invisible to operators too. Both now create the replacement first, send, and
revoke earlier tokens *only* on an accepted send
(`revokeAllTokensForRegistrationExcept`); a failure revokes just the undelivered
token and is logged as a failure. `resendManageLink` still returns an identical
`{ success: true }` in every case (S5/API4) — the outcome reaches the operator,
never the caller.

**S2b — the same rotation defect survived on the third call site.** The first
pass fixed the two resend use cases and consciously left
`updateRegistrationByToken` (the guest manage-form edit) alone, reasoning that
it returns `newManageUrl` directly to the guest so a failed send could not lock
anyone out. That reasoning was wrong: a repo-wide search shows **no client reads
`newManageUrl`** — `ManageForm` only parses the response body on the error path
— so the replacement link exists solely in the email. The highest-volume manage
path therefore still revoked the guest's live token before sending, discarded
the send result, and logged success unconditionally. It now follows the same
create → send → revoke order. Two further points specific to it: the
registration edit is already persisted when the send fails, so only the rotation
is rolled back, never the edit; and the function returns the URL the caller came
in with, so the response always names a link that actually works. Found by an
adversarial review pass, not by the original findings list.

**S2c — an out-of-enum `stay` produced a wall-clock invite.**
`EVENT_DATES_BY_STAY[stay]` was an unguarded object index, so `"__proto__"`,
`"constructor"` and `"toString"` resolved to `Object.prototype`, whose `.start`
is `undefined` — and formatting `undefined` as a date yields *the current time*.
The result was a plausible-looking window derived from the wall clock rather
than a detectable failure; any other unknown key threw instead. Unreachable
through a Postgres enum column, but it sat on the post-rotation path and
falsified the module's totality claim. `predefinedDates` now guards with
`Object.hasOwn` and falls back to the day-visit option.

**S3 — `PUT /api/admin/registrations` trusted its payload.** The handler cast
every field (`name as string`, `adultsCount as number`, `registrationId as
string`) straight into a `RegistrationInput`, so an authenticated admin session
could send a non-UUID id, a number for a name, or 501-character notes and get an
opaque `500` from the driver — a violation of S10 with no field-level detail.
`adminEditRegistrationSchema` now validates the entire body, reporting every
invalid field at once and stripping unknown keys so `status` / `id` cannot be
smuggled in. Admin capabilities are unchanged: any stay option, any
accommodation, and an arbitrary in-window range — the same constraints
admin-initiated *creation* already enforced through `registerGuest`.

### Design Decisions (remediation)

- **Bound the input rather than only harden the conversion.** Either alone would
  stop the crash. Both are kept because they answer different questions: the
  bound tells an admin what is allowed *before* they submit, and the totality
  guarantees no stored row can ever break the email path. A rejection an admin
  can read beats a silent fallback to dates nobody chose.
- **`2000`–`2100`.** Wide enough for historical record-keeping and a multi-decade
  horizon, narrow enough that every date in it has a whole-minute offset in the
  tz database. The lower bound is far above the 1891 local-mean-time boundary
  that caused the defect, so the rule stays true if the venue's zone changes.
- **Nullable returns over exceptions in `timezone.ts`.** The alternative — a
  `try`/`catch` at the call site — leaves the next caller free to forget. A
  `Date | null` return makes the compiler ask the question at every call site.
- **One conversion function, not a strict and a `try` variant.** A strict
  variant would have had no production caller left, leaving dead code whose
  tests still passed.
- **Enum schemas built from the domain enums.** `z.enum(StayOption)` instead of a
  duplicated literal list makes parsed payloads typed as `StayOption`, so the
  route builds a `RegistrationInput` with no casts at all. The casts were not
  incidental to the vulnerability — they were the mechanism by which unvalidated
  values became typed ones.
- **Validation at the route *and* the use case.** Not redundancy for its own
  sake: `adminEditRegistration` is reachable from other callers, and the
  invariant it protects (never write a half-defined range) deserves enforcement
  at its own boundary.
- **`400`-only field errors in the UI.** Reading a `fields`-shaped body from any
  failing status meant an expired session left the modal open and silent, with
  the admin re-submitting a request that could never succeed.
- **DB CHECK constraints as a backstop, not the guard.** `Registration_stayDates_pair_check`
  and `_order_check` make "both or neither, in order" true of the table. Safe to
  add to this migration because both columns are introduced by it, so every
  existing row already satisfies them. Documented caveat: local dev provisions
  via `prisma db push`, which cannot create CHECK constraints (Prisma's schema
  language has no syntax for them), so they exist in migrated environments only.
- **Rotation rollback does not roll back the action.** On `updateRegistrationByToken`
  the registration edit is committed before the email is attempted. Undoing it
  on a send failure would tell the guest their change was lost when it was not;
  only the token rotation is reverted.
- **A rolled-back rotation still returns a working URL.** The alternative — an
  optional `newManageUrl` — would have given the endpoint two response shapes
  for one status code (API5). The raw token the caller supplied is already in
  memory for this request, so returning it introduces no new exposure (T1) and
  keeps the contract "this is the link that is live now" true in both cases.
- **Not rotating on a failed send is the right trade against T4.** A token that
  has been used once staying valid slightly longer is a far smaller harm than a
  guest permanently locked out of their registration, and it is the same trade
  the resend paths make.
- **`discardUndeliveredToken` swallows its own failure.** It runs when something
  is already broken, often the same outage; letting it throw would replace the
  error the caller is about to report with a misleading one. An undelivered
  token that survives is unreachable — its raw value was never sent anywhere.
- **The modal owns the list of fields it can display.** The page filters server
  field errors against `EDITABLE_FIELDS` rather than guessing, so a `400` naming
  only `body` or `registrationId` falls through to the generic toast instead of
  leaving Save looking dead.

### Files Added (remediation)

- `src/lib/validation/field-errors.ts` — `toFieldErrors`, the single Zod-issues →
  `fields` map translation, replacing three hand-rolled copies.
- `src/lib/usecases/token-rotation.ts` — `discardUndeliveredToken`, the shared
  non-throwing compensation used by all three rotation paths.
- `tests/unit/lib/validation/admin-edit-registration.test.ts`.

### Files Changed (remediation)

- `src/config/event.ts` — `SUPPORTED_STAY_DATE_MIN` / `_MAX`.
- `src/lib/date/timezone.ts` — total conversions; seconds-aware offset parsing;
  component-built instants.
- `src/lib/event/stay-dates.ts` — `resolveEventDates` total, with day-visit and
  predefined fallbacks and a guarded stay-option lookup.
- `src/lib/usecases/manage-registration.ts` — delivery-then-rotation on the guest
  edit path, with the rotation (not the edit) rolled back on a failed send.
- `src/lib/validation/registration.ts` — window bounds, shared range refinement,
  `adminEditRegistrationSchema`, enum schemas from the domain enums.
- `src/app/api/admin/registrations/route.ts` — full-payload validation, no casts,
  `400` for malformed JSON.
- `src/lib/usecases/{admin-actions,resend-link}.ts` — delivery-then-rotation.
- `src/repositories/token-repository.ts` — `revokeAllTokensForRegistrationExcept`.
- `src/components/admin/EditRegistrationModal.tsx` — `min`/`max` on both date
  inputs, bounds validation, server errors on every editable field.
- `src/app/admin/registrations/page.tsx` — field errors read from `400` only.
- `prisma/migrations/20260727090000_add_custom_stay_dates/migration.sql`,
  `prisma/schema.prisma` — pair and order CHECK constraints.
- `src/i18n/messages/{en,cs,sk}.json` — `errorDateRangeBounds`.
- `docs/ARCHITECTURE.md` — 7.2 (rotation ordering), 8.1.1 (bounds, data
  integrity, error surfacing), 12.3 (payload contract), 14.3 (totality).

### Verification (remediation)

- `npx vitest run` — **78 files, 750 passed** (+113 over 637).
- `npx vitest run --coverage` — 92.94% statements / 88.28% branches, above the
  80% / 75% gates and above the pre-remediation 92.23% / 87.86%. New and changed
  modules: `stay-dates.ts`, `field-errors.ts`, `token-rotation.ts` and
  `validation/registration.ts` at 100%, `resend-link.ts` 100% statements,
  `manage-registration.ts` 97.72%, `timezone.ts` 92.85% (the remainder are
  unreachable defensive branches).
- The migration's CHECK constraints were **not executed against a live
  database** — no Postgres was reachable in the working environment. They are
  covered by `npx prisma validate` and review only.
- `npx tsc --noEmit` — passes (0 errors).
- `npm run lint` — passes (0 errors; the same 1 pre-existing warning in
  `src/app/layout.tsx`).
- `npx prisma validate` — passes.
- `npm run build` — passes.

### Known follow-ups (not in this change)

- Admin auto-provisioning guard — explicitly out of scope for this change.
- `POST /api/admin/registrations` returns `200` with `{ success: false }` when a
  resend fails, and the admin UI keys its success toast off `res.ok` alone, so a
  failed resend still shows as sent. Pre-existing, outside the reviewed
  findings, and a response-contract change rather than a security fix.

---

## T-102: Permanent Admin Deletion of a Registration

**Status:** DONE
**Issue:** #102

### Description

The admin surface could only ever *cancel* a registration. Cancelling is the
right tool for a guest who is not coming — the record stays on the list under
the Cancelled filter, it can be reactivated, and it remains in the history. But
it is the wrong tool for a record that should not exist at all: a duplicate
submission, a test entry made while checking the form, or a guest asking to have
their data removed. Those accumulated permanently, with no way for an
administrator to remove them short of waiting out the 180-day retention purge
(which only reaches cancelled records) or reaching into the database by hand.

This ticket adds a deliberate, admin-only permanent delete, without weakening
any existing guarantee: cancel keeps its endpoint, its verb and its exact
behaviour, and every caller of it is untouched.

### Semantics

| Rule | Behaviour |
|------|-----------|
| Scope | One registration by id, plus its dependent `RegistrationToken` rows |
| Dependent data | Removed by the `ON DELETE CASCADE` foreign key, in the same statement — never a second, non-atomic delete |
| Status precondition | None. Unlike cancel/reconfirm, a registration in any status may be deleted; purging a cancelled one is the main use |
| Reversibility | None. This is why the UI gates it behind a named confirmation |
| Unknown id | `404` |
| Lost race | `404` — a concurrent delete means the caller deleted nothing, and is told so |
| Persistence failure | Propagates to a generic `500`; never reported as success, never logged as one |
| Audit | `LOG5` context plus the masked email (`LOG4`), written on success only — after the row is gone, the log is the only trace it existed |

### Design Decisions

**A dedicated endpoint, not the collection's `DELETE` verb.** In this API
`DELETE /api/admin/registrations` already means *cancel*. Overloading it would
have made the irreversible action indistinguishable from the reversible one in
access logs, and — worse — would have silently converted every existing cancel
call site into a hard delete. `POST /api/admin/registrations/delete` follows the
`reconfirm` precedent: a dedicated path so the action is explicit, `POST` to
match its sibling action routes.

**`deleteMany`, not `delete`.** `delete` throws an opaque Prisma error when the
row is absent; a returned count lets the use case answer "did it exist?" without
pattern-matching driver error codes, and closes the check-then-delete race
honestly rather than reporting a deletion that another admin performed.

**The cascade does the dependent work.** Deleting tokens explicitly as well
would duplicate a guarantee the schema already makes and would open a window in
which a registration exists with its manage links already gone. The integration
test asserts a single parent-level statement, so if that ever changes to an
explicit two-step delete, the requirement to make it atomic surfaces there.

**Delete lives in the edit modal only.** Not on table rows and not in the
read-only drawer, where the neighbouring click merely cancels. Reaching it takes
a deliberate step, it sits at the opposite end of the footer from Save so a
mis-aimed click lands on empty space, and the confirmation names the guest and
states that cancelling is the reversible alternative. Every way out of the
confirmation except the confirm button — dismiss, Escape, backdrop — is the safe
one. The handler prop is optional, so any caller that must not offer deletion
gets exactly the previous modal.

### Files Added

- `src/app/api/admin/registrations/delete/route.ts` — the endpoint.
- `src/lib/api-request.ts` — `readJsonBody`, extracted from the collection route
  so both mutation paths share one malformed-payload contract (`400` under
  `body`, never a `500`) instead of two copies that can drift.
- `src/app/api/admin/registrations/delete/route.test.ts`.
- `tests/integration/admin-delete-registration.test.ts`.

### Files Changed

- `src/repositories/registration-repository.ts` — `deleteRegistrationById`.
- `src/lib/usecases/admin-actions.ts` — `adminDeleteRegistration`.
- `src/app/api/admin/registrations/route.ts` — uses the shared `readJsonBody`
  (behaviour unchanged; the existing malformed-body tests cover the swap).
- `src/components/admin/EditRegistrationModal.tsx` — optional `onDelete`,
  destructive footer control, confirmation dialog.
- `src/app/admin/registrations/page.tsx` — `handleDelete`; closes the modal and
  drawer, drops the deleted id from any pending bulk selection, refreshes.
- `src/i18n/messages/{en,cs,sk}.json` — `edit.delete`,
  `edit.confirmDelete{Title,Message,Confirm,Dismiss}`,
  `deleteSuccess`, `errorDelete`.
- `docs/ARCHITECTURE.md` — 8.1.2 (cancel vs delete), 8.2 (cascade rationale),
  12.3 (endpoint contract).
- `docs/VERIFICATION_RULES.md` — 9.4 manual check row.

### Tests Added (33 net new)

Written before the implementation; the suite was confirmed red (13 failures
across the four touched files) before any production file was edited.

- Repository (3) — delete by id, `false` for no matching row, failure propagates.
- Use case (6) — deletes and logs; deletes a cancelled registration; masked
  email only in the audit entry; `NotFoundError` with no persistence call when
  absent; `NotFoundError` when the row vanishes mid-operation; failure
  propagates without a success log.
- Route (10) — success payload; `401`; `403`; auth precedes body reading;
  three invalid-identifier shapes; malformed JSON; `404`; generic `500`.
- Integration (9) — route → validation → use case → repository → Prisma wired
  end to end, plus cascade-is-a-single-statement, the real logger's audit entry,
  no full email in output, and the race and failure paths.
- Component (5) — control absent without a handler; confirmation required;
  confirm deletes; dismiss deletes nothing; the control never submits the form.

The race-condition guard was mutation-checked: removing it turns both the unit
and the integration race tests red.

### Verification

- `npx vitest run` — **80 files, 783 passed** (+33 over 750, 0 failures).
- `npx vitest run --coverage` — 93.11% statements / 88.84% branches, above the
  80% / 75% gates and above the previous 92.94% / 88.28%. `api-request.ts` at
  100%.
- `npx tsc --noEmit` — passes (0 errors).
- `npm run lint` — passes (0 errors; the same 1 pre-existing warning in
  `src/app/layout.tsx`).
- `npx prisma validate` — passes. No schema change was needed: the cascade this
  feature relies on was already declared in `schema.prisma` and created by the
  `20260211_init` migration.
- `npm run build` — passes; `/api/admin/registrations/delete` present in the
  route manifest.
- Not executed against a live database — no Postgres was reachable in the
  working environment, so the cascade is verified by schema, migration SQL and
  review rather than by an end-to-end delete.

### Known follow-ups (not in this change)

- Bulk delete is not offered. Deleting many records at once wants a different
  confirmation design than one guest's name, and was not part of this issue.

---

End of Execution Backlog.
