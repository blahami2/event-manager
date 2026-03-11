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
import { ValidationError } from "@/lib/errors/app-errors";
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
 * Body: { registrationId, name, email, stay, adultsCount, childrenCount, notes? }
 */
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    const body = (await request.json()) as Record<string, unknown>;
    const { registrationId, name, email, stay, adultsCount, childrenCount, notes } = body;

    const data: RegistrationInput = {
      name: name as string,
      email: email as string,
      stay: stay as RegistrationInput["stay"],
      adultsCount: adultsCount as number,
      childrenCount: childrenCount as number,
      ...(notes !== undefined ? { notes: notes as string } : {}),
    };

    const result = await adminEditRegistration(
      registrationId as string,
      data,
      adminId,
    );

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

    const body: unknown = await request.json();
    const parsed = resendEmailSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path.join(".");
        fields[fieldName] = issue.message;
      }
      throw new ValidationError("Validation failed", fields);
    }

    const result = await adminResendEmail(parsed.data.registrationId, adminId);

    return successResponse(result, "Registration email resent successfully");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
