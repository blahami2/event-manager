/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RegistrationTable } from "../RegistrationTable";
import { AccommodationOption, RegistrationStatus, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

// Mock next-intl: passthrough keys so we can assert on canonical enum keys
// such as `enums.stay.FRI_SUN`.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function makeRegistration(overrides: Partial<RegistrationOutput> = {}): RegistrationOutput {
  return {
    id: "reg-1",
    name: "John Doe",
    email: "john@example.com",
    stay: StayOption.FRI_SUN,
    accommodation: AccommodationOption.ANYWHERE,
    adultsCount: 2,
    childrenCount: 0,
    notes: null,
    status: RegistrationStatus.CONFIRMED,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    ...overrides,
  };
}

/**
 * Scope queries to the desktop `<table>` layout. The component also renders
 * a mobile card list (CSS toggles visibility at the `md` breakpoint) which
 * jsdom will include in the DOM — scoping keeps assertions unambiguous.
 */
function getDesktopTable(): HTMLElement {
  const tbl = document.querySelector("table");
  if (!tbl) throw new Error("Desktop table not mounted");
  return tbl as HTMLElement;
}

describe("RegistrationTable", () => {
  const defaultProps = {
    registrations: [makeRegistration()],
    onEdit: vi.fn(),
    onCancel: vi.fn(),
  };

  it("should render empty state when no registrations", () => {
    render(<RegistrationTable registrations={[]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("noResults")).toBeDefined();
  });

  it("should render table headers including notes when registrations exist", () => {
    render(<RegistrationTable {...defaultProps} />);
    const table = within(getDesktopTable());
    expect(table.getByText("name")).toBeDefined();
    expect(table.getByText("email")).toBeDefined();
    expect(table.getByText("stay")).toBeDefined();
    expect(table.getByText("adults")).toBeDefined();
    expect(table.getByText("children")).toBeDefined();
    expect(table.getByText("notes")).toBeDefined();
    expect(table.getByText("status")).toBeDefined();
    expect(table.getByText("created")).toBeDefined();
    expect(table.getByText("actions")).toBeDefined();
  });

  it("should render registration data resolved via canonical enum labels", () => {
    render(<RegistrationTable {...defaultProps} />);
    const table = within(getDesktopTable());
    expect(table.getByText("John Doe")).toBeDefined();
    expect(table.getByText("john@example.com")).toBeDefined();
    // - stay/accommodation/status resolve to enums.* keys (the canonical
    //   labels routed through the single `i18n/labels.ts` module).
    expect(table.getByText("enums.stay.FRI_SUN")).toBeDefined();
    expect(table.getByText("enums.accommodation.ANYWHERE")).toBeDefined();
    expect(table.getByText("enums.status.CONFIRMED")).toBeDefined();
    // - adults count rendered
    expect(table.getByText("2")).toBeDefined();
  });

  it("should show edit, cancel, and resend buttons for confirmed registration", () => {
    render(<RegistrationTable {...defaultProps} />);
    const table = within(getDesktopTable());
    expect(table.getByRole("button", { name: "edit" })).toBeDefined();
    expect(table.getByRole("button", { name: "cancel" })).toBeDefined();
    expect(table.getByRole("button", { name: "resendEmail" })).toBeDefined();
  });

  it("should hide cancel and resend buttons for cancelled registration", () => {
    const cancelled = makeRegistration({ status: RegistrationStatus.CANCELLED });
    render(<RegistrationTable registrations={[cancelled]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    const table = within(getDesktopTable());
    expect(table.getByRole("button", { name: "edit" })).toBeDefined();
    expect(table.queryByRole("button", { name: "cancel" })).toBeNull();
    expect(table.queryByRole("button", { name: "resendEmail" })).toBeNull();
  });

  it("should call onEdit when edit is clicked", () => {
    const onEdit = vi.fn();
    const reg = makeRegistration();
    render(<RegistrationTable registrations={[reg]} onEdit={onEdit} onCancel={vi.fn()} />);
    fireEvent.click(within(getDesktopTable()).getByRole("button", { name: "edit" }));
    expect(onEdit).toHaveBeenCalledWith(reg);
  });

  it("should show confirmation dialog when cancel is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(within(getDesktopTable()).getByRole("button", { name: "cancel" }));
    // - the dialog is mounted and its message appears (may appear more than
    //   once if the dialog uses the same string for title and body)
    expect(screen.getAllByText("confirmCancel").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "yes" })).toBeDefined();
    expect(screen.getByRole("button", { name: "no" })).toBeDefined();
  });

  it("should call onCancel when confirmation is accepted", () => {
    const onCancel = vi.fn();
    render(<RegistrationTable {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(within(getDesktopTable()).getByRole("button", { name: "cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "yes" }));
    expect(onCancel).toHaveBeenCalledWith("reg-1");
  });

  it("should dismiss confirmation when no is clicked", () => {
    render(<RegistrationTable {...defaultProps} />);
    fireEvent.click(within(getDesktopTable()).getByRole("button", { name: "cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "no" }));
    expect(screen.queryByText("confirmCancel")).toBeNull();
  });

  it("should display short notes inline without an expand affordance", () => {
    // given
    // - a note comfortably below the preview threshold
    const regWithNotes = makeRegistration({ notes: "Vegetarian diet" });

    // when
    render(<RegistrationTable registrations={[regWithNotes]} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then
    const table = within(getDesktopTable());
    expect(table.getByText("Vegetarian diet")).toBeDefined();
    // - no expand toggle for short notes in the table
    expect(table.queryByText("notesExpand")).toBeNull();
  });

  it("should expand long notes when the expand button is clicked", () => {
    // given
    // - a note longer than the preview threshold
    const longNote = "A".repeat(200);
    const regWithLongNote = makeRegistration({ notes: longNote });

    // when
    render(<RegistrationTable registrations={[regWithLongNote]} onEdit={vi.fn()} onCancel={vi.fn()} />);
    const table = within(getDesktopTable());
    // - expand button visible
    const expandBtn = table.getByRole("button", { name: "notesExpand" });
    fireEvent.click(expandBtn);

    // then
    // - collapse label now visible in the same table row
    expect(table.getByRole("button", { name: "notesCollapse" })).toBeDefined();
    // - the full note is rendered somewhere
    expect(table.getByText(longNote)).toBeDefined();
  });

  it("should render sortable headers when onSortChange is provided", () => {
    // given
    const onSortChange = vi.fn();

    // when
    render(
      <RegistrationTable
        {...defaultProps}
        sort={{ key: "name", direction: "asc" }}
        onSortChange={onSortChange}
      />,
    );

    // then
    const table = within(getDesktopTable());
    // - the Name header is now a button (sortable)
    const nameHeader = table.getByRole("button", { name: /name/i });
    expect(nameHeader).toBeDefined();
    // - the aria-sort on the active column reflects direction
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
  });

  it("should toggle sort direction when the active column header is clicked twice", () => {
    // given
    const onSortChange = vi.fn();
    render(
      <RegistrationTable
        {...defaultProps}
        sort={{ key: "name", direction: "asc" }}
        onSortChange={onSortChange}
      />,
    );

    // when
    // - clicking the already-active Name header flips direction
    fireEvent.click(
      within(getDesktopTable()).getByRole("button", { name: /name/i }),
    );

    // then
    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: "desc" });
  });

  it("should switch to a new column with ascending direction on first click", () => {
    // given
    const onSortChange = vi.fn();
    render(
      <RegistrationTable
        {...defaultProps}
        sort={{ key: "name", direction: "desc" }}
        onSortChange={onSortChange}
      />,
    );

    // when
    // - clicking a different column header
    fireEvent.click(
      within(getDesktopTable()).getByRole("button", { name: /status/i }),
    );

    // then
    expect(onSortChange).toHaveBeenCalledWith({
      key: "status",
      direction: "asc",
    });
  });

  it("should render row checkboxes when selection is enabled", () => {
    // given
    // - selection is opt-in via the `selection` prop
    const onSelectionChange = vi.fn();

    // when
    render(
      <RegistrationTable
        {...defaultProps}
        selection={{ selectedIds: new Set<string>(), onSelectionChange }}
      />,
    );

    // then
    // - one checkbox per row + one select-all header checkbox
    const table = within(getDesktopTable());
    const checkboxes = table.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it("should invoke onSelectionChange with the row id when a row checkbox is clicked", () => {
    // given
    const onSelectionChange = vi.fn();

    // when
    render(
      <RegistrationTable
        {...defaultProps}
        selection={{ selectedIds: new Set<string>(), onSelectionChange }}
      />,
    );
    // - click the first non-header checkbox
    const table = within(getDesktopTable());
    const rowCheckbox = table.getByLabelText("selectRow");
    fireEvent.click(rowCheckbox);

    // then
    // - the callback receives a Set containing just the clicked id
    expect(onSelectionChange).toHaveBeenCalled();
    const arg = onSelectionChange.mock.calls[0]?.[0] as Set<string>;
    expect(arg.has("reg-1")).toBe(true);
  });

  it("should highlight matching substrings in name and email when searchHighlight is set", () => {
    // given
    // - a query substring that matches both name and email
    const reg = makeRegistration({ name: "Alice Cooper", email: "alice@band.com" });

    // when
    render(
      <RegistrationTable
        registrations={[reg]}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        searchHighlight="alice"
      />,
    );

    // then
    const desktopTable = getDesktopTable();
    // - the match is wrapped in a <mark>
    const marks = desktopTable.querySelectorAll("mark");
    expect(marks.length).toBeGreaterThanOrEqual(2);
    // - each mark contains the matched substring (case-insensitive match preserves case)
    for (const mark of Array.from(marks)) {
      expect(mark.textContent?.toLowerCase()).toBe("alice");
    }
  });

  it("should open the detail drawer via onRowClick when a row is clicked", () => {
    // given
    const onRowClick = vi.fn();
    const reg = makeRegistration();

    // when
    render(
      <RegistrationTable
        registrations={[reg]}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onRowClick={onRowClick}
      />,
    );
    // - click on the name cell (not on an action button)
    const table = within(getDesktopTable());
    fireEvent.click(table.getByText("John Doe"));

    // then
    expect(onRowClick).toHaveBeenCalledWith(reg);
  });

  it("should display em-dash when registration has null notes", () => {
    // given
    // - a registration with null notes
    const regWithoutNotes = makeRegistration({ notes: null });

    // when
    render(<RegistrationTable registrations={[regWithoutNotes]} onEdit={vi.fn()} onCancel={vi.fn()} />);

    // then
    const cells = within(getDesktopTable()).getAllByRole("cell");
    const notesCell = cells.find((cell) => cell.textContent === "\u2014");
    expect(notesCell).toBeDefined();
  });
});
