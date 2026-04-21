/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddRegistrationModal } from "../AddRegistrationModal";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText("name"), "Alice Smith");
  await user.type(screen.getByLabelText("email"), "alice@example.com");
  await user.selectOptions(screen.getByLabelText("stay"), "SAT_SUN");
  // - accommodation, adultsCount default to valid values; childrenCount stays at 0
}

describe("AddRegistrationModal", () => {
  it("should render dialog with all required form fields when opened", () => {
    // given
    // when
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // then
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByLabelText("name")).toBeDefined();
    expect(screen.getByLabelText("email")).toBeDefined();
    expect(screen.getByLabelText("stay")).toBeDefined();
    expect(screen.getByLabelText("accommodation")).toBeDefined();
    expect(screen.getByLabelText("adultsCount")).toBeDefined();
    expect(screen.getByLabelText("childrenCount")).toBeDefined();
    expect(screen.getByLabelText("notes")).toBeDefined();
    expect(screen.getByRole("button", { name: "submit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "cancel" })).toBeDefined();
  });

  it("should call onClose when cancel button is clicked", () => {
    // given
    const onClose = vi.fn();
    render(<AddRegistrationModal onClose={onClose} onCreated={vi.fn()} />);

    // when
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    // then
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show client-side validation errors when submitting empty form", async () => {
    // given
    const user = userEvent.setup();
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    expect(screen.getByText("errorNameRequired")).toBeDefined();
    expect(screen.getByText("errorEmailInvalid")).toBeDefined();
    expect(screen.getByText("errorStayRequired")).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should POST form data to /api/register when submitted with valid values", async () => {
    // given
    // - server accepts the registration
    const user = userEvent.setup();
    const onCreated = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { registrationId: "r-1" }, message: "ok" }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={onCreated} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/registrations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alice Smith",
          email: "alice@example.com",
          stay: "SAT_SUN",
          accommodation: "ANYWHERE",
          adultsCount: 1,
          childrenCount: 0,
        }),
      });
    });
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
  });

  it("should include notes in the request body when notes were entered", async () => {
    // given
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { registrationId: "r-2" }, message: "ok" }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await fillValidForm(user);
    await user.type(screen.getByLabelText("notes"), "Vegan");
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      if (!lastCall) throw new Error("fetch was not called");
      const body = JSON.parse(lastCall[1].body) as { notes?: string };
      expect(body.notes).toBe("Vegan");
    });
  });

  it("should disable submit button and show submitting label while request is pending", async () => {
    // given
    const user = userEvent.setup();
    let resolveFetch!: (v: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    const submitBtn = await screen.findByRole("button", { name: "submitting" });
    expect(submitBtn).toBeDefined();
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    // - let the pending request settle so no act() warnings leak into later tests
    resolveFetch({ ok: true, status: 201, json: async () => ({}) });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("should display field-level errors returned by the server on 400", async () => {
    // given
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
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeDefined();
    });
  });

  it("should display a rate limit error message when server returns 429", async () => {
    // given
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: "RATE_LIMITED", message: "Too many" } }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      expect(screen.getByText("errorRateLimited")).toBeDefined();
    });
  });

  it("should display a generic error message on a 500 response", async () => {
    // given
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { code: "INTERNAL", message: "boom" } }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      expect(screen.getByText("errorGeneric")).toBeDefined();
    });
  });

  it("should display a generic error message when fetch throws a network error", async () => {
    // given
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      expect(screen.getByText("errorGeneric")).toBeDefined();
    });
  });

  it("should not call onCreated when the server returns a validation error", async () => {
    // given
    const user = userEvent.setup();
    const onCreated = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: { email: "bad" },
        },
      }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={onCreated} />);

    // when
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      expect(screen.getByText("bad")).toBeDefined();
    });
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("should offer all four stay options in the stay dropdown", () => {
    // given
    // - the admin modal must expose every StayOption value so admins can
    //   set or correct registrations to legacy stays (FRI_SAT, FRI_SUN) as
    //   well as the currently sold ones (SAT_SUN, SAT_ONLY)
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    const select = screen.getByLabelText("stay") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);

    // then
    expect(values).toContain("FRI_SAT");
    expect(values).toContain("SAT_SUN");
    expect(values).toContain("FRI_SUN");
    expect(values).toContain("SAT_ONLY");
  });

  it("should allow admin to submit a FRI_SAT stay", async () => {
    // given
    // - admin chooses a legacy stay option that is no longer publicly offered
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { registrationId: "r-4" }, message: "ok" }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await user.type(screen.getByLabelText("name"), "Carol");
    await user.type(screen.getByLabelText("email"), "carol@example.com");
    await user.selectOptions(screen.getByLabelText("stay"), "FRI_SAT");
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      if (!lastCall) throw new Error("fetch was not called");
      const body = JSON.parse(lastCall[1].body) as { stay: string };
      expect(body.stay).toBe("FRI_SAT");
    });
  });

  it("should force accommodation to NONE when SAT_ONLY stay is selected", async () => {
    // given
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { registrationId: "r-3" }, message: "ok" }),
    });
    render(<AddRegistrationModal onClose={vi.fn()} onCreated={vi.fn()} />);

    // when
    await user.type(screen.getByLabelText("name"), "Bob");
    await user.type(screen.getByLabelText("email"), "bob@example.com");
    await user.selectOptions(screen.getByLabelText("stay"), "SAT_ONLY");
    await user.click(screen.getByRole("button", { name: "submit" }));

    // then
    await waitFor(() => {
      const lastCall = fetchMock.mock.calls.at(-1);
      if (!lastCall) throw new Error("fetch was not called");
      const body = JSON.parse(lastCall[1].body) as { accommodation: string };
      expect(body.accommodation).toBe("NONE");
    });
  });
});
