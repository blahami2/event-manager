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
      return "Fri\u2013Sat";
    case "SAT_SUN":
      return "Sat\u2013Sun";
    case "FRI_SUN":
      return "Fri\u2013Sun";
    case "SAT_ONLY":
      return "Sat";
    default:
      return stay;
  }
}

function StatusBadge({ status }: { readonly status: RegistrationStatus }): React.ReactElement {
  const isConfirmed = status === RegistrationStatus.CONFIRMED;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isConfirmed
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
          : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? "bg-emerald-500" : "bg-rose-500"}`} aria-hidden="true" />
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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
        {tReg("noResults")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("name")}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("email")}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("stay")}</th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{t("adults")}</th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{t("children")}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("status")}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("created")}</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((reg, index) => (
              <tr
                key={reg.id}
                className={`transition-colors hover:bg-indigo-50/40 ${index % 2 === 1 ? "bg-slate-50/40" : "bg-white"}`}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{reg.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{reg.email}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {formatStay(reg.stay)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm tabular-nums text-slate-600">{reg.adultsCount}</td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm tabular-nums text-slate-600">{reg.childrenCount}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <StatusBadge status={reg.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{formatDate(reg.createdAt)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  {confirmingId === reg.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-xs text-rose-600">{t("confirmCancel")}</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmCancel(reg.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700"
                      >
                        {t("yes")}
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissConfirm}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        {t("no")}
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(reg)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        {t("edit")}
                      </button>
                      {reg.status !== RegistrationStatus.CANCELLED && (
                        <button
                          type="button"
                          onClick={() => handleCancelClick(reg.id)}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
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
    </div>
  );
}
