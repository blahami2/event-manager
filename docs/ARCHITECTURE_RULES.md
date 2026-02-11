# Architecture Rules (Non-Negotiables)

> **Every agent MUST read this file before writing any code.**
>
> These rules are absolute constraints. Violating any rule means the work is rejected.
> No ticket, deadline, or convenience justifies breaking these rules.

---

## Agent Pre-Work Checklist

Before starting ANY ticket, the agent MUST:

1. Read `docs/ARCHITECTURE_RULES.md` (this file)
2. Read `Technical_Specification.md` (original spec) and `docs/ARCHITECTURE.md` (implementation details)
3. Read `docs/VERIFICATION_RULES.md` for acceptance criteria
4. Check `docs/EXECUTION_BACKLOG.md` for the specific ticket's requirements
5. Verify the ticket's dependencies are completed

---

## Layer Boundaries

| Rule | Description |
|------|-------------|
| L1 | UI components (`src/app/`, `src/components/`) MUST NOT import from `src/repositories/` |
| L2 | UI components MUST NOT contain business logic (no validation, no token handling, no DB queries) |
| L3 | API route handlers (`route.ts`) MUST delegate to use cases; no inline business logic |
| L4 | Use cases (`src/lib/usecases/`) MUST NOT import from `src/components/` |
| L5 | Repositories (`src/repositories/`) MUST NOT import from `src/lib/usecases/` |
| L6 | Only repositories may import `@prisma/client` |
| L7 | All cross-layer data passes through typed interfaces in `src/types/` |

---

## Security Constraints

| Rule | Description |
|------|-------------|
| S1 | Capability tokens MUST be generated with `crypto.randomBytes(32)` minimum |
| S2 | Tokens MUST be stored as SHA-256 hashes; raw tokens MUST NEVER be stored |
| S3 | Token comparison MUST be hash-to-hash; never plaintext |
| S4 | Raw tokens MUST NEVER appear in logs, error messages, or stack traces |
| S5 | The `/api/resend-link` endpoint MUST return an identical `200` response regardless of whether the email exists |
| S6 | Admin endpoints MUST verify both session validity AND `AdminUser` allowlist membership |
| S7 | Rate limiting MUST be enforced on all public-facing mutation endpoints |
| S8 | Full IP addresses MUST NOT be logged in production; use hashed IPs |
| S9 | Error responses MUST NOT expose internal details (stack traces, query text, file paths) in production |
| S10 | All user input MUST be validated with Zod schemas before processing |

---

## Token Handling Constraints

| Rule | Description |
|------|-------------|
| T1 | Raw token exists only: (a) in memory during generation, (b) in the email body |
| T2 | After generation, the raw token is sent via email and then discarded from server memory |
| T3 | Token lookup: hash the incoming token → query DB by hash → never query by raw value |
| T4 | On every successful manage action, rotate the token: invalidate old, issue new |
| T5 | After 10 failed token lookups per IP per hour, respond with `429` |
| T6 | Admin can revoke any token; registration cancellation auto-revokes associated token |
| T7 | Token URLs: `{BASE_URL}/manage/{raw_token}` – no other format permitted |

---

## Forbidden Patterns

These patterns MUST NOT appear in the codebase:

| ID  | Pattern | Reason |
|-----|---------|--------|
| F1  | `console.log(token)` or any logging of raw tokens | Security: token exposure |
| F2  | `console.log(req.url)` on manage routes | Security: tokens in URLs |
| F3  | `console.log(process.env.*)` for secrets | Security: credential exposure |
| F4  | Direct `prisma.*` calls outside `src/repositories/` | Architecture: layer violation |
| F5  | Business logic inside React components | Architecture: separation of concerns |
| F6  | `any` type in TypeScript (except explicitly justified with comment) | Quality: type safety |
| F7  | Untyped API responses | Quality: contract enforcement |
| F8  | `catch (e) {}` empty catch blocks | Quality: silent error swallowing |
| F9  | Hardcoded secrets or API keys | Security: credential management |
| F10 | Raw SQL queries (use Prisma query builder) | Security: injection prevention |

---

## Error Handling Rules

| Rule | Description |
|------|-------------|
| E1 | All application errors MUST extend `AppError` from `src/lib/errors/app-errors.ts` |
| E2 | API routes MUST catch errors and return structured JSON: `{ "error": { "code", "message" } }` |
| E3 | Use cases MUST throw typed errors; they MUST NOT catch and swallow errors |
| E4 | UI MUST display user-friendly messages; never raw error objects |
| E5 | Validation failures return `400` with field-level error details |
| E6 | Unknown errors return `500` with generic message: `"An unexpected error occurred"` |

---

## Logging Rules

| Rule | Description |
|------|-------------|
| LOG1 | Use structured JSON logging (key-value), not string interpolation |
| LOG2 | Every log entry MUST include: `level`, `message`, `timestamp` |
| LOG3 | NEVER log: raw tokens, full emails, full IPs, DB connection strings, API keys |
| LOG4 | Mask emails in logs: `j***@example.com` |
| LOG5 | All admin actions MUST be logged with `adminUserId`, `action`, `targetId` |
| LOG6 | All rate limit triggers MUST be logged as `warn` |

---

## Data Rules

| Rule | Description |
|------|-------------|
| D1 | Minimize personal data collection: name, email, guest count, optional dietary notes only |
| D2 | No data collected beyond what is specified in the domain model |
| D3 | Data retention policy MUST be implemented and documented |
| D4 | Migrations MUST be incremental; no destructive migrations without explicit ticket |
| D5 | Seed data uses fixed UUIDs for reproducibility |

---

## Testing Rules

| Rule | Description |
|------|-------------|
| TEST1 | Every use case MUST have corresponding unit tests |
| TEST2 | Token generation and hashing MUST have dedicated tests |
| TEST3 | Tests MUST NOT depend on external services (mock Prisma, Resend, Supabase) |
| TEST4 | Test files follow the naming convention: `*.test.ts` |
| TEST5 | Test fixtures use constants from `tests/fixtures/seed-data.ts` |

---

## Git Safety Rules

| Rule | Description |
|------|-------------|
| GIT1 | `.gitignore` MUST exist at the repo root before any code is written |
| GIT2 | NEVER commit `.env`, `.env.local`, or any `.env*.local` file |
| GIT3 | NEVER commit `*.pem`, `*.key`, `credentials.json`, or service account files |
| GIT4 | `.env.example` MUST contain only placeholder values (e.g., `your-key-here`), never real credentials |
| GIT5 | If a secret is accidentally committed, it MUST be considered compromised and rotated immediately – removing it from git history is not sufficient |
| GIT6 | CI MUST run a secret scanning step (gitleaks) on every PR |
| GIT7 | Seed data MUST NOT contain real user data, real emails, or real API keys |

**Files that MUST NEVER be committed (enforced by `.gitignore`):**
- `.env`, `.env.local`, `.env.*.local` – environment secrets
- `*.pem`, `*.key` – private keys
- `credentials.json`, `service-account*.json` – service credentials
- `node_modules/` – dependencies
- `.next/`, `coverage/` – build artifacts

---

## API Contract Rules

| Rule | Description |
|------|-------------|
| API1 | All success responses: `{ "data": {...}, "message": "..." }` |
| API2 | All error responses: `{ "error": { "code": "...", "message": "...", "fields?": {...} } }` |
| API3 | Status codes are deterministic (see `docs/ARCHITECTURE.md` Section 5.2) |
| API4 | The resend-link endpoint ALWAYS returns `200` with identical message body |
| API5 | No endpoint may return different response shapes for the same status code |

---

End of Architecture Rules.
