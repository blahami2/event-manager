import {
  listRegistrations,
  findRegistrationById,
  cancelRegistration,
  updateRegistration,
} from "@/repositories/registration-repository";
import { revokeAllTokensForRegistration, createToken } from "@/repositories/token-repository";
import { generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { NotFoundError, InvalidStatusError } from "@/lib/errors/app-errors";
import { purgeExpiredTokens, purgeCancelledRegistrations } from "@/lib/usecases/data-retention";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import type { RegistrationFilters, RegistrationOutput, PaginatedResult, RegistrationInput } from "@/types/registration";
import { RegistrationStatus, StayOption } from "@/types/registration";

/** Registration statistics summary. */
export interface RegistrationStats {
  readonly total: number;
  readonly confirmed: number;
  readonly cancelled: number;
  readonly totalAdults: number;
  readonly totalChildren: number;
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

  const totalAdults = items.reduce(
    (sum, r) => sum + (r.status === RegistrationStatus.CONFIRMED ? r.adultsCount : 0),
    0,
  );
  const totalChildren = items.reduce(
    (sum, r) => sum + (r.status === RegistrationStatus.CONFIRMED ? r.childrenCount : 0),
    0,
  );

  return {
    total: items.length,
    confirmed,
    cancelled,
    totalAdults,
    totalChildren,
  };
}

/**
 * Admin-cancel a registration. Logs the admin action.
 *
 * @throws {NotFoundError} when registration doesn't exist or is already cancelled
 */
export async function adminCancelRegistration(registrationId: string, adminId: string): Promise<RegistrationOutput> {
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
const CSV_COLUMNS = ["name", "email", "stay", "adultsCount", "childrenCount", "notes", "status", "createdAt"] as const;

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
 * Columns: name, email, stay, adultsCount, childrenCount, notes, status, createdAt.
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

/** Result returned by {@link adminResendEmail}. */
interface AdminResendEmailResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Admin-resend the registration confirmation email with a new manage link.
 *
 * Workflow:
 * 1. Find registration by ID
 * 2. Validate it is CONFIRMED (not CANCELLED)
 * 3. Revoke all existing tokens for the registration
 * 4. Generate a new capability token
 * 5. Store the new token hash
 * 6. Construct manage URL and send email
 * 7. Log admin action with masked email
 *
 * @throws {NotFoundError} when registration does not exist
 * @throws {InvalidStatusError} when registration is not CONFIRMED
 */
export async function adminResendEmail(
  registrationId: string,
  adminId: string,
): Promise<AdminResendEmailResult> {
  const registration = await findRegistrationById(registrationId);

  if (!registration) {
    throw new NotFoundError("Registration");
  }

  if (registration.status !== RegistrationStatus.CONFIRMED) {
    throw new InvalidStatusError("Cannot resend email for a cancelled registration");
  }

  // Revoke all existing tokens
  await revokeAllTokensForRegistration(registrationId);

  // Generate new token
  const { raw, hash } = generateToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  await createToken(registrationId, hash, expiresAt);

  // Build manage URL and send email
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const manageUrl = `${baseUrl}/manage/${raw}`;

  const emailResult = await sendManageLink({
    to: registration.email,
    manageUrl,
    guestName: registration.name,
    registrationId: registration.id,
    emailType: "manage-link",
    stay: registration.stay as StayOption,
  });

  // Log admin action with masked email (LOG3, LOG4, LOG5)
  logger.info("Admin resent registration email", {
    adminUserId: adminId,
    action: "resend_email",
    targetId: registrationId,
    email: maskEmail(registration.email),
  });

  if (!emailResult.success) {
    return { success: false, error: emailResult.error };
  }

  return { success: true };
}

/** Data retention purge results returned to admin callers. */
export interface DataRetentionResult {
  readonly expiredTokensPurged: number;
  readonly cancelledRegistrationsPurged: number;
}

/**
 * Admin-trigger data retention purge.
 * Removes expired+revoked tokens and old cancelled registrations.
 * Logs the admin action.
 */
export async function adminPurgeRetentionData(adminId: string, olderThan?: Date): Promise<DataRetentionResult> {
  const [tokenResult, regResult] = await Promise.all([purgeExpiredTokens(), purgeCancelledRegistrations(olderThan)]);

  logger.info("Admin triggered data retention purge", {
    adminUserId: adminId,
    action: "purge_retention_data",
    expiredTokensPurged: tokenResult.purgedCount,
    cancelledRegistrationsPurged: regResult.purgedCount,
  });

  return {
    expiredTokensPurged: tokenResult.purgedCount,
    cancelledRegistrationsPurged: regResult.purgedCount,
  };
}
