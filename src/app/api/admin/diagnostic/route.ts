import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/auth/supabase-client";
import { extractTokenFromCookies } from "@/lib/auth/admin-guard";
import { listAdmins } from "@/repositories/admin-repository";

/**
 * GET /api/admin/diagnostic
 *
 * Diagnostic endpoint to debug admin authentication issues.
 * Shows:
 * - Current user's Supabase ID from cookie/token
 * - All AdminUser records in database
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Extract token from cookies
    const token = extractTokenFromCookies(request.headers.get("cookie"));

    let currentUser = null;
    if (token) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        currentUser = {
          id: data.user.id,
          email: data.user.email,
        };
      }
    }

    // Get all admin users from database
    const adminUsers = await listAdmins();

    return NextResponse.json({
      currentUser,
      adminUsersInDatabase: adminUsers,
      tokenExtracted: !!token,
      authenticationWorking: !!currentUser,
      isCurrentUserInAdminTable: adminUsers.some(
        (admin) => admin.supabaseUserId === currentUser?.id
      ),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
