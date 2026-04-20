import { NextRequest } from "next/server";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { registerGuest } from "@/lib/usecases/register";
import { successResponse, handleApiError } from "@/lib/api-response";
import { logger, maskEmail } from "@/lib/logger";

/**
 * POST /api/admin/registrations/create
 *
 * Admin-only endpoint that creates a registration on behalf of a guest,
 * bypassing the public registration deadline. Body shape matches the
 * public `/api/register` endpoint: `{ name, email, stay, accommodation,
 * adultsCount, childrenCount, notes? }`.
 *
 * The `bypassDeadline` flag is set server-side; a client cannot request
 * bypass by adding a field to the body. Any such field is ignored by the
 * use case's Zod schema (it validates a fixed set of keys).
 *
 * Response shape matches the admin-endpoint contract used by the rest of
 * the admin API (`{ data, message }` on success, `{ error }` on failure).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { adminId } = await verifyAdmin(request);

    const body: unknown = await request.json();
    const result = await registerGuest(body, { bypassDeadline: true });

    // Log admin-initiated creation with masked email (LOG3, LOG4, LOG5).
    // The email is safe to derive here: `registerGuest` has already
    // validated and stored it. If the body is malformed, the use case
    // throws before reaching this point.
    const email =
      typeof body === "object" && body !== null && "email" in body
        ? String((body as { email: unknown }).email ?? "")
        : "";

    logger.info("Admin created registration", {
      adminUserId: adminId,
      action: "create_registration",
      targetId: result.registrationId,
      email: maskEmail(email),
    });

    return successResponse(
      { registrationId: result.registrationId },
      "Registration created",
      201,
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
