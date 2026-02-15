/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next-intl/server
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

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

  it("should render dashboard heading when page loads", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 10,
      confirmed: 7,
      cancelled: 3,
      totalAdults: 20,
      totalChildren: 5,
    });

    const page = await AdminDashboardPage();
    render(page);

    expect(screen.getByText("title")).toBeDefined();
  });

  it("should display registration statistics when stats loaded", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 15,
      confirmed: 10,
      cancelled: 5,
      totalAdults: 25,
      totalChildren: 5,
    });

    const page = await AdminDashboardPage();
    render(page);

    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("25")).toBeDefined();
  });

  it("should display translated stat labels when page loads", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 0,
      confirmed: 0,
      cancelled: 0,
      totalAdults: 0,
      totalChildren: 0,
    });

    const page = await AdminDashboardPage();
    render(page);

    expect(screen.getByText("totalRegistrations")).toBeDefined();
    expect(screen.getByText("confirmed")).toBeDefined();
    expect(screen.getByText("cancelled")).toBeDefined();
    expect(screen.getByText("totalAdults")).toBeDefined();
    expect(screen.getByText("totalChildren")).toBeDefined();
  });

  it("should render quick links when page loads", async () => {
    mockGetRegistrationStats.mockResolvedValue({
      total: 0,
      confirmed: 0,
      cancelled: 0,
      totalAdults: 0,
      totalChildren: 0,
    });

    const page = await AdminDashboardPage();
    render(page);

    const regLink = screen.getByRole("link", { name: "viewRegistrations" });
    expect(regLink).toBeDefined();
    expect(regLink.getAttribute("href")).toBe("/admin/registrations");

    const exportLink = screen.getByRole("link", { name: "exportCsv" });
    expect(exportLink).toBeDefined();
    expect(exportLink.getAttribute("href")).toBe("/api/admin/registrations/export");
  });
});
