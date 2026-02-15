"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { RegistrationOutput } from "@/types/registration";

export interface EditRegistrationModalProps {
  readonly registration: RegistrationOutput;
  readonly onSave: (id: string, data: { name: string; email: string; guestCount: number; dietaryNotes?: string }) => void;
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
  const [guestCount, setGuestCount] = useState(String(registration.guestCount));
  const [dietaryNotes, setDietaryNotes] = useState(registration.dietaryNotes ?? "");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(registration.id, {
        name,
        email,
        guestCount: Number(guestCount),
        ...(dietaryNotes ? { dietaryNotes } : {}),
      });
    },
    [registration.id, name, email, guestCount, dietaryNotes, onSave],
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
            <label htmlFor="edit-guest-count" className="block text-sm font-medium text-gray-700">{t("guestCount")}</label>
            <input id="edit-guest-count" type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="edit-dietary" className="block text-sm font-medium text-gray-700">{t("dietaryNotes")}</label>
            <textarea id="edit-dietary" value={dietaryNotes} onChange={(e) => setDietaryNotes(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
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
