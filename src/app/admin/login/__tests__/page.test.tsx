/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../page";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock supabase client
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/auth/supabase-client", () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render email and password fields when page loads", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("email")).toBeDefined();
    expect(screen.getByLabelText("password")).toBeDefined();
  });

  it("should render submit button when page loads", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "submit" })).toBeDefined();
  });

  it("should call signInWithPassword on submit when form submitted", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: {} },
      error: null,
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("email"), {
      target: { value: "admin@test.com" },
    });
    fireEvent.change(screen.getByLabelText("password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@test.com",
        password: "password123",
      });
    });
  });

  it("should redirect to /admin on successful login when credentials valid", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: "test" } },
      error: null,
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("email"), {
      target: { value: "admin@test.com" },
    });
    fireEvent.change(screen.getByLabelText("password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  it("should show error message on failure when credentials invalid", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("email"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(screen.getByLabelText("password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText("error")).toBeDefined();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should render page title when page loads", () => {
    render(<LoginPage />);
    expect(screen.getByText("title")).toBeDefined();
  });
});
