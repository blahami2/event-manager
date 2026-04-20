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
import { Badge, Button, ConfirmDialog } from "@/components/ui/admin";

export interface RegistrationTableProps {
  readonly registrations: ReadonlyArray<RegistrationOutput>;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
  readonly onResendEmail?: (registrationId: string) => void;
  readonly resendingId?: string | null;
}

/** Character threshold above which the notes cell shows an expand affordance. */
const NOTES_PREVIEW_CHARS = 60;

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
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
  if (notes.length <= NOTES_PREVIEW_CHARS) {
    return (
      <span className="whitespace-pre-wrap break-words text-text-secondary">
        {notes}
      </span>
    );
  }

  const preview = notes.slice(0, NOTES_PREVIEW_CHARS).trimEnd();
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="whitespace-pre-wrap break-words text-text-secondary">
        {expanded ? notes : `${preview}…`}
      </span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs font-medium text-accent transition-colors duration-150 hover:text-accent-hover focus:outline-none focus-visible:underline"
        aria-expanded={expanded}
      >
        {expanded ? collapseLabel : expandLabel}
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
  resendingId,
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
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("name")}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("stay")}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("adults")}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("children")}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("accommodation")}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("notes")}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("status")}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("created")}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {registrations.map((reg) => {
                const isCancelled = reg.status === RegistrationStatus.CANCELLED;
                return (
                  <tr
                    key={reg.id}
                    className="group transition-colors duration-150 hover:bg-admin-hover/60"
                  >
                    <td className="min-w-[200px] px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {reg.name}
                        </span>
                        <span className="mt-0.5 break-all font-mono text-xs text-text-tertiary">
                          {reg.email}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-text-secondary">
                      {stayLabel(reg.stay, tEnums)}
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
                    <td className="max-w-[260px] px-4 py-3 align-top text-sm">
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
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
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
                              className="hover:text-admin-danger"
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
