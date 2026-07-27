import {
  listRegistrations,
  findRegistrationById,
  cancelRegistration,
  reconfirmRegistration,
  updateRegistration,
  deleteRegistrationById,
} from "@/repositories/registration-repository";
import {
  revokeAllTokensForRegistrationExcept,
  createToken,
} from "@/repositories/token-repository";
import { discardUndeliveredToken } from "@/lib/usecases/token-rotation";
import { generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { NotFoundError, InvalidStatusError, ValidationError } from "@/lib/errors/app-errors";
import { stayDateRangeSchema } from "@/lib/validation/registration";
import { purgeExpiredTokens, purgeCancelledRegistrations } from "@/lib/usecases/data-retention";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import type { RegistrationFilters, RegistrationOutput, PaginatedResult, RegistrationInput } from "@/types/registration";
import { RegistrationStatus } from "@/types/registration";

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
 * Admin-reconfirm a previously cancelled registration. Logs the action.
 *
 * @throws {NotFoundError} when the registration doesn't exist or is not
 *   currently cancelled (so a no-op reconfirm on a confirmed record is
 *   treated as a bad request instead of silently succeeding).
 */
export async function adminReconfirmRegistration(
  registrationId: string,
  adminId: string,
): Promise<RegistrationOutput> {
  const existing = await findRegistrationById(registrationId);

  if (!existing || existing.status !== RegistrationStatus.CANCELLED) {
    throw new NotFoundError("Registration");
  }

  const result = await reconfirmRegistration(registrationId);

  logger.info("Admin reconfirmed registration", {
    adminUserId: adminId,
    action: "reconfirm_registration",
    targetId: registrationId,
  });

  return result;
}

/** Identifier of the registration removed by {@link adminDeleteRegistration}. */
export interface AdminDeleteRegistrationResult {
  readonly id: string;
}

/**
 * Permanently delete a registration and its dependent data. Logs the action.
 *
 * This is the irreversible sibling of {@link adminCancelRegistration}, which
 * only flips status and leaves the record on the guest list. Delete is for
 * records that should not exist at all — a duplicate, a test entry, or an
 * erasure request — so the row goes, and the database cascade takes its
 * capability tokens with it (see `deleteRegistrationById`). Any manage link the
 * guest still holds therefore stops working, which is the intended effect: a
 * live link to a deleted registration would be a dangling capability.
 *
 * Unlike cancel and reconfirm, no starting status is required. Purging an
 * already-cancelled registration is the most common reason to reach for this,
 * and refusing it would make the action useless where it is needed most.
 *
 * The returned id is all that survives, so the audit entry carries the masked
 * email as well (LOG4): once the row is gone, the log is the only record that
 * the registration ever existed.
 *
 * @throws {NotFoundError} when the registration does not exist, or when a
 *   concurrent delete removed it between the lookup and the delete — the loser
 *   of that race must not be told it deleted something.
 */
export async function adminDeleteRegistration(
  registrationId: string,
  adminId: string,
): Promise<AdminDeleteRegistrationResult> {
  const existing = await findRegistrationById(registrationId);

  if (!existing) {
    throw new NotFoundError("Registration");
  }

  const deleted = await deleteRegistrationById(registrationId);

  if (!deleted) {
    throw new NotFoundError("Registration");
  }

  logger.info("Admin deleted registration", {
    adminUserId: adminId,
    action: "delete_registration",
    targetId: registrationId,
    email: maskEmail(existing.email),
    status: existing.status,
  });

  return { id: registrationId };
}

/**
 * Validate the optional custom stay date range carried by an admin edit.
 *
 * Returns a fragment to merge into the repository payload: empty when the
 * caller sent no range fields at all (so the stored range is left alone), or
 * the normalized `{ stayStartDate, stayEndDate }` pair otherwise.
 *
 * @throws {ValidationError} when the range is incomplete, inverted, or not a
 *   pair of real calendar dates
 */
function validateStayDateRange(data: RegistrationInput): {
  stayStartDate?: string | null;
  stayEndDate?: string | null;
} {
  if (data.stayStartDate === undefined && data.stayEndDate === undefined) {
    return {};
  }

  const parsed = stayDateRangeSchema.safeParse({
    stayStartDate: data.stayStartDate,
    stayEndDate: data.stayEndDate,
  });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".")] = issue.message;
    }
    throw new ValidationError("Validation failed", fields);
  }

  return parsed.data;
}

/**
 * Admin-edit a registration. Logs the admin action.
 *
 * Administrators may pin an arbitrary custom stay date range here (issue #101);
 * it overrides the calendar dates implied by the `stay` option without
 * replacing the option itself.
 *
 * @throws {NotFoundError} when registration doesn't exist
 * @throws {ValidationError} when the custom stay date range is invalid
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

  const result = await updateRegistration(registrationId, {
    ...data,
    ...validateStayDateRange(data),
  });

  logger.info("Admin edited registration", {
    adminUserId: adminId,
    action: "edit_registration",
    targetId: registrationId,
  });

  return result;
}

/**
 * CSV column headers.
 *
 * `stayStartDate` / `stayEndDate` are appended rather than grouped next to
 * `stay`: inserting a column mid-row silently shifts every later field for any
 * consumer that reads by position (spreadsheet formulas, scripts). Appending is
 * backwards compatible. Both are empty for registrations that use their stay
 * option's predefined dates.
 */
const CSV_COLUMNS = ["name", "email", "stay", "accommodation", "adultsCount", "childrenCount", "notes", "status", "createdAt", "stayStartDate", "stayEndDate"] as const;

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
 * 3. Generate a new capability token and store its hash
 * 4. Construct manage URL and send email
 * 5. Only on a delivered email, revoke every *other* token (T4 rotation)
 * 6. Log admin action with masked email
 *
 * The ordering is deliberate. Revoking first — as this originally did — meant
 * an email provider outage destroyed the guest's working manage link and put
 * nothing in its place: the action that was supposed to deliver access removed
 * it instead, irreversibly. Rotation is now the consequence of a *delivered*
 * email, and a failed send revokes only the token that was never delivered.
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

  // Generate and store the replacement token. Existing tokens stay valid until
  // the email carrying this one has actually been accepted.
  const { raw, hash } = generateToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const newToken = await createToken(registrationId, hash, expiresAt);

  // Build manage URL and send email
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const manageUrl = `${baseUrl}/manage/${raw}`;

  let emailResult: { readonly success: boolean; readonly error?: string };
  try {
    emailResult = await sendManageLink({
      to: registration.email,
      manageUrl,
      guestName: registration.name,
      registrationId: registration.id,
      emailType: "manage-link",
      stayDates: registration,
    });
  } catch (error: unknown) {
    // An unexpected failure on the send path must not leave an undelivered
    // token live, and must not touch the tokens the guest may still hold.
    await discardUndeliveredToken(newToken.id, registrationId);
    throw error;
  }

  if (!emailResult.success) {
    await discardUndeliveredToken(newToken.id, registrationId);

    logger.error("Admin resend email failed", {
      adminUserId: adminId,
      action: "resend_email",
      targetId: registrationId,
      email: maskEmail(registration.email),
      error: emailResult.error,
    });

    return { success: false, ...(emailResult.error !== undefined ? { error: emailResult.error } : {}) };
  }

  // The new link is in the guest's inbox, so every earlier one is superseded (T4).
  await revokeAllTokensForRegistrationExcept(registrationId, newToken.id);

  // Log admin action with masked email (LOG3, LOG4, LOG5)
  logger.info("Admin resent registration email", {
    adminUserId: adminId,
    action: "resend_email",
    targetId: registrationId,
    email: maskEmail(registration.email),
  });

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
