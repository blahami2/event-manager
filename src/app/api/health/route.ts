import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/health-check";
import { logger } from "@/lib/logger";

/**
 * Health check endpoint.
 *
 * Returns 200 with status "ok" if the application and database are healthy.
 * Returns 503 with status "error" if the database is unreachable.
 *
 * No authentication required.
 */
export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();

  try {
    await checkDatabaseHealth();

    return NextResponse.json(
      { status: "ok", timestamp, version: "1.0.0" },
      { status: 200 },
    );
  } catch (error: unknown) {
    logger.error("Health check failed: database unreachable", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { status: "error", timestamp },
      { status: 503 },
    );
  }
}
