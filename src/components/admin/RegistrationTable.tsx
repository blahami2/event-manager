"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import {
  accommodationLabel,
  stayLabel,
  statusLabel,
} from "@/i18n/labels";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
} from "@/components/ui/admin";

/** Character threshold above which the notes cell shows an expand affordance. */
const NOTES_PREVIEW_CHARS = 60;

/** Keys on which the user can sort. Stay/accommodation intentionally excluded. */
export type SortKey = "name" | "status" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface SortState {
  readonly key: SortKey;
  readonly direction: SortDirection;
}

export interface RegistrationTableProps {
  readonly registrations: ReadonlyArray<RegistrationOutput>;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
  readonly onResendEmail?: (registrationId: string) => void;
  readonly resendingId?: string | null;
  /** Current sort state. When omitted, sorting UI is not rendered. */
  readonly sort?: SortState;
  /** Invoked when the user clicks a sortable header. */
  readonly onSortChange?: (sort: SortState) => void;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Render a registration status using the shared Badge primitive. The mapping
 * lives here (not in Badge) because it's domain-specific.
 */
function StatusBadge({
  status,
  label,
}: {
  readonly status: RegistrationStatus;
  readonly label: string;
}): React.ReactElement {
  return (
    <Badge variant={status === RegistrationStatus.CONFIRMED ? "success" : "danger"}>
      {label}
    </Badge>
  );
}

/**
 * Notes cell with expand/collapse. Short notes render inline. Long notes
 * show a preview + "more" toggle, replacing the earlier `truncate + title`
 * approach which hid content from users who did not hover.
 */
function NotesCell({
  notes,
  expandLabel,
  collapseLabel,
}: {
  readonly notes: string | null;
  readonly expandLabel: string;
  readonly collapseLabel: string;
}): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  if (!notes) return <span className="text-[color:var(--color-text-tertiary)]">{"\u2014"}</span>;
  if (notes.length <= NOTES_PREVIEW_CHARS) {
    return <span className="whitespace-pre-wrap break-words">{notes}</span>;
  }

  const preview = notes.slice(0, NOTES_PREVIEW_CHARS).trimEnd();
  return (
    <div className="flex flex-col gap-1">
      <span className="whitespace-pre-wrap break-words">
        {expanded ? notes : `${preview}…`}
      </span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="self-start text-xs font-medium text-[color:var(--color-accent)] transition-colors hover:brightness-110 focus:outline-none focus-visible:underline"
        aria-expanded={expanded}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
}

/**
 * Sortable-header button. Renders the column label plus an up/down caret
 * indicating the current direction on the active column. Non-sortable
 * columns render a plain `<span>`.
 */
function SortableHeader({
  label,
  columnKey,
  sort,
  onSortChange,
}: {
  readonly label: string;
  readonly columnKey: SortKey;
  readonly sort?: SortState;
  readonly onSortChange?: (sort: SortState) => void;
}): React.ReactElement {
  if (!onSortChange) {
    return <span>{label}</span>;
  }
  const isActive = sort?.key === columnKey;
  const direction = isActive ? sort?.direction ?? "asc" : "asc";

  const handleClick = (): void => {
    const next: SortState = isActive
      ? { key: columnKey, direction: direction === "asc" ? "desc" : "asc" }
      : { key: columnKey, direction: "asc" };
    onSortChange(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-sort={
        isActive ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      className="inline-flex items-center gap-1 rounded text-left transition-colors hover:text-[color:var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/60"
    >
      {label}
      <span
        className={`ml-0.5 inline-block text-[9px] transition-opacity ${
          isActive ? "opacity-100" : "opacity-40"
        }`}
        aria-hidden="true"
      >
        {isActive && direction === "desc" ? "▼" : "▲"}
      </span>
    </button>
  );
}

type ConfirmAction =
  | { type: "cancel"; id: string }
  | { type: "resend"; id: string }
  | null;

export function RegistrationTable({
  registrations,
  onEdit,
  onCancel,
  onResendEmail,
  resendingId,
  sort,
  onSortChange,
}: RegistrationTableProps): React.ReactElement {
  const t = useTranslations("admin.registrations.table");
  const tReg = useTranslations("admin.registrations");
  const tEnums = useTranslations();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleCancelClick = useCallback((id: string) => {
    setConfirmAction({ type: "cancel", id });
  }, []);

  const handleResendClick = useCallback((id: string) => {
    setConfirmAction({ type: "resend", id });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return;
    if (confirmAction.type === "cancel") {
      onCancel(confirmAction.id);
    } else {
      onResendEmail?.(confirmAction.id);
    }
    setConfirmAction(null);
  }, [confirmAction, onCancel, onResendEmail]);

  const handleDismiss = useCallback(() => {
    setConfirmAction(null);
  }, []);

  if (registrations.length === 0) {
    return (
      <EmptyState
        title={tReg("noResults")}
        icon={
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
      />
    );
  }

  const confirmMessage =
    confirmAction?.type === "cancel"
      ? t("confirmCancel")
      : confirmAction?.type === "resend"
        ? t("confirmResend")
        : "";
  const confirmVariant: "danger" | "info" =
    confirmAction?.type === "cancel" ? "danger" : "info";

  // ------------------------------------------------------------------
  // Desktop table (>= md) + mobile card view (< md). Both render the
  // same data; CSS toggles which one is visible so we only ever render
  // a single, accessible DOM representation per viewport.
  // ------------------------------------------------------------------

  const tableCellCls =
    "px-4 py-2.5 text-sm text-[color:var(--color-text-secondary)]";
  const tableHeadCls =
    "sticky top-14 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)]";

  return (
    <>
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmMessage}
        message={confirmMessage}
        confirmLabel={t("yes")}
        dismissLabel={t("no")}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
        variant={confirmVariant}
      />

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={tableHeadCls}>
                  <SortableHeader
                    label={t("name")}
                    columnKey="name"
                    sort={sort}
                    onSortChange={onSortChange}
                  />
                </th>
                <th className={tableHeadCls}>{t("email")}</th>
                <th className={tableHeadCls}>{t("stay")}</th>
                <th className={`${tableHeadCls} text-right`}>{t("adults")}</th>
                <th className={`${tableHeadCls} text-right`}>{t("children")}</th>
                <th className={tableHeadCls}>{t("accommodation")}</th>
                <th className={tableHeadCls}>{t("notes")}</th>
                <th className={tableHeadCls}>
                  <SortableHeader
                    label={t("status")}
                    columnKey="status"
                    sort={sort}
                    onSortChange={onSortChange}
                  />
                </th>
                <th className={tableHeadCls}>
                  <SortableHeader
                    label={t("created")}
                    columnKey="createdAt"
                    sort={sort}
                    onSortChange={onSortChange}
                  />
                </th>
                <th className={`${tableHeadCls} text-right`}>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, idx) => {
                const isCancelled = reg.status === RegistrationStatus.CANCELLED;
                const stripeCls =
                  idx % 2 === 1 ? "bg-[color:var(--color-surface-2)]/30" : "bg-transparent";
                return (
                  <tr
                    key={reg.id}
                    className={`${stripeCls} transition-colors duration-[var(--motion-fast)] hover:bg-[color:var(--color-surface-3)]/50`}
                  >
                    <td className={`${tableCellCls} font-medium text-[color:var(--color-text-primary)]`}>
                      {reg.name}
                    </td>
                    <td className={tableCellCls}>
                      <span className="break-all">{reg.email}</span>
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap`}>
                      {stayLabel(reg.stay, tEnums)}
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap text-right tabular-nums`}>
                      {reg.adultsCount}
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap text-right tabular-nums`}>
                      {reg.childrenCount}
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap`}>
                      {accommodationLabel(reg.accommodation, tEnums)}
                    </td>
                    <td className={`${tableCellCls} max-w-[260px]`}>
                      <NotesCell
                        notes={reg.notes}
                        expandLabel={tReg("notesExpand")}
                        collapseLabel={tReg("notesCollapse")}
                      />
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap`}>
                      <StatusBadge
                        status={reg.status}
                        label={statusLabel(reg.status, tEnums)}
                      />
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap tabular-nums`}>
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className={`${tableCellCls} whitespace-nowrap`}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(reg)}>
                          {t("edit")}
                        </Button>
                        {!isCancelled ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelClick(reg.id)}
                            >
                              {t("cancel")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={resendingId === reg.id}
                              onClick={() => handleResendClick(reg.id)}
                            >
                              {resendingId === reg.id
                                ? t("resendingEmail")
                                : t("resendEmail")}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <ul className="flex flex-col gap-3 md:hidden">
        {registrations.map((reg) => {
          const isCancelled = reg.status === RegistrationStatus.CANCELLED;
          return (
            <li
              key={reg.id}
              className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[color:var(--color-text-primary)]">
                    {reg.name}
                  </p>
                  <p className="truncate text-xs text-[color:var(--color-text-secondary)]">
                    {reg.email}
                  </p>
                </div>
                <StatusBadge
                  status={reg.status}
                  label={statusLabel(reg.status, tEnums)}
                />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <dt className="text-[color:var(--color-text-tertiary)]">{t("stay")}</dt>
                  <dd className="text-[color:var(--color-text-primary)]">
                    {stayLabel(reg.stay, tEnums)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[color:var(--color-text-tertiary)]">{t("accommodation")}</dt>
                  <dd className="text-[color:var(--color-text-primary)]">
                    {accommodationLabel(reg.accommodation, tEnums)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[color:var(--color-text-tertiary)]">{t("adults")}</dt>
                  <dd className="text-[color:var(--color-text-primary)] tabular-nums">
                    {reg.adultsCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[color:var(--color-text-tertiary)]">{t("children")}</dt>
                  <dd className="text-[color:var(--color-text-primary)] tabular-nums">
                    {reg.childrenCount}
                  </dd>
                </div>
              </dl>
              {reg.notes ? (
                <div className="mt-3 rounded-[var(--radius-sm)] bg-[color:var(--color-surface-2)] p-2 text-xs text-[color:var(--color-text-secondary)]">
                  <NotesCell
                    notes={reg.notes}
                    expandLabel={tReg("notesExpand")}
                    collapseLabel={tReg("notesCollapse")}
                  />
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[color:var(--color-border)] pt-3">
                <Button variant="secondary" size="sm" onClick={() => onEdit(reg)}>
                  {t("edit")}
                </Button>
                {!isCancelled ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleCancelClick(reg.id)}>
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={resendingId === reg.id}
                      onClick={() => handleResendClick(reg.id)}
                    >
                      {resendingId === reg.id ? t("resendingEmail") : t("resendEmail")}
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
