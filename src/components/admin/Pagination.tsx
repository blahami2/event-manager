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
    <div className="flex flex-col items-center justify-between gap-4 px-1 pt-4 sm:flex-row">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <p className="text-sm text-text-secondary">
          {t("showing")}{" "}
          <span className="font-mono tabular-nums font-medium text-text-primary">{start}</span>
          <span className="mx-0.5 text-text-tertiary">{"–"}</span>
          <span className="font-mono tabular-nums font-medium text-text-primary">{end}</span>{" "}
          {t("of")}{" "}
          <span className="font-mono tabular-nums font-medium text-text-primary">{total}</span>
        </p>
        <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      </div>
      <nav className="flex items-center gap-2" aria-label={t("label")}>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("previous")}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("previous")}
        </Button>
        <span className="px-2 text-sm font-medium text-text-secondary">
          {t("pageOfPages", { page, total: totalPages })}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("next")}
        >
          {t("next")}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </nav>
    </div>
  );
}
