/**
 * Health check utilities.
 *
 * Provides database connectivity check without exposing prisma client
 * to API routes (maintains architecture boundary L1).
 */

import { prisma } from "@/repositories/prisma";

/**
 * Checks if the database is reachable.
 *
 * @returns Promise that resolves if DB is healthy, rejects if unreachable
 */
export async function checkDatabaseHealth(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
