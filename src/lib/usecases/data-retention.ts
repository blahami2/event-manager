import { deleteExpiredRevokedTokens } from "@/repositories/token-repository";
import { deleteCancelledRegistrationsBefore } from "@/repositories/registration-repository";
import { logger } from "@/lib/logger";

/** Default retention period for cancelled registrations: 180 days in milliseconds. */
const DEFAULT_RETENTION_DAYS = 180;

/** Result of a data retention purge operation. */
export interface PurgeResult {
  readonly purgedCount: number;
}

/**
 * Purge tokens that are both expired and revoked.
 *
 * Idempotent — running multiple times produces the same end state.
 * Safe for production: only deletes tokens matching both conditions.
 */
export async function purgeExpiredTokens(): Promise<PurgeResult> {
  const purgedCount = await deleteExpiredRevokedTokens();

  logger.info("Purged expired revoked tokens", {
    action: "purge_expired_tokens",
    purgedCount,
  });

  return { purgedCount };
}

/**
 * Purge cancelled registrations older than the specified date.
 *
 * @param olderThan - Delete cancelled registrations updated before this date.
 *                    Defaults to 180 days ago.
 *
 * Idempotent — running multiple times produces the same end state.
 * Safe for production: only deletes CANCELLED registrations older than the cutoff.
 */
export async function purgeCancelledRegistrations(
  olderThan?: Date,
): Promise<PurgeResult> {
  const cutoff =
    olderThan ?? new Date(Date.now() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const purgedCount = await deleteCancelledRegistrationsBefore(cutoff);

  logger.info("Purged cancelled registrations", {
    action: "purge_cancelled_registrations",
    purgedCount,
    olderThan: cutoff.toISOString(),
  });

  return { purgedCount };
}
