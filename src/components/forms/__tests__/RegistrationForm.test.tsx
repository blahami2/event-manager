/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IntlWrapper } from "@/test/intl-wrapper";
import { RegistrationForm } from "../RegistrationForm";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

async function fillForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText("Participant"), "Alice");
  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.selectOptions(screen.getByLabelText("Stay"), "FRI_SUN");
  // adultsCount defaults to 1, childrenCount defaults to 0
}

describe("RegistrationForm", () => {
  it("renders all form fields", () => {
    render(<RegistrationForm />, { wrapper: IntlWrapper });
    expect(screen.getByLabelText("Participant")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Stay")).toBeDefined();
    expect(screen.getByLabelText("Number of Adults")).toBeDefined();
    expect(screen.getByLabelText("Number of Children")).toBeDefined();
    expect(screen.getByLabelText("Notes (anything else)")).toBeDefined();
    expect(screen.getByRole("button", { name: "Submit Reservation" })).toBeDefined();
  });

  it("shows client-side validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    expect(screen.getByText("Name is required")).toBeDefined();
    expect(screen.getByText("Invalid email format")).toBeDefined();
    expect(screen.getByText("Please select a stay option")).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits successfully and shows success message", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        data: { registrationId: "123" },
        message: "Registration successful.",
      }),
    });

    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Registration successful! Check your email for your manage link.",
        ),
      ).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        email: "alice@example.com",
        stay: "FRI_SUN",
        adultsCount: 1,
        childrenCount: 0,
      }),
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (v: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    expect(screen.getByRole("button", { name: "Submitting…" })).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Submitting…" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    resolveFetch({ ok: true, status: 201, json: async () => ({}) });
  });

  it("shows rate limit error on 429", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      }),
    });

    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    await waitFor(() => {
      expect(
        screen.getByText("Too many attempts. Please try again later."),
      ).toBeDefined();
    });
  });

  it("shows field-level errors on 400 with fields", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: { email: "Email already registered" },
        },
      }),
    });

    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeDefined();
    });
  });

  it("shows generic error on 500", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
      }),
    });

    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "An unexpected error occurred. Please try again.",
        ),
      ).toBeDefined();
    });
  });

  it("shows generic error on network failure", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    render(<RegistrationForm />, { wrapper: IntlWrapper });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Submit Reservation" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "An unexpected error occurred. Please try again.",
        ),
      ).toBeDefined();
    });
  });

  it("adults count dropdown has options 1-10", () => {
    render(<RegistrationForm />, { wrapper: IntlWrapper });
    const select = screen.getByLabelText("Number of Adults") as HTMLSelectElement;
    expect(select.options.length).toBe(10);
    expect(select.options[0]?.value).toBe("1");
    expect(select.options[9]?.value).toBe("10");
  });

  it("children count dropdown has options 0-10", () => {
    render(<RegistrationForm />, { wrapper: IntlWrapper });
    const select = screen.getByLabelText("Number of Children") as HTMLSelectElement;
    expect(select.options.length).toBe(11);
    expect(select.options[0]?.value).toBe("0");
    expect(select.options[10]?.value).toBe("10");
  });

  it("stay dropdown has correct options", () => {
    render(<RegistrationForm />, { wrapper: IntlWrapper });
    const select = screen.getByLabelText("Stay") as HTMLSelectElement;
    // placeholder + 4 options
    expect(select.options.length).toBe(5);
    expect(select.options[1]?.value).toBe("FRI_SAT");
    expect(select.options[2]?.value).toBe("SAT_SUN");
    expect(select.options[3]?.value).toBe("FRI_SUN");
    expect(select.options[4]?.value).toBe("SAT_ONLY");
  });
});
