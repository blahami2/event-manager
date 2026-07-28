"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RegistrationFilters,
  type RegistrationFiltersValue,
} from "@/components/admin/RegistrationFilters";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import {
  EDITABLE_FIELDS,
  EditRegistrationModal,
} from "@/components/admin/EditRegistrationModal";
import type { EditRegistrationPayload } from "@/components/admin/EditRegistrationModal";
import { AddRegistrationModal } from "@/components/admin/AddRegistrationModal";
import { Pagination } from "@/components/admin/Pagination";
import { StatsStrip, type RegistrationStats } from "@/components/admin/StatsStrip";
import { RegistrationDrawer } from "@/components/admin/RegistrationDrawer";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Button, SkeletonRow, useToast } from "@/components/ui/admin";
import type { RegistrationOutput, PaginatedResult } from "@/types/registration";

const DEFAULT_PAGE_SIZE = 50;

const EMPTY_FILTERS: RegistrationFiltersValue = {
  status: "",
  stay: "",
  accommodation: "",
  search: "",
};

/** Keep pagination valid after removing the current page's final row. */
export function pageAfterDeletion(page: number, itemCount: number): number {
  return page > 1 && itemCount === 1 ? page - 1 : page;
}

interface FetchState {
  readonly data: PaginatedResult<RegistrationOutput> | null;
  readonly loading: boolean;
}

async function fetchRegistrations(
  status: string,
  stay: string,
  accommodation: string,
  search: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<RegistrationOutput>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (stay) params.set("stay", stay);
  if (accommodation) params.set("accommodation", accommodation);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const res = await fetch(`/api/admin/registrations?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch registrations");
  const json = (await res.json()) as { data: PaginatedResult<RegistrationOutput> };
  return json.data;
}

/**
 * Extract the correctable field errors from a rejected API response, or `null`
 * when there is nothing the admin can act on in the form.
 *
 * Two filters, each closing a way for a rejected save to fail silently:
 *
 * - Only a `400` is a validation failure. An auth failure or a server fault
 *   must fall through to the generic error path even if its body happens to
 *   carry a `fields`-shaped object; keeping the modal open and silent on an
 *   expired session would leave the admin re-submitting a request that can
 *   never succeed.
 * - Only fields the modal can render count. A `400` naming just `body`
 *   (malformed JSON) or `registrationId` has no input to attach to, so routing
 *   it into the modal would show nothing at all.
 */
async function readFieldErrors(
  response: Response,
): Promise<Readonly<Record<string, string>> | null> {
  if (response.status !== 400) {
    return null;
  }

  try {
    const body = (await response.json()) as {
      error?: { fields?: Record<string, string> };
    };
    const fields = body.error?.fields;
    if (!fields) {
      return null;
    }

    const displayable = Object.fromEntries(
      Object.entries(fields).filter(([field]) =>
        (EDITABLE_FIELDS as ReadonlyArray<string>).includes(field),
      ),
    );

    return Object.keys(displayable).length > 0 ? displayable : null;
  } catch {
    // A non-JSON error body is not a validation failure; fall back to the
    // generic error path rather than swallowing the problem.
    return null;
  }
}

async function fetchStats(): Promise<RegistrationStats> {
  const res = await fetch("/api/admin/registrations/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  const json = (await res.json()) as { data: RegistrationStats };
  return json.data;
}

export default function AdminRegistrationsPage(): React.ReactElement {
  const t = useTranslations("admin.registrations");
  const tBulk = useTranslations("admin.registrations.bulk");
  const toast = useToast();

  const [filters, setFilters] = useState<RegistrationFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [state, setState] = useState<FetchState>({ data: null, loading: true });
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [editing, setEditing] = useState<RegistrationOutput | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Readonly<
    Record<string, string>
  > | null>(null);
  const [drawer, setDrawer] = useState<RegistrationOutput | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [bulkResending, setBulkResending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const latestListRequest = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = latestListRequest.current + 1;
    latestListRequest.current = requestId;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await fetchRegistrations(
        filters.status,
        filters.stay,
        filters.accommodation,
        filters.search,
        page,
        pageSize,
      );
      if (requestId !== latestListRequest.current) return;
      setState({ data, loading: false });
      const visibleIds = new Set(data.items.map((registration) => registration.id));
      setSelectedIds((previous) => {
        const retained = new Set(
          Array.from(previous).filter((id) => visibleIds.has(id)),
        );
        return retained.size === previous.size ? previous : retained;
      });
    } catch {
      if (requestId !== latestListRequest.current) return;
      setState((prev) => ({ ...prev, loading: false }));
      toast.error(t("errorLoad"));
    }
  }, [
    filters.status,
    filters.stay,
    filters.accommodation,
    filters.search,
    page,
    pageSize,
    t,
    toast,
  ]);

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchStats();
      setStats(s);
    } catch {
      // Non-fatal — stats strip simply stays at its previous values or
      // skeleton. A toast would be excessive noise for a secondary widget.
    }
  }, []);

  useEffect(() => {
    void loadData();
    return () => {
      // Dependency changes and unmounts both retire the in-flight request.
      // Its eventual success or failure must not mutate this page instance.
      latestListRequest.current += 1;
    };
  }, [loadData]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleFiltersChange = useCallback(
    (next: RegistrationFiltersValue) => {
      setSelectedIds(new Set());
      setFilters(next);
      setPage(1);
    },
    [],
  );

  const handleFiltersReset = useCallback(() => {
    setSelectedIds(new Set());
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setSelectedIds(new Set());
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setSelectedIds(new Set());
    setPage(newPage);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadData(), loadStats()]);
  }, [loadData, loadStats]);

  const removeSelectedId = useCallback((registrationId: string) => {
    setSelectedIds((previous) => {
      if (!previous.has(registrationId)) return previous;
      const next = new Set(previous);
      next.delete(registrationId);
      return next;
    });
  }, []);

  const handleCancel = useCallback(
    async (registrationId: string) => {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) throw new Error("Failed to cancel registration");
        removeSelectedId(registrationId);
        setDrawer(null);
        await refreshAll();
      } catch {
        toast.error(t("errorCancel"));
      }
    },
    [refreshAll, removeSelectedId, t, toast],
  );

  const handleReconfirm = useCallback(
    async (registrationId: string) => {
      try {
        const res = await fetch("/api/admin/registrations/reconfirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) throw new Error("Failed to reconfirm registration");
        removeSelectedId(registrationId);
        setEditing(null);
        setDrawer(null);
        toast.success(t("reconfirmSuccess"));
        await refreshAll();
      } catch {
        toast.error(t("reconfirmError"));
      }
    },
    [refreshAll, removeSelectedId, t, toast],
  );

  /**
   * Permanently delete a registration (issue #102).
   *
   * Separate from `handleCancel`, which flips status via the collection's
   * `DELETE`. Confirmation is owned by the edit modal, so by the time this
   * runs the admin has already made the deliberate choice; all that is left is
   * to close the surfaces showing a record that no longer exists and reload.
   */
  const handleDelete = useCallback(
    async (registrationId: string) => {
      try {
        const res = await fetch("/api/admin/registrations/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) throw new Error("Failed to delete registration");
        setEditing(null);
        setDrawer(null);
        // The row is gone, so any pending selection of it is stale.
        removeSelectedId(registrationId);
        toast.success(t("deleteSuccess"));
        // Deleting the sole row on a later page makes that page cease to
        // exist. Move back first; the page effect will fetch the valid page.
        const nextPage = pageAfterDeletion(page, state.data?.items.length ?? 0);
        if (nextPage !== page) {
          setSelectedIds(new Set());
          setPage(nextPage);
          await loadStats();
        } else {
          await refreshAll();
        }
      } catch {
        toast.error(t("errorDelete"));
      }
    },
    [loadStats, page, refreshAll, removeSelectedId, state.data?.items.length, t, toast],
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
    setDrawer(null);
    // Errors from a previous attempt describe a payload that is no longer on
    // screen; carrying them into a freshly opened form would be misleading.
    setEditFieldErrors(null);
    setEditing(registration);
  }, []);

  const handleOpenAdd = useCallback(() => setIsAdding(true), []);
  const handleCloseAdd = useCallback(() => setIsAdding(false), []);

  const handleAddCreated = useCallback(async () => {
    setIsAdding(false);
    toast.success(t("addSuccess"));
    await refreshAll();
  }, [refreshAll, t, toast]);

  const handleSave = useCallback(
    async (id: string, data: EditRegistrationPayload) => {
      setEditFieldErrors(null);
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: id, ...data }),
        });

        if (!res.ok) {
          // A validation failure names the offending fields (API2). Hand them
          // back to the modal and leave it open so the admin can correct the
          // exact field instead of losing their edits to a generic toast.
          const fields = await readFieldErrors(res);
          if (fields) {
            setEditFieldErrors(fields);
            return;
          }
          throw new Error("Failed to update registration");
        }

        removeSelectedId(id);
        setEditing(null);
        toast.success(t("updateSuccess"));
        await refreshAll();
      } catch {
        toast.error(t("errorUpdate"));
      }
    },
    [refreshAll, removeSelectedId, t, toast],
  );

  const handleRowClick = useCallback((registration: RegistrationOutput) => {
    setDrawer(registration);
  }, []);

  const visibleItems = useMemo(
    () => state.data?.items ?? [],
    [state.data?.items],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allVisibleIds = visibleItems.map((r) => r.id);
      const allSelected = allVisibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of allVisibleIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of allVisibleIds) next.add(id);
      return next;
    });
  }, [visibleItems]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkResend = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkResending(true);
    let successCount = 0;
    let anyError = false;
    for (const id of ids) {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: id }),
        });
        if (res.ok) successCount += 1;
        else anyError = true;
      } catch {
        anyError = true;
      }
    }
    setBulkResending(false);
    setSelectedIds(new Set());
    if (successCount > 0) {
      toast.success(tBulk("resendSuccess", { count: successCount }));
    }
    if (anyError) toast.error(tBulk("resendError"));
  }, [selectedIds, toast, tBulk]);

  const bulkExportHref = useMemo(() => {
    if (selectedIds.size === 0) return "/api/admin/registrations/export";
    const params = new URLSearchParams();
    for (const id of selectedIds) params.append("id", id);
    return `/api/admin/registrations/export?${params.toString()}`;
  }, [selectedIds]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-text-tertiary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          {stats ? (
            <p className="mt-1 text-sm text-text-secondary">
              {t("totalCount", { count: stats.total })}
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <a
            href="/api/admin/registrations/export"
            download
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border-default bg-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base sm:flex-none"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
            </svg>
            {t("downloadCsv")}
          </a>
          <Button variant="primary" onClick={handleOpenAdd}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("addReservation")}
          </Button>
        </div>
      </header>

      <StatsStrip stats={stats} />

      <RegistrationFilters
        value={filters}
        onChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

      <div>
        {state.loading ? (
          <div
            className="overflow-hidden rounded-lg border border-border-default bg-surface-raised/40"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">{t("loading")}</span>
            <div className="admin-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border-subtle">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </tbody>
              </table>
            </div>
          </div>
        ) : state.data ? (
          <>
            <RegistrationTable
              registrations={visibleItems}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onResendEmail={handleResendEmail}
              onViewDetails={handleRowClick}
              resendingId={resendingId}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              searchQuery={filters.search}
            />
            <Pagination
              page={state.data.page}
              pageSize={state.data.pageSize}
              total={state.data.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        ) : null}
      </div>

      {editing && (
        <EditRegistrationModal
          registration={editing}
          onSave={handleSave}
          onReconfirm={handleReconfirm}
          onDelete={handleDelete}
          onClose={() => {
            setEditFieldErrors(null);
            setEditing(null);
          }}
          {...(editFieldErrors ? { serverFieldErrors: editFieldErrors } : {})}
        />
      )}
      {isAdding && (
        <AddRegistrationModal
          onClose={handleCloseAdd}
          onCreated={handleAddCreated}
        />
      )}
      <RegistrationDrawer
        registration={drawer}
        onClose={() => setDrawer(null)}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onResendEmail={handleResendEmail}
        onReconfirm={handleReconfirm}
        resendingId={resendingId}
      />
      <BulkActionBar
        count={selectedIds.size}
        onClear={handleClearSelection}
        onResend={handleBulkResend}
        resending={bulkResending}
        exportHref={bulkExportHref}
      />
    </div>
  );
}
