/**
 * Application error hierarchy.
 *
 * All application errors extend AppError so that API route handlers
 * can catch them and return consistent structured JSON responses.
 *
 * See docs/ARCHITECTURE.md Section 5.1 for the specification.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";

    // Restore prototype chain (required when targeting ES5 or when extending built-ins)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  /** Seconds until the rate limit window resets. */
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number = 60) {
    super("Too many requests", "RATE_LIMITED", 429);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AuthenticationError extends AppError {
  constructor() {
    super("Authentication required", "UNAUTHENTICATED", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor() {
    super("Insufficient permissions", "UNAUTHORIZED", 403);
    this.name = "AuthorizationError";
  }
}
