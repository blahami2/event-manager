/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditRegistrationModal } from "../EditRegistrationModal";
import { SUPPORTED_STAY_DATE_MAX, SUPPORTED_STAY_DATE_MIN } from "@/config/event";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) =>
    namespace === "common" && key === "close" ? "Close" : key,
}));

const mockReg: RegistrationOutput = {
  id: "reg-1",
  name: "John Doe",
  email: "john@example.com",
  stay: StayOption.FRI_SUN,
  accommodation: AccommodationOption.ANYWHERE,
  adultsCount: 2,
  childrenCount: 1,
  notes: "Vegan",
  stayStartDate: null,
  stayEndDate: null,
  status: RegistrationStatus.CONFIRMED,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

describe("EditRegistrationModal", () => {
  it("should render with pre-filled values when registration provided", () => {
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);
    expect((screen.getByLabelText("name") as HTMLInputElement).value).toBe("John Doe");
    expect((screen.getByLabelText("email") as HTMLInputElement).value).toBe("john@example.com");
    expect((screen.getByLabelText("stay") as HTMLSelectElement).value).toBe("FRI_SUN");
    expect((screen.getByLabelText("adultsCount") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("childrenCount") as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText("notes") as HTMLTextAreaElement).value).toBe("Vegan");
  });

  it("should call onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onSave with updated data when form submitted", () => {
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("adultsCount"), { target: { value: "3" } });
    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    expect(onSave).toHaveBeenCalledWith("reg-1", {
      name: "Jane Doe",
      email: "john@example.com",
      stay: "FRI_SUN",
      accommodation: "ANYWHERE",
      adultsCount: 3,
      childrenCount: 1,
      notes: "Vegan",
      stayStartDate: null,
      stayEndDate: null,
    });
  });

  it("should render dialog with accessible role when mounted", () => {
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("should offer all four stay options when registration has a legacy stay", () => {
    // given
    // - registration currently uses a legacy stay (FRI_SUN)
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // when
    const select = screen.getByLabelText("stay") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);

    // then
    // - admin can pick any of the four stay options regardless of the
    //   registration's current value (legacy stays included)
    expect(values).toContain("FRI_SAT");
    expect(values).toContain("SAT_SUN");
    expect(values).toContain("FRI_SUN");
    expect(values).toContain("SAT_ONLY");
  });

  it("should offer all four stay options when registration has a current stay", () => {
    // given
    // - registration currently uses a sold stay option (SAT_SUN)
    const satSunReg: RegistrationOutput = { ...mockReg, stay: StayOption.SAT_SUN };
    render(<EditRegistrationModal registration={satSunReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // when
    const select = screen.getByLabelText("stay") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);

    // then
    // - admin can still access the legacy stay options (FRI_SAT, FRI_SUN)
    //   for data-entry / correction scenarios
    expect(values).toContain("FRI_SAT");
    expect(values).toContain("SAT_SUN");
    expect(values).toContain("FRI_SUN");
    expect(values).toContain("SAT_ONLY");
  });
});

/**
 * Issue #101: administrators must be able to set any date range, not only the
 * dates implied by a predefined stay option. The stay select stays as a
 * convenience — enabling the custom range prefills it from the selected stay.
 */
describe("EditRegistrationModal custom date range", () => {
  /** Submit the modal's form directly; the footer button is outside `<form>` semantics in jsdom. */
  function submitForm(): void {
    const form = screen.getByRole("dialog").querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);
  }

  it("should hide the date inputs when the registration has no custom range", () => {
    // given
    // - a registration that relies on its predefined stay option
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // then
    expect((screen.getByLabelText("customDates") as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByLabelText("arrivalDate")).toBeNull();
    expect(screen.queryByLabelText("departureDate")).toBeNull();
  });

  it("should show the stored range when the registration has a custom range", () => {
    // given
    // - an arbitrary range that matches no predefined stay option
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };
    render(<EditRegistrationModal registration={customReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // then
    expect((screen.getByLabelText("customDates") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("arrivalDate") as HTMLInputElement).value).toBe("2026-07-10");
    expect((screen.getByLabelText("departureDate") as HTMLInputElement).value).toBe("2026-07-13");
  });

  it("should prefill the range from the selected stay option when enabled", () => {
    // given
    // - the registration is on SAT_SUN, whose predefined dates are 6–7 June 2026
    const satSunReg: RegistrationOutput = { ...mockReg, stay: StayOption.SAT_SUN };
    render(<EditRegistrationModal registration={satSunReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // when
    fireEvent.click(screen.getByLabelText("customDates"));

    // then
    expect((screen.getByLabelText("arrivalDate") as HTMLInputElement).value).toBe("2026-06-06");
    expect((screen.getByLabelText("departureDate") as HTMLInputElement).value).toBe("2026-06-07");
  });

  it("should submit an arbitrary range outside the event weekend", () => {
    // given
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));

    // when
    fireEvent.change(screen.getByLabelText("arrivalDate"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-09-30" } });
    submitForm();

    // then
    expect(onSave).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ stayStartDate: "2026-09-01", stayEndDate: "2026-09-30" }),
    );
  });

  it("should submit a single-day range when arrival and departure match", () => {
    // given
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));

    // when
    fireEvent.change(screen.getByLabelText("arrivalDate"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-09-01" } });
    submitForm();

    // then
    expect(onSave).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ stayStartDate: "2026-09-01", stayEndDate: "2026-09-01" }),
    );
  });

  it("should submit nulls when an existing range is switched off", () => {
    // given
    // - an existing custom range the admin wants to drop in favour of the
    //   predefined stay option
    const onSave = vi.fn();
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };
    render(<EditRegistrationModal registration={customReg} onSave={onSave} onClose={vi.fn()} />);

    // when
    fireEvent.click(screen.getByLabelText("customDates"));
    submitForm();

    // then
    expect(onSave).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ stayStartDate: null, stayEndDate: null }),
    );
  });

  it("should block submission and show an error when departure precedes arrival", () => {
    // given
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));

    // when
    fireEvent.change(screen.getByLabelText("arrivalDate"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-09-01" } });
    submitForm();

    // then
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("errorDateRangeOrder");
  });

  it("should block submission and show an error when one date is missing", () => {
    // given
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));

    // when
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "" } });
    submitForm();

    // then
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("errorDateRangeIncomplete");
  });

  it("should clear the error once the range is corrected", () => {
    // given
    // - an admin who fixes their mistake should not be stuck with a stale error
    const onSave = vi.fn();
    render(<EditRegistrationModal registration={mockReg} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));
    fireEvent.change(screen.getByLabelText("arrivalDate"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-09-01" } });
    submitForm();

    // when
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-10-01" } });
    submitForm();

    // then
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onSave).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ stayStartDate: "2026-09-30", stayEndDate: "2026-10-01" }),
    );
  });

  it("should keep the stay select available so predefined options stay usable", () => {
    // given
    // - the custom range overrides the calendar dates but the stay option is
    //   still the value shown in tables, filters and exports
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };
    render(<EditRegistrationModal registration={customReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // then
    expect((screen.getByLabelText("stay") as HTMLSelectElement).value).toBe("FRI_SUN");
  });
});

/**
 * The prefilled range is machine-generated, so it must track the stay option
 * until an admin takes ownership of it by typing. Otherwise switching the stay
 * option silently leaves dates belonging to the previous one.
 */
describe("EditRegistrationModal prefill tracking", () => {
  it("should refresh an untouched prefilled range when the stay option changes", () => {
    // given
    // - custom dates enabled on SAT_SUN, prefilled and not edited
    const satSunReg: RegistrationOutput = { ...mockReg, stay: StayOption.SAT_SUN };
    render(<EditRegistrationModal registration={satSunReg} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));

    // when
    // - the admin switches to FRI_SAT, whose dates are 5–6 June 2026
    fireEvent.change(screen.getByLabelText("stay"), { target: { value: "FRI_SAT" } });

    // then
    expect((screen.getByLabelText("arrivalDate") as HTMLInputElement).value).toBe("2026-06-05");
    expect((screen.getByLabelText("departureDate") as HTMLInputElement).value).toBe("2026-06-06");
  });

  it("should keep admin-entered dates when the stay option changes", () => {
    // given
    // - the admin typed their own range, so it is no longer a machine default
    const satSunReg: RegistrationOutput = { ...mockReg, stay: StayOption.SAT_SUN };
    render(<EditRegistrationModal registration={satSunReg} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("customDates"));
    fireEvent.change(screen.getByLabelText("arrivalDate"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-09-30" } });

    // when
    fireEvent.change(screen.getByLabelText("stay"), { target: { value: "FRI_SAT" } });

    // then
    expect((screen.getByLabelText("arrivalDate") as HTMLInputElement).value).toBe("2026-09-01");
    expect((screen.getByLabelText("departureDate") as HTMLInputElement).value).toBe("2026-09-30");
  });

  it("should keep a stored range when the stay option changes", () => {
    // given
    // - a range an admin previously saved is data, not a default
    const customReg: RegistrationOutput = {
      ...mockReg,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };
    render(<EditRegistrationModal registration={customReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // when
    fireEvent.change(screen.getByLabelText("stay"), { target: { value: "FRI_SAT" } });

    // then
    expect((screen.getByLabelText("arrivalDate") as HTMLInputElement).value).toBe("2026-07-10");
    expect((screen.getByLabelText("departureDate") as HTMLInputElement).value).toBe("2026-07-13");
  });

  it("should not prefill anything when the stay option changes with the toggle off", () => {
    // given
    render(<EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />);

    // when
    fireEvent.change(screen.getByLabelText("stay"), { target: { value: "FRI_SAT" } });

    // then
    expect((screen.getByLabelText("customDates") as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByLabelText("arrivalDate")).toBeNull();
  });
});

/**
 * The server owns the authoritative range rules. When it rejects a range, its
 * field-level messages must land on the field they belong to instead of being
 * flattened into a generic toast.
 */
describe("EditRegistrationModal server-side errors", () => {
  const customReg: RegistrationOutput = {
    ...mockReg,
    stayStartDate: "2026-07-10",
    stayEndDate: "2026-07-13",
  };

  it("should show a server error against the departure field", () => {
    // given
    render(
      <EditRegistrationModal
        registration={customReg}
        onSave={vi.fn()}
        onClose={vi.fn()}
        serverFieldErrors={{ stayEndDate: "End date must not be before the start date" }}
      />,
    );

    // then
    expect(screen.getByRole("alert").textContent).toBe(
      "End date must not be before the start date",
    );
  });

  it("should show a server error against the arrival field", () => {
    // given
    render(
      <EditRegistrationModal
        registration={customReg}
        onSave={vi.fn()}
        onClose={vi.fn()}
        serverFieldErrors={{ stayStartDate: "Date must be a valid calendar date" }}
      />,
    );

    // then
    expect(screen.getByRole("alert").textContent).toBe("Date must be a valid calendar date");
  });

  it("should prefer the local error once the admin edits an invalid range", () => {
    // given
    // - the server rejected the range, then the admin made it invalid locally
    render(
      <EditRegistrationModal
        registration={customReg}
        onSave={vi.fn()}
        onClose={vi.fn()}
        serverFieldErrors={{ stayEndDate: "Stale server message" }}
      />,
    );

    // when
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "2026-07-01" } });
    const form = screen.getByRole("dialog").querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    // then
    expect(screen.getByRole("alert").textContent).toBe("errorDateRangeOrder");
  });

  it("should ignore server errors for fields the modal does not render", () => {
    // given
    // - `registrationId` and `body` are payload-level fields with no input to
    //   attach to; they must not be pinned onto an unrelated one
    render(
      <EditRegistrationModal
        registration={customReg}
        onSave={vi.fn()}
        onClose={vi.fn()}
        serverFieldErrors={{ registrationId: "registrationId must be a valid UUID" }}
      />,
    );

    // then
    expect(screen.queryByRole("alert")).toBeNull();
  });

  /**
   * The server validates the whole payload, not just the date range, so every
   * field it can reject needs somewhere to display that rejection. Without this
   * the modal would sit open and silent after a `400` on, say, `email` — the
   * admin would see their edits refused with no indication of why.
   */
  it.each([
    ["name", "Name is required"],
    ["email", "Invalid email format"],
    ["adultsCount", "Maximum 10 adults allowed"],
    ["childrenCount", "Children count cannot be negative"],
    ["notes", "Notes must be at most 500 characters"],
  ])("should show a server error against the %s field", (field, message) => {
    // given
    render(
      <EditRegistrationModal
        registration={mockReg}
        onSave={vi.fn()}
        onClose={vi.fn()}
        serverFieldErrors={{ [field]: message }}
      />,
    );

    // then
    expect(screen.getByRole("alert").textContent).toBe(message);
  });

  it("should show every rejected field at once", () => {
    // given
    // - one round trip should surface every correction the admin has to make
    render(
      <EditRegistrationModal
        registration={mockReg}
        onSave={vi.fn()}
        onClose={vi.fn()}
        serverFieldErrors={{
          email: "Invalid email format",
          adultsCount: "Maximum 10 adults allowed",
        }}
      />,
    );

    // then
    const messages = screen.getAllByRole("alert").map((el) => el.textContent);
    expect(messages).toContain("Invalid email format");
    expect(messages).toContain("Maximum 10 adults allowed");
  });
});

/**
 * The supported window is a server rule, so the form has to state it. Native
 * `min`/`max` make the out-of-range dates unreachable in the date picker, and
 * the explicit check covers typed input, which the picker does not constrain.
 */
describe("EditRegistrationModal supported date window", () => {
  const customReg: RegistrationOutput = {
    ...mockReg,
    stayStartDate: "2026-07-10",
    stayEndDate: "2026-07-13",
  };

  it("should bound both date inputs to the supported window", () => {
    // given
    render(
      <EditRegistrationModal registration={customReg} onSave={vi.fn()} onClose={vi.fn()} />,
    );

    // then
    const arrival = screen.getByLabelText("arrivalDate") as HTMLInputElement;
    const departure = screen.getByLabelText("departureDate") as HTMLInputElement;
    expect(arrival.min).toBe(SUPPORTED_STAY_DATE_MIN);
    expect(arrival.max).toBe(SUPPORTED_STAY_DATE_MAX);
    expect(departure.min).toBe(SUPPORTED_STAY_DATE_MIN);
    expect(departure.max).toBe(SUPPORTED_STAY_DATE_MAX);
  });

  it("should block submission and show an error when the arrival date predates the window", () => {
    // given
    const onSave = vi.fn();
    render(
      <EditRegistrationModal registration={customReg} onSave={onSave} onClose={vi.fn()} />,
    );

    // when
    fireEvent.change(screen.getByLabelText("arrivalDate"), { target: { value: "1850-01-01" } });
    const form = screen.getByRole("dialog").querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    // then
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("errorDateRangeBounds");
  });

  it("should block submission and show an error when the departure date is beyond the window", () => {
    // given
    const onSave = vi.fn();
    render(
      <EditRegistrationModal registration={customReg} onSave={onSave} onClose={vi.fn()} />,
    );

    // when
    fireEvent.change(screen.getByLabelText("departureDate"), { target: { value: "9999-12-31" } });
    const form = screen.getByRole("dialog").querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    // then
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("errorDateRangeBounds");
  });

  /**
   * Irreversible admin delete (issue #102).
   *
   * The action lives behind the edit modal rather than in the list or the
   * read-only drawer: reaching it already takes a deliberate step, and it keeps
   * a one-click destructive control out of the row-level surfaces where the
   * neighbouring click merely cancels.
   */
  describe("delete action", () => {
    it("should not render the delete control when no handler is supplied", () => {
      // given
      // - callers that do not grant delete get exactly the previous modal
      render(
        <EditRegistrationModal registration={mockReg} onSave={vi.fn()} onClose={vi.fn()} />,
      );

      // then
      expect(screen.queryByText("delete")).toBeNull();
    });

    it("should require confirmation before deleting", () => {
      // given
      const onDelete = vi.fn();
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={onDelete}
        />,
      );

      // when
      fireEvent.click(screen.getByText("delete"));

      // then
      // - the confirmation is shown and nothing has been deleted yet
      expect(screen.getByText("confirmDeleteMessage")).toBeTruthy();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("should delete the registration when the confirmation is accepted", async () => {
      // given
      const onDelete = vi.fn();
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByText("delete"));

      // when
      fireEvent.click(screen.getByText("confirmDeleteConfirm"));

      // then
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("reg-1");
      });
    });

    it("should disable confirmation while deletion is in flight", async () => {
      let resolveDelete: (() => void) | undefined;
      const onDelete = vi.fn(
        () => new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
      );
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByText("delete"));

      const confirm = screen.getByText("confirmDeleteConfirm");
      fireEvent.click(confirm);
      fireEvent.click(confirm);

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledOnce();
      });
      expect((confirm as HTMLButtonElement).disabled).toBe(true);

      resolveDelete?.();
      await waitFor(() => {
        expect(screen.queryByText("confirmDeleteMessage")).toBeNull();
      });
    });

    it("should keep both dialogs locked while deletion is in flight", async () => {
      let resolveDelete: (() => void) | undefined;
      const onClose = vi.fn();
      const onDelete = vi.fn(
        () => new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
      );
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={onClose}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByText("delete"));
      fireEvent.click(screen.getByText("confirmDeleteConfirm"));
      await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());

      const backdrops = screen.getAllByTestId("modal-backdrop");
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      fireEvent.keyDown(document, { key: "Escape" });
      backdrops.forEach((backdrop) => fireEvent.click(backdrop));
      closeButtons.forEach((button) => fireEvent.click(button));

      expect(screen.getAllByRole("dialog")).toHaveLength(2);
      expect(onClose).not.toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalledOnce();

      resolveDelete?.();
      await waitFor(() => {
        expect(screen.queryByText("confirmDeleteMessage")).toBeNull();
      });
    });

    it("should release the guard when the delete callback throws synchronously", async () => {
      const onDelete = vi.fn(() => {
        throw new Error("callback failed");
      });
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByText("delete"));

      expect(() => {
        fireEvent.click(screen.getByText("confirmDeleteConfirm"));
      }).not.toThrow();
      await waitFor(() => {
        expect(screen.queryByText("confirmDeleteMessage")).toBeNull();
      });
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should let Escape dismiss only the nested confirmation", () => {
      const onClose = vi.fn();
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={onClose}
          onDelete={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByText("delete"));

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByText("confirmDeleteMessage")).toBeNull();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByLabelText("name")).toBeDefined();
    });

    it("should delete nothing when the confirmation is dismissed", () => {
      // given
      const onDelete = vi.fn();
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByText("delete"));

      // when
      fireEvent.click(screen.getByText("confirmDeleteDismiss"));

      // then
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByText("confirmDeleteMessage")).toBeNull();
    });

    it("should not save the form when the delete control is used", () => {
      // given
      // - the control sits in the footer next to Save; it must not submit
      const onSave = vi.fn();
      render(
        <EditRegistrationModal
          registration={mockReg}
          onSave={onSave}
          onClose={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      // when
      fireEvent.click(screen.getByText("delete"));

      // then
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it("should accept the exact edges of the supported window", () => {
    // given
    const onSave = vi.fn();
    render(
      <EditRegistrationModal registration={customReg} onSave={onSave} onClose={vi.fn()} />,
    );

    // when
    fireEvent.change(screen.getByLabelText("arrivalDate"), {
      target: { value: SUPPORTED_STAY_DATE_MIN },
    });
    fireEvent.change(screen.getByLabelText("departureDate"), {
      target: { value: SUPPORTED_STAY_DATE_MAX },
    });
    const form = screen.getByRole("dialog").querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    // then
    expect(onSave).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({
        stayStartDate: SUPPORTED_STAY_DATE_MIN,
        stayEndDate: SUPPORTED_STAY_DATE_MAX,
      }),
    );
  });
});
