"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";

/** Stay options hidden from new selections but shown for legacy registrations. */
const LEGACY_STAY_OPTIONS: ReadonlyArray<StayOption> = [StayOption.FRI_SAT, StayOption.FRI_SUN] as const;

export interface EditRegistrationModalProps {
  readonly registration: RegistrationOutput;
  readonly onSave: (
    id: string,
    data: { name: string; email: string; stay: StayOption; adultsCount: number; childrenCount: number; notes?: string },
  ) => void;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all"
      role="dialog"
      aria-label={t("title")}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border-dark bg-dark-secondary/90 shadow-2xl backdrop-blur-md">
        <div className="border-b border-border-dark/50 bg-white/5 px-6 py-4">
          <h2 className="text-xl font-semibold tracking-wide text-white">{t("title")}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
              {t("name")}
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="edit-email" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
              {t("email")}
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="edit-stay" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
              {t("stay")}
            </label>
            <select
              id="edit-stay"
              value={stay}
              onChange={(e) => setStay(e.target.value)}
              required
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
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
              <label htmlFor="edit-adults-count" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
                {t("adultsCount")}
              </label>
              <input
                id="edit-adults-count"
                type="number"
                min="1"
                value={adultsCount}
                onChange={(e) => setAdultsCount(e.target.value)}
                required
                className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label
                htmlFor="edit-children-count"
                className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
              >
                {t("childrenCount")}
              </label>
              <input
                id="edit-children-count"
                type="number"
                min="0"
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                required
                className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-notes" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
              {t("notes")}
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              rows={2}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-border-dark/50 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-dark bg-dark-primary/50 px-4 py-2 text-sm font-medium text-admin-text-secondary transition-all hover:bg-white/5 hover:text-white"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg border-2 border-accent bg-accent px-6 py-2 text-sm font-bold tracking-wide text-white transition-all hover:bg-transparent hover:text-accent hover:shadow-lg hover:shadow-accent/20"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
