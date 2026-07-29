import { NextRequest } from "next/server";
import { z } from "zod";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import {
  listRegistrationsPaginated,
  adminEditRegistration,
  adminCancelRegistration,
  adminResendEmail,
} from "@/lib/usecases/admin-actions";
import { successResponse, handleApiError } from "@/lib/api-response";
import { readJsonBody } from "@/lib/api-request";
import { ValidationError } from "@/lib/errors/app-errors";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { adminEditRegistrationSchema } from "@/lib/validation/registration";
import type { RegistrationFilters, RegistrationInput } from "@/types/registration";
import { RegistrationStatus } from "@/types/registration";

/** Zod schema for the POST (resend email) request body. */
const resendEmailSchema = z.object({
  registrationId: z.string().uuid("registrationId must be a valid UUID"),
});

/**
 * GET /api/admin/registrations
 *
 * Returns a paginated list of registrations with optional filters.
 * Query params: status, search, page, pageSize.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await verifyAdmin(request);

    const params = request.nextUrl.searchParams;
    const filters: RegistrationFilters = {
      ...(params.get("status") ? { status: params.get("status") as RegistrationStatus } : {}),
      ...(params.get("search") ? { search: params.get("search") as string } : {}),
      page: params.get("page") ? Number(params.get("page")) : 1,
      pageSize: params.get("pageSize") ? Number(params.get("pageSize")) : 20,
    };

    const result = await listRegistrationsPaginated(filters);

    return successResponse(result, "Registrations retrieved");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/registrations
 *
 * Admin edit a registration.
 * Body: { registrationId, name, email, stay, accommodation, adultsCount,
 *         childrenCount, notes?, stayStartDate?, stayEndDate? }
 *
 * The entire body is validated against `adminEditRegistrationSchema` before
 * anything is forwarded, so an invalid payload becomes a structured `400`
 * naming the offending fields (E5, API2) instead of reaching the repository as
 * a database error. The schema also strips unknown keys, so server-owned fields
 * cannot be smuggled into an update.
 *
 * `stayStartDate` / `stayEndDate` are optional `YYYY-MM-DD` calendar dates that
 * pin an arbitrary stay range; send `null` for both to clear it, omit both to
 * leave the stored range untouched. The use case validates the range again —
 * it is reachable from other callers, and the invariant it protects (never
 * write a half-defined range) is worth enforcing at its own boundary too.
 */
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    const parsed = adminEditRegistrationSchema.safeParse(await readJsonBody(request));

    if (!parsed.success) {
      throw new ValidationError("Validation failed", toFieldErrors(parsed.error));
    }

    const { registrationId, notes, stayStartDate, stayEndDate, ...fields } = parsed.data;

    const data: RegistrationInput = {
      ...fields,
      ...(notes !== undefined ? { notes } : {}),
      // Absent keys must stay absent: omitting them means "leave the stored
      // range alone", which is not the same as clearing it with null.
      ...(stayStartDate !== undefined ? { stayStartDate } : {}),
      ...(stayEndDate !== undefined ? { stayEndDate } : {}),
    };

    const result = await adminEditRegistration(registrationId, data, adminId);

    return successResponse(result, "Registration updated");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/registrations
 *
 * Admin cancel a registration.
 * Body: { registrationId }
 */
export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    const body = (await request.json()) as Record<string, unknown>;
    const { registrationId } = body;

    const result = await adminCancelRegistration(
      registrationId as string,
      adminId,
    );

    return successResponse(result, "Registration cancelled");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/registrations
 *
 * Admin resend registration confirmation email with a new manage link.
 * Body: { registrationId: string }
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    const parsed = resendEmailSchema.safeParse(await readJsonBody(request));

    if (!parsed.success) {
      throw new ValidationError("Validation failed", toFieldErrors(parsed.error));
    }

    const result = await adminResendEmail(parsed.data.registrationId, adminId);

    return successResponse(result, "Registration email resent successfully");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
