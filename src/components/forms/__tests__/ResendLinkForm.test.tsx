/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResendLinkForm } from "../ResendLinkForm";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

describe("ResendLinkForm", () => {
  it("renders email field and submit button", () => {
    render(<ResendLinkForm />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Send Manage Link" }),
    ).toBeDefined();
  });

  it("shows validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<ResendLinkForm />);
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    expect(screen.getByText("Please enter a valid email address")).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<ResendLinkForm />);
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    expect(screen.getByText("Please enter a valid email address")).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits to /api/resend-link and shows success message on 200", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { sent: true },
        message:
          "If this email is registered, a manage link has been sent.",
      }),
    });

    render(<ResendLinkForm />);
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "If this email is registered, a manage link has been sent.",
        ),
      ).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/resend-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com" }),
    });
  });

  it("shows identical success message regardless of email existence", async () => {
    const user = userEvent.setup();
    // API always returns 200 with same message (S5)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { sent: true },
        message:
          "If this email is registered, a manage link has been sent.",
      }),
    });

    render(<ResendLinkForm />);
    await user.type(
      screen.getByLabelText("Email"),
      "nonexistent@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "If this email is registered, a manage link has been sent.",
        ),
      ).toBeDefined();
    });
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveResponse!: (value: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );

    render(<ResendLinkForm />);
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    // Button should show loading state
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Sending…" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    // Resolve to clean up
    resolveResponse({
      ok: true,
      status: 200,
      json: async () => ({ data: { sent: true }, message: "ok" }),
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "If this email is registered, a manage link has been sent.",
        ),
      ).toBeDefined();
    });
  });

  it("shows rate limit error on 429", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    render(<ResendLinkForm />);
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Too many attempts. Please try again later."),
      ).toBeDefined();
    });
  });

  it("shows generic error on network failure", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    render(<ResendLinkForm />);
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send Manage Link" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred. Please try again."),
      ).toBeDefined();
    });
  });
});
