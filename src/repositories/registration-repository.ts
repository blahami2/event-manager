import { prisma } from "./prisma";
import type {
  RegistrationInput,
  RegistrationOutput,
  RegistrationFilters,
  PaginatedResult,
} from "@/types/registration";
import { RegistrationStatus } from "@/types/registration";

/**
 * Registration data-access layer.
 *
 * Every function maps directly to a Prisma operation and converts the
 * result to a typed `RegistrationOutput`.  No business logic lives here.
 */

// ── Helpers ──

function toOutput(row: {
  id: string;
  name: string;
  email: string;
  guestCount: number;
  dietaryNotes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): RegistrationOutput {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    guestCount: row.guestCount,
    dietaryNotes: row.dietaryNotes,
    status: row.status as RegistrationStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

// ── Public API ──

/** Create a new registration (defaults to CONFIRMED). */
export async function createRegistration(
  data: RegistrationInput,
): Promise<RegistrationOutput> {
  const row = await prisma.registration.create({
    data: {
      name: data.name,
      email: data.email,
      guestCount: data.guestCount,
      dietaryNotes: data.dietaryNotes,
      status: RegistrationStatus.CONFIRMED,
    },
  });
  return toOutput(row);
}

/** Find a single registration by its primary key. */
export async function findRegistrationById(
  id: string,
): Promise<RegistrationOutput | null> {
  const row = await prisma.registration.findUnique({ where: { id } });
  return row ? toOutput(row) : null;
}

/** Find the first registration matching an email address. */
export async function findRegistrationByEmail(
  email: string,
): Promise<RegistrationOutput | null> {
  const row = await prisma.registration.findFirst({ where: { email } });
  return row ? toOutput(row) : null;
}

/** Update an existing registration. */
export async function updateRegistration(
  id: string,
  data: RegistrationInput,
): Promise<RegistrationOutput> {
  const row = await prisma.registration.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      guestCount: data.guestCount,
      dietaryNotes: data.dietaryNotes,
    },
  });
  return toOutput(row);
}

/** Soft-cancel a registration (sets status to CANCELLED, does not delete). */
export async function cancelRegistration(
  id: string,
): Promise<RegistrationOutput> {
  const row = await prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.CANCELLED },
  });
  return toOutput(row);
}

/** List registrations with optional filtering and pagination. */
export async function listRegistrations(
  filters: RegistrationFilters,
): Promise<PaginatedResult<RegistrationOutput>> {
  const page = filters.page ?? DEFAULT_PAGE;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  // Build the `where` clause dynamically
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.registration.count({ where }),
  ]);

  return {
    items: rows.map(toOutput),
    total,
    page,
    pageSize,
  };
}

/** Return the total number of registrations. */
export async function countRegistrations(): Promise<number> {
  return prisma.registration.count();
}
