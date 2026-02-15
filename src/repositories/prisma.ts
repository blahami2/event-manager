import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton for Next.js / Vercel serverless.
 *
 * The instance is stored on `globalThis` so it survives both:
 *   - Next.js hot-reload in development (avoids pool exhaustion)
 *   - Warm serverless invocations in production on Vercel
 *
 * Without this, each warm invocation could create a *new* PrismaClient
 * while the previous one still holds connections, leading to the
 * "prepared statement already exists" PostgreSQL error (42P05) when
 * using a connection pooler like PgBouncer / Supabase Pooler.
 *
 * All repository files MUST import `prisma` from this module
 * (not from `@prisma/client` directly).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

// Cache in ALL environments – critical for serverless production
globalForPrisma.prisma = prisma;
