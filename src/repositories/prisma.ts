import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton for Next.js.
 *
 * In development, Next.js hot-reloads modules which would create a new
 * PrismaClient on every reload, exhausting the database connection pool.
 * Storing the instance on `globalThis` prevents this.
 *
 * In production, a single instance is created and reused.
 *
 * All repository files MUST import `prisma` from this module
 * (not from `@prisma/client` directly).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
