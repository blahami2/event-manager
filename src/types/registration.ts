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

/** Accommodation option enum (mirrors Prisma AccommodationOption). */
export enum AccommodationOption {
  PRIVATE_ROOM = "PRIVATE_ROOM",
  COMMON_ROOM = "COMMON_ROOM",
  OWN_TENT = "OWN_TENT",
  ANYWHERE = "ANYWHERE",
  NONE = "NONE",
}

/**
 * Input data for creating or updating a registration.
 *
 * `stayStartDate` / `stayEndDate` carry an optional admin-set custom date range
 * (issue #101) as `YYYY-MM-DD` calendar dates. Three states are meaningful and
 * distinct:
 *
 * - **omitted (`undefined`)** — leave any stored range untouched. Public flows
 *   (registration and the guest manage form) never send these fields, so a
 *   guest editing their own registration cannot wipe an admin's range.
 * - **`null`** — clear the range; the predefined `stay` option governs again.
 * - **a date pair** — pin the range. Both dates must be present and ordered.
 */
export interface RegistrationInput {
  readonly name: string;
  readonly email: string;
  readonly stay: StayOption;
  readonly accommodation: AccommodationOption;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly notes?: string;
  readonly stayStartDate?: string | null;
  readonly stayEndDate?: string | null;
}

/** Output data returned when reading a registration. */
export interface RegistrationOutput {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly stay: StayOption;
  readonly accommodation: AccommodationOption;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly notes: string | null;
  readonly status: RegistrationStatus;
  /**
   * Admin-set custom stay range as `YYYY-MM-DD` calendar dates, or `null` when
   * the predefined `stay` option governs. Calendar dates rather than `Date`
   * instants: "arrives on 10 July" must not shift with the reader's timezone.
   *
   * Required (nullable) rather than optional: the repository always populates
   * both, and making them optional would push an `undefined` branch onto every
   * consumer forever for no benefit. `null` is the single representation of
   * "no custom range" on the way out — the three-state contract with
   * `undefined` exists only on {@link RegistrationInput}, on the way in.
   */
  readonly stayStartDate: string | null;
  readonly stayEndDate: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Filters for listing registrations (admin). */
export interface RegistrationFilters {
  readonly status?: RegistrationStatus;
  readonly stay?: StayOption;
  readonly accommodation?: AccommodationOption;
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
