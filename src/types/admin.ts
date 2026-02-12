/**
 * Shared admin types used across layers.
 *
 * UI → Use cases → Repositories all communicate through these interfaces.
 * See docs/ARCHITECTURE.md Section 8.3 for the domain model.
 */

/** Output data returned when reading an admin user. */
export interface AdminData {
  readonly id: string;
  readonly supabaseUserId: string;
  readonly email: string;
  readonly createdAt: Date;
}
