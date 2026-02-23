"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

/** Stay options hidden from new selections but shown for legacy registrations. */
const LEGACY_STAY_OPTIONS: ReadonlyArray<StayOption> = [StayOption.FRI_SAT, StayOption.FRI_SUN] as const;

export interface EditRegistrationModalProps {
  readonly registration: RegistrationOutput;
  readonly onSave: (id: string, data: { name: string; email: string; stay: StayOption; adultsCount: number; childrenCount: number; notes?: string }) => void;
  readonly onClose: () => void;
}

export function EditRegistrationModal({
  registration,
  onSave,
  onClose,
}: EditRegistrationModalProps): React.ReactElement {
  const t = useTranslations("admin.registrations.edit");
  const [name, setName] = useState(registration.name);
  const [email, setEmail] = useState(registration.email);
  const [stay, setStay] = useState(registration.stay as string);
  const [adultsCount, setAdultsCount] = useState(String(registration.adultsCount));
  const [childrenCount, setChildrenCount] = useState(String(registration.childrenCount));
  const [notes, setNotes] = useState(registration.notes ?? "");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(registration.id, {
        name,
        email,
        stay: stay as StayOption,
        adultsCount: Number(adultsCount),
        childrenCount: Number(childrenCount),
        ...(notes ? { notes } : {}),
      });
    },
    [registration.id, name, email, stay, adultsCount, childrenCount, notes, onSave],
  );

  const inputCls = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const labelCls = "block text-sm font-medium text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" role="dialog" aria-label={t("title")}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className={labelCls}>{t("name")}</label>
            <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label htmlFor="edit-email" className={labelCls}>{t("email")}</label>
            <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label htmlFor="edit-stay" className={labelCls}>{t("stay")}</label>
            <select id="edit-stay" value={stay} onChange={(e) => setStay(e.target.value)} required className={inputCls}>
              {LEGACY_STAY_OPTIONS.includes(registration.stay) && (
                <option value={registration.stay}>
                  {registration.stay === StayOption.FRI_SAT ? t("stayFriSat") : t("stayFriSun")}
                </option>
              )}
              <option value="SAT_SUN">{t("staySatSun")}</option>
              <option value="SAT_ONLY">{t("staySatOnly")}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-adults-count" className={labelCls}>{t("adultsCount")}</label>
              <input id="edit-adults-count" type="number" min="1" value={adultsCount} onChange={(e) => setAdultsCount(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label htmlFor="edit-children-count" className={labelCls}>{t("childrenCount")}</label>
              <input id="edit-children-count" type="number" min="0" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} required className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="edit-notes" className={labelCls}>{t("notes")}</label>
            <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              {t("cancel")}
            </button>
            <button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 hover:from-violet-700 hover:to-indigo-700">
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
