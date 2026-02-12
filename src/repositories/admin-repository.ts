import { prisma } from "./prisma";
import type { AdminData } from "@/types/admin";

/**
 * Admin user data-access layer.
 *
 * Every function maps directly to a Prisma operation and converts the
 * result to a typed `AdminData`.  No business logic lives here.
 *
 * Admin users are seeded or managed via the database directly — there
 * are no CRUD operations exposed here.
 */

// ── Helpers ──

function toOutput(row: {
  id: string;
  supabaseUserId: string;
  email: string;
  createdAt: Date;
}): AdminData {
  return {
    id: row.id,
    supabaseUserId: row.supabaseUserId,
    email: row.email,
    createdAt: row.createdAt,
  };
}

// ── Public API ──

/** Find a single admin user by their Supabase user ID. */
export async function findAdminBySupabaseId(
  supabaseUserId: string,
): Promise<AdminData | null> {
  const row = await prisma.adminUser.findUnique({
    where: { supabaseUserId },
  });
  return row ? toOutput(row) : null;
}

/** Check whether a Supabase user ID belongs to an admin. */
export async function isAdmin(supabaseUserId: string): Promise<boolean> {
  const row = await prisma.adminUser.findUnique({
    where: { supabaseUserId },
  });
  return row !== null;
}

/** Return all admin users. */
export async function listAdmins(): Promise<ReadonlyArray<AdminData>> {
  const rows = await prisma.adminUser.findMany();
  return rows.map(toOutput);
}
