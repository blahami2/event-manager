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
    default:
      return stay;
  }
}

function StatusBadge({ status }: { readonly status: RegistrationStatus }): React.ReactElement {
  const styles =
    status === RegistrationStatus.CONFIRMED
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

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
      <div className="rounded-md bg-gray-50 py-12 text-center text-sm text-gray-500">
        {tReg("noResults")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("name")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("email")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("stay")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("adults")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("children")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("status")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("created")}</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {registrations.map((reg) => (
            <tr key={reg.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{reg.name}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{reg.email}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatStay(reg.stay)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{reg.adultsCount}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{reg.childrenCount}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <StatusBadge status={reg.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(reg.createdAt)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                {confirmingId === reg.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-red-600">{t("confirmCancel")}</span>
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
                      className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                    >
                      {t("no")}
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(reg)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {t("edit")}
                    </button>
                    {reg.status !== RegistrationStatus.CANCELLED && (
                      <button
                        type="button"
                        onClick={() => handleCancelClick(reg.id)}
                        className="text-red-600 hover:text-red-900"
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
