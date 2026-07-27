import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/registration-repository", () => ({
  listRegistrations: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { exportRegistrationsCsv } from "../admin-actions";
import { listRegistrations } from "@/repositories/registration-repository";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";

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
    expect(csv).toBe("name,email,stay,accommodation,adultsCount,childrenCount,notes,status,createdAt,stayStartDate,stayEndDate");
  });

  it("includes registration data rows", async () => {
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Jane",
          email: "jane@example.com",
          stay: StayOption.FRI_SAT,
          accommodation: AccommodationOption.ANYWHERE,
          adultsCount: 2,
          childrenCount: 0,
          notes: null,
          stayStartDate: null,
          stayEndDate: null,
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
    expect(lines[1]).toBe("Jane,jane@example.com,FRI_SAT,ANYWHERE,2,0,,CONFIRMED,2026-01-15T10:00:00.000Z,,");
  });

  it("includes an admin-set custom date range in its own columns", async () => {
    // given
    // - a registration whose dates were overridden by an admin
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Jane",
          email: "jane@example.com",
          stay: StayOption.SAT_SUN,
          stayStartDate: "2026-07-10",
          stayEndDate: "2026-07-13",
          accommodation: AccommodationOption.ANYWHERE,
          adultsCount: 2,
          childrenCount: 0,
          notes: null,
          status: RegistrationStatus.CONFIRMED,
          createdAt: new Date("2026-01-15T10:00:00.000Z"),
          updatedAt: new Date("2026-01-15T10:00:00.000Z"),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10000,
    });

    // when
    const csv = await exportRegistrationsCsv();

    // then
    const lines = csv.split("\n");
    expect(lines[1]).toBe(
      "Jane,jane@example.com,SAT_SUN,ANYWHERE,2,0,,CONFIRMED,2026-01-15T10:00:00.000Z,2026-07-10,2026-07-13",
    );
  });

  it("escapes commas in field values", async () => {
    vi.mocked(listRegistrations).mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Doe, Jane",
          email: "jane@example.com",
          stay: StayOption.FRI_SUN,
          accommodation: AccommodationOption.ANYWHERE,
          adultsCount: 1,
          childrenCount: 0,
          notes: "nuts, dairy",
          stayStartDate: null,
          stayEndDate: null,
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
          stay: StayOption.SAT_SUN,
          accommodation: AccommodationOption.ANYWHERE,
          adultsCount: 1,
          childrenCount: 0,
          notes: null,
          stayStartDate: null,
          stayEndDate: null,
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
