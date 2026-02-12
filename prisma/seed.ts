/**
 * Prisma seed script – populates the database with deterministic test data.
 *
 * All records use fixed UUIDs so that tests and local development are
 * reproducible. The script is idempotent (uses upsert).
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

// ── Main seed function ──

async function main(): Promise<void> {
  // Admin user
  await prisma.adminUser.upsert({
    where: { id: SEED_ADMIN_USER_ID },
    update: {},
    create: {
      id: SEED_ADMIN_USER_ID,
      supabaseUserId: SEED_ADMIN_SUPABASE_ID,
      email: SEED_ADMIN_EMAIL,
    },
  });

  // Registration 1: confirmed, no dietary notes
  await prisma.registration.upsert({
    where: { id: SEED_REGISTRATION_1_ID },
    update: {},
    create: {
      id: SEED_REGISTRATION_1_ID,
      name: "Alice Johnson",
      email: "alice@example.com",
      guestCount: 2,
      dietaryNotes: null,
      status: "CONFIRMED",
    },
  });

  // Registration 2: confirmed, with dietary notes
  await prisma.registration.upsert({
    where: { id: SEED_REGISTRATION_2_ID },
    update: {},
    create: {
      id: SEED_REGISTRATION_2_ID,
      name: "Bob Smith",
      email: "bob@example.com",
      guestCount: 4,
      dietaryNotes: "Vegetarian, nut allergy",
      status: "CONFIRMED",
    },
  });

  // Registration 3: cancelled
  await prisma.registration.upsert({
    where: { id: SEED_REGISTRATION_3_ID },
    update: {},
    create: {
      id: SEED_REGISTRATION_3_ID,
      name: "Carol Davis",
      email: "carol@example.com",
      guestCount: 1,
      dietaryNotes: null,
      status: "CANCELLED",
    },
  });
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
