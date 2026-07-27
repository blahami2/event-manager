/**
 * Shared token-rotation compensation.
 *
 * Every path that mails a guest a new manage link follows the same order:
 * create the replacement token, send the email, and only then revoke what the
 * replacement supersedes. That order is what stops an email failure from
 * costing a guest their only working link — but it means a failed send leaves
 * behind a token that was never delivered, which has to be cleaned up.
 *
 * @module token-rotation
 */

import { revokeToken } from "@/repositories/token-repository";
import { logger } from "@/lib/logger";

/**
 * Revoke a token that was created for an email that never went out.
 *
 * Never throws. This runs inside a failure path — frequently the *same* outage
 * that caused the send to fail — and its own failure must not replace the error
 * the caller is about to report, which would hide the real cause and leave the
 * caller with a misleading one. A revoke that does not happen is not dangerous
 * on its own: the raw token was never delivered anywhere, so the row is
 * unreachable and expires on its own schedule. Losing the reason the email
 * failed is the worse outcome, so it is preserved and the cleanup failure is
 * logged separately.
 *
 * @param tokenId       - The undelivered token's ID.
 * @param registrationId - Registration the token belongs to, for log context.
 */
export async function discardUndeliveredToken(
  tokenId: string,
  registrationId: string,
): Promise<void> {
  try {
    await revokeToken(tokenId);
  } catch (error: unknown) {
    logger.error("Failed to revoke undelivered token", {
      registrationId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
