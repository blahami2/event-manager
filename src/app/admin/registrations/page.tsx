"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { EditRegistrationModal } from "@/components/admin/EditRegistrationModal";
import type { EditRegistrationPayload } from "@/components/admin/EditRegistrationModal";
import { AddRegistrationModal } from "@/components/admin/AddRegistrationModal";
import { Pagination } from "@/components/admin/Pagination";
import { Button, TableSkeleton, useToast } from "@/components/ui/admin";
import type { RegistrationOutput, PaginatedResult } from "@/types/registration";

const DEFAULT_PAGE_SIZE = 20;
const TABLE_COLUMN_COUNT = 10;

interface FetchState {
  readonly data: PaginatedResult<RegistrationOutput> | null;
  readonly loading: boolean;
  readonly error: string | null;
}

async function fetchRegistrations(
  status: string,
  search: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<RegistrationOutput>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const res = await fetch(`/api/admin/registrations?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch registrations");
  }
  const json = (await res.json()) as { data: PaginatedResult<RegistrationOutput> };
  return json.data;
}

export default function AdminRegistrationsPage(): React.ReactElement {
  const t = useTranslations("admin.registrations");
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [state, setState] = useState<FetchState>({ data: null, loading: true, error: null });
  const [editing, setEditing] = useState<RegistrationOutput | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchRegistrations(status, search, page, pageSize);
      setState({ data, loading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: t("errorLoad") }));
    }
  }, [status, search, page, pageSize, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleCancel = useCallback(
    async (registrationId: string) => {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) {
          throw new Error("Failed to cancel registration");
        }
        await loadData();
      } catch {
        toast.error(t("errorCancel"));
      }
    },
    [loadData, t, toast],
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
        if (!res.ok) {
          throw new Error("Failed to resend email");
        }
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
    setEditing(registration);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setIsAdding(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setIsAdding(false);
  }, []);

  const handleAddCreated = useCallback(async () => {
    setIsAdding(false);
    toast.success(t("addSuccess"));
    await loadData();
  }, [loadData, t, toast]);

  const handleSave = useCallback(
    async (id: string, data: EditRegistrationPayload) => {
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: id, ...data }),
        });
        if (!res.ok) {
          throw new Error("Failed to update registration");
        }
        setEditing(null);
        await loadData();
      } catch {
        toast.error(t("errorUpdate"));
      }
    },
    [loadData, t, toast],
  );

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
        <RegistrationFilters
          status={status}
          search={search}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
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
          <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} columns={TABLE_COLUMN_COUNT} label={t("loading")} />
        ) : state.data ? (
          <>
            <RegistrationTable
              registrations={state.data.items}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onResendEmail={handleResendEmail}
              resendingId={resendingId}
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
    </div>
  );
}
