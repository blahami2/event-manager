import { NextRequest } from "next/server";
import { z } from "zod";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { adminDeleteRegistration } from "@/lib/usecases/admin-actions";
import { successResponse, handleApiError } from "@/lib/api-response";
import { readJsonBody } from "@/lib/api-request";
import { AuthorizationError, ValidationError } from "@/lib/errors/app-errors";
import { toFieldErrors } from "@/lib/validation/field-errors";

const deleteSchema = z.object({
  registrationId: z.string().uuid("registrationId must be a valid UUID"),
});

/**
 * POST /api/admin/registrations/delete
 *
 * Permanently delete a registration and, by database cascade, its capability
 * tokens. Irreversible — the soft "cancel" that keeps the record on the guest
 * list remains `DELETE /api/admin/registrations`.
 *
 * A dedicated path, following the `reconfirm` precedent: the collection's
 * `DELETE` verb already means *cancel* in this API, so overloading it would
 * make the destructive action indistinguishable from the reversible one in
 * access logs — and would silently turn every existing cancel call site into a
 * hard delete. `POST` here matches its sibling action routes.
 *
 * Authorization runs before the body is read (S6), so an unauthenticated caller
 * cannot probe payload validity.
 *
 * Body: `{ registrationId: string }` (UUID)
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      throw new ValidationError("Validation failed", {
        body: "Content-Type must be application/json",
      });
    }

    // Cookie-authenticated requests are browser-replayable, so reject an
    // explicit foreign Origin before performing the destructive action.
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      throw new AuthorizationError();
    }

    const parsed = deleteSchema.safeParse(await readJsonBody(request));

    if (!parsed.success) {
      throw new ValidationError("Validation failed", toFieldErrors(parsed.error));
    }

    const result = await adminDeleteRegistration(parsed.data.registrationId, adminId);

    return successResponse(result, "Registration deleted");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
