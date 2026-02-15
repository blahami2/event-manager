import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRegistration,
  findRegistrationById,
  findRegistrationByEmail,
  updateRegistration,
  cancelRegistration,
  listRegistrations,
  countRegistrations,
} from "@/repositories/registration-repository";
import { RegistrationStatus, StayOption } from "@/types/registration";

// ── Mock Prisma ──

const mockRegistration = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
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
      adultsCount: 2,
      childrenCount: 0,
      notes: null,
      status: RegistrationStatus.CONFIRMED,
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
        adultsCount: 3,
        childrenCount: 0,
        notes: undefined,
      },
    });
    expect(result.name).toBe("Alice Smith");
    expect(result.adultsCount).toBe(3);
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
