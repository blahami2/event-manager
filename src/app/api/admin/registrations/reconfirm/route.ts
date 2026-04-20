import { NextRequest } from "next/server";
import { z } from "zod";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { adminReconfirmRegistration } from "@/lib/usecases/admin-actions";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors/app-errors";

const reconfirmSchema = z.object({
  registrationId: z.string().uuid("registrationId must be a valid UUID"),
});

/**
 * POST /api/admin/registrations/reconfirm
 *
 * Reactivate a cancelled registration. Dedicated path (rather than a field
 * on PUT) so the action is explicit in access logs and so bulk cancel / edit
 * flows don't accidentally flip status back.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    const body: unknown = await request.json();
    const parsed = reconfirmSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      throw new ValidationError("Validation failed", fields);
    }

    const result = await adminReconfirmRegistration(
      parsed.data.registrationId,
      adminId,
    );

    return successResponse(result, "Registration reconfirmed");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
