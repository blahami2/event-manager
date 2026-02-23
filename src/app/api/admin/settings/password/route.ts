import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { verifyAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/auth/supabase-client";
import { successResponse, handleApiError } from "@/lib/api-response";
import { AppError, ValidationError } from "@/lib/errors/app-errors";

/**
 * PUT /api/admin/settings/password
 *
 * Changes the admin user's password.
 * Verifies current password, then updates via service role client.
 */
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Missing required fields", {
        currentPassword: !currentPassword ? "required" : "",
        newPassword: !newPassword ? "required" : "",
      });
    }

    if (newPassword.length < 8) {
      throw new ValidationError("Password too short", {
        newPassword: "min_length",
      });
    }

    if (currentPassword === newPassword) {
      throw new ValidationError("New password must be different", {
        newPassword: "same_password",
      });
    }

    // Get the user from the session to find their email
    const cookies = request.cookies.getAll();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: { message: "Server configuration error" } },
        { status: 500 },
      );
    }

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookies,
        setAll: () => {},
      },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      throw new AppError("Unable to determine user email", "USER_EMAIL_MISSING", 500);
    }

    const email = userData.user.email;
    const userId = userData.user.id;

    // Verify current password by attempting sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      throw new AppError("Current password is incorrect", "CURRENT_PASSWORD_INCORRECT", 403);
    }

    // Update password using service role client
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      throw new AppError("Failed to update password", "PASSWORD_UPDATE_FAILED", 500);
    }

    return successResponse({ success: true }, "Password updated successfully");
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
