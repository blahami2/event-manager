# Event Manager

A single-event registration platform built for managing guest sign-ups, confirmations, and administrative workflows. Designed for events like birthday celebrations where guests register themselves and administrators manage the guest list.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| ORM | Prisma 6 |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Email | Resend |
| Styling | Tailwind CSS |
| Testing | Vitest + Testing Library |
| Hosting | Vercel |

## Prerequisites

- **Node.js** 20+
- **Supabase** account and project ([supabase.com](https://supabase.com))
- **Resend** account and API key ([resend.com](https://resend.com))

## Getting Started

```bash
# Clone the repository
git clone https://github.com/blahami2/event-manager.git
cd event-manager

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Resend credentials

# Set up the database
npx prisma migrate dev
npx prisma db seed

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Database Migrations

The project uses [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) to manage database schema changes. All migration files live in `prisma/migrations/` and are committed to version control.

| Environment | Command | Description |
|-------------|---------|-------------|
| Development | `npx prisma migrate dev` | Apply pending migrations, regenerate Prisma client |
| Development | `npx prisma migrate dev --name describe_change` | Create a new migration after editing `prisma/schema.prisma` |
| Production | `npx prisma migrate deploy` | Apply pending migrations (safe for CI/CD, no client generation) |
| Any | `npx prisma migrate reset` | Drop database, re-apply all migrations, re-seed (destroys all data) |

See [docs/ARCHITECTURE.md, Section 11](docs/ARCHITECTURE.md) for the full migration policy.

## Creating an Admin User

Admin access requires both a **Supabase Auth account** and a matching row in the **AdminUser** database table. This two-step process ensures that only explicitly allowlisted users can access admin features.

### 1. Create a Supabase Auth user

- **Local development:** Open Supabase Studio at [http://127.0.0.1:54323](http://127.0.0.1:54323) (started automatically by `npm run dev`), navigate to **Authentication > Users**, and create a new user with email and password.
- **Production:** Create the user in your Supabase project dashboard under **Authentication > Users**.

### 2. Add the user to the AdminUser table

Copy the new user's Supabase UUID from the Auth dashboard, then insert a row into the `AdminUser` table using one of these methods:

**Option A -- SQL** (via Supabase Studio SQL Editor or `psql`):

```sql
INSERT INTO "AdminUser" (id, "supabaseUserId", email, "createdAt")
VALUES (gen_random_uuid(), 'your-supabase-user-uuid', 'admin@example.com', now());
```

**Option B -- Prisma Studio:**

```bash
npx prisma studio
```

Open the `AdminUser` table and add a new record with the Supabase user UUID and email.

> **Note:** For local development, `npx prisma db seed` automatically creates a test admin user (`admin@example.com`). You still need to create the matching Supabase Auth user in Studio for login to work.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Next.js development server |
| `build` | `npm run build` | Create production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `test` | `npm test` | Run Vitest test suite |

## Project Structure

```
├── prisma/              # Schema, migrations, seed data
├── src/
│   ├── app/             # Next.js App Router (pages, API routes, layouts)
│   ├── components/      # React components
│   ├── config/          # Application configuration constants
│   ├── lib/             # Business logic, services, utilities
│   ├── repositories/    # Data access layer (Prisma)
│   └── types/           # Shared TypeScript types
├── tests/               # Unit and integration tests
└── docs/                # Architecture and specification docs
```

For the full folder structure and architectural conventions, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase pooled connection string |
| `DIRECT_URL` | Yes | Direct Postgres connection (for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `RESEND_API_KEY` | Yes | Resend API key for transactional emails |
| `BASE_URL` | Yes | Application base URL (used in email links) |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` (default: `info`) |
| `RATE_LIMIT_DISABLED` | No | Set `true` to disable rate limiting in dev |

For full details, see [docs/ARCHITECTURE.md, Section 10.3](docs/ARCHITECTURE.md#103-environment-variables).

## Data Retention

The application implements a data retention policy for responsible data management:

- **Cancelled registrations** are purged after **180 days**
- **Expired and revoked tokens** are purged automatically
- Purge operations are idempotent and safe for repeated execution
- An admin API endpoint is available for triggering manual purges

## Planned Features

- **Calendar Invite**: Registration confirmation emails will include an iCalendar (.ics) attachment, universally recognized by Gmail, Outlook, Apple Mail, and other clients
- **Multilingual Support**: Czech, English, and Slovak with easy language switching
- **Automatic Language Detection**: Language auto-detected from browser settings, with manual override via language switcher

See [docs/EXECUTION_BACKLOG.md](docs/EXECUTION_BACKLOG.md) Phase 11 for implementation tickets.

## Documentation

- [Architecture Specification](docs/ARCHITECTURE.md) — Implementation conventions, folder structure, layering rules
- [Architecture Rules](docs/ARCHITECTURE_RULES.md) — Deterministic rules for agentic development
- [Technical Specification](docs/Technical_Specification.md) — Project overview, domain model, feature backlog
- [Execution Backlog](docs/EXECUTION_BACKLOG.md) — Ticket breakdown and dependency graph
- [Verification Rules](docs/VERIFICATION_RULES.md) — Quality gates and verification procedures

## License

Private project. All rights reserved.
