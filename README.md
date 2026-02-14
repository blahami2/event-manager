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

## Documentation

- [Architecture Specification](docs/ARCHITECTURE.md) — Implementation conventions, folder structure, layering rules
- [Architecture Rules](docs/ARCHITECTURE_RULES.md) — Deterministic rules for agentic development
- [Technical Specification](docs/Technical_Specification.md) — Project overview, domain model, feature backlog
- [Execution Backlog](docs/EXECUTION_BACKLOG.md) — Ticket breakdown and dependency graph
- [Verification Rules](docs/VERIFICATION_RULES.md) — Quality gates and verification procedures

## License

Private project. All rights reserved.
