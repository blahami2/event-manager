/**
 * Rate-limiting and token-expiry constants.
 *
 * Referenced by: rate limiter (T-010), token utility (T-009),
 * API route handlers (T-025 – T-027).
 *
 * Values are sourced from docs/ARCHITECTURE.md Section 9.
 */

/** Max registration attempts per IP per hour. */
export const MAX_REGISTRATION_ATTEMPTS_PER_HOUR = 5;

/** Max token lookups (manage page) per IP per hour. */
export const MAX_TOKEN_LOOKUPS_PER_HOUR = 10;

/** Max resend-link requests per IP per hour. */
export const MAX_RESEND_ATTEMPTS_PER_HOUR = 3;

/** Max admin login attempts per IP per 15 minutes. */
export const MAX_ADMIN_LOGIN_ATTEMPTS_PER_15MIN = 5;

/** Number of days before a capability token expires. */
export const TOKEN_EXPIRY_DAYS = 90;
