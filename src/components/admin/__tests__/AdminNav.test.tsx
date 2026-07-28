/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminNav } from "../AdminNav";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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

  it("should render a brand link pointing to /admin", () => {
    render(<AdminNav />);
    // The dashboard page was retired; the brand mark still links to /admin
    // (which silently redirects to /admin/registrations).
    const link = screen.getByRole("link", { name: "title" });
    expect(link.getAttribute("href")).toBe("/admin");
  });

  it("should render registrations link when component mounts", () => {
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: "registrations" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/admin/registrations");
  });

  it("should render logout button when component mounts", () => {
    render(<AdminNav />);
    const button = screen.getByRole("button", { name: "logout" });
    expect(button).toBeDefined();
  });

  it("should call signOut and redirect on logout when logout button clicked", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    render(<AdminNav />);

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });

  it("should render admin title when component mounts", () => {
    render(<AdminNav />);
    expect(screen.getByText("title")).toBeDefined();
  });

  it("should toggle the mobile navigation and collapse after choosing a link", () => {
    render(<AdminNav />);
    const toggle = screen.getByRole("button", { name: "openMenu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "closeMenu" }).getAttribute("aria-expanded"))
      .toBe("true");
    const registrationLinks = screen.getAllByRole("link", { name: "registrations" });
    const mobileRegistrationLink = registrationLinks[registrationLinks.length - 1];
    expect(mobileRegistrationLink).toBeDefined();
    mobileRegistrationLink?.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(mobileRegistrationLink as HTMLElement);

    expect(screen.getByRole("button", { name: "openMenu" }).getAttribute("aria-expanded"))
      .toBe("false");
  });
});
