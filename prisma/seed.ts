/**
 * Prisma seed script skeleton.
 *
 * Contains fixed UUID constants for reproducible seed data.
 * Actual record creation will be added in T-043.
 *
 * Run: npx prisma db seed
 */

// ── Fixed UUIDs for seed data ──

/** Seed admin user. */
export const SEED_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000099";
export const SEED_ADMIN_SUPABASE_ID = "supabase-admin-seed-001";
export const SEED_ADMIN_EMAIL = "admin@example.com";

/** Seed registration – confirmed, no dietary notes. */
export const SEED_REGISTRATION_1_ID = "00000000-0000-0000-0000-000000000001";

/** Seed registration – confirmed, with dietary notes. */
export const SEED_REGISTRATION_2_ID = "00000000-0000-0000-0000-000000000002";

/** Seed registration – cancelled. */
export const SEED_REGISTRATION_3_ID = "00000000-0000-0000-0000-000000000003";

// ── Main seed function (populated in T-043) ──

async function main(): Promise<void> {
  // T-043 will add upsert calls here.
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
