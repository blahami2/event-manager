"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { RegistrationOutput } from "@/types/registration";
import type { StayOption } from "@/types/registration";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-label={t("title")}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">{t("name")}</label>
            <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">{t("email")}</label>
            <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="edit-stay" className="block text-sm font-medium text-gray-700">{t("stay")}</label>
            <select id="edit-stay" value={stay} onChange={(e) => setStay(e.target.value)} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="FRI_SAT">{t("stayFriSat")}</option>
              <option value="SAT_SUN">{t("staySatSun")}</option>
              <option value="FRI_SUN">{t("stayFriSun")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-adults-count" className="block text-sm font-medium text-gray-700">{t("adultsCount")}</label>
            <input id="edit-adults-count" type="number" min="1" value={adultsCount} onChange={(e) => setAdultsCount(e.target.value)} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="edit-children-count" className="block text-sm font-medium text-gray-700">{t("childrenCount")}</label>
            <input id="edit-children-count" type="number" min="0" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700">{t("notes")}</label>
            <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t("cancel")}
            </button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
