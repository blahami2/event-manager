import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/lib/errors/app-errors";
import { RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput, PaginatedResult } from "@/types/registration";

// ── Mock dependencies ──

const mockListRegistrations = vi.hoisted(() => vi.fn());
const mockCountRegistrations = vi.hoisted(() => vi.fn());
const mockFindRegistrationById = vi.hoisted(() => vi.fn());
const mockCancelRegistration = vi.hoisted(() => vi.fn());
const mockUpdateRegistration = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/repositories/registration-repository", () => ({
  listRegistrations: mockListRegistrations,
  countRegistrations: mockCountRegistrations,
  findRegistrationById: mockFindRegistrationById,
  cancelRegistration: mockCancelRegistration,
  updateRegistration: mockUpdateRegistration,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
  maskEmail: vi.fn((email: string) => `${email.charAt(0)}***@${email.split("@")[1]}`),
}));

// ── Fixtures ──

const now = new Date("2026-02-13T12:00:00.000Z");

function makeRegistration(overrides: Partial<RegistrationOutput> = {}): RegistrationOutput {
  return {
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
    ...overrides,
  };
}

const confirmedReg1 = makeRegistration({ id: "reg-1", name: "Alice Johnson", email: "alice@example.com", adultsCount: 2, childrenCount: 1 });
const confirmedReg2 = makeRegistration({ id: "reg-2", name: "Bob Smith", email: "bob@example.com", stay: StayOption.FRI_SAT, adultsCount: 2, childrenCount: 2, notes: "Vegetarian, nut allergy" });
const cancelledReg = makeRegistration({ id: "reg-3", name: "Carol Davis", email: "carol@example.com", stay: StayOption.SAT_SUN, adultsCount: 1, childrenCount: 0, status: RegistrationStatus.CANCELLED });

const adminId = "admin-user-001";

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Import SUT (after mocks) ──

import {
  listRegistrationsPaginated,
  getRegistrationStats,
  adminCancelRegistration,
  adminEditRegistration,
  exportRegistrationsCsv,
} from "@/lib/usecases/admin-actions";

// ── Tests ──

describe("listRegistrationsPaginated", () => {
  it("should return paginated list with total count when called with filters", async () => {
    const paginatedResult: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1, confirmedReg2],
      total: 5,
      page: 1,
      pageSize: 2,
    };
    mockListRegistrations.mockResolvedValue(paginatedResult);

    const result = await listRegistrationsPaginated({ page: 1, pageSize: 2 });

    expect(result).toEqual(paginatedResult);
    expect(mockListRegistrations).toHaveBeenCalledWith({ page: 1, pageSize: 2 });
  });

  it("should pass status filter to repository when provided", async () => {
    const paginatedResult: PaginatedResult<RegistrationOutput> = {
      items: [cancelledReg],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    mockListRegistrations.mockResolvedValue(paginatedResult);

    const result = await listRegistrationsPaginated({ status: RegistrationStatus.CANCELLED });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe(RegistrationStatus.CANCELLED);
  });

  it("should return empty list when no registrations match", async () => {
    const emptyResult: PaginatedResult<RegistrationOutput> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
    mockListRegistrations.mockResolvedValue(emptyResult);

    const result = await listRegistrationsPaginated({ search: "nonexistent" });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe("getRegistrationStats", () => {
  it("should return total, confirmed, cancelled, totalAdults, and totalChildren counts", async () => {
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1, confirmedReg2, cancelledReg],
      total: 3,
      page: 1,
      pageSize: 1000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    const stats = await getRegistrationStats();

    expect(stats).toEqual({
      total: 3,
      confirmed: 2,
      cancelled: 1,
      totalAdults: 5,
      totalChildren: 3,
    });
  });

  it("should return zero counts when no registrations exist", async () => {
    const emptyResult: PaginatedResult<RegistrationOutput> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 1000,
    };
    mockListRegistrations.mockResolvedValue(emptyResult);

    const stats = await getRegistrationStats();

    expect(stats).toEqual({ total: 0, confirmed: 0, cancelled: 0, totalAdults: 0, totalChildren: 0 });
  });
});

describe("adminCancelRegistration", () => {
  it("should cancel registration and log admin action when registration exists", async () => {
    mockFindRegistrationById.mockResolvedValue(confirmedReg1);
    const cancelledVersion = makeRegistration({ id: "reg-1", status: RegistrationStatus.CANCELLED });
    mockCancelRegistration.mockResolvedValue(cancelledVersion);

    const result = await adminCancelRegistration("reg-1", adminId);

    expect(result.status).toBe(RegistrationStatus.CANCELLED);
    expect(mockCancelRegistration).toHaveBeenCalledWith("reg-1");
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Admin cancelled registration",
      expect.objectContaining({
        adminUserId: adminId,
        action: "cancel_registration",
        targetId: "reg-1",
      }),
    );
  });

  it("should throw NotFoundError when registration does not exist", async () => {
    mockFindRegistrationById.mockResolvedValue(null);
    await expect(adminCancelRegistration("nonexistent", adminId)).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when registration is already cancelled", async () => {
    mockFindRegistrationById.mockResolvedValue(cancelledReg);
    await expect(adminCancelRegistration("reg-3", adminId)).rejects.toThrow(NotFoundError);
  });
});

describe("adminEditRegistration", () => {
  it("should update registration and log admin action when registration exists", async () => {
    mockFindRegistrationById.mockResolvedValue(confirmedReg1);
    const updatedReg = makeRegistration({ id: "reg-1", name: "Alice Updated", adultsCount: 3 });
    mockUpdateRegistration.mockResolvedValue(updatedReg);

    const editData = { name: "Alice Updated", email: "alice@example.com", stay: StayOption.FRI_SUN, adultsCount: 3, childrenCount: 0 };

    const result = await adminEditRegistration("reg-1", editData, adminId);

    expect(result.name).toBe("Alice Updated");
    expect(result.adultsCount).toBe(3);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Admin edited registration",
      expect.objectContaining({
        adminUserId: adminId,
        action: "edit_registration",
        targetId: "reg-1",
      }),
    );
  });

  it("should throw NotFoundError when registration does not exist", async () => {
    mockFindRegistrationById.mockResolvedValue(null);
    await expect(
      adminEditRegistration("nonexistent", { name: "X", email: "x@x.com", stay: StayOption.FRI_SAT, adultsCount: 1, childrenCount: 0 }, adminId),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("exportRegistrationsCsv", () => {
  it("should return CSV string with correct headers and data rows", async () => {
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1, confirmedReg2, cancelledReg],
      total: 3,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    const csv = await exportRegistrationsCsv();

    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,email,stay,adultsCount,childrenCount,notes,status,createdAt");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain("Alice Johnson");
    expect(lines[1]).toContain("alice@example.com");
    expect(lines[1]).toContain("FRI_SUN");
    expect(lines[1]).toContain("CONFIRMED");
  });

  it("should handle notes with commas by quoting the field", async () => {
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg2],
      total: 1,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    const csv = await exportRegistrationsCsv();

    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Vegetarian, nut allergy"');
  });

  it("should return only header when no registrations exist", async () => {
    const emptyResult: PaginatedResult<RegistrationOutput> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(emptyResult);

    const csv = await exportRegistrationsCsv();

    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("name,email,stay,adultsCount,childrenCount,notes,status,createdAt");
  });

  it("should handle null notes as empty string", async () => {
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1],
      total: 1,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    const csv = await exportRegistrationsCsv();

    const lines = csv.split("\n");
    // notes is after childrenCount (index 5)
    const fields = lines[1]?.split(",");
    expect(fields?.[5]).toBe("");
  });
});
