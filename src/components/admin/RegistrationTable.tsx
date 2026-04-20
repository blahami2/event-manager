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
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Render a registration status using the shared Badge primitive. Mapping
 * lives here (not in Badge) because the mapping is domain-specific.
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
 * Notes cell with expand/collapse. Short notes render inline, long notes
 * show a preview + "more" toggle. This replaces the earlier `truncate + title`
 * approach, which hid content from users who didn't think to hover.
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
  if (!notes) return <span>{"\u2014"}</span>;
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
        className="self-start text-xs text-accent transition-colors hover:text-red-400 focus:outline-none focus-visible:underline"
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
      <div className="rounded-xl border border-border-dark bg-dark-secondary/50 py-16 text-center text-sm text-admin-text-secondary shadow-sm">
        <p>{tReg("noResults")}</p>
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
      <div className="overflow-hidden rounded-xl border border-border-dark bg-dark-secondary/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-dark">
            <thead className="bg-dark-secondary/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("email")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("stay")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("adults")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("children")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("accommodation")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("notes")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("created")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark bg-transparent">
              {registrations.map((reg) => {
                const isCancelled = reg.status === RegistrationStatus.CANCELLED;
                return (
                  <tr
                    key={reg.id}
                    className="group transition-colors duration-150 hover:bg-admin-hover/80"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-admin-text-primary">
                      {reg.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-admin-text-secondary">
                      <span className="break-all">{reg.email}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-admin-text-secondary">
                      {stayLabel(reg.stay, tEnums)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-admin-text-secondary">
                      {reg.adultsCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-admin-text-secondary">
                      {reg.childrenCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-admin-text-secondary">
                      {accommodationLabel(reg.accommodation, tEnums)}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-sm text-admin-text-secondary">
                      <NotesCell
                        notes={reg.notes}
                        expandLabel={tReg("notesExpand")}
                        collapseLabel={tReg("notesCollapse")}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge
                        status={reg.status}
                        label={statusLabel(reg.status, tEnums)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-admin-text-secondary">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
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
    </>
  );
}
