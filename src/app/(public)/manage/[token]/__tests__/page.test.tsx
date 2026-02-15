/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { IntlWrapper } from "@/test/intl-wrapper";
import { ManageForm } from "../ManageForm";
import type { RegistrationOutput } from "@/types/registration";
import { RegistrationStatus, StayOption } from "@/types/registration";

const fetchMock = vi.fn();

const VALID_TOKEN = "test-token-12345678";

const mockRegistration: RegistrationOutput = {
  id: "reg-001",
  name: "Alice Smith",
  email: "alice@example.com",
  stay: StayOption.FRI_SUN,
  adultsCount: 2,
  childrenCount: 1,
  notes: "Vegetarian",
  status: RegistrationStatus.CONFIRMED,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function renderForm(): ReturnType<typeof render> {
  return render(
    <ManageForm registration={mockRegistration} token={VALID_TOKEN} />,
    { wrapper: IntlWrapper },
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubGlobal("confirm", vi.fn(() => false));
});

describe("ManageForm", () => {
  describe("displays registration details", () => {
    it("renders edit form pre-populated with registration data", () => {
      renderForm();

      expect(
        (screen.getByLabelText("Name") as HTMLInputElement).value,
      ).toBe("Alice Smith");
      expect(
        (screen.getByLabelText("Email") as HTMLInputElement).value,
      ).toBe("alice@example.com");
      expect(
        (screen.getByLabelText("Stay") as HTMLSelectElement).value,
      ).toBe("FRI_SUN");
      expect(
        (screen.getByLabelText("Number of Adults") as HTMLSelectElement).value,
      ).toBe("2");
      expect(
        (screen.getByLabelText("Number of Children") as HTMLSelectElement).value,
      ).toBe("1");
      expect(
        (screen.getByLabelText("Notes (optional)") as HTMLTextAreaElement).value,
      ).toBe("Vegetarian");
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Cancel Registration" }),
      ).toBeDefined();
    });

    it("does not display the token anywhere on the page", () => {
      renderForm();
      expect(document.body.textContent).not.toContain(VALID_TOKEN);
    });
  });

  describe("edit form – save", () => {
    it("calls PUT /api/manage on save and shows success message", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { newManageUrl: "http://localhost:3000/manage/newtoken123" },
          message: "Registration updated",
        }),
      });

      renderForm();

      const nameInput = screen.getByLabelText("Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Bob Jones");
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(screen.getByText(/updated successfully/i)).toBeDefined();
      });

      expect(fetchMock).toHaveBeenCalledWith("/api/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"name":"Bob Jones"'),
      });
    });

    it("shows manage link notice after successful save", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { newManageUrl: "http://localhost:3000/manage/newtoken123" },
          message: "Registration updated",
        }),
      });

      renderForm();
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(
          screen.getByText(/new manage link has been sent/i),
        ).toBeDefined();
      });
    });

    it("shows validation errors from API on save", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            fields: { email: "Invalid email format" },
          },
        }),
      });

      renderForm();
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid email format")).toBeDefined();
      });
    });

    it("shows client-side validation errors for empty name", async () => {
      const user = userEvent.setup();
      renderForm();

      const nameInput = screen.getByLabelText("Name");
      await user.clear(nameInput);
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeDefined();
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows loading state during save", async () => {
      const user = userEvent.setup();
      let resolveFetch!: (v: unknown) => void;
      fetchMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      renderForm();
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      expect(screen.getByRole("button", { name: "Saving…" })).toBeDefined();
      expect(
        (screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ data: {}, message: "ok" }),
      });
    });
  });

  describe("cancel registration", () => {
    it("shows confirmation dialog on cancel click", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal("confirm", confirmMock);

      renderForm();
      await user.click(
        screen.getByRole("button", { name: "Cancel Registration" }),
      );

      expect(confirmMock).toHaveBeenCalled();
    });

    it("calls DELETE /api/manage on confirmed cancel and shows cancelled message", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("confirm", vi.fn(() => true));
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: null, message: "Registration cancelled" }),
      });

      renderForm();
      await user.click(
        screen.getByRole("button", { name: "Cancel Registration" }),
      );

      await waitFor(() => {
        expect(screen.getByText("Registration cancelled")).toBeDefined();
      });

      expect(fetchMock).toHaveBeenCalledWith("/api/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: VALID_TOKEN }),
      });
    });

    it("does not cancel when confirmation is declined", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("confirm", vi.fn(() => false));

      renderForm();
      await user.click(
        screen.getByRole("button", { name: "Cancel Registration" }),
      );

      expect(screen.getByDisplayValue("Alice Smith")).toBeDefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("rate limit", () => {
    it("shows rate limit message on 429 during save", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        }),
      });

      renderForm();
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(
          screen.getByText("Too many attempts. Please try again later."),
        ).toBeDefined();
      });
    });

    it("shows rate limit message on 429 during cancel", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("confirm", vi.fn(() => true));
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        }),
      });

      renderForm();
      await user.click(
        screen.getByRole("button", { name: "Cancel Registration" }),
      );

      await waitFor(() => {
        expect(
          screen.getByText("Too many attempts. Please try again later."),
        ).toBeDefined();
      });
    });
  });
});
