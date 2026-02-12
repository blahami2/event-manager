import { describe, it, expect } from "vitest";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-errors";

describe("successResponse", () => {
  it("should return JSON matching ApiSuccessResponse shape with status 200", async () => {
    // given
    const data = { registrationId: "abc-123" };

    // when
    const response = successResponse(data, "Registration successful");

    // then
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      data: { registrationId: "abc-123" },
      message: "Registration successful",
    });
  });

  it("should allow a custom status code", async () => {
    // given
    const data = { id: "new-id" };

    // when
    const response = successResponse(data, "Created", 201);

    // then
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ data: { id: "new-id" }, message: "Created" });
  });
});

describe("errorResponse", () => {
  it("should return JSON matching ApiErrorResponse for ValidationError with fields", async () => {
    // given
    const error = new ValidationError("Validation failed", {
      email: "Invalid email format",
      name: "Name is required",
    });

    // when
    const response = errorResponse(error);

    // then
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: {
          email: "Invalid email format",
          name: "Name is required",
        },
      },
    });
  });

  it("should return 404 for NotFoundError", async () => {
    // given
    const error = new NotFoundError("Registration");

    // when
    const response = errorResponse(error);

    // then
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Registration not found",
      },
    });
  });

  it("should return 429 for RateLimitError", async () => {
    // given
    const error = new RateLimitError();

    // when
    const response = errorResponse(error);

    // then
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests",
      },
    });
  });

  it("should return 401 for AuthenticationError", async () => {
    // given
    const error = new AuthenticationError();

    // when
    const response = errorResponse(error);

    // then
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      },
    });
  });

  it("should return 403 for AuthorizationError", async () => {
    // given
    const error = new AuthorizationError();

    // when
    const response = errorResponse(error);

    // then
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Insufficient permissions",
      },
    });
  });

  it("should return custom AppError status code", async () => {
    // given
    const error = new AppError("Service unavailable", "SERVICE_UNAVAILABLE", 503);

    // when
    const response = errorResponse(error);

    // then
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable",
      },
    });
  });
});

describe("handleApiError", () => {
  it("should map AppError to correct status code and shape", async () => {
    // given
    const error = new NotFoundError("Token");

    // when
    const response = handleApiError(error);

    // then
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Token not found",
      },
    });
  });

  it("should include fields for ValidationError", async () => {
    // given
    const error = new ValidationError("Bad input", { email: "Required" });

    // when
    const response = handleApiError(error);

    // then
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.fields).toEqual({ email: "Required" });
  });

  it("should return generic 500 for non-AppError errors", async () => {
    // given
    const error = new Error("Some internal crash");

    // when
    const response = handleApiError(error);

    // then
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  it("should return generic 500 for non-Error values", async () => {
    // when
    const response = handleApiError("string error");

    // then
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  it("should not leak internal details for unknown errors", async () => {
    // given
    const error = new TypeError("Cannot read property 'foo' of undefined");

    // when
    const response = handleApiError(error);

    // then
    const body = await response.json();
    expect(body.error.message).toBe("An unexpected error occurred");
    expect(body.error.message).not.toContain("Cannot read property");
  });
});
