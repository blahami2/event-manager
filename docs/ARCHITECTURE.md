# Architecture Specification (Layer A)

> **Source of truth**: This document extends [`../Technical_Specification.md`](../Technical_Specification.md).
> The original specification defines the project overview, high-level architecture, domain model,
> security constraints, and feature backlog. This document adds the implementation-level
> conventions, rules, and deterministic specifications required for agentic development.
>
> If there is a conflict, the original Technical Specification takes precedence for intent;
> this document takes precedence for implementation details.

---

# 1. Technology Stack (Pinned)

| Layer          | Technology                     | Version Constraint  |
|----------------|--------------------------------|---------------------|
| Framework      | Next.js (App Router)           | 14.x+              |
| Language       | TypeScript (strict mode)       | 5.x+               |
| ORM            | Prisma                         | 5.x+               |
| Database       | PostgreSQL (Supabase)          | 15+                 |
| Auth           | Supabase Auth (admins only)    | Latest SDK          |
| Email          | Resend                         | Latest SDK          |
| Styling        | Tailwind CSS                   | 3.x+               |
| Validation     | Zod                            | 4.x (pinned 4.3.6) |
| Hosting        | Vercel                         | —                   |
| Testing        | Vitest + Testing Library       | Latest              |

---

# 2. Folder Structure Convention

```
/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                          # Next.js App Router pages & layouts
│   │   ├── (public)/                 # Public route group
│   │   │   ├── page.tsx              # Event landing page
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── manage/
│   │   │       └── [token]/
│   │   │           └── page.tsx
│   │   ├── admin/                    # Admin route group (protected)
│   │   │   ├── layout.tsx            # Auth guard wrapper
│   │   │   ├── page.tsx              # Dashboard
│   │   │   └── registrations/
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   ├── manage/
│   │   │   │   └── route.ts
│   │   │   ├── resend-link/
│   │   │   │   └── route.ts
│   │   │   ├── health/
│   │   │   │   └── route.ts
│   │   │   └── admin/
│   │   │       └── registrations/
│   │   │           └── route.ts
│   │   ├── layout.tsx                # Root layout
│   │   ├── error.tsx                 # Root error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   └── globals.css
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # Primitive UI components (Button, Input, etc.)
│   │   ├── forms/                    # Form components
│   │   └── admin/                    # Admin-specific components
│   ├── i18n/                          # Internationalization (Phase 11)
│   │   ├── config.ts                  # Supported locales, default locale
│   │   ├── get-locale.ts             # Locale detection logic
│   │   └── messages/                  # Translation files
│   │       ├── en.json                # English
│   │       ├── cs.json                # Czech
│   │       └── sk.json                # Slovak
│   ├── lib/                          # Application layer (business logic)
│   │   ├── usecases/                 # Use case functions
│   │   │   ├── register.ts
│   │   │   ├── manage-registration.ts
│   │   │   ├── resend-link.ts
│   │   │   ├── admin-actions.ts
│   │   │   └── data-retention.ts
│   │   ├── validation/               # Zod schemas
│   │   │   ├── registration.ts
│   │   │   └── admin.ts
│   │   ├── token/                    # Token generation & hashing
│   │   │   └── capability-token.ts
│   │   ├── email/                    # Email service abstraction
│   │   │   ├── send-manage-link.ts
│   │   │   ├── ics-generator.ts       # ICS calendar invite generator (Phase 11)
│   │   │   └── templates/
│   │   ├── auth/                     # Auth helpers
│   │   │   ├── supabase-client.ts
│   │   │   ├── admin-guard.ts
│   │   │   └── middleware.ts
│   │   ├── rate-limit/               # Rate limiting logic
│   │   │   └── limiter.ts
│   │   ├── errors/                   # Error types and handlers
│   │   │   └── app-errors.ts
│   │   └── logger.ts                 # Structured logging wrapper
│   ├── repositories/                 # Data access layer (Prisma)
│   │   ├── registration-repository.ts
│   │   ├── token-repository.ts
│   │   └── admin-repository.ts
│   ├── config/                       # Configuration constants
│   │   ├── event.ts                  # Event-specific config (name, date, etc.)
│   │   └── limits.ts                 # Rate limits, token expiry, etc.
│   └── types/                        # Shared TypeScript types
│       ├── registration.ts
│       └── api.ts
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   └── repositories/
│   ├── integration/
│   ├── security/
│   ├── architecture/
│   └── fixtures/
│       └── seed-data.ts
├── docs/                             # Agentic development documents
│   ├── ARCHITECTURE.md               # This file (Layer A)
│   ├── ARCHITECTURE_RULES.md         # Non-negotiables
│   ├── EXECUTION_BACKLOG.md          # Atomic tickets (Layer B)
│   └── VERIFICATION_RULES.md         # Automated checks (Layer C)
├── .env.example
├── .env.local                        # Never committed
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
└── package.json
```

---

# 3. Naming Conventions

| Element              | Convention           | Example                            |
|----------------------|----------------------|------------------------------------|
| Files (components)   | PascalCase           | `RegistrationForm.tsx`             |
| Files (non-component)| kebab-case           | `capability-token.ts`              |
| Directories          | kebab-case           | `rate-limit/`                      |
| React components     | PascalCase           | `EventHeader`                      |
| Functions            | camelCase            | `generateCapabilityToken()`        |
| Constants            | SCREAMING_SNAKE_CASE | `MAX_TOKEN_ATTEMPTS`               |
| Types/Interfaces     | PascalCase           | `RegistrationInput`                |
| Zod schemas          | camelCase + Schema   | `registrationSchema`               |
| DB tables (Prisma)   | PascalCase singular  | `model Registration`               |
| DB columns (Prisma)  | camelCase            | `createdAt`                        |
| API routes           | kebab-case           | `/api/resend-link`                 |
| Environment vars     | SCREAMING_SNAKE_CASE | `DATABASE_URL`                     |
| Test files           | `*.test.ts`          | `capability-token.test.ts`         |

---

# 4. Dependency Rules (Import Boundaries)

```
┌─────────────────┐
│   UI Layer       │  src/app/, src/components/
│   (pages, comps) │
└────────┬────────┘
         │ can import ↓
┌────────▼────────┐
│ Application Layer│  src/lib/usecases/, src/lib/validation/
│ (use cases, Zod) │
└────────┬────────┘
         │ can import ↓
┌────────▼────────┐
│   Data Layer     │  src/repositories/
│   (Prisma repos) │
└────────┬────────┘
         │ can import ↓
┌────────▼────────┐
│ Infrastructure   │  src/lib/auth/, src/lib/email/, src/lib/rate-limit/
│ (auth, email,    │
│  rate-limit)     │
└─────────────────┘
```

**Strict rules:**

1. UI Layer MUST NOT import from `src/repositories/` directly
2. UI Layer MUST NOT contain business logic (validation, token handling, DB queries)
3. Application Layer MUST NOT import from `src/components/`
4. Data Layer MUST NOT import from `src/lib/usecases/`
5. Repositories MUST be the only code that imports `@prisma/client`
6. API route handlers (`route.ts`) delegate to use cases; they MUST NOT contain business logic inline
7. All cross-layer communication uses typed interfaces from `src/types/`

---

# 5. Error-Handling Pattern

## 5.1 Error Types

All application errors extend a base `AppError` class defined in `src/lib/errors/app-errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', 'RATE_LIMITED', 429);
  }
}

export class AuthenticationError extends AppError {
  constructor() {
    super('Authentication required', 'UNAUTHENTICATED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor() {
    super('Insufficient permissions', 'UNAUTHORIZED', 403);
  }
}
```

## 5.2 Error-Handling Rules

1. **API routes** catch errors and return structured JSON:
   ```json
   { "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {} } }
   ```
2. **Use cases** throw `AppError` subclasses; they MUST NOT catch and swallow errors silently
3. **Repositories** let Prisma errors propagate; the use case layer handles them
4. **UI components** use error boundaries for rendering errors; they display user-friendly messages, never stack traces
5. **Never expose internal error details** to the client in production
6. **All API responses** use consistent status codes:
   - `200` – success
   - `201` – created
   - `400` – validation failure
   - `401` – unauthenticated
   - `403` – unauthorized
   - `404` – not found
   - `429` – rate limited
   - `500` – internal server error (generic message only)

---

# 6. Logging Rules

## 6.1 Structured Logging Policy

* Use structured JSON logging (key-value pairs, not string interpolation)
* Log format: `{ "level": "info|warn|error", "message": "...", "context": {}, "timestamp": "ISO8601" }`
* Use a thin logging wrapper in `src/lib/logger.ts` (wraps `console` in dev, structured output in prod)

## 6.2 What to Log

| Event                        | Level   | Required Context                     |
|------------------------------|---------|--------------------------------------|
| Registration created         | `info`  | registrationId                       |
| Registration updated         | `info`  | registrationId                       |
| Registration cancelled       | `info`  | registrationId                       |
| Token lookup failed          | `warn`  | IP (hashed), attempt count           |
| Rate limit triggered         | `warn`  | IP (hashed), endpoint                |
| Email sent                   | `info`  | registrationId, emailType            |
| Email send failed            | `error` | registrationId, errorCode            |
| Admin login                  | `info`  | adminUserId                          |
| Admin action                 | `info`  | adminUserId, action, targetId        |
| Unhandled error              | `error` | error message, stack (server only)   |

## 6.3 What MUST NOT Be Logged

* Raw capability tokens (ever)
* Full email addresses (use masked: `j***@example.com`)
* Request URLs containing tokens
* Database connection strings
* API keys or secrets
* Full IP addresses in production (hash them)

---

# 7. Token Security Rules

## 7.1 Capability Token Specification

| Property            | Requirement                                                |
|---------------------|------------------------------------------------------------|
| Generation          | `crypto.randomBytes(32)` – 32 bytes minimum                |
| Encoding            | URL-safe base64 (`base64url`)                              |
| Storage             | SHA-256 hash stored in DB; raw token NEVER stored           |
| Transmission        | Sent once via email; included in manage link URL            |
| Lookup              | Hash the incoming token, compare against stored hash        |
| Rotation            | New token generated on each edit; old token invalidated     |
| Expiry              | Configurable; default 90 days from last use                 |
| Revocation          | Admin can revoke; cancellation revokes                      |

## 7.2 Token Handling Invariants

1. Raw tokens exist only in memory during generation and in the email body
2. The database column stores ONLY the SHA-256 hash
3. Token comparison is always hash-to-hash; never plaintext comparison
4. Failed token lookups MUST NOT reveal whether a registration exists
5. After 10 failed token lookups per IP per hour, return `429`
6. Token rotation: on every successful manage action, invalidate old token and issue new one
7. Manage link URL format: `{BASE_URL}/manage/{raw_token}`
8. On **every** path that mails a new link — `resendManageLink`,
   `adminResendEmail` and `updateRegistrationByToken` — rotation follows
   delivery: the replacement token is created first, the email is sent, and only
   an accepted send revokes what it supersedes
   (`revokeAllTokensForRegistrationExcept`, or `revokeToken` on the used token
   for the guest edit). A failed or throwing send revokes only the token that
   was never delivered, leaving whatever the guest already holds usable.
   Revoking first meant an email provider outage destroyed a guest's working
   link and put nothing in its place — worst of all on `POST /api/resend-link`,
   the one path a locked-out guest can trigger themselves, where the request
   meant to restore access removed it instead.
9. A failed send is recorded as a failure (`logger.error`), never logged as a
   delivered link. The public response is unchanged either way, so the outcome
   is visible to operators without becoming visible to callers (S5, API4).
10. Rolling back a rotation never rolls back the action that triggered it. A
    guest edit that was persisted stays persisted; only the token change is
    undone, and `PUT /api/manage` then reports the link the guest arrived with,
    so the response always names a manage URL that works.
11. The compensating revoke (`discardUndeliveredToken`) never throws. It runs
    inside a failure path — often the same outage that caused the send to fail —
    and must not replace the error the caller is about to report. An undelivered
    token that survives is unreachable anyway: its raw value was never sent.

---

# 8. Domain Model (Detailed)

> Extends Section 3 of the Technical Specification with field-level detail.

## 8.1 Registration

| Field          | Type        | Constraints                       |
|----------------|-------------|-----------------------------------|
| id             | UUID        | Primary key, auto-generated       |
| name           | String      | Required, 1-200 chars             |
| email          | String      | Required, valid email format      |
| stay           | Enum        | Required: FRI_SAT, SAT_SUN, FRI_SUN |
| adultsCount    | Int         | Required, 0-10                    |
| childrenCount  | Int         | Required, 0-10                    |
| notes          | String?     | Optional, max 500 chars           |
| status         | Enum        | CONFIRMED, CANCELLED              |
| stayStartDate  | Date?       | Optional, admin-only custom range start (see 8.1.1) |
| stayEndDate    | Date?       | Optional, admin-only custom range end (see 8.1.1)   |
| createdAt      | DateTime    | Auto-set                          |
| updatedAt      | DateTime    | Auto-updated                      |

### 8.1.1 Custom Stay Date Range (admin only)

Administrators may pin an arbitrary date range on a registration instead of
accepting the dates implied by its `stay` option. `stay` remains required and
unchanged — it is still the value shown in tables, filters and the CSV export —
so the custom range is an *override of the calendar dates only*.

| Aspect | Rule |
|--------|------|
| Storage | Two nullable `DATE` columns (calendar dates, not instants) |
| Wire format | `YYYY-MM-DD` strings on every layer above the repository |
| Completeness | Both columns are set together or both are `null` |
| Ordering | `stayEndDate` must not precede `stayStartDate`; equal dates mean a day visit |
| Bounds | `2000-01-01`…`2100-12-31` (`SUPPORTED_STAY_DATE_MIN`/`_MAX`, `src/config/event.ts`). Any range inside that window is valid, including ranges far outside the event weekend. The window is not a policy preference: outside it the venue-local conversion in Section 14.3 has no faithful answer — before 1891 `Europe/Bratislava` ran on a `GMT+00:57:44` local mean time offset. It is mirrored as `min`/`max` on the admin form's date inputs |
| Validation | `stayDateRangeSchema` (`src/lib/validation/registration.ts`), applied by `adminEditRegistrationSchema` at the route and again by `adminEditRegistration` in the use case |
| Data integrity | `Registration_stayDates_pair_check` / `_order_check` CHECK constraints hold "both or neither, in order" in migrated databases. Prisma's schema language cannot express CHECK constraints, so they live in migration SQL and `prisma db push` (local dev) does not create them |
| Who can set it | Admin edit only (`PUT /api/admin/registrations`). Public registration and the guest manage form never send these fields |
| Omission semantics | Fields omitted from a payload leave the stored range untouched; explicit `null` clears it |
| Effect | `resolveEventDates` (`src/lib/event/stay-dates.ts`) uses the range for the `.ics` invite; with no range the predefined `EVENT_DATES_BY_STAY` mapping applies |
| Error surfacing | The admin edit modal renders the `400` response's `fields` map against the offending input (every editable field, not only the dates); local validation takes precedence while the admin is editing. Only a `400` is read as field-level detail — a `401`/`403`/`500` falls through to the generic error path |

### 8.1.2 Permanent Deletion (admin only)

A registration can leave the system in two different ways, and they are not
interchangeable:

| | Cancel | Delete |
|---|---|---|
| Endpoint | `DELETE /api/admin/registrations` | `POST /api/admin/registrations/delete` |
| Effect | `status` → `CANCELLED`; row and history retained | Row removed; dependent tokens removed by cascade |
| Reversible | Yes, via `POST /api/admin/registrations/reconfirm` | **No** |
| Visible in admin list | Yes, under the *Cancelled* filter | No |
| Counted in stats / CSV export | Yes (as cancelled) | No |
| Intended for | A guest who is not coming | A record that should never have existed — duplicate, test entry, erasure request |

Design notes:

- **Cancel stays the default.** Delete is reachable only from inside the edit
  modal and only behind an explicit confirmation naming the guest; it is
  deliberately not offered on table rows or in the read-only drawer, where the
  adjacent action is the reversible cancel.
- **No status precondition.** Unlike cancel and reconfirm, delete accepts a
  registration in any status — purging an already-cancelled record is its most
  common use.
- **Dependent data is the database's job.** The `RegistrationToken` cascade
  (Section 8.2) removes the guest's manage links in the same statement, so
  there is no window in which one exists without the other.
- **A concurrent delete is a 404, not a success.** The use case re-checks the
  affected-row count and reports `NOT_FOUND` if another admin won the race,
  rather than confirming a deletion it did not perform.
- **The audit log outlives the row.** `LOG5` context plus the masked email
  (`LOG4`) is the only remaining trace, so it is written on success only.
- Deletion is distinct from the scheduled retention purge (Section 8.1 /
  `data-retention.ts`), which removes *old cancelled* registrations in bulk on a
  time policy rather than one record on an administrator's instruction.

## 8.2 RegistrationToken

| Field          | Type        | Constraints                       |
|----------------|-------------|-----------------------------------|
| id             | UUID        | Primary key                       |
| registrationId | UUID        | FK → Registration                 |
| tokenHash      | String      | SHA-256 hash, unique, indexed     |
| expiresAt      | DateTime    | Default: createdAt + 90 days      |
| isRevoked      | Boolean     | Default: false                    |
| createdAt      | DateTime    | Auto-set                          |

The foreign key is declared `ON DELETE CASCADE`. This is what makes permanent
deletion of a registration (Section 8.1.2) safe: the guest's capability tokens
cannot outlive the record they grant access to, so no manage link is ever left
pointing at a registration that no longer exists.

## 8.3 AdminUser

| Field          | Type        | Constraints                       |
|----------------|-------------|-----------------------------------|
| id             | UUID        | Primary key                       |
| supabaseUserId | String      | Unique, from Supabase Auth        |
| email          | String      | For reference                     |
| createdAt      | DateTime    | Auto-set                          |

## 8.4 RateLimitEntry (optional, if not using external service)

| Field          | Type        | Constraints                       |
|----------------|-------------|-----------------------------------|
| id             | UUID        | Primary key                       |
| ipHash         | String      | SHA-256 of IP address             |
| endpoint       | String      | API endpoint path                 |
| attempts       | Int         | Counter                           |
| windowStart    | DateTime    | Start of rate limit window        |

---

# 9. Rate Limiting Specification

| Endpoint              | Window  | Max Attempts | Response on Exceed         |
|-----------------------|---------|--------------|----------------------------|
| POST /api/register    | 1 hour  | 5 per IP     | 429 with `Retry-After`     |
| GET /manage/[token]   | 1 hour  | 10 per IP    | 429 with `Retry-After`     |
| POST /api/resend-link | 1 hour  | 3 per IP     | 429 with `Retry-After`     |
| POST /admin/* (login) | 15 min  | 5 per IP     | 429 with `Retry-After`     |

All rate limit responses return:
```json
{ "error": { "code": "RATE_LIMITED", "message": "Too many requests. Try again later." } }
```

---

# 10. Observability

## 10.1 Health Endpoint

* `GET /api/health` returns `200 OK` with:
  ```json
  { "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z", "version": "1.0.0" }
  ```
* Health check verifies database connectivity (Prisma `$queryRaw('SELECT 1')`)
* Returns `503` if database is unreachable

## 10.2 Error Boundaries

* Root error boundary in `src/app/error.tsx` catches unhandled rendering errors
* Displays generic user-friendly message
* Logs full error server-side with structured logging

## 10.3 Environment Variables

| Variable               | Required | Description                     |
|------------------------|----------|---------------------------------|
| `DATABASE_URL`         | Yes      | Supabase Postgres connection    |
| `DIRECT_URL`           | Yes      | Direct DB connection for Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes  | Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key          |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key       |
| `RESEND_API_KEY`       | Yes      | Resend API key                  |
| `EMAIL_FROM`           | Yes      | Sender address for emails (e.g. `Birthday Celebration <noreply@resend.dev>`) |
| `BASE_URL`             | Yes      | Application base URL            |
| `NODE_ENV`             | Yes      | `development` or `production`   |
| `LOG_LEVEL`            | No       | `debug`, `info`, `warn`, `error`|
| `RATE_LIMIT_DISABLED`  | No       | `true` to disable in dev        |

---

# 11. Migration Policy

## 11.1 Rules

1. All schema changes go through `prisma migrate dev` (development) or `prisma migrate deploy` (production)
2. Migrations MUST be incremental and additive
3. **No destructive migrations** (dropping columns, tables) without an explicit backlog ticket
4. Each migration has a descriptive name: `npx prisma migrate dev --name update_registration_fields`
5. Migration files are committed to version control
6. The `prisma/seed.ts` script provides deterministic seed data for development

## 11.2 Seed Data Convention

Seed data lives in `prisma/seed.ts` and uses fixed UUIDs for reproducibility:

```typescript
const SEED_REGISTRATION_ID = '00000000-0000-0000-0000-000000000001';
const SEED_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000099';
```

Test fixtures in `tests/fixtures/seed-data.ts` re-export these constants.

---

# 12. API Response Contracts

All API endpoints return consistent response shapes.

## 12.1 Success Response

```json
{
  "data": { "..." : "..." },
  "message": "Registration created successfully"
}
```

## 12.2 Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "email": "Invalid email format"
    }
  }
}
```

## 12.3 Endpoint-Specific Contracts

### POST /api/register
- **Success (201):** `{ "data": { "registrationId": "uuid" }, "message": "Registration successful. Check your email." }`
- **Validation failure (400):** Error response with field-level errors
- **Rate limited (429):** Rate limit error

### POST /api/resend-link
- **Always returns (200):** `{ "message": "If this email is registered, a manage link has been sent." }`
- This response is IDENTICAL regardless of whether the email exists (prevents enumeration)

### GET /manage/[token]
- **Valid token:** Renders manage page with registration data
- **Invalid token (404):** Generic "Link not found or expired" page
- **Rate limited (429):** Rate limit error page

### PUT /api/manage
- **Success (200):** `{ "data": { "registration": {...} }, "message": "Updated successfully" }`
- **Invalid token (404):** `{ "error": { "code": "NOT_FOUND", "message": "Link not found or expired" } }`

### DELETE /api/manage
- **Success (200):** `{ "message": "Registration cancelled" }`
- **Invalid token (404):** `{ "error": { "code": "NOT_FOUND", "message": "Link not found or expired" } }`

### Admin endpoints
- **Unauthenticated (401):** `{ "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" } }`
- **Not admin (403):** `{ "error": { "code": "UNAUTHORIZED", "message": "Insufficient permissions" } }`

#### PUT /api/admin/registrations

Body: `{ registrationId, name, email, stay, accommodation, adultsCount, childrenCount, notes?, stayStartDate?, stayEndDate? }`

The whole body is validated against `adminEditRegistrationSchema` before
anything is forwarded (S10). `registrationId` must be a UUID; the remaining
fields are held to the same domain constraints as every other write path
(`registrationSchema`), which is also what admin-initiated creation enforces.
Unknown keys are stripped, so server-owned fields (`status`, `id`) cannot be
smuggled into an update.

`stayStartDate` / `stayEndDate` are optional `YYYY-MM-DD` calendar dates forming
a custom stay range within the supported window (Section 8.1.1). Send both to
pin a range, send both as `null` to clear it, omit both to leave the stored
range untouched.

- **Success (200):** `{ "data": { ...registration }, "message": "Registration updated" }`
- **Invalid range (400):** `{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "fields": { "stayEndDate": "End date must not be before the start date" } } }`
- **Invalid identifier (400):** `{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "fields": { "registrationId": "registrationId must be a valid UUID" } } }`
- **Invalid field (400):** `{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "fields": { "email": "Invalid email format", "adultsCount": "Maximum 10 adults allowed" } } }`

Every invalid field is reported in one response, so the admin sees all
corrections in a single round trip. A body that is not valid JSON is reported
the same way, under the `body` key.

Example — pin an arbitrary week-long stay:

```jsonc
// PUT /api/admin/registrations
{
  "registrationId": "3f1c…",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "stay": "SAT_SUN",           // still required; drives table/filter/CSV display
  "accommodation": "ANYWHERE",
  "adultsCount": 2,
  "childrenCount": 0,
  "stayStartDate": "2026-07-10",
  "stayEndDate": "2026-07-17"
}
```

#### POST /api/admin/registrations/delete

Body: `{ registrationId }` (UUID)

Permanently deletes the registration and, by the `RegistrationToken` foreign-key
cascade, every capability token issued for it (Section 8.1.2). Irreversible.

A dedicated path rather than the collection's `DELETE` verb, which in this API
already means the *reversible* cancel: overloading it would make the destructive
action indistinguishable from the reversible one in access logs, and would turn
every existing cancel call site into a hard delete. Authorization runs before
the body is read, so an unauthenticated caller cannot probe payload validity.

- **Success (200):** `{ "data": { "id": "uuid" }, "message": "Registration deleted" }`
- **Invalid identifier (400):** `{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "fields": { "registrationId": "registrationId must be a valid UUID" } } }`
- **Malformed JSON body (400):** as above, under the `body` key
- **Unknown registration (404):** `{ "error": { "code": "NOT_FOUND", "message": "Registration not found" } }`
- **Lost a concurrent delete (404):** identical to the unknown case — the loser of the race is never told it deleted something
- **Persistence failure (500):** `{ "error": { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred" } }` (S9 — no driver detail is exposed)

Example:

```jsonc
// POST /api/admin/registrations/delete
{ "registrationId": "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f" }
```

### GET /api/health
- **Healthy (200):** `{ "status": "ok", "timestamp": "ISO8601", "version": "1.0.0" }`
- **Unhealthy (503):** `{ "status": "error", "timestamp": "ISO8601" }`

---

---

# 13. Internationalization (i18n) — Phase 11

## 13.1 Supported Locales

| Locale | Language | Status   |
|--------|----------|----------|
| `en`   | English  | Default  |
| `cs`   | Czech    | Planned  |
| `sk`   | Slovak   | Planned  |

## 13.2 Locale Detection Priority

1. **Manual override**: `NEXT_LOCALE` cookie (set by language switcher)
2. **Browser detection**: `Accept-Language` header, mapped to closest supported locale
3. **Fallback**: English (`en`)

## 13.3 Translation Architecture

- Library: `next-intl` (recommended for Next.js App Router)
- Translation files: `src/i18n/messages/{locale}.json`
- Type-safe translation keys via TypeScript
- Cookie-based locale persistence (no URL-based routing like `/en/register`)
- Email templates accept `locale` parameter to render in recipient's language

## 13.4 i18n Rules

| Rule  | Description |
|-------|-------------|
| I18N1 | All user-visible text in UI MUST come from translation files, no hardcoded strings |
| I18N2 | Log messages MUST remain in English (not translated) |
| I18N3 | API error codes MUST remain in English; only user-facing messages are translated |
| I18N4 | CSV export data MUST NOT be translated (contains user-entered data) |
| I18N5 | All three locale files MUST have identical key sets (enforced by TypeScript types) |

---

# 14. Calendar Invite (ICS) — Phase 11

## 14.1 Format

Registration confirmation emails include an iCalendar (.ics) attachment per [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545).

## 14.2 ICS Specification

| Property       | Value                                      |
|----------------|--------------------------------------------|
| MIME type      | `text/calendar; method=REQUEST`            |
| Filename       | `event.ics`                                |
| Method         | `REQUEST` (treated as invitation by clients) |
| Event data     | From `src/config/event.ts`                 |
| Event window   | From `resolveEventDates` (`src/lib/event/stay-dates.ts`) |
| UID            | Unique per generation (UUID + domain)      |
| Compatibility  | Gmail, Outlook, Apple Mail, Thunderbird    |

## 14.3 Event Window Resolution

The `DTSTART` / `DTEND` of the invite come from `resolveEventDates`:

1. If the registration carries a complete, well-formed custom range
   (Section 8.1.1), that range wins.
2. Otherwise the predefined `EVENT_DATES_BY_STAY[stay]` mapping applies.

A custom range captures calendar dates only, so its times of day are taken from
the registration's stay option — derived from `EVENT_DATES_BY_STAY` rather than
duplicated as constants, so a range that equals the stay option's own dates
round-trips to exactly the predefined instants. When those times would produce
an empty or inverted window (an overnight option's 20:00 → 12:00 applied to a
single date), the range is treated as a day visit and uses the
`CUSTOM_RANGE_DAY_VISIT_*` times instead. A partial or malformed range falls
back to the stay-option dates rather than producing a half-defined invite.

Conversions between venue-local wall time and instants resolve the UTC offset in
force on the date being converted, via the IANA zone `EVENT_TIMEZONE`
(`src/lib/date/timezone.ts`). A fixed offset would be an hour wrong for any
range outside daylight saving time, and arbitrary ranges are explicitly allowed
anywhere in the supported window.

`resolveEventDates` is **total: no input can make it throw, and no output
depends on the current time.** It runs inside the outgoing email path,
downstream of capability-token rotation, so an exception there would cost the
guest their only working manage link. A `stay` outside the enum falls back to a
defined window rather than being looked up unguarded — an object index would
otherwise resolve `"__proto__"` to `Object.prototype` and derive the invite's
times of day from the wall clock. Every conversion in
`src/lib/date/timezone.ts` therefore reports failure as `null` — an unknown zone,
a date that is not real, or a date whose offset carries a seconds component (the
venue's pre-1891 local mean time) — and `resolveEventDates` falls back to the
stay-option dates. Stored ranges are bounds-checked on the way in (Section
8.1.1); this is the backstop for rows that predate a bounds change or arrive by
any future path that skips validation.

## 14.4 Scope

- Attached to every manage-link email: registration confirmation, guest
  self-service edit, guest resend-link, and admin resend. All four resolve the
  window through `resolveEventDates`, so an admin-set custom range is never
  lost on any path.
- `sendManageLink` takes a single `stayDates: StayDatesSource` object rather
  than loose fields, so a call site cannot forward the stay option while
  forgetting the custom range.
- No calendar update/cancellation emails (future enhancement)
- No external library dependency (format generated directly)

---

End of Architecture Specification.
