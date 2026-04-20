"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/admin";

export interface BulkActionBarProps {
  readonly selectedCount: number;
  readonly onExport: () => void;
  readonly onResendEmails: () => void;
  readonly onClear: () => void;
  /** When true, the resend button is marked busy. */
  readonly resending?: boolean;
}

/**
 * Sticky bar that surfaces bulk actions when at least one row is selected.
 * Anchored to the bottom of the viewport so it remains reachable while the
 * admin scrolls through a long list. Renders nothing when no rows are
 * selected.
 */
export function BulkActionBar({
  selectedCount,
  onExport,
  onResendEmails,
  onClear,
  resending = false,
}: BulkActionBarProps): React.ReactElement | null {
  const t = useTranslations("admin.registrations");
  if (selectedCount <= 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky bottom-4 z-30 mt-6"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] px-4 py-2.5 shadow-[var(--shadow-lg)]">
        <span className="text-sm font-medium text-[color:var(--color-text-primary)] tabular-nums">
          {t("selectedCount", { count: selectedCount })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onExport}>
            <svg
              className="h-3.5 w-3.5"
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
            {t("bulkExport")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onResendEmails}
            loading={resending}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {t("bulkResend")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t("clearSelection")}
          </Button>
        </div>
      </div>
    </div>
  );
}
