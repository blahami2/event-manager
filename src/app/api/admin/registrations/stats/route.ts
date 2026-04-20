import { NextRequest } from "next/server";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import { successResponse, handleApiError } from "@/lib/api-response";

/**
 * GET /api/admin/registrations/stats
 *
 * Returns aggregate registration counts (total, confirmed, cancelled,
 * totalAdults, totalChildren). Used to render the admin stats strip.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await verifyAdmin(request);
    const stats = await getRegistrationStats();
    return successResponse(stats, "Stats retrieved");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
