"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AccommodationOption, StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import {
  ACCOMMODATION_OPTIONS,
  CURRENT_STAY_OPTIONS,
  LEGACY_STAY_OPTIONS,
  accommodationLabel,
  stayLabel,
} from "@/i18n/labels";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui/admin";

/** Maximum allowed length for the notes field. Matches server-side validation. */
const NOTES_MAX_LENGTH = 500;

/**
 * Payload emitted by the edit modal. Mirrors `RegistrationInput` except that
 * `notes` is optional (omitted when blank to avoid an empty string landing
 * in the DB).
 */
export interface EditRegistrationPayload {
  readonly name: string;
  readonly email: string;
  readonly stay: StayOption;
  readonly accommodation: AccommodationOption;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly notes?: string;
}

export interface EditRegistrationModalProps {
  readonly registration: RegistrationOutput;
  readonly onSave: (id: string, data: EditRegistrationPayload) => void;
  readonly onClose: () => void;
}

export function EditRegistrationModal({
  registration,
  onSave,
  onClose,
}: EditRegistrationModalProps): React.ReactElement {
  const t = useTranslations("admin.registrations.edit");
  const tEnums = useTranslations();

  // Form state uses proper enum types — no `as string` casting anywhere.
  const [name, setName] = useState(registration.name);
  const [email, setEmail] = useState(registration.email);
  const [stay, setStay] = useState<StayOption>(registration.stay);
  const [accommodation, setAccommodation] = useState<AccommodationOption>(
    registration.accommodation,
  );
  const [adultsCount, setAdultsCount] = useState(String(registration.adultsCount));
  const [childrenCount, setChildrenCount] = useState(String(registration.childrenCount));
  const [notes, setNotes] = useState(registration.notes ?? "");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedNotes = notes.trim();
      onSave(registration.id, {
        name,
        email,
        stay,
        accommodation,
        adultsCount: Number(adultsCount),
        childrenCount: Number(childrenCount),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      });
    },
    [registration.id, name, email, stay, accommodation, adultsCount, childrenCount, notes, onSave],
  );

  // Only show legacy stay options if the registration actually uses one.
  const showLegacyOption = LEGACY_STAY_OPTIONS.includes(registration.stay);

  return (
    <Modal open onClose={onClose} title={t("title")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("name")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Select
          label={t("stay")}
          value={stay}
          onChange={(e) => setStay(e.target.value as StayOption)}
          required
        >
          {showLegacyOption ? (
            <option value={registration.stay}>
              {stayLabel(registration.stay, tEnums)}
            </option>
          ) : null}
          {CURRENT_STAY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {stayLabel(opt, tEnums)}
            </option>
          ))}
        </Select>
        <Select
          label={t("accommodation")}
          value={accommodation}
          onChange={(e) => setAccommodation(e.target.value as AccommodationOption)}
          required
        >
          {ACCOMMODATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {accommodationLabel(opt, tEnums)}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("adultsCount")}
            type="number"
            min="1"
            value={adultsCount}
            onChange={(e) => setAdultsCount(e.target.value)}
            required
          />
          <Input
            label={t("childrenCount")}
            type="number"
            min="0"
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value)}
            required
          />
        </div>
        <Textarea
          label={t("notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
        />
        <div className="mt-6 flex justify-end gap-3 border-t border-border-dark/60 pt-4">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit">
            {t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
