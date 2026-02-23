"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

export interface RegistrationTableProps {
  readonly registrations: ReadonlyArray<RegistrationOutput>;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
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

  return (
    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${styles}`}>
      {status}
    </span>
  );
}

export function RegistrationTable({
  registrations,
  onEdit,
  onCancel,
}: RegistrationTableProps): React.ReactElement {
  const t = useTranslations("admin.registrations.table");
  const tReg = useTranslations("admin.registrations");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCancelClick = useCallback((id: string) => {
    setConfirmingId(id);
  }, []);

  const handleConfirmCancel = useCallback(
    (id: string) => {
      onCancel(id);
      setConfirmingId(null);
    },
    [onCancel],
  );

  const handleDismissConfirm = useCallback(() => {
    setConfirmingId(null);
  }, []);

  if (registrations.length === 0) {
    return (
      <div className="rounded-md bg-dark-secondary py-12 text-center text-sm text-admin-text-secondary">
        {tReg("noResults")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#222]">
        <thead className="bg-dark-secondary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("name")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("email")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("stay")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("adults")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("children")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("status")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("created")}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222]">
          {registrations.map((reg) => (
            <tr key={reg.id} className="transition-colors hover:bg-admin-hover">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-admin-text-primary">{reg.name}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{reg.email}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{formatStay(reg.stay)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{reg.adultsCount}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{reg.childrenCount}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <StatusBadge status={reg.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#c8c8c8]">{formatDate(reg.createdAt)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                {confirmingId === reg.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-red-400">{t("confirmCancel")}</span>
                    <button
                      type="button"
                      onClick={() => handleConfirmCancel(reg.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      {t("yes")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissConfirm}
                      className="rounded border border-border-dark bg-transparent px-2 py-1 text-xs text-admin-text-secondary hover:text-white"
                    >
                      {t("no")}
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(reg)}
                      className="text-accent hover:text-red-400"
                    >
                      {t("edit")}
                    </button>
                    {reg.status !== RegistrationStatus.CANCELLED && (
                      <button
                        type="button"
                        onClick={() => handleCancelClick(reg.id)}
                        className="text-red-500 hover:text-red-300"
                      >
                        {t("cancel")}
                      </button>
                    )}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
