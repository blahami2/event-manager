/**
 * Test fixture constants for deterministic test data.
 *
 * All test files that need seed IDs or test data objects should import
 * from here, not from prisma/seed.ts directly.
 */

// ── Re-exported seed UUIDs ──

export {
  SEED_ADMIN_USER_ID,
  SEED_ADMIN_SUPABASE_ID,
  SEED_ADMIN_EMAIL,
  SEED_REGISTRATION_1_ID,
  SEED_REGISTRATION_2_ID,
  SEED_REGISTRATION_3_ID,
} from "../../prisma/seed";

// ── Complete test data objects ──

export const SEED_ADMIN = {
  id: "00000000-0000-0000-0000-000000000099",
  supabaseUserId: "supabase-admin-seed-001",
  email: "admin@example.com",
} as const;

/** Confirmed registration without notes. */
export const SEED_REGISTRATION_1 = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alice Johnson",
  email: "alice@example.com",
  stay: "FRI_SUN",
  adultsCount: 2,
  childrenCount: 0,
  notes: null,
  status: "CONFIRMED",
} as const;

/** Confirmed registration with notes. */
export const SEED_REGISTRATION_2 = {
  id: "00000000-0000-0000-0000-000000000002",
  name: "Bob Smith",
  email: "bob@example.com",
  stay: "FRI_SAT",
  adultsCount: 2,
  childrenCount: 2,
  notes: "Vegetarian, nut allergy",
  status: "CONFIRMED",
} as const;

/** Cancelled registration. */
export const SEED_REGISTRATION_3 = {
  id: "00000000-0000-0000-0000-000000000003",
  name: "Carol Davis",
  email: "carol@example.com",
  stay: "SAT_SUN",
  adultsCount: 1,
  childrenCount: 0,
  notes: null,
  status: "CANCELLED",
} as const;
