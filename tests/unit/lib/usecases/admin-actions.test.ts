import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/lib/errors/app-errors";
import { RegistrationStatus } from "@/types/registration";
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
    guestCount: 2,
    dietaryNotes: null,
    status: RegistrationStatus.CONFIRMED,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const confirmedReg1 = makeRegistration({ id: "reg-1", name: "Alice Johnson", email: "alice@example.com", guestCount: 2 });
const confirmedReg2 = makeRegistration({ id: "reg-2", name: "Bob Smith", email: "bob@example.com", guestCount: 4, dietaryNotes: "Vegetarian, nut allergy" });
const cancelledReg = makeRegistration({ id: "reg-3", name: "Carol Davis", email: "carol@example.com", guestCount: 1, status: RegistrationStatus.CANCELLED });

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
    // given
    // - a paginated result from the repository
    const paginatedResult: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1, confirmedReg2],
      total: 5,
      page: 1,
      pageSize: 2,
    };
    mockListRegistrations.mockResolvedValue(paginatedResult);

    // when
    const result = await listRegistrationsPaginated({ page: 1, pageSize: 2 });

    // then
    expect(result).toEqual(paginatedResult);
    expect(mockListRegistrations).toHaveBeenCalledWith({ page: 1, pageSize: 2 });
  });

  it("should pass status filter to repository when provided", async () => {
    // given
    const paginatedResult: PaginatedResult<RegistrationOutput> = {
      items: [cancelledReg],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    mockListRegistrations.mockResolvedValue(paginatedResult);

    // when
    const result = await listRegistrationsPaginated({ status: RegistrationStatus.CANCELLED });

    // then
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe(RegistrationStatus.CANCELLED);
  });

  it("should return empty list when no registrations match", async () => {
    // given
    const emptyResult: PaginatedResult<RegistrationOutput> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
    mockListRegistrations.mockResolvedValue(emptyResult);

    // when
    const result = await listRegistrationsPaginated({ search: "nonexistent" });

    // then
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe("getRegistrationStats", () => {
  it("should return total, confirmed, and cancelled counts", async () => {
    // given
    // - a list of all registrations (no filters, large page)
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1, confirmedReg2, cancelledReg],
      total: 3,
      page: 1,
      pageSize: 1000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    // when
    const stats = await getRegistrationStats();

    // then
    expect(stats).toEqual({
      total: 3,
      confirmed: 2,
      cancelled: 1,
    });
  });

  it("should return zero counts when no registrations exist", async () => {
    // given
    const emptyResult: PaginatedResult<RegistrationOutput> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 1000,
    };
    mockListRegistrations.mockResolvedValue(emptyResult);

    // when
    const stats = await getRegistrationStats();

    // then
    expect(stats).toEqual({ total: 0, confirmed: 0, cancelled: 0 });
  });
});

describe("adminCancelRegistration", () => {
  it("should cancel registration and log admin action when registration exists", async () => {
    // given
    // - an existing confirmed registration
    mockFindRegistrationById.mockResolvedValue(confirmedReg1);
    const cancelledVersion = makeRegistration({ id: "reg-1", status: RegistrationStatus.CANCELLED });
    mockCancelRegistration.mockResolvedValue(cancelledVersion);

    // when
    const result = await adminCancelRegistration("reg-1", adminId);

    // then
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
    // given
    mockFindRegistrationById.mockResolvedValue(null);

    // when / then
    await expect(adminCancelRegistration("nonexistent", adminId)).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when registration is already cancelled", async () => {
    // given
    mockFindRegistrationById.mockResolvedValue(cancelledReg);

    // when / then
    await expect(adminCancelRegistration("reg-3", adminId)).rejects.toThrow(NotFoundError);
  });
});

describe("adminEditRegistration", () => {
  it("should update registration and log admin action when registration exists", async () => {
    // given
    // - an existing registration
    mockFindRegistrationById.mockResolvedValue(confirmedReg1);
    const updatedReg = makeRegistration({ id: "reg-1", name: "Alice Updated", guestCount: 3 });
    mockUpdateRegistration.mockResolvedValue(updatedReg);

    const editData = { name: "Alice Updated", email: "alice@example.com", guestCount: 3 };

    // when
    const result = await adminEditRegistration("reg-1", editData, adminId);

    // then
    expect(result.name).toBe("Alice Updated");
    expect(result.guestCount).toBe(3);
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
    // given
    mockFindRegistrationById.mockResolvedValue(null);

    // when / then
    await expect(
      adminEditRegistration("nonexistent", { name: "X", email: "x@x.com", guestCount: 1 }, adminId),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("exportRegistrationsCsv", () => {
  it("should return CSV string with correct headers and data rows", async () => {
    // given
    // - registrations with various data
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1, confirmedReg2, cancelledReg],
      total: 3,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    // when
    const csv = await exportRegistrationsCsv();

    // then
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,email,guestCount,dietaryNotes,status,createdAt");
    expect(lines).toHaveLength(4); // header + 3 data rows
    expect(lines[1]).toContain("Alice Johnson");
    expect(lines[1]).toContain("alice@example.com");
    expect(lines[1]).toContain("2");
    expect(lines[1]).toContain("CONFIRMED");
  });

  it("should handle dietary notes with commas by quoting the field", async () => {
    // given
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg2],
      total: 1,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    // when
    const csv = await exportRegistrationsCsv();

    // then
    const lines = csv.split("\n");
    // "Vegetarian, nut allergy" contains a comma, so it should be quoted
    expect(lines[1]).toContain('"Vegetarian, nut allergy"');
  });

  it("should return only header when no registrations exist", async () => {
    // given
    const emptyResult: PaginatedResult<RegistrationOutput> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(emptyResult);

    // when
    const csv = await exportRegistrationsCsv();

    // then
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("name,email,guestCount,dietaryNotes,status,createdAt");
  });

  it("should handle null dietary notes as empty string", async () => {
    // given
    const allRegs: PaginatedResult<RegistrationOutput> = {
      items: [confirmedReg1], // dietaryNotes is null
      total: 1,
      page: 1,
      pageSize: 10000,
    };
    mockListRegistrations.mockResolvedValue(allRegs);

    // when
    const csv = await exportRegistrationsCsv();

    // then
    const lines = csv.split("\n");
    // null dietaryNotes should be empty string in CSV
    const fields = lines[1].split(",");
    expect(fields[3]).toBe("");
  });
});
