import { NextResponse } from "next/server";

import type { ApiSuccessResponse, ApiErrorResponse } from "@/types/api";
import { AppError, ValidationError } from "@/lib/errors/app-errors";

/**
 * Build a success JSON response matching ApiSuccessResponse<T>.
 *
 * @param data    - Payload to include under the `data` key.
 * @param message - Human-readable success message.
 * @param status  - HTTP status code (default 200).
 */
export function successResponse<T>(
  data: T,
  message: string,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, message }, { status });
}

/**
 * Build an error JSON response from a known AppError.
 *
 * If the error is a ValidationError, `fields` is included in the body.
 */
export function errorResponse(error: AppError): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      ...(error instanceof ValidationError ? { fields: error.fields } : {}),
    },
  };

  return NextResponse.json(body, { status: error.statusCode });
}

/**
 * Catch-all error handler for API route handlers.
 *
 * - AppError subclasses are mapped to their status code and shape.
 * - Any other error returns a generic 500 with no internal details leaked.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return errorResponse(error);
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 },
  );
}
