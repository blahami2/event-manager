"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import type { SortState } from "@/components/admin/RegistrationTable";
import { EditRegistrationModal } from "@/components/admin/EditRegistrationModal";
import type { EditRegistrationPayload } from "@/components/admin/EditRegistrationModal";
import { AddRegistrationModal } from "@/components/admin/AddRegistrationModal";
import { Pagination } from "@/components/admin/Pagination";
import { StatsStrip } from "@/components/admin/StatsStrip";
import type { StatsStripData } from "@/components/admin/StatsStrip";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { RegistrationDrawer } from "@/components/admin/RegistrationDrawer";
import { Button, ConfirmDialog, TableSkeleton, useToast } from "@/components/ui/admin";
import type { PaginatedResult, RegistrationOutput } from "@/types/registration";
import { resolvePageAfterPageSizeChange } from "./page-size-logic";

const DEFAULT_PAGE_SIZE = 20;
const TABLE_COLUMN_COUNT = 11;

interface FetchState {
  readonly data: PaginatedResult<RegistrationOutput> | null;
  readonly loading: boolean;
  readonly error: string | null;
}

async function fetchRegistrations(
  status: string,
  search: string,
  stay: string,
  accommodation: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<RegistrationOutput>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (stay) params.set("stay", stay);
  if (accommodation) params.set("accommodation", accommodation);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const res = await fetch(`/api/admin/registrations?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch registrations");
  }
  const json = (await res.json()) as { data: PaginatedResult<RegistrationOutput> };
  return json.data;
}

/**
 * Client-side filter for stay/accommodation. The backend list API accepts
 * only `status` + `search`, so Tier C's stay/accommodation filters apply
 * after the fetch to avoid an API change. This is explicitly documented
 * so we know the page-size vs. total interaction may be slightly off while
 * stay/accommodation are active — a trade-off the brief accepts; the
 * server-side filtering upgrade is a separate ticket.
 */
function applyClientFilters(
  items: ReadonlyArray<RegistrationOutput>,
  stay: string,
  accommodation: string,
): ReadonlyArray<RegistrationOutput> {
  if (!stay && !accommodation) return items;
  return items.filter((r) => {
    if (stay && r.stay !== stay) return false;
    if (accommodation && r.accommodation !== accommodation) return false;
    return true;
  });
}

/**
 * Client-side sort. The backend returns by `createdAt desc` by default;
 * sorting happens here over the already-paginated page to keep the API
 * surface unchanged.
 */
function applySort(
  items: ReadonlyArray<RegistrationOutput>,
  sort: SortState,
): ReadonlyArray<RegistrationOutput> {
  const copy = [...items];
  const dir = sort.direction === "asc" ? 1 : -1;
  copy.sort((a, b) => {
    switch (sort.key) {
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "status":
        return a.status.localeCompare(b.status) * dir;
      case "createdAt":
      default:
        return (
          (a.createdAt.getTime() - b.createdAt.getTime()) * dir
        );
    }
  });
  return copy;
}

export default function AdminRegistrationsPage(): React.ReactElement {
  const t = useTranslations("admin.registrations");
  const toast = useToast();

  // --- Filter + pagination state -----------------------------------------
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [stay, setStay] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({
    key: "createdAt",
    direction: "desc",
  });

  // --- List + stats state -------------------------------------------------
  const [state, setState] = useState<FetchState>({ data: null, loading: true, error: null });
  const [stats, setStats] = useState<StatsStripData | null>(null);

  // --- Modal / drawer / selection state ----------------------------------
  const [editing, setEditing] = useState<RegistrationOutput | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [drawerRegistration, setDrawerRegistration] = useState<RegistrationOutput | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [bulkResending, setBulkResending] = useState(false);
  const [bulkResendConfirm, setBulkResendConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchRegistrations(status, search, stay, accommodation, page, pageSize);
      setState({ data, loading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: t("errorLoad") }));
    }
  }, [status, search, stay, accommodation, page, pageSize, t]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/registrations/stats");
      if (!res.ok) return;
      const body = (await res.json()) as { data: StatsStripData };
      setStats(body.data);
    } catch {
      // Stats are purely informational; a failed stats fetch never blocks
      // the main list. Silently ignore.
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // --- Handlers -----------------------------------------------------------
  const handleStatusChange = useCallback((v: string) => {
    setStatus(v);
    setPage(1);
  }, []);
  const handleStayChange = useCallback((v: string) => {
    setStay(v);
    setPage(1);
  }, []);
  const handleAccommodationChange = useCallback((v: string) => {
    setAccommodation(v);
    setPage(1);
  }, []);
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  const handleClearAllFilters = useCallback(() => {
    setStatus("");
    setSearch("");
    setStay("");
    setAccommodation("");
    setPage(1);
  }, []);

  /**
   * Page-size change keeps the current page when possible and only resets
   * to page 1 if the new page would be beyond the total.
   */
  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      const total = state.data?.total ?? 0;
      setPageSize(newPageSize);
      setPage((currentPage) =>
        resolvePageAfterPageSizeChange({
          currentPage,
          newPageSize,
          total,
        }),
      );
    },
    [state.data?.total],
  );

  const handleCancel = useCallback(
    async (registrationId: string) => {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) throw new Error("Failed to cancel registration");
        setDrawerRegistration(null);
        await loadData();
        await loadStats();
      } catch {
        toast.error(t("errorCancel"));
      }
    },
    [loadData, loadStats, t, toast],
  );

  const handleResendEmail = useCallback(
    async (registrationId: string) => {
      setResendingId(registrationId);
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) throw new Error("Failed to resend email");
        toast.success(t("table.resendSuccess"));
      } catch {
        toast.error(t("table.resendError"));
      } finally {
        setResendingId(null);
      }
    },
    [t, toast],
  );

  const handleEdit = useCallback((registration: RegistrationOutput) => {
    setDrawerRegistration(null);
    setEditing(registration);
  }, []);
  const handleOpenAdd = useCallback(() => setIsAdding(true), []);
  const handleCloseAdd = useCallback(() => setIsAdding(false), []);
  const handleAddCreated = useCallback(async () => {
    setIsAdding(false);
    toast.success(t("addSuccess"));
    await loadData();
    await loadStats();
  }, [loadData, loadStats, t, toast]);

  const handleSave = useCallback(
    async (id: string, data: EditRegistrationPayload) => {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: id, ...data }),
        });
        if (!res.ok) throw new Error("Failed to update registration");
        setEditing(null);
        await loadData();
        await loadStats();
      } catch {
        toast.error(t("errorUpdate"));
      }
    },
    [loadData, loadStats, t, toast],
  );

  const handleRowClick = useCallback((reg: RegistrationOutput) => {
    setDrawerRegistration(reg);
  }, []);

  // --- Bulk actions -------------------------------------------------------
  const selectedRegistrations = useMemo(() => {
    const byId = new Map((state.data?.items ?? []).map((r) => [r.id, r]));
    return Array.from(selectedIds)
      .map((id) => byId.get(id))
      .filter((r): r is RegistrationOutput => r !== undefined);
  }, [selectedIds, state.data?.items]);

  const handleBulkExport = useCallback(() => {
    if (selectedRegistrations.length === 0) return;
    const params = new URLSearchParams();
    for (const reg of selectedRegistrations) {
      params.append("id", reg.id);
    }
    // The export endpoint streams all registrations server-side; passing
    // `id` params scopes the CSV to selected rows (graceful fallback:
    // a server that ignores the params simply exports everything).
    const url = `/api/admin/registrations/export?${params.toString()}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "registrations.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [selectedRegistrations]);

  const handleBulkResend = useCallback(async () => {
    if (selectedRegistrations.length === 0) return;
    setBulkResendConfirm(false);
    setBulkResending(true);
    let success = 0;
    let failed = 0;
    for (const reg of selectedRegistrations) {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: reg.id }),
        });
        if (res.ok) success += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkResending(false);
    setSelectedIds(new Set());
    if (failed === 0) {
      toast.success(t("bulkResendSuccess", { count: success }));
    } else {
      toast.error(
        t("bulkResendPartial", {
          success,
          failed,
          total: selectedRegistrations.length,
        }),
      );
    }
  }, [selectedRegistrations, t, toast]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // --- Derived list (client filters + sort applied on the fetched page) --
  const displayItems = useMemo(() => {
    if (!state.data) return [] as ReadonlyArray<RegistrationOutput>;
    const filtered = applyClientFilters(state.data.items, stay, accommodation);
    return applySort(filtered, sort);
  }, [state.data, stay, accommodation, sort]);

  return (
    <div>
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-text-primary)]">
            {t("title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handleOpenAdd}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t("addReservation")}
          </Button>
          <a
            href="/api/admin/registrations/export"
            download
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors duration-[var(--motion-fast)] hover:bg-[color:var(--color-surface-3)] hover:border-[color:var(--color-border-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-surface-0)]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
              />
            </svg>
            {t("downloadCsv")}
          </a>
        </div>
      </header>

      <div className="mt-6">
        <StatsStrip stats={stats} />
      </div>

      <div className="mt-6">
        <RegistrationFilters
          status={status}
          search={search}
          stay={stay}
          accommodation={accommodation}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
          onStayChange={handleStayChange}
          onAccommodationChange={handleAccommodationChange}
          onClearAll={handleClearAllFilters}
        />
      </div>

      <div className="mt-4">
        {state.error && (
          <div
            className="mb-4 rounded-[var(--radius-md)] border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 p-3 text-sm text-[color:var(--color-danger)]"
            role="alert"
          >
            {state.error}
          </div>
        )}

        {state.loading ? (
          <TableSkeleton
            rows={pageSize > 10 ? 10 : pageSize}
            columns={TABLE_COLUMN_COUNT}
            label={t("loading")}
          />
        ) : state.data ? (
          <>
            <RegistrationTable
              registrations={displayItems}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onResendEmail={handleResendEmail}
              resendingId={resendingId}
              sort={sort}
              onSortChange={setSort}
              selection={{ selectedIds, onSelectionChange: setSelectedIds }}
              onRowClick={handleRowClick}
              searchHighlight={search}
            />
            <Pagination
              page={state.data.page}
              pageSize={state.data.pageSize}
              total={state.data.total}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        ) : null}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onExport={handleBulkExport}
        onResendEmails={() => setBulkResendConfirm(true)}
        onClear={handleClearSelection}
        resending={bulkResending}
      />

      <ConfirmDialog
        open={bulkResendConfirm}
        title={t("bulkResend")}
        message={t("bulkResendConfirm", { count: selectedIds.size })}
        confirmLabel={t("bulkResend")}
        dismissLabel={t("table.no")}
        onConfirm={handleBulkResend}
        onDismiss={() => setBulkResendConfirm(false)}
      />

      {editing && (
        <EditRegistrationModal
          registration={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
      {isAdding && (
        <AddRegistrationModal
          onClose={handleCloseAdd}
          onCreated={handleAddCreated}
        />
      )}
      <RegistrationDrawer
        registration={drawerRegistration}
        onClose={() => setDrawerRegistration(null)}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onResendEmail={handleResendEmail}
      />
    </div>
  );
}
