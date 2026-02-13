import { NextRequest } from "next/server";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { exportRegistrationsCsv } from "@/lib/usecases/admin-actions";
import { handleApiError } from "@/lib/api-response";

/**
 * GET /api/admin/registrations/export
 *
 * Returns all registrations as a downloadable CSV file.
 * Admin-only endpoint.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await verifyAdmin(request);

    const csv = await exportRegistrationsCsv();
    const date = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=registrations-${date}.csv`,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
