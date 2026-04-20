"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { EditRegistrationModal } from "@/components/admin/EditRegistrationModal";
import type { EditRegistrationPayload } from "@/components/admin/EditRegistrationModal";
import { AddRegistrationModal } from "@/components/admin/AddRegistrationModal";
import { Pagination } from "@/components/admin/Pagination";
import { Button } from "@/components/ui/admin";
import type { RegistrationOutput, PaginatedResult } from "@/types/registration";

const DEFAULT_PAGE_SIZE = 20;

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
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [state, setState] = useState<FetchState>({ data: null, loading: true, error: null });
  const [editing, setEditing] = useState<RegistrationOutput | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendFeedback, setResendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [addFeedback, setAddFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
        setState((prev) => ({ ...prev, error: t("errorCancel") }));
      }
    },
    [loadData, t],
  );

  const handleResendEmail = useCallback(
    async (registrationId: string) => {
      setResendingId(registrationId);
      setResendFeedback(null);
      try {
        const res = await fetch("/api/admin/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) {
          throw new Error("Failed to resend email");
        }
        setResendFeedback({ type: "success", message: t("table.resendSuccess") });
      } catch {
        setResendFeedback({ type: "error", message: t("table.resendError") });
      } finally {
        setResendingId(null);
      }
    },
    [t],
  );

  const handleEdit = useCallback((registration: RegistrationOutput) => {
    setEditing(registration);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setAddFeedback(null);
    setIsAdding(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setIsAdding(false);
  }, []);

  const handleAddCreated = useCallback(async () => {
    setIsAdding(false);
    setAddFeedback({ type: "success", message: t("addSuccess") });
    await loadData();
  }, [loadData, t]);

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
        setState((prev) => ({ ...prev, error: t("errorUpdate") }));
      }
    },
    [loadData, t],
  );

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">
          {t("title")}
        </h1>
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
            className="inline-flex items-center gap-2 rounded-md border border-border-dark bg-dark-secondary px-4 py-2 text-sm font-medium text-admin-text-primary transition-colors hover:bg-admin-hover hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-border-dark focus-visible:ring-offset-2 focus-visible:ring-offset-dark-primary"
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
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
              />
            </svg>
            {t("downloadCsv")}
          </a>
        </div>
      </div>

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
            className="mb-4 rounded-md border border-admin-danger/40 bg-admin-danger/10 p-4 text-sm text-admin-danger"
            role="alert"
          >
            {state.error}
          </div>
        )}

        {resendFeedback && (
          <div
            className={`mb-4 rounded-md border p-4 text-sm ${
              resendFeedback.type === "success"
                ? "border-admin-success/40 bg-admin-success/10 text-admin-success"
                : "border-admin-danger/40 bg-admin-danger/10 text-admin-danger"
            }`}
            role="alert"
          >
            {resendFeedback.message}
          </div>
        )}

        {addFeedback && (
          <div
            className={`mb-4 rounded-md border p-4 text-sm ${
              addFeedback.type === "success"
                ? "border-admin-success/40 bg-admin-success/10 text-admin-success"
                : "border-admin-danger/40 bg-admin-danger/10 text-admin-danger"
            }`}
            role="alert"
          >
            {addFeedback.message}
          </div>
        )}

        {state.loading ? (
          <div className="py-12 text-center text-sm text-admin-text-secondary">
            {t("loading")}
          </div>
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
