import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRegistration,
  findRegistrationById,
  findRegistrationByEmail,
  updateRegistration,
  cancelRegistration,
  deleteRegistrationById,
  listRegistrations,
  countRegistrations,
} from "@/repositories/registration-repository";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";

// ── Mock Prisma ──

const mockRegistration = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/repositories/prisma", () => ({
  prisma: {
    registration: mockRegistration,
  },
}));

// ── Fixtures ──

const now = new Date("2026-02-11T12:00:00.000Z");

const dbRegistration = {
  id: "reg-1",
  name: "Alice Johnson",
  email: "alice@example.com",
  stay: "FRI_SUN" as const,
  accommodation: "ANYWHERE" as const,
  adultsCount: 2,
  childrenCount: 0,
  notes: null,
  status: "CONFIRMED" as const,
  createdAt: now,
  updatedAt: now,
};

describe("createRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a registration and return typed output", async () => {
    // given
    mockRegistration.create.mockResolvedValue(dbRegistration);

    // when
    const result = await createRegistration({
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
    });

    // then
    expect(mockRegistration.create).toHaveBeenCalledOnce();
    expect(mockRegistration.create).toHaveBeenCalledWith({
      data: {
        name: "Alice Johnson",
        email: "alice@example.com",
        stay: "FRI_SUN",
        accommodation: "ANYWHERE",
        adultsCount: 2,
        childrenCount: 0,
        notes: undefined,
        status: "CONFIRMED",
      },
    });
    expect(result).toEqual({
      id: "reg-1",
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      notes: null,
      status: RegistrationStatus.CONFIRMED,
      stayStartDate: null,
      stayEndDate: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("should pass notes when provided", async () => {
    // given
    mockRegistration.create.mockResolvedValue({
      ...dbRegistration,
      notes: "Vegetarian",
    });

    // when
    await createRegistration({
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      notes: "Vegetarian",
    });

    // then
    expect(mockRegistration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ notes: "Vegetarian" }),
    });
  });
});

describe("findRegistrationById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a registration when found", async () => {
    // given
    mockRegistration.findUnique.mockResolvedValue(dbRegistration);

    // when
    const result = await findRegistrationById("reg-1");

    // then
    expect(mockRegistration.findUnique).toHaveBeenCalledWith({
      where: { id: "reg-1" },
    });
    expect(result).toEqual(expect.objectContaining({ id: "reg-1" }));
  });

  it("should return null when not found", async () => {
    // given
    mockRegistration.findUnique.mockResolvedValue(null);

    // when
    const result = await findRegistrationById("non-existent");

    // then
    expect(result).toBeNull();
  });
});

describe("findRegistrationByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a registration when found by email", async () => {
    // given
    mockRegistration.findFirst.mockResolvedValue(dbRegistration);

    // when
    const result = await findRegistrationByEmail("alice@example.com");

    // then
    expect(mockRegistration.findFirst).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
    });
    expect(result).toEqual(expect.objectContaining({ email: "alice@example.com" }));
  });

  it("should return null when not found", async () => {
    // given
    mockRegistration.findFirst.mockResolvedValue(null);

    // when
    const result = await findRegistrationByEmail("unknown@example.com");

    // then
    expect(result).toBeNull();
  });
});

describe("updateRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update and return the registration", async () => {
    // given
    const updated = { ...dbRegistration, name: "Alice Smith", adultsCount: 3 };
    mockRegistration.update.mockResolvedValue(updated);

    // when
    const result = await updateRegistration("reg-1", {
      name: "Alice Smith",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 3,
      childrenCount: 0,
    });

    // then
    expect(mockRegistration.update).toHaveBeenCalledWith({
      where: { id: "reg-1" },
      data: {
        name: "Alice Smith",
        email: "alice@example.com",
        stay: "FRI_SUN",
        accommodation: "ANYWHERE",
        adultsCount: 3,
        childrenCount: 0,
        notes: undefined,
      },
    });
    expect(result.name).toBe("Alice Smith");
    expect(result.adultsCount).toBe(3);
  });
});

/**
 * Custom stay date ranges cross the repository boundary as `YYYY-MM-DD`
 * strings and are stored as date-only columns. `undefined` means "leave the
 * stored range alone" (public manage edits never send the fields), while
 * `null` means "clear the range and fall back to the stay option".
 */
describe("registration custom stay date range", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should persist the custom range as UTC-midnight dates when creating with a range", async () => {
    // given
    mockRegistration.create.mockResolvedValue(dbRegistration);

    // when
    await createRegistration({
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    });

    // then
    expect(mockRegistration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stayStartDate: new Date("2026-07-10T00:00:00.000Z"),
        stayEndDate: new Date("2026-07-13T00:00:00.000Z"),
      }),
    });
  });

  it("should persist the custom range when updating with a range", async () => {
    // given
    mockRegistration.update.mockResolvedValue(dbRegistration);

    // when
    await updateRegistration("reg-1", {
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    });

    // then
    expect(mockRegistration.update).toHaveBeenCalledWith({
      where: { id: "reg-1" },
      data: expect.objectContaining({
        stayStartDate: new Date("2026-07-10T00:00:00.000Z"),
        stayEndDate: new Date("2026-07-13T00:00:00.000Z"),
      }),
    });
  });

  it("should clear the stored range when updating with explicit nulls", async () => {
    // given
    mockRegistration.update.mockResolvedValue(dbRegistration);

    // when
    await updateRegistration("reg-1", {
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
      stayStartDate: null,
      stayEndDate: null,
    });

    // then
    expect(mockRegistration.update).toHaveBeenCalledWith({
      where: { id: "reg-1" },
      data: expect.objectContaining({ stayStartDate: null, stayEndDate: null }),
    });
  });

  it("should leave the stored range untouched when the range fields are omitted", async () => {
    // given
    // - the public manage form submits no range fields; an admin-set range
    //   must survive a guest editing their own registration
    mockRegistration.update.mockResolvedValue(dbRegistration);

    // when
    await updateRegistration("reg-1", {
      name: "Alice Johnson",
      email: "alice@example.com",
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      adultsCount: 2,
      childrenCount: 0,
    });

    // then
    const call = mockRegistration.update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(Object.keys(call.data)).not.toContain("stayStartDate");
    expect(Object.keys(call.data)).not.toContain("stayEndDate");
  });

  it("should map stored date columns to calendar-date strings when reading", async () => {
    // given
    mockRegistration.findUnique.mockResolvedValue({
      ...dbRegistration,
      stayStartDate: new Date("2026-07-10T00:00:00.000Z"),
      stayEndDate: new Date("2026-07-13T00:00:00.000Z"),
    });

    // when
    const result = await findRegistrationById("reg-1");

    // then
    expect(result?.stayStartDate).toBe("2026-07-10");
    expect(result?.stayEndDate).toBe("2026-07-13");
  });

  it("should map an absent stored range to nulls when reading", async () => {
    // given
    mockRegistration.findUnique.mockResolvedValue({
      ...dbRegistration,
      stayStartDate: null,
      stayEndDate: null,
    });

    // when
    const result = await findRegistrationById("reg-1");

    // then
    expect(result?.stayStartDate).toBeNull();
    expect(result?.stayEndDate).toBeNull();
  });
});

describe("cancelRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set status to CANCELLED without deleting", async () => {
    // given
    const cancelled = { ...dbRegistration, status: "CANCELLED" as const };
    mockRegistration.update.mockResolvedValue(cancelled);

    // when
    const result = await cancelRegistration("reg-1");

    // then
    expect(mockRegistration.update).toHaveBeenCalledWith({
      where: { id: "reg-1" },
      data: { status: "CANCELLED" },
    });
    expect(result.status).toBe(RegistrationStatus.CANCELLED);
  });
});

describe("listRegistrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated results with defaults", async () => {
    // given
    mockRegistration.findMany.mockResolvedValue([dbRegistration]);
    mockRegistration.count.mockResolvedValue(1);

    // when
    const result = await listRegistrations({});

    // then
    expect(mockRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("should filter by status", async () => {
    // given
    mockRegistration.findMany.mockResolvedValue([]);
    mockRegistration.count.mockResolvedValue(0);

    // when
    await listRegistrations({ status: RegistrationStatus.CONFIRMED });

    // then
    expect(mockRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "CONFIRMED" }),
      }),
    );
  });

  it("should filter by search term across name and email", async () => {
    // given
    mockRegistration.findMany.mockResolvedValue([]);
    mockRegistration.count.mockResolvedValue(0);

    // when
    await listRegistrations({ search: "alice" });

    // then
    expect(mockRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
          ],
        }),
      }),
    );
  });

  it("should apply stay and accommodation filters before count and pagination", async () => {
    // A matching row may sit beyond the first page of the unfiltered dataset.
    // Both queries must therefore share the filters so Prisma counts and
    // paginates the matching dataset rather than filtering returned rows.
    mockRegistration.findMany.mockResolvedValue([dbRegistration]);
    mockRegistration.count.mockResolvedValue(1);

    const result = await listRegistrations({
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
      page: 1,
      pageSize: 20,
    });

    const where = {
      stay: StayOption.FRI_SUN,
      accommodation: AccommodationOption.ANYWHERE,
    };
    expect(mockRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 0, take: 20 }),
    );
    expect(mockRegistration.count).toHaveBeenCalledWith({ where });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("should support custom pagination", async () => {
    // given
    mockRegistration.findMany.mockResolvedValue([]);
    mockRegistration.count.mockResolvedValue(50);

    // when
    const result = await listRegistrations({ page: 3, pageSize: 10 });

    // then
    expect(mockRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });
});

/**
 * Hard delete (issue #102). `deleteMany` rather than `delete` is what makes the
 * "did it exist?" answer a returned count instead of a thrown Prisma error, so
 * the caller can map a concurrent delete onto the same 404 as a missing row.
 */
describe("deleteRegistrationById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete by id and report true when a row was removed", async () => {
    // given
    // - one matching registration exists
    mockRegistration.deleteMany.mockResolvedValue({ count: 1 });

    // when
    const result = await deleteRegistrationById("reg-1");

    // then
    expect(mockRegistration.deleteMany).toHaveBeenCalledWith({
      where: { id: "reg-1" },
    });
    expect(result).toBe(true);
  });

  it("should report false when no row matched the id", async () => {
    // given
    // - the row is already gone (never existed, or a concurrent delete won)
    mockRegistration.deleteMany.mockResolvedValue({ count: 0 });

    // when
    const result = await deleteRegistrationById("missing");

    // then
    expect(result).toBe(false);
  });

  it("should propagate a persistence failure rather than reporting success", async () => {
    // given
    const failure = new Error("connection lost");
    mockRegistration.deleteMany.mockRejectedValue(failure);

    // when / then
    await expect(deleteRegistrationById("reg-1")).rejects.toThrow(failure);
  });
});

describe("countRegistrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the total count", async () => {
    // given
    mockRegistration.count.mockResolvedValue(42);

    // when
    const result = await countRegistrations();

    // then
    expect(mockRegistration.count).toHaveBeenCalledOnce();
    expect(result).toBe(42);
  });
});
