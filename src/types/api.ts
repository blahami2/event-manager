/**
 * Shared API response types.
 *
 * All API endpoints return one of these shapes.
 * See docs/ARCHITECTURE.md Section 12 for response contracts.
 */

/** Successful API response. */
export interface ApiSuccessResponse<T> {
  readonly data: T;
  readonly message: string;
}

/** Error API response. */
export interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly fields?: Record<string, string>;
  };
}

/** Union of success and error responses. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
