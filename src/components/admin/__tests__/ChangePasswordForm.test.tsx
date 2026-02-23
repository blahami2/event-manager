/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChangePasswordForm } from "../ChangePasswordForm";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all password fields", () => {
    render(<ChangePasswordForm />);
    expect(screen.getByLabelText("currentPassword")).toBeDefined();
    expect(screen.getByLabelText("newPassword")).toBeDefined();
    expect(screen.getByLabelText("confirmPassword")).toBeDefined();
  });

  it("should render submit button", () => {
    render(<ChangePasswordForm />);
    expect(screen.getByRole("button", { name: "submit" })).toBeDefined();
  });

  it("should show mismatch error when passwords do not match", async () => {
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("currentPassword"), { target: { value: "oldpass1" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "different1" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("errorMismatch");
    });
  });

  it("should show min length error for short passwords", async () => {
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("currentPassword"), { target: { value: "oldpass1" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("errorMinLength");
    });
  });

  it("should show same password error", async () => {
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("currentPassword"), { target: { value: "samepass1" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "samepass1" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "samepass1" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("errorSamePassword");
    });
  });

  it("should show success message on successful submission", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { success: true } }) });

    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("currentPassword"), { target: { value: "oldpass1" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("success");
    });
  });

  it("should show error on 403 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: "Current password is incorrect" } }),
    });

    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("currentPassword"), { target: { value: "wrong123" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("errorCurrentIncorrect");
    });
  });

  it("should show generic error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("currentPassword"), { target: { value: "oldpass1" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("errorGeneric");
    });
  });
});
