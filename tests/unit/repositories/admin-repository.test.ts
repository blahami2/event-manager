import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findAdminBySupabaseId,
  isAdmin,
  listAdmins,
} from "@/repositories/admin-repository";

// ── Mock Prisma ──

const mockAdminUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/repositories/prisma", () => ({
  prisma: {
    adminUser: mockAdminUser,
  },
}));

// ── Fixtures ──

const now = new Date("2026-02-12T12:00:00.000Z");

const dbAdmin = {
  id: "admin-1",
  supabaseUserId: "supabase-uid-1",
  email: "admin@example.com",
  createdAt: now,
};

const dbAdmin2 = {
  id: "admin-2",
  supabaseUserId: "supabase-uid-2",
  email: "admin2@example.com",
  createdAt: now,
};

// ── Tests ──

describe("findAdminBySupabaseId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return admin data when admin is found", async () => {
    // given
    // - prisma finds an admin user matching the supabase user ID
    mockAdminUser.findUnique.mockResolvedValue(dbAdmin);

    // when
    const result = await findAdminBySupabaseId("supabase-uid-1");

    // then
    expect(result).toEqual({
      id: "admin-1",
      supabaseUserId: "supabase-uid-1",
      email: "admin@example.com",
      createdAt: now,
    });
  });

  it("should query by supabaseUserId", async () => {
    // given
    // - prisma returns a matching admin
    mockAdminUser.findUnique.mockResolvedValue(dbAdmin);

    // when
    await findAdminBySupabaseId("supabase-uid-1");

    // then
    expect(mockAdminUser.findUnique).toHaveBeenCalledWith({
      where: { supabaseUserId: "supabase-uid-1" },
    });
  });

  it("should return null when admin is not found", async () => {
    // given
    // - prisma returns null because no admin with this supabase ID exists
    mockAdminUser.findUnique.mockResolvedValue(null);

    // when
    const result = await findAdminBySupabaseId("non-existent-uid");

    // then
    expect(result).toBeNull();
  });
});

describe("isAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when user is an admin", async () => {
    // given
    // - prisma finds an admin user matching the supabase user ID
    mockAdminUser.findUnique.mockResolvedValue(dbAdmin);

    // when
    const result = await isAdmin("supabase-uid-1");

    // then
    expect(result).toBe(true);
  });

  it("should return false when user is not an admin", async () => {
    // given
    // - prisma returns null because no admin with this supabase ID exists
    mockAdminUser.findUnique.mockResolvedValue(null);

    // when
    const result = await isAdmin("non-existent-uid");

    // then
    expect(result).toBe(false);
  });

  it("should query by supabaseUserId", async () => {
    // given
    // - prisma returns null
    mockAdminUser.findUnique.mockResolvedValue(null);

    // when
    await isAdmin("some-uid");

    // then
    expect(mockAdminUser.findUnique).toHaveBeenCalledWith({
      where: { supabaseUserId: "some-uid" },
    });
  });
});

describe("listAdmins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all admin users", async () => {
    // given
    // - prisma returns two admin rows
    mockAdminUser.findMany.mockResolvedValue([dbAdmin, dbAdmin2]);

    // when
    const result = await listAdmins();

    // then
    expect(result).toEqual([
      {
        id: "admin-1",
        supabaseUserId: "supabase-uid-1",
        email: "admin@example.com",
        createdAt: now,
      },
      {
        id: "admin-2",
        supabaseUserId: "supabase-uid-2",
        email: "admin2@example.com",
        createdAt: now,
      },
    ]);
  });

  it("should return an empty array when no admins exist", async () => {
    // given
    // - prisma returns an empty array
    mockAdminUser.findMany.mockResolvedValue([]);

    // when
    const result = await listAdmins();

    // then
    expect(result).toEqual([]);
  });

  it("should call prisma findMany without filters", async () => {
    // given
    // - prisma returns admins
    mockAdminUser.findMany.mockResolvedValue([dbAdmin]);

    // when
    await listAdmins();

    // then
    expect(mockAdminUser.findMany).toHaveBeenCalledOnce();
  });
});
