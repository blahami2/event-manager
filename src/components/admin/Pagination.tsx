"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/admin";
import { PageSizeSelector } from "./PageSizeSelector";

export interface PaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps): React.ReactElement | null {
  const t = useTranslations("admin.pagination");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border-dark/50 px-6 py-4 sm:flex-row">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <p className="text-sm text-admin-text-secondary">
          {t("showing")}{" "}
          <span className="font-medium text-admin-text-primary">{start}</span>{" "}
          {t("to")}{" "}
          <span className="font-medium text-admin-text-primary">{end}</span>{" "}
          {t("of")}{" "}
          <span className="font-medium text-admin-text-primary">{total}</span>{" "}
          {t("results")}
        </p>
        <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      </div>
      <nav className="flex items-center gap-2" aria-label={t("label")}>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("previous")}
        </Button>
        <span className="px-2 text-sm font-medium text-admin-text-secondary">
          {t("pageOfPages", { page, total: totalPages })}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("next")}
        </Button>
      </nav>
    </div>
  );
}
