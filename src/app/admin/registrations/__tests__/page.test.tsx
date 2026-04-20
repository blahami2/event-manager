/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next-intl so translation keys are returned as-is with their namespace.
// Uses a memoized translator per namespace to preserve referential stability
// across re-renders (avoids triggering effects that depend on `t`).
const translatorCache = new Map<string, (key: string) => string>();
vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => {
    const key = namespace ?? "";
    const cached = translatorCache.get(key);
    if (cached) return cached;
    const translator = (k: string): string => (namespace ? `${namespace}.${k}` : k);
    translatorCache.set(key, translator);
    return translator;
  },
}));

// Mock child components so the test focuses on page wiring
vi.mock("@/components/admin/RegistrationFilters", () => ({
  RegistrationFilters: () => <div data-testid="filters-stub" />,
}));
vi.mock("@/components/admin/RegistrationTable", () => ({
  RegistrationTable: ({ registrations }: { readonly registrations: ReadonlyArray<{ id: string }> }) => (
    <div data-testid="table-stub">{registrations.length} rows</div>
  ),
}));
vi.mock("@/components/admin/Pagination", () => ({
  Pagination: () => <div data-testid="pagination-stub" />,
}));
vi.mock("@/components/admin/EditRegistrationModal", () => ({
  EditRegistrationModal: () => <div data-testid="edit-modal-stub" />,
}));

// The page uses useToast(); mount the real ToastProvider via a helper render.
import { ToastProvider } from "@/components/ui/admin";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

function mockListResponse(count: number): void {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        items: Array.from({ length: count }, (_, i) => ({ id: `r-${i}` })),
        total: count,
        page: 1,
        pageSize: 20,
      },
      message: "ok",
    }),
  });
}

// Must import AFTER mocks
import AdminRegistrationsPage from "../page";

describe("AdminRegistrationsPage — Add reservation", () => {
  it("should render an 'Add reservation' button when page loads", async () => {
    // given
    mockListResponse(0);

    // when
    render(
      <ToastProvider>
        <AdminRegistrationsPage />
      </ToastProvider>,
    );

    // then
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "admin.registrations.addReservation" })).toBeDefined();
    });
  });

  it("should open the AddRegistrationModal when 'Add reservation' button is clicked", async () => {
    // given
    mockListResponse(0);
    render(
      <ToastProvider>
        <AdminRegistrationsPage />
      </ToastProvider>,
    );
    await waitFor(() => screen.getByRole("button", { name: "admin.registrations.addReservation" }));

    // when
    fireEvent.click(screen.getByRole("button", { name: "admin.registrations.addReservation" }));

    // then
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("should close the AddRegistrationModal when cancel is clicked inside it", async () => {
    // given
    mockListResponse(0);
    render(
      <ToastProvider>
        <AdminRegistrationsPage />
      </ToastProvider>,
    );
    await waitFor(() => screen.getByRole("button", { name: "admin.registrations.addReservation" }));
    fireEvent.click(screen.getByRole("button", { name: "admin.registrations.addReservation" }));
    expect(screen.getByRole("dialog")).toBeDefined();

    // when
    // - the modal's cancel button resolves to its fully namespaced translation key
    fireEvent.click(
      screen.getByRole("button", { name: "admin.registrations.add.cancel" }),
    );

    // then
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should refetch registrations list after a successful add", async () => {
    // given
    const user = userEvent.setup();
    // - initial list fetch
    mockListResponse(0);
    render(
      <ToastProvider>
        <AdminRegistrationsPage />
      </ToastProvider>,
    );
    await waitFor(() => screen.getByRole("button", { name: "admin.registrations.addReservation" }));
    fetchMock.mockClear();

    // - POST /api/admin/registrations/create
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { registrationId: "new-1" }, message: "ok" }),
    });
    // - subsequent list refetch
    mockListResponse(1);

    // when
    fireEvent.click(
      screen.getByRole("button", { name: "admin.registrations.addReservation" }),
    );
    await user.type(
      screen.getByLabelText("admin.registrations.add.name"),
      "Alice",
    );
    await user.type(
      screen.getByLabelText("admin.registrations.add.email"),
      "alice@example.com",
    );
    await user.selectOptions(
      screen.getByLabelText("admin.registrations.add.stay"),
      "SAT_SUN",
    );
    await user.click(
      screen.getByRole("button", { name: "admin.registrations.add.submit" }),
    );

    // then
    await waitFor(() => {
      // - first call: POST to the admin create endpoint
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/registrations/create",
        expect.objectContaining({ method: "POST" }),
      );
    });
    await waitFor(() => {
      // - second call: GET list to refresh (the list endpoint shares the
      //   same prefix, so we filter by the create endpoint to avoid a
      //   false positive match on the POST itself)
      const listCall = fetchMock.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          (call[0] as string).startsWith("/api/admin/registrations") &&
          (call[0] as string) !== "/api/admin/registrations/create",
      );
      expect(listCall).toBeDefined();
    });
    await waitFor(() => {
      // - modal closes after successful add
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
