"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { EditRegistrationModal } from "@/components/admin/EditRegistrationModal";
import { Pagination } from "@/components/admin/Pagination";
import type { RegistrationOutput, PaginatedResult } from "@/types/registration";

const PAGE_SIZE = 20;

interface FetchState {
  readonly data: PaginatedResult<RegistrationOutput> | null;
  readonly loading: boolean;
  readonly error: string | null;
}

async function fetchRegistrations(
  status: string,
  search: string,
  page: number,
): Promise<PaginatedResult<RegistrationOutput>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));

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
  const [state, setState] = useState<FetchState>({ data: null, loading: true, error: null });
  const [editing, setEditing] = useState<RegistrationOutput | null>(null);

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchRegistrations(status, search, page);
      setState({ data, loading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: t("errorLoad") }));
    }
  }, [status, search, page, t]);

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

  const handleEdit = useCallback((registration: RegistrationOutput) => {
    setEditing(registration);
  }, []);

  const handleSave = useCallback(
    async (
      id: string,
      data: { name: string; email: string; stay: string; adultsCount: number; childrenCount: number; notes?: string },
    ) => {
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
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">{t("title")}</h1>
        <a
          href="/api/admin/registrations/export"
          download
          className="inline-flex items-center border border-border-dark bg-transparent px-4 py-2 text-sm font-medium text-admin-text-secondary transition-colors hover:border-[#555] hover:text-white"
        >
          {t("downloadCsv")}
        </a>
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
          <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 p-4 text-sm text-red-400" role="alert">
            {state.error}
          </div>
        )}

        {state.loading ? (
          <div className="py-12 text-center text-sm text-admin-text-secondary">{t("loading")}</div>
        ) : state.data ? (
          <>
            <RegistrationTable
              registrations={state.data.items}
              onEdit={handleEdit}
              onCancel={handleCancel}
            />
            <Pagination
              page={state.data.page}
              pageSize={state.data.pageSize}
              total={state.data.total}
              onPageChange={setPage}
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
    </div>
  );
}
