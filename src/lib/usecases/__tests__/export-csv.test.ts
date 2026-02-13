import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/registration-repository", () => ({
  listRegistrations: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { exportRegistrationsCsv } from "../admin-actions";
import { listRegistrations } from "@/repositories/registration-repository";
import { RegistrationStatus } from "@/types/registration";

describe("exportRegistrationsCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns header row when no registrations", async () => {
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10000,
    });

    const csv = await exportRegistrationsCsv();
    expect(csv).toBe("name,email,guestCount,dietaryNotes,status,createdAt");
  });

  it("includes registration data rows", async () => {
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Jane",
          email: "jane@example.com",
          guestCount: 2,
          dietaryNotes: null,
          status: RegistrationStatus.CONFIRMED,
          createdAt: new Date("2026-01-15T10:00:00.000Z"),
          updatedAt: new Date("2026-01-15T10:00:00.000Z"),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10000,
    });

    const csv = await exportRegistrationsCsv();
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("Jane,jane@example.com,2,,CONFIRMED,2026-01-15T10:00:00.000Z");
  });

  it("escapes commas in field values", async () => {
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Doe, Jane",
          email: "jane@example.com",
          guestCount: 1,
          dietaryNotes: "nuts, dairy",
          status: RegistrationStatus.CONFIRMED,
          createdAt: new Date("2026-01-15T10:00:00.000Z"),
          updatedAt: new Date("2026-01-15T10:00:00.000Z"),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10000,
    });

    const csv = await exportRegistrationsCsv();
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Doe, Jane"');
    expect(lines[1]).toContain('"nuts, dairy"');
  });

  it("escapes double quotes in field values", async () => {
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [
        {
          id: "1",
          name: 'Jane "JD" Doe',
          email: "jane@example.com",
          guestCount: 1,
          dietaryNotes: null,
          status: RegistrationStatus.CONFIRMED,
          createdAt: new Date("2026-01-15T10:00:00.000Z"),
          updatedAt: new Date("2026-01-15T10:00:00.000Z"),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10000,
    });

    const csv = await exportRegistrationsCsv();
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Jane ""JD"" Doe"');
  });
});
