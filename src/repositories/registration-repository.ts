import { prisma } from "./prisma";
import type {
  RegistrationInput,
  RegistrationOutput,
  RegistrationFilters,
  PaginatedResult,
} from "@/types/registration";
import { RegistrationStatus } from "@/types/registration";
import type { StayOption, AccommodationOption } from "@/types/registration";
import { formatIsoDate, parseIsoDate } from "@/lib/date/iso-date";

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
  stay: string;
  accommodation: string;
  adultsCount: number;
  childrenCount: number;
  notes: string | null;
  status: string;
  stayStartDate?: Date | null;
  stayEndDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RegistrationOutput {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    stay: row.stay as StayOption,
    accommodation: row.accommodation as AccommodationOption,
    adultsCount: row.adultsCount,
    childrenCount: row.childrenCount,
    notes: row.notes,
    status: row.status as RegistrationStatus,
    stayStartDate: row.stayStartDate ? formatIsoDate(row.stayStartDate) : null,
    stayEndDate: row.stayEndDate ? formatIsoDate(row.stayEndDate) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Translate the optional custom stay range into a Prisma data fragment.
 *
 * Omitting both fields yields an empty fragment, which Prisma interprets as
 * "do not touch these columns" — that is what keeps a guest's manage-form edit
 * from clearing an administrator's custom range. An explicit `null` clears the
 * range; a date pair pins it. Values are expected to be pre-validated
 * (`stayDateRangeSchema`); an unparseable date degrades to `null` rather than
 * writing an Invalid Date to the column.
 */
function toStayDateRangeData(data: RegistrationInput): {
  stayStartDate?: Date | null;
  stayEndDate?: Date | null;
} {
  if (data.stayStartDate === undefined && data.stayEndDate === undefined) {
    return {};
  }

  return {
    stayStartDate: data.stayStartDate ? parseIsoDate(data.stayStartDate) : null,
    stayEndDate: data.stayEndDate ? parseIsoDate(data.stayEndDate) : null,
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
      stay: data.stay,
      accommodation: data.accommodation,
      adultsCount: data.adultsCount,
      childrenCount: data.childrenCount,
      notes: data.notes,
      status: RegistrationStatus.CONFIRMED,
      ...toStayDateRangeData(data),
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
      stay: data.stay,
      accommodation: data.accommodation,
      adultsCount: data.adultsCount,
      childrenCount: data.childrenCount,
      notes: data.notes,
      ...toStayDateRangeData(data),
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

/** Reactivate a cancelled registration (sets status back to CONFIRMED). */
export async function reconfirmRegistration(
  id: string,
): Promise<RegistrationOutput> {
  const row = await prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.CONFIRMED },
  });
  return toOutput(row);
}

/**
 * Permanently delete a single registration, and with it every row that depends
 * on it.
 *
 * Dependent data is removed by the database, not by this function:
 * `RegistrationToken.registrationId` carries `ON DELETE CASCADE` (declared in
 * `schema.prisma` and created by the `20260211_init` migration), so a guest's
 * manage links die with the registration in the same statement. Deleting them
 * here as well would duplicate a guarantee the schema already makes, and would
 * open a window where tokens are gone but the registration is not.
 *
 * Uses `deleteMany` rather than `delete` deliberately: `delete` throws an
 * opaque Prisma error when the row is absent, whereas a count lets the caller
 * answer "did it exist?" without pattern-matching on driver error codes.
 *
 * @returns `true` when a row was removed, `false` when the id matched nothing.
 */
export async function deleteRegistrationById(id: string): Promise<boolean> {
  const result = await prisma.registration.deleteMany({ where: { id } });
  return result.count > 0;
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

/** Delete cancelled registrations older than the given date. Returns count of deleted rows. */
export async function deleteCancelledRegistrationsBefore(
  olderThan: Date,
): Promise<number> {
  const result = await prisma.registration.deleteMany({
    where: {
      status: RegistrationStatus.CANCELLED,
      updatedAt: { lt: olderThan },
    },
  });
  return result.count;
}

/** Return the total number of registrations. */
export async function countRegistrations(): Promise<number> {
  return prisma.registration.count();
}
