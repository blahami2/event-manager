/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock admin-actions use case
const mockGetRegistrationStats = vi.fn();
vi.mock("@/lib/usecases/admin-actions", () => ({
  getRegistrationStats: (...args: unknown[]) => mockGetRegistrationStats(...args),
}));

// Must import after mocks
import AdminDashboardPage from "../page";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard heading", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 10,
      confirmed: 7,
      cancelled: 3,
      totalGuests: 25,
    });

    const page = await AdminDashboardPage();
    render(page);

    expect(screen.getByText("Dashboard")).toBeDefined();
  });

  it("displays registration statistics", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 15,
      confirmed: 10,
      cancelled: 5,
      totalGuests: 30,
    });

    const page = await AdminDashboardPage();
    render(page);

    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("30")).toBeDefined();
  });

  it("displays stat labels", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 0,
      confirmed: 0,
      cancelled: 0,
      totalGuests: 0,
    });

    const page = await AdminDashboardPage();
    render(page);

    expect(screen.getByText("Total Registrations")).toBeDefined();
    expect(screen.getByText("Confirmed")).toBeDefined();
    expect(screen.getByText("Cancelled")).toBeDefined();
    expect(screen.getByText("Total Guests")).toBeDefined();
  });

  it("renders quick links", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 0,
      confirmed: 0,
      cancelled: 0,
      totalGuests: 0,
    });

    const page = await AdminDashboardPage();
    render(page);

    const regLink = screen.getByRole("link", { name: /registrations/i });
    expect(regLink).toBeDefined();
    expect(regLink.getAttribute("href")).toBe("/admin/registrations");

    const exportLink = screen.getByRole("link", { name: /export csv/i });
    expect(exportLink).toBeDefined();
    expect(exportLink.getAttribute("href")).toBe("/api/admin/registrations/export");
  });
});
