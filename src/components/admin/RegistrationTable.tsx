"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

export interface RegistrationTableProps {
  readonly registrations: ReadonlyArray<RegistrationOutput>;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
  readonly onResendEmail?: (registrationId: string) => void;
  readonly resendingId?: string | null;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStay(stay: string): string {
  switch (stay) {
    case "FRI_SAT":
      return "Fri–Sat";
    case "SAT_SUN":
      return "Sat–Sun";
    case "FRI_SUN":
      return "Fri–Sun";
    case "SAT_ONLY":
      return "Sat";
    default:
      return stay;
  }
}

function StatusBadge({ status }: { readonly status: RegistrationStatus }): React.ReactElement {
  const styles =
    status === RegistrationStatus.CONFIRMED
      ? "bg-green-900/40 text-green-400 border border-green-700"
      : "bg-red-900/40 text-red-400 border border-red-700";

  return <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${styles}`}>{status}</span>;
}

type ConfirmAction = { type: "cancel"; id: string } | { type: "resend"; id: string } | null;

function ConfirmDialog({
  action,
  message,
  onConfirm,
  onDismiss,
  confirmLabel,
  dismissLabel,
  variant,
}: {
  readonly action: ConfirmAction;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
  readonly confirmLabel: string;
  readonly dismissLabel: string;
  readonly variant: "danger" | "info";
}): React.ReactElement | null {
  if (!action) return null;

  const confirmStyles = variant === "danger"
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onDismiss}>
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border-dark bg-dark-secondary p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-6 text-sm text-admin-text-primary">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-border-dark bg-transparent px-4 py-2 text-sm text-admin-text-secondary transition-colors hover:text-white"
          >
            {dismissLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm text-white transition-colors ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RegistrationTable({ registrations, onEdit, onCancel, onResendEmail, resendingId }: RegistrationTableProps): React.ReactElement {
  const t = useTranslations("admin.registrations.table");
  const tReg = useTranslations("admin.registrations");
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
      <div className="rounded-xl border border-border-dark bg-dark-secondary/50 py-16 text-center text-sm text-admin-text-secondary shadow-sm backdrop-blur-sm">
        <p className="opacity-80">{tReg("noResults")}</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        action={confirmAction}
        message={confirmAction?.type === "cancel" ? t("confirmCancel") : t("confirmResend")}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
        confirmLabel={t("yes")}
        dismissLabel={t("no")}
        variant={confirmAction?.type === "cancel" ? "danger" : "info"}
      />
      <div className="overflow-hidden rounded-xl border border-border-dark bg-dark-secondary/50 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-dark">
            <thead className="bg-dark-secondary/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("email")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("stay")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("adults")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("children")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("notes")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("created")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark bg-transparent">
              {registrations.map((reg) => (
                <tr key={reg.id} className="group transition-all duration-200 hover:bg-admin-hover/80 hover:shadow-sm">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-admin-text-primary">{reg.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{reg.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{formatStay(reg.stay)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{reg.adultsCount}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{reg.childrenCount}</td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-[#c8c8c8]" title={reg.notes ?? undefined}>
                    {reg.notes ?? "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <StatusBadge status={reg.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{formatDate(reg.createdAt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(reg)}
                        className="text-accent transition-colors hover:text-red-400 group-hover:scale-105"
                      >
                        {t("edit")}
                      </button>
                      {reg.status !== RegistrationStatus.CANCELLED && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCancelClick(reg.id)}
                            className="text-red-500 transition-colors hover:text-red-300 group-hover:scale-105"
                          >
                            {t("cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResendClick(reg.id)}
                            disabled={resendingId === reg.id}
                            className="text-blue-400 transition-colors hover:text-blue-300 group-hover:scale-105 disabled:opacity-50"
                          >
                            {resendingId === reg.id ? t("resendEmail") + "..." : t("resendEmail")}
                          </button>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
