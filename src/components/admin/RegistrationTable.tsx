"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import {
  accommodationLabel,
  staySummaryLabel,
  statusLabel,
} from "@/i18n/labels";
import { Badge, Button, ConfirmDialog } from "@/components/ui/admin";

export interface RegistrationTableProps {
  readonly registrations: ReadonlyArray<RegistrationOutput>;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
  readonly onResendEmail?: (registrationId: string) => void;
  readonly onViewDetails?: (registration: RegistrationOutput) => void;
  readonly resendingId?: string | null;
  readonly selectedIds?: ReadonlySet<string>;
  readonly onToggleSelect?: (id: string) => void;
  readonly onToggleSelectAll?: () => void;
  readonly searchQuery?: string;
}

function formatDate(date: Date, locale: string): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
 * Highlight instances of `query` in `text`. Case-insensitive, whole-match
 * substrings only (no regex). Renders highlighted spans with a subtle accent.
 */
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  if (!lower.includes(needle)) return text;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lower.indexOf(needle);
  let key = 0;
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark
        key={key++}
        className="rounded-sm bg-accent-muted px-0.5 text-text-primary"
      >
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    cursor = idx + needle.length;
    idx = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

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
  if (!notes)
    return <span className="text-text-tertiary">{"\u2014"}</span>;

  if (!expanded) {
    // Collapsed: single line, ellipsis. Clicking "Read" expands in place.
    return (
      <div className="flex items-center gap-2">
        <span className="truncate text-text-secondary" title={notes}>
          {notes}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="shrink-0 text-xs font-medium text-accent transition-colors duration-150 hover:text-accent-hover focus:outline-none focus-visible:underline"
          aria-expanded={false}
        >
          {expandLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="whitespace-pre-wrap break-words text-text-secondary">
        {notes}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(false);
        }}
        className="text-xs font-medium text-accent transition-colors duration-150 hover:text-accent-hover focus:outline-none focus-visible:underline"
        aria-expanded={true}
      >
        {collapseLabel}
      </button>
    </div>
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
  onViewDetails,
  resendingId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  searchQuery = "",
}: RegistrationTableProps): React.ReactElement {
  const locale = useLocale();
  const t = useTranslations("admin.registrations.table");
  const tReg = useTranslations("admin.registrations");
  const tEnums = useTranslations();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const hasSelection = !!selectedIds && !!onToggleSelect && !!onToggleSelectAll;

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
      <div className="rounded-lg border border-border-default bg-surface-raised/40 px-6 py-16 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-base text-text-tertiary"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2a4 4 0 014-4h4m-4 4l4-4m0 0l-4-4m4 4H3"
            />
          </svg>
        </div>
        <p className="text-sm text-text-secondary">{tReg("noResults")}</p>
      </div>
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

  const allSelected =
    hasSelection && registrations.every((r) => selectedIds.has(r.id));
  const someSelected =
    hasSelection &&
    !allSelected &&
    registrations.some((r) => selectedIds.has(r.id));

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
      <div className="overflow-hidden rounded-lg border border-border-default bg-surface-raised/40">
        <div className="admin-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-surface-raised/80">
                {hasSelection ? (
                  <th scope="col" className="w-10 px-4 py-3 text-left">
                    <IndeterminateCheckbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={onToggleSelectAll}
                      ariaLabel={t("selectAll")}
                    />
                  </th>
                ) : null}
                <HeaderCell>{t("name")}</HeaderCell>
                <HeaderCell>{t("stay")}</HeaderCell>
                <HeaderCell align="right">{t("adults")}</HeaderCell>
                <HeaderCell align="right">{t("children")}</HeaderCell>
                <HeaderCell>{t("accommodation")}</HeaderCell>
                <HeaderCell width="w-[260px] min-w-[260px]">{t("notes")}</HeaderCell>
                <HeaderCell>{t("status")}</HeaderCell>
                <HeaderCell>{t("created")}</HeaderCell>
                <HeaderCell align="right">{t("actions")}</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {registrations.map((reg) => {
                const isCancelled = reg.status === RegistrationStatus.CANCELLED;
                const isSelected = hasSelection && selectedIds.has(reg.id);
                return (
                  <tr
                    key={reg.id}
                    data-selected={isSelected || undefined}
                    className={`group transition-colors duration-150 ${
                      isSelected ? "bg-accent-muted/40" : "hover:bg-admin-hover/60"
                    }`}
                  >
                    {hasSelection ? (
                      <td
                        className="w-10 px-4 py-3 align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onToggleSelect(reg.id)}
                          ariaLabel={t("selectRow", { name: reg.name })}
                        />
                      </td>
                    ) : null}
                    <td className="min-w-[200px] px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {highlight(reg.name, searchQuery)}
                        </span>
                        <span className="mt-0.5 break-all font-mono text-xs text-text-tertiary">
                          {highlight(reg.email, searchQuery)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-text-secondary">
                      {staySummaryLabel(
                        reg.stay,
                        reg.stayStartDate,
                        reg.stayEndDate,
                        tEnums,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top font-mono text-sm tabular-nums text-text-primary">
                      {reg.adultsCount}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right align-top font-mono text-sm tabular-nums ${reg.childrenCount === 0 ? "text-text-tertiary" : "text-text-primary"}`}>
                      {reg.childrenCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-text-secondary">
                      {accommodationLabel(reg.accommodation, tEnums)}
                    </td>
                    <td className="w-[260px] min-w-[260px] max-w-[260px] px-4 py-3 align-top text-sm">
                      <NotesCell
                        notes={reg.notes}
                        expandLabel={tReg("notesExpand")}
                        collapseLabel={tReg("notesCollapse")}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <StatusBadge
                        status={reg.status}
                        label={statusLabel(reg.status, tEnums)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs tabular-nums text-text-tertiary">
                      {formatDate(reg.createdAt, locale)}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right align-top"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {onViewDetails ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(reg)}
                            aria-label={t("viewDetails", { name: reg.name })}
                            title={t("viewDetails", { name: reg.name })}
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
                                strokeWidth={1.5}
                                d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z"
                              />
                              <circle cx="12" cy="12" r="2.25" strokeWidth={1.5} />
                            </svg>
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(reg)}
                        >
                          {t("edit")}
                        </Button>
                        {!isCancelled ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={resendingId === reg.id}
                              onClick={() => handleResendClick(reg.id)}
                              aria-label={t("resendEmail")}
                              title={t("resendEmail")}
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
                                  strokeWidth={1.5}
                                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelClick(reg.id)}
                              aria-label={t("cancel")}
                              title={t("cancel")}
                              className="hover:text-danger"
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
                                  strokeWidth={1.5}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
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
    </>
  );
}

function HeaderCell({
  children,
  align = "left",
  width,
}: {
  readonly children: React.ReactNode;
  readonly align?: "left" | "right";
  readonly width?: string;
}): React.ReactElement {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary ${
        align === "right" ? "text-right" : "text-left"
      } ${width ?? ""}`.trim()}
    >
      {children}
    </th>
  );
}

function Checkbox({
  checked,
  onChange,
  ariaLabel,
}: {
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly ariaLabel: string;
}): React.ReactElement {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-border-strong bg-surface-sunken text-accent accent-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
    />
  );
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly onChange?: () => void;
  readonly ariaLabel: string;
}): React.ReactElement {
  return (
    <input
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      type="checkbox"
      checked={checked}
      onChange={() => onChange?.()}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-border-strong bg-surface-sunken text-accent accent-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
    />
  );
}
