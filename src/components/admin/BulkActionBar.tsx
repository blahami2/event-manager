"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/admin";

export interface BulkActionBarProps {
  readonly count: number;
  readonly onClear: () => void;
  readonly onResend: () => void;
  readonly resending?: boolean;
  readonly exportHref: string;
}

/**
 * Sticky-footer bar that appears when the user selects registrations.
 * Exposes bulk resend and export actions. Bulk cancel is intentionally
 * omitted — destructive bulk operations should land with a preview/undo UX
 * in a dedicated ticket.
 */
export function BulkActionBar({
  count,
  onClear,
  onResend,
  resending = false,
  exportHref,
}: BulkActionBarProps): React.ReactElement | null {
  const t = useTranslations("admin.registrations.bulk");
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label={t("region")}
      className="admin-pop-in sticky bottom-2 z-20 mx-auto flex w-full max-w-xl flex-wrap items-center gap-2 rounded-xl border border-border-default bg-surface-overlay/95 px-3 py-2.5 shadow-pop backdrop-blur sm:bottom-4 sm:flex-nowrap sm:gap-3 sm:rounded-full sm:px-5"
    >
      <span className="flex min-w-0 items-center gap-2 pr-1 sm:pr-2">
        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-accent px-2 font-mono text-xs font-semibold tabular-nums text-white">
          {count}
        </span>
        <span className="truncate text-sm text-text-secondary">{t("selected")}</span>
      </span>

      <div className="mx-0 hidden h-5 w-px bg-border-default sm:block" aria-hidden="true" />

      <Button
        variant="secondary"
        size="sm"
        loading={resending}
        onClick={onResend}
      >
        {t("resend")}
      </Button>
      <a
        href={exportHref}
        download
        className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-transparent px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
      >
        {t("export")}
      </a>

      <button
        type="button"
        onClick={onClear}
        aria-label={t("clear")}
        className="ml-auto rounded-md p-1 text-text-tertiary transition-colors duration-150 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
