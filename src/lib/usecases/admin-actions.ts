import {
  listRegistrations,
  findRegistrationById,
  cancelRegistration,
  updateRegistration,
} from "@/repositories/registration-repository";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors/app-errors";
import type {
  RegistrationFilters,
  RegistrationOutput,
  PaginatedResult,
  RegistrationInput,
} from "@/types/registration";
import { RegistrationStatus } from "@/types/registration";

/** Registration statistics summary. */
export interface RegistrationStats {
  readonly total: number;
  readonly confirmed: number;
  readonly cancelled: number;
}

/**
 * List registrations with optional filtering and pagination.
 * Delegates directly to the registration repository.
 */
export async function listRegistrationsPaginated(
  filters: RegistrationFilters,
): Promise<PaginatedResult<RegistrationOutput>> {
  return listRegistrations(filters);
}

/**
 * Get aggregated registration statistics.
 * Returns total, confirmed, and cancelled counts.
 */
export async function getRegistrationStats(): Promise<RegistrationStats> {
  const result = await listRegistrations({ page: 1, pageSize: 1000 });
  const items = result.items;

  const confirmed = items.filter((r) => r.status === RegistrationStatus.CONFIRMED).length;
  const cancelled = items.filter((r) => r.status === RegistrationStatus.CANCELLED).length;

  return {
    total: items.length,
    confirmed,
    cancelled,
  };
}

/**
 * Admin-cancel a registration. Logs the admin action.
 *
 * @throws {NotFoundError} when registration doesn't exist or is already cancelled
 */
export async function adminCancelRegistration(
  registrationId: string,
  adminId: string,
): Promise<RegistrationOutput> {
  const existing = await findRegistrationById(registrationId);

  if (!existing || existing.status === RegistrationStatus.CANCELLED) {
    throw new NotFoundError("Registration");
  }

  const result = await cancelRegistration(registrationId);

  logger.info("Admin cancelled registration", {
    adminUserId: adminId,
    action: "cancel_registration",
    targetId: registrationId,
  });

  return result;
}

/**
 * Admin-edit a registration. Logs the admin action.
 *
 * @throws {NotFoundError} when registration doesn't exist
 */
export async function adminEditRegistration(
  registrationId: string,
  data: RegistrationInput,
  adminId: string,
): Promise<RegistrationOutput> {
  const existing = await findRegistrationById(registrationId);

  if (!existing) {
    throw new NotFoundError("Registration");
  }

  const result = await updateRegistration(registrationId, data);

  logger.info("Admin edited registration", {
    adminUserId: adminId,
    action: "edit_registration",
    targetId: registrationId,
  });

  return result;
}

/** CSV column headers. */
const CSV_COLUMNS = ["name", "email", "guestCount", "dietaryNotes", "status", "createdAt"] as const;

/**
 * Escape a CSV field: quote it if it contains commas, quotes, or newlines.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export all registrations as a CSV string.
 * Columns: name, email, guestCount, dietaryNotes, status, createdAt.
 */
export async function exportRegistrationsCsv(): Promise<string> {
  const result = await listRegistrations({ page: 1, pageSize: 10000 });

  const header = CSV_COLUMNS.join(",");
  const rows = result.items.map((reg) =>
    CSV_COLUMNS.map((col) => {
      const value = reg[col];
      if (value === null || value === undefined) {
        return "";
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return escapeCsvField(String(value));
    }).join(","),
  );

  return [header, ...rows].join("\n");
}
