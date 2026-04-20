import { NextRequest } from "next/server";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import { successResponse, handleApiError } from "@/lib/api-response";

/**
 * GET /api/admin/registrations/stats
 *
 * Returns aggregate registration counts for the admin dashboard strip.
 * Separate from the list endpoint so the strip can refresh independently
 * (e.g. after a mutation) without paying the cost of a paginated list
 * query, and so a list failure doesn't blank out the stats.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await verifyAdmin(request);
    const stats = await getRegistrationStats();
    return successResponse(stats, "ok", 200);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
