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

| ID    | Title                              | Phase | Dependencies                  |
|-------|------------------------------------|-------|-------------------------------|
| T-001 | Initialize Next.js Project         | 1     | None                          |
| T-002 | TypeScript, Tailwind, Testing      | 1     | T-001                         |
| T-038 | CI Pipeline – Foundation           | 1     | T-002                         |
| T-003 | Prisma and Database Schema         | 1     | T-002                         |
| T-039 | Prisma Client Singleton            | 1     | T-003                         |
| T-004 | Supabase Auth Integration          | 1     | T-003                         |
| T-005 | Resend Integration                 | 1     | T-004                         |
| T-006 | Env Config and Folder Structure    | 1     | T-005                         |
| T-040 | Shared TypeScript Types            | 1     | T-006                         |
| T-043 | Seed Data Population               | 1     | T-006, T-003                  |
| T-007 | Error Types                        | 2     | T-006                         |
| T-041 | API Response Utility               | 2     | T-007                         |
| T-036 | Error Boundaries                   | 2     | T-007                         |
| T-008 | Structured Logger                  | 2     | T-006                         |
| T-009 | Capability Token Utility           | 2     | T-006                         |
| T-010 | Rate Limiter                       | 2     | T-008, T-006                  |
| T-042 | CI Pipeline – Coverage Gates       | 2     | T-038, T-009                  |
| T-011 | Registration Repository            | 3     | T-039, T-040, T-007           |
| T-012 | Token Repository                   | 3     | T-039, T-040, T-009           |
| T-013 | Admin Repository                   | 3     | T-039, T-040                  |
| T-014 | Register Use Case                  | 4     | T-011, T-012, T-009           |
| T-015 | Manage Registration Use Case       | 4     | T-012, T-011                  |
| T-016 | Resend Link Use Case               | 4     | T-012, T-011                  |
| T-017 | Admin Auth Guard                   | 4     | T-004, T-013                  |
| T-018 | Admin Actions Use Case             | 4     | T-013, T-011                  |
| T-019 | Email Service                      | 5     | T-014                         |
| T-020 | Email Templates                    | 5     | T-019                         |
| T-025 | Register API Route                 | 6     | T-014, T-010, T-041           |
| T-026 | Manage API Route                   | 6     | T-015, T-010, T-041           |
| T-027 | Resend Link API Route              | 6     | T-016, T-010, T-041           |
| T-044 | Admin Mutation API Routes          | 6     | T-017, T-018, T-041           |
| T-021 | Event Landing Page                 | 7     | T-036, T-025, T-019           |
| T-022 | Registration Form                  | 7     | T-036, T-025                  |
| T-023 | Manage Page                        | 7     | T-036, T-026                  |
| T-024 | Resend Link Page                   | 7     | T-036, T-027                  |
| T-028 | Admin Layout and Auth              | 8     | T-017                         |
| T-029 | Admin Dashboard                    | 8     | T-018, T-028                  |
| T-030 | Admin Registration List            | 8     | T-044, T-028                  |
| T-031 | Admin CSV Export                   | 8     | T-018                         |
| T-032 | Rate Limiting Integration          | 9     | T-025, T-026, T-027           |
| T-033 | Token Logging Audit                | 9     | T-032                         |
| T-034 | Security Headers                   | 9     | T-033                         |
| T-045 | CI Pipeline – Security Suites      | 9     | T-038, T-033                  |
| T-035 | Health Endpoint                    | 10    | T-008                         |
| T-037 | Data Retention                     | 10    | T-035                         |
| T-046 | README                             | 10    | T-037                         |
| T-047 | ICS Calendar Invite Utility        | 11    | T-006                         |
| T-048 | Attach Calendar Invite to Email    | 11    | T-047, T-019, T-020           |
| T-049 | i18n Infrastructure Setup          | 11    | T-006                         |
| T-050 | Translate Public UI Pages          | 11    | T-049, T-021..T-024           |
| T-051 | Translate Email Templates          | 11    | T-049, T-020                  |
| T-052 | Language Switcher Component        | 11    | T-049                         |
| T-053 | Translate Admin UI                 | 11    | T-049, T-028..T-031           |
| T-054 | Registration Form Field Migration  | 11    | T-003, T-040, T-014, T-022    |

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
- [ ] `renderManageLinkEmail` accepts a `locale` parameter
- [ ] Email subject line is translated
- [ ] Email body text is translated (greeting, instructions, event details labels)
- [ ] The manage link itself is language-independent (URL doesn't change)
- [ ] Calendar invite note text is translated (if T-048 is completed)
- [ ] Locale is determined from the user's session/cookie at the time of registration
- [ ] Fallback to English if locale is not available
- [ ] Unit test: email rendered in each of the three languages contains correct translated strings

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

| ID    | Title                              | Phase | Dependencies                  |
|-------|------------------------------------|-------|-------------------------------|
| T-047 | ICS Calendar Invite Utility        | 11    | T-006                         |
| T-048 | Attach Calendar Invite to Email    | 11    | T-047, T-019, T-020           |
| T-049 | i18n Infrastructure Setup          | 11    | T-006                         |
| T-050 | Translate Public UI Pages          | 11    | T-049, T-021..T-024           |
| T-051 | Translate Email Templates          | 11    | T-049, T-020                  |
| T-052 | Language Switcher Component        | 11    | T-049                         |
| T-053 | Translate Admin UI                 | 11    | T-049, T-028..T-031           |
| T-054 | Registration Form Field Migration  | 11    | T-003, T-040, T-014, T-022    |
| T-055 | Visual Redesign – v1 Design System | 11    | T-021..T-024, T-036           |

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

End of Execution Backlog.
