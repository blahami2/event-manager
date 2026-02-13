/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminNav } from "../AdminNav";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/admin",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock supabase client
const mockSignOut = vi.fn();
vi.mock("@/lib/auth/supabase-client", () => ({
  createBrowserClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

describe("AdminNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Dashboard link", () => {
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/admin");
  });

  it("renders Registrations link", () => {
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: /registrations/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/admin/registrations");
  });

  it("renders Logout button", () => {
    render(<AdminNav />);
    const button = screen.getByRole("button", { name: /logout/i });
    expect(button).toBeDefined();
  });

  it("calls signOut and redirects on logout", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    render(<AdminNav />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });
});
