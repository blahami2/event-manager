/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
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
  RegistrationFilters: ({
    value,
    onChange,
  }: {
    readonly value: {
      readonly status: string;
      readonly stay: string;
      readonly accommodation: string;
      readonly search: string;
    };
    readonly onChange: (value: {
      readonly status: string;
      readonly stay: string;
      readonly accommodation: string;
      readonly search: string;
    }) => void;
  }) => (
    <div data-testid="filters-stub">
      <button
        type="button"
        onClick={() => onChange({ ...value, search: "newest" })}
      >
        search-newest
      </button>
    </div>
  ),
}));
vi.mock("@/components/admin/RegistrationTable", () => ({
  RegistrationTable: ({
    registrations,
    onEdit,
    selectedIds,
    onToggleSelect,
  }: {
    readonly registrations: ReadonlyArray<{ id: string }>;
    readonly onEdit: (registration: { id: string }) => void;
    readonly selectedIds: ReadonlySet<string>;
    readonly onToggleSelect: (id: string) => void;
  }) => (
    <div data-testid="table-stub">
      {registrations.length} rows
      {registrations.map((r) => (
        <span key={r.id}>
          <button type="button" onClick={() => onEdit(r)}>
            {`edit-${r.id}`}
          </button>
          <button type="button" onClick={() => onToggleSelect(r.id)}>
            {`select-${r.id}`}
          </button>
        </span>
      ))}
      <span data-testid="selected-count">{selectedIds.size}</span>
    </div>
  ),
}));
vi.mock("@/components/admin/Pagination", () => ({
  Pagination: ({
    onPageChange,
    onPageSizeChange,
  }: {
    readonly onPageChange: (page: number) => void;
    readonly onPageSizeChange: (pageSize: number) => void;
  }) => (
    <div data-testid="pagination-stub">
      <button type="button" onClick={() => onPageChange(2)}>page-2</button>
      <button type="button" onClick={() => onPageSizeChange(100)}>page-size-100</button>
    </div>
  ),
}));
// The edit modal is stubbed down to the two things the page owns: it triggers
// a save, and it renders whatever server-side field errors the page hands back.
vi.mock("@/components/admin/EditRegistrationModal", () => ({
  // The page filters server field errors against this list, so the stub has to
  // carry it too — otherwise the test would exercise an empty allow-list rather
  // than the real one.
  EDITABLE_FIELDS: [
    "name",
    "email",
    "stay",
    "accommodation",
    "adultsCount",
    "childrenCount",
    "notes",
    "stayStartDate",
    "stayEndDate",
  ],
  EditRegistrationModal: ({
    registration,
    onSave,
    serverFieldErrors,
  }: {
    readonly registration: { id: string };
    readonly onSave: (id: string, data: Record<string, unknown>) => void;
    readonly serverFieldErrors?: Readonly<Record<string, string>>;
  }) => (
    <div data-testid="edit-modal-stub">
      <button
        type="button"
        onClick={() =>
          onSave(registration.id, {
            stayStartDate: "2026-07-13",
            stayEndDate: "2026-07-10",
          })
        }
      >
        save-stub
      </button>
      <span data-testid="server-field-errors">
        {serverFieldErrors ? JSON.stringify(serverFieldErrors) : "none"}
      </span>
    </div>
  ),
}));

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

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function listResponse(id: string): {
  readonly ok: true;
  readonly status: 200;
  readonly json: () => Promise<Record<string, unknown>>;
} {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        items: [{ id }],
        total: 1,
        page: 1,
        pageSize: 50,
      },
    }),
  };
}

// Must import AFTER mocks
import AdminRegistrationsPage, { pageAfterDeletion } from "../page";
import { ToastProvider } from "@/components/ui/admin";

function renderPage(): ReturnType<typeof render> {
  return render(
    <ToastProvider>
      <AdminRegistrationsPage />
    </ToastProvider>,
  );
}

describe("AdminRegistrationsPage — deletion pagination", () => {
  it("moves to the prior page after deleting the only row on a later page", () => {
    expect(pageAfterDeletion(3, 1)).toBe(2);
  });

  it("keeps the current page when rows remain or it is already the first page", () => {
    expect(pageAfterDeletion(3, 2)).toBe(3);
    expect(pageAfterDeletion(1, 1)).toBe(1);
  });
});

describe("AdminRegistrationsPage — selection visibility", () => {
  function mockStableList(): void {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve(listResponse("visible-registration"));
    });
  }

  async function selectVisibleRegistration(): Promise<void> {
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "select-visible-registration" }))
        .toBeDefined(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "select-visible-registration" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("selected-count").textContent).toBe("1"),
    );
    expect(
      screen.getByRole("link", { name: "admin.registrations.bulk.export" })
        .getAttribute("href"),
    ).toBe("/api/admin/registrations/export?id=visible-registration");
  }

  it("clears selection and hidden bulk payloads when filters change", async () => {
    mockStableList();
    renderPage();
    await selectVisibleRegistration();

    fireEvent.click(screen.getByRole("button", { name: "search-newest" }));

    await waitFor(() =>
      expect(screen.getByTestId("selected-count").textContent).toBe("0"),
    );
    expect(
      screen.queryByRole("region", {
        name: "admin.registrations.bulk.region",
      }),
    ).toBeNull();
    expect(fetchMock.mock.calls.some(([, init]) =>
      (init as RequestInit | undefined)?.method === "POST",
    )).toBe(false);
  });

  it.each(["page-2", "page-size-100"])(
    "clears selection when pagination changes via %s",
    async (control) => {
      mockStableList();
      renderPage();
      await selectVisibleRegistration();

      fireEvent.click(screen.getByRole("button", { name: control }));

      await waitFor(() =>
        expect(screen.getByTestId("selected-count").textContent).toBe("0"),
      );
      expect(
        screen.queryByRole("region", {
          name: "admin.registrations.bulk.region",
        }),
      ).toBeNull();
    },
  );

  it("clears the mutated ID even when a same-page refetch still contains it", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      if (init?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { id: "visible-registration" } }),
        });
      }
      return Promise.resolve(listResponse("visible-registration"));
    });
    renderPage();
    await selectVisibleRegistration();
    fireEvent.click(
      screen.getByRole("button", { name: "edit-visible-registration" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    await waitFor(() =>
      expect(screen.queryByTestId("edit-modal-stub")).toBeNull(),
    );
    expect(
      screen.queryByRole("region", {
        name: "admin.registrations.bulk.region",
      }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "admin.registrations.downloadCsv" })
        .getAttribute("href"),
    ).toBe("/api/admin/registrations/export");
  });

  it("drops a selected ID removed by a same-page data refetch", async () => {
    let visibleId = "visible-registration";
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      if (init?.method === "PUT") {
        visibleId = "replacement-registration";
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { id: "visible-registration" } }),
        });
      }
      return Promise.resolve(listResponse(visibleId));
    });
    renderPage();
    await selectVisibleRegistration();
    fireEvent.click(
      screen.getByRole("button", { name: "edit-visible-registration" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "edit-replacement-registration" }),
      ).toBeDefined(),
    );
    expect(
      screen.queryByRole("region", {
        name: "admin.registrations.bulk.region",
      }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "admin.registrations.downloadCsv" })
        .getAttribute("href"),
    ).toBe("/api/admin/registrations/export");
  });

  it("removes a mutated ID from bulk actions before its refresh resolves", async () => {
    const pendingRefresh = deferred<ReturnType<typeof listResponse>>();
    let mutationSucceeded = false;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      if (init?.method === "PUT") {
        mutationSucceeded = true;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { id: "visible-registration" } }),
        });
      }
      return mutationSucceeded
        ? pendingRefresh.promise
        : Promise.resolve(listResponse("visible-registration"));
    });
    renderPage();
    await selectVisibleRegistration();
    fireEvent.click(
      screen.getByRole("button", { name: "edit-visible-registration" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    await waitFor(() =>
      expect(screen.queryByTestId("edit-modal-stub")).toBeNull(),
    );
    expect(
      screen.queryByRole("region", {
        name: "admin.registrations.bulk.region",
      }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "admin.registrations.downloadCsv" })
        .getAttribute("href"),
    ).toBe("/api/admin/registrations/export");

    await act(async () => {
      pendingRefresh.resolve(listResponse("visible-registration"));
      await pendingRefresh.promise;
    });
  });
});

describe("AdminRegistrationsPage — request sequencing", () => {
  it("keeps loading and data controlled by the newest request when responses arrive out of order", async () => {
    const older = deferred<ReturnType<typeof listResponse>>();
    const newer = deferred<ReturnType<typeof listResponse>>();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      return url.includes("search=newest") ? newer.promise : older.promise;
    });

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "search-newest" }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) =>
        typeof url === "string" && url.includes("search=newest"),
      )).toBe(true),
    );

    newer.resolve(listResponse("newest"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "edit-newest" })).toBeDefined(),
    );
    expect(screen.queryByRole("status")).toBeNull();

    older.resolve(listResponse("stale"));
    await older.promise;
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "edit-newest" })).toBeDefined(),
    );
    expect(screen.queryByRole("button", { name: "edit-stale" })).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("ignores an older request error after a newer request has started", async () => {
    const older = deferred<ReturnType<typeof listResponse>>();
    const newer = deferred<ReturnType<typeof listResponse>>();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      return url.includes("search=newest") ? newer.promise : older.promise;
    });

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "search-newest" }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) =>
        typeof url === "string" && url.includes("search=newest"),
      )).toBe(true),
    );

    older.reject(new Error("stale failure"));
    await expect(older.promise).rejects.toThrow("stale failure");
    expect(screen.queryByText("admin.registrations.errorLoad")).toBeNull();
    expect(screen.getByRole("status")).toBeDefined();

    newer.resolve(listResponse("newest"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "edit-newest" })).toBeDefined(),
    );
    expect(screen.queryByText("admin.registrations.errorLoad")).toBeNull();
  });

  it("lets the newest request control the error and loading state", async () => {
    const older = deferred<ReturnType<typeof listResponse>>();
    const newer = deferred<ReturnType<typeof listResponse>>();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      return url.includes("search=newest") ? newer.promise : older.promise;
    });

    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "search-newest" }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) =>
        typeof url === "string" && url.includes("search=newest"),
      )).toBe(true),
    );

    older.resolve(listResponse("stale"));
    await older.promise;
    newer.reject(new Error("newest failure"));

    await waitFor(() =>
      expect(screen.getByText("admin.registrations.errorLoad")).toBeDefined(),
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("button", { name: "edit-stale" })).toBeNull();
  });

  it("does not commit state or show an error after unmount", async () => {
    const pending = deferred<ReturnType<typeof listResponse>>();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/admin/registrations/stats") {
        return Promise.resolve({ ok: false });
      }
      return pending.promise;
    });

    const view = render(
      <ToastProvider>
        <AdminRegistrationsPage />
      </ToastProvider>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    view.rerender(<ToastProvider>{null}</ToastProvider>);

    pending.reject(new Error("finished after unmount"));
    await expect(pending.promise).rejects.toThrow("finished after unmount");
    await Promise.resolve();

    expect(screen.queryByText("admin.registrations.errorLoad")).toBeNull();
  });
});

describe("AdminRegistrationsPage — Add reservation", () => {
  it("should render an 'Add reservation' button when page loads", async () => {
    // given
    mockListResponse(0);

    // when
    renderPage();

    // then
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "admin.registrations.addReservation" })).toBeDefined();
    });
  });

  it("should open the AddRegistrationModal when 'Add reservation' button is clicked", async () => {
    // given
    mockListResponse(0);
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: "admin.registrations.addReservation" }));

    // when
    fireEvent.click(screen.getByRole("button", { name: "admin.registrations.addReservation" }));

    // then
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("should close the AddRegistrationModal when cancel is clicked inside it", async () => {
    // given
    mockListResponse(0);
    renderPage();
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
    renderPage();
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

/**
 * A `400` from the edit endpoint carries field-level detail (for example an
 * inverted custom stay range). The page must route that detail back into the
 * modal rather than collapsing it into a generic toast and closing the form,
 * which would discard the admin's unsaved input.
 */
describe("AdminRegistrationsPage — edit validation errors", () => {
  function mockEditResponse(
    ok: boolean,
    status: number,
    body: Record<string, unknown>,
  ): void {
    fetchMock.mockResolvedValueOnce({
      ok,
      status,
      json: async () => body,
    });
  }

  async function openEditModal(): Promise<void> {
    mockListResponse(1);
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: "edit-r-0" }));
    fireEvent.click(screen.getByRole("button", { name: "edit-r-0" }));
    await waitFor(() => screen.getByTestId("edit-modal-stub"));
  }

  it("should keep the modal open and surface field errors when the save is rejected", async () => {
    // given
    await openEditModal();
    mockEditResponse(false, 400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: { stayEndDate: "End date must not be before the start date" },
      },
    });

    // when
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    // then
    await waitFor(() => {
      expect(screen.getByTestId("server-field-errors").textContent).toContain("stayEndDate");
    });
    expect(screen.getByTestId("edit-modal-stub")).toBeDefined();
  });

  it("should close the modal and clear field errors after a successful save", async () => {
    // given
    await openEditModal();
    mockEditResponse(true, 200, { data: { id: "r-0" }, message: "ok" });
    mockListResponse(1);

    // when
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    // then
    await waitFor(() => {
      expect(screen.queryByTestId("edit-modal-stub")).toBeNull();
    });
  });

  /**
   * Only a `400` carries field-level detail. Treating any failing response with
   * a `fields`-shaped body as a validation failure would leave the modal open
   * and silent on an expired session or a server fault — the admin would keep
   * pressing save against a request that can never succeed.
   */
  it.each([
    ["401", 401, "UNAUTHENTICATED"],
    ["403", 403, "UNAUTHORIZED"],
    ["500", 500, "INTERNAL_ERROR"],
  ])("should not treat a %s as a field-level validation failure", async (_label, status, code) => {
    // given
    await openEditModal();
    mockEditResponse(false, status, {
      error: { code, message: "Nope", fields: { stayEndDate: "should be ignored" } },
    });

    // when
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    // then
    // - the generic failure toast is the observable end of that path; waiting
    //   for it first means the "no field errors" assertion cannot pass merely
    //   because the state has not updated yet
    await waitFor(() => {
      expect(screen.getByText("admin.registrations.errorUpdate")).toBeDefined();
    });
    expect(screen.getByTestId("server-field-errors").textContent).toBe("none");
  });

  /**
   * A `400` can name a field the modal has no input for — `body` (malformed
   * JSON) or `registrationId` (a client bug). Routing those into the modal
   * closed the loop on nothing: the modal renders per-input messages only, so
   * Save appeared to do nothing at all, with no message anywhere.
   */
  it.each([["body"], ["registrationId"]])(
    "should fall back to the generic error when the only rejected field is %s",
    async (field) => {
      // given
      await openEditModal();
      mockEditResponse(false, 400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: { [field]: "Request body must be valid JSON" },
        },
      });

      // when
      fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

      // then
      await waitFor(() => {
        expect(screen.getByText("admin.registrations.errorUpdate")).toBeDefined();
      });
      expect(screen.getByTestId("server-field-errors").textContent).toBe("none");
    },
  );

  it("should still surface field errors when the response names a rendered field too", async () => {
    // given
    // - a mixed map must not lose the part the admin can act on
    await openEditModal();
    mockEditResponse(false, 400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: { registrationId: "bad id", email: "Invalid email format" },
      },
    });

    // when
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));

    // then
    await waitFor(() => {
      expect(screen.getByTestId("server-field-errors").textContent).toContain("email");
    });
    expect(screen.getByTestId("edit-modal-stub")).toBeDefined();
  });

  it("should drop stale field errors when the modal is reopened", async () => {
    // given
    // - a rejected save leaves errors on screen
    await openEditModal();
    mockEditResponse(false, 400, {
      error: { code: "VALIDATION_ERROR", message: "Validation failed", fields: { stayEndDate: "bad" } },
    });
    fireEvent.click(screen.getByRole("button", { name: "save-stub" }));
    await waitFor(() => {
      expect(screen.getByTestId("server-field-errors").textContent).toContain("stayEndDate");
    });

    // when
    // - the admin re-opens the row without saving
    fireEvent.click(screen.getByRole("button", { name: "edit-r-0" }));

    // then
    expect(screen.getByTestId("server-field-errors").textContent).toBe("none");
  });
});
