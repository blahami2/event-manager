import { randomBytes, createHash } from "crypto";

/**
 * Capability token generation and hashing.
 *
 * Tokens are cryptographically random, URL-safe, base64url-encoded strings.
 * Only the SHA-256 hash is stored in the database; the raw token is sent
 * once via email and never persisted on the server.
 *
 * See docs/ARCHITECTURE.md Section 7 for token security rules.
 */

interface TokenPair {
  /** Base64url-encoded raw token (sent to user, never stored). */
  readonly raw: string;
  /** SHA-256 hex digest of the raw token (stored in DB). */
  readonly hash: string;
}

/**
 * Generate a new capability token pair.
 *
 * @returns `{ raw, hash }` where `raw` is base64url (32+ bytes) and
 *          `hash` is the SHA-256 hex digest of `raw`.
 */
export function generateToken(): TokenPair {
  const bytes = randomBytes(32);
  const raw = bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { raw, hash: hashToken(raw) };
}

/**
 * Hash a raw token string with SHA-256.
 *
 * Used to look up tokens: hash the incoming raw value, then query by hash.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
