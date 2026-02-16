/**
 * Script to add an admin user to the database.
 * 
 * Usage:
 *   SUPABASE_USER_ID=xxx EMAIL=admin@example.com npm run add-admin
 * 
 * This manually inserts a record into the AdminUser table linking
 * a Supabase Auth user to admin privileges.
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const supabaseUserId = process.env.SUPABASE_USER_ID;
  const email = process.env.EMAIL;

  if (!supabaseUserId || !email) {
    console.error("Error: SUPABASE_USER_ID and EMAIL environment variables are required");
    console.error("\nUsage:");
    console.error('  SUPABASE_USER_ID="abc123..." EMAIL="admin@example.com" npm run add-admin');
    process.exit(1);
  }

  // Check if user already exists
  const existing = await prisma.adminUser.findUnique({
    where: { supabaseUserId },
  });

  if (existing) {
    console.log(`Admin user already exists:`);
    console.log(`  ID: ${existing.id}`);
    console.log(`  Email: ${existing.email}`);
    console.log(`  Supabase ID: ${existing.supabaseUserId}`);
    return;
  }

  // Create new admin user
  const adminUser = await prisma.adminUser.create({
    data: {
      id: randomUUID(),
      supabaseUserId,
      email,
    },
  });

  console.log(`✅ Admin user created successfully:`);
  console.log(`  ID: ${adminUser.id}`);
  console.log(`  Email: ${adminUser.email}`);
  console.log(`  Supabase ID: ${adminUser.supabaseUserId}`);
}

main()
  .catch((e: unknown) => {
    console.error("Error adding admin user:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
