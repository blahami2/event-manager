import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-errors";

describe("AppError", () => {
  it("should create an error with message, code, statusCode, and isOperational", () => {
    // when
    const error = new AppError("something broke", "CUSTOM_ERROR", 500);

    // then
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("something broke");
    expect(error.code).toBe("CUSTOM_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe("AppError");
  });

  it("should allow overriding isOperational", () => {
    // when
    const error = new AppError("fatal", "FATAL", 500, false);

    // then
    expect(error.isOperational).toBe(false);
  });

  it("should have a proper prototype chain", () => {
    // when
    const error = new AppError("test", "TEST", 500);

    // then
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
    expect(error.stack).toBeDefined();
  });
});

describe("ValidationError", () => {
  it("should have status 400 and VALIDATION_ERROR code", () => {
    // given
    const fields = { email: "Invalid email format", name: "Name is required" };

    // when
    const error = new ValidationError("Validation failed", fields);

    // then
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Validation failed");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.fields).toEqual(fields);
  });
});

describe("NotFoundError", () => {
  it("should have status 404 and NOT_FOUND code", () => {
    // when
    const error = new NotFoundError("Registration");

    // then
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("Registration not found");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });
});

describe("RateLimitError", () => {
  it("should have status 429 and RATE_LIMITED code", () => {
    // when
    const error = new RateLimitError();

    // then
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.message).toBe("Too many requests");
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.statusCode).toBe(429);
    expect(error.isOperational).toBe(true);
  });
});

describe("AuthenticationError", () => {
  it("should have status 401 and UNAUTHENTICATED code", () => {
    // when
    const error = new AuthenticationError();

    // then
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe("Authentication required");
    expect(error.code).toBe("UNAUTHENTICATED");
    expect(error.statusCode).toBe(401);
    expect(error.isOperational).toBe(true);
  });
});

describe("AuthorizationError", () => {
  it("should have status 403 and UNAUTHORIZED code", () => {
    // when
    const error = new AuthorizationError();

    // then
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.message).toBe("Insufficient permissions");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.statusCode).toBe(403);
    expect(error.isOperational).toBe(true);
  });
});
