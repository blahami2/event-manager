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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-label={t("title")}>
      <div className="w-full max-w-md rounded-lg border border-border-dark bg-admin-card-bg p-6">
        <h2 className="mb-4 text-lg font-semibold text-admin-text-primary">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-admin-text-secondary">{t("name")}</label>
            <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-sm text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-admin-text-secondary">{t("email")}</label>
            <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-sm text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="edit-stay" className="block text-sm font-medium text-admin-text-secondary">{t("stay")}</label>
            <select id="edit-stay" value={stay} onChange={(e) => setStay(e.target.value)} required className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-sm text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
              {LEGACY_STAY_OPTIONS.includes(registration.stay) && (
                <option value={registration.stay}>
                  {registration.stay === StayOption.FRI_SAT ? t("stayFriSat") : t("stayFriSun")}
                </option>
              )}
              <option value="SAT_SUN">{t("staySatSun")}</option>
              <option value="SAT_ONLY">{t("staySatOnly")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-adults-count" className="block text-sm font-medium text-admin-text-secondary">{t("adultsCount")}</label>
            <input id="edit-adults-count" type="number" min="1" value={adultsCount} onChange={(e) => setAdultsCount(e.target.value)} required className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-sm text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="edit-children-count" className="block text-sm font-medium text-admin-text-secondary">{t("childrenCount")}</label>
            <input id="edit-children-count" type="number" min="0" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} required className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-sm text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium text-admin-text-secondary">{t("notes")}</label>
            <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-sm text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-border-dark bg-transparent px-4 py-2 text-sm font-medium text-admin-text-secondary hover:border-[#555] hover:text-white">
              {t("cancel")}
            </button>
            <button type="submit" className="rounded-md border-2 border-accent bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-transparent hover:text-accent">
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
