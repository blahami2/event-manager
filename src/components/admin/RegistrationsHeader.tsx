"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/admin";

export function RegistrationsHeader({
  total,
  onAdd,
}: {
  readonly total: number | null;
  readonly onAdd: () => void;
}): React.ReactElement {
  const t = useTranslations("admin.registrations");
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end">
      <div><p className="text-xs font-medium uppercase tracking-[0.24em] text-text-tertiary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{t("title")}</h1>
        {total !== null ? <p className="mt-1 text-sm text-text-secondary">{t("totalCount", { count: total })}</p> : null}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <a href="/api/admin/registrations/export" download className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border-default bg-transparent px-3 py-2 text-sm font-medium text-text-secondary sm:flex-none">{t("downloadCsv")}</a>
        <Button variant="primary" onClick={onAdd}>{t("addReservation")}</Button>
      </div>
    </header>
  );
}
