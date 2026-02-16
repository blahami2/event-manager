/**
 * Shared registration types used across layers.
 *
 * UI → Use cases → Repositories all communicate through these interfaces.
 * See docs/ARCHITECTURE.md Section 8 for the domain model.
 */

/** Registration status enum (mirrors Prisma RegistrationStatus). */
export enum RegistrationStatus {
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

/** Stay option enum (mirrors Prisma StayOption). */
export enum StayOption {
  FRI_SAT = "FRI_SAT",
  SAT_SUN = "SAT_SUN",
  FRI_SUN = "FRI_SUN",
  SAT_ONLY = "SAT_ONLY",
}

/** Input data for creating or updating a registration. */
export interface RegistrationInput {
  readonly name: string;
  readonly email: string;
  readonly stay: StayOption;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly notes?: string;
}

/** Output data returned when reading a registration. */
export interface RegistrationOutput {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly stay: StayOption;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly notes: string | null;
  readonly status: RegistrationStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Filters for listing registrations (admin). */
export interface RegistrationFilters {
  readonly status?: RegistrationStatus;
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/** Generic paginated result wrapper. */
export interface PaginatedResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Data associated with a capability token lookup. */
export interface TokenData {
  readonly id: string;
  readonly registrationId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly isRevoked: boolean;
  readonly createdAt: Date;
}
