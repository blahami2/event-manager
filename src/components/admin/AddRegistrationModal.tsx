"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { registrationSchema } from "@/lib/validation/registration";
import { AccommodationOption, StayOption } from "@/types/registration";
import type { ApiErrorResponse } from "@/types/api";
import {
  ACCOMMODATION_OPTIONS,
  ALL_STAY_OPTIONS,
  accommodationLabel,
  stayLabel,
} from "@/i18n/labels";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui/admin";

/** Max notes length. Matches the server-side Zod schema. */
const NOTES_MAX_LENGTH = 500;
const ADULT_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);
const CHILDREN_COUNT_OPTIONS = Array.from({ length: 11 }, (_, i) => i);

interface FieldErrors {
  name?: string;
  email?: string;
  stay?: string;
  accommodation?: string;
  adultsCount?: string;
  childrenCount?: string;
  notes?: string;
}

export interface AddRegistrationModalProps {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

/** Map Zod field key to translation key for localized errors. */
function zodKeyToTranslationKey(field: keyof FieldErrors): string {
  switch (field) {
    case "name":
      return "errorNameRequired";
    case "email":
      return "errorEmailInvalid";
    case "stay":
      return "errorStayRequired";
    case "accommodation":
      return "errorAccommodationRequired";
    case "adultsCount":
      return "errorAdultsInvalid";
    case "childrenCount":
      return "errorChildrenInvalid";
    case "notes":
      return "errorNotesTooLong";
    default:
      return "errorGeneric";
  }
}

/** Sentinel used to represent "no stay selected" in local state. */
type StaySelection = StayOption | "";

export function AddRegistrationModal({
  onClose,
  onCreated,
}: AddRegistrationModalProps): React.ReactElement {
  const t = useTranslations("admin.registrations.add");
  const tEnums = useTranslations();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stay, setStay] = useState<StaySelection>("");
  const [accommodation, setAccommodation] = useState<AccommodationOption>(
    AccommodationOption.ANYWHERE,
  );
  const [adultsCount, setAdultsCount] = useState("1");
  const [childrenCount, setChildrenCount] = useState("0");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accommodation must match the public registration form's rules:
  //  - SAT_ONLY → accommodation is forced to NONE (no overnight).
  //  - Switching away from SAT_ONLY resets a lingering NONE back to ANYWHERE.
  useEffect(() => {
    if (stay === StayOption.SAT_ONLY) {
      setAccommodation(AccommodationOption.NONE);
    } else if (
      accommodation === AccommodationOption.NONE &&
      stay !== ""
    ) {
      setAccommodation(AccommodationOption.ANYWHERE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stay]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFieldErrors({});
      setSubmitError("");

      const trimmedNotes = notes.trim();
      const candidate = {
        name: name.trim(),
        email: email.trim(),
        stay: stay === "" ? undefined : stay,
        accommodation,
        adultsCount: Number(adultsCount),
        childrenCount: Number(childrenCount),
        ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
      };

      const parsed = registrationSchema.safeParse(candidate);
      if (!parsed.success) {
        const errors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof FieldErrors | undefined;
          if (field && !errors[field]) {
            errors[field] = zodKeyToTranslationKey(field);
          }
        }
        setFieldErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/admin/registrations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (response.ok) {
          onCreated();
          return;
        }

        if (response.status === 429) {
          setSubmitError("errorRateLimited");
          return;
        }

        if (response.status === 400) {
          const body = (await response.json()) as ApiErrorResponse;
          if (body.error.fields) {
            setFieldErrors(body.error.fields as FieldErrors);
          } else {
            setSubmitError(body.error.message);
          }
          return;
        }

        setSubmitError("errorGeneric");
      } catch {
        setSubmitError("errorGeneric");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, stay, accommodation, adultsCount, childrenCount, notes, onCreated],
  );

  // Resolve translation keys / server messages into displayable strings.
  const renderFieldError = (rawMessage: string | undefined): string | undefined => {
    if (!rawMessage) return undefined;
    return rawMessage.startsWith("error") ? t(rawMessage) : rawMessage;
  };

  const accommodationDisabled = stay === StayOption.SAT_ONLY;

  return (
    <Modal open onClose={onClose} title={t("title")} size="md">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t("name")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={renderFieldError(fieldErrors.name)}
        />
        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={renderFieldError(fieldErrors.email)}
        />
        <Select
          label={t("stay")}
          value={stay}
          onChange={(e) => setStay(e.target.value as StaySelection)}
          error={renderFieldError(fieldErrors.stay)}
        >
          <option value="">{t("stayPlaceholder")}</option>
          {ALL_STAY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {stayLabel(opt, tEnums)}
            </option>
          ))}
        </Select>
        <Select
          label={t("accommodation")}
          value={accommodation}
          onChange={(e) =>
            setAccommodation(e.target.value as AccommodationOption)
          }
          disabled={accommodationDisabled}
          error={renderFieldError(fieldErrors.accommodation)}
        >
          {accommodationDisabled ? (
            <option value={AccommodationOption.NONE}>
              {accommodationLabel(AccommodationOption.NONE, tEnums)}
            </option>
          ) : (
            ACCOMMODATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {accommodationLabel(opt, tEnums)}
              </option>
            ))
          )}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t("adultsCount")}
            value={adultsCount}
            onChange={(e) => setAdultsCount(e.target.value)}
            error={renderFieldError(fieldErrors.adultsCount)}
          >
            {ADULT_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
          <Select
            label={t("childrenCount")}
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value)}
            error={renderFieldError(fieldErrors.childrenCount)}
          >
            {CHILDREN_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <Textarea
          label={t("notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          error={renderFieldError(fieldErrors.notes)}
        />

        {submitError ? (
          <p
            className="rounded-md border border-danger/40 bg-danger-muted p-3 text-sm text-danger"
            role="alert"
          >
            {renderFieldError(submitError)}
          </p>
        ) : null}

        <div className="-mx-6 -mb-5 mt-2 flex items-center justify-end gap-3 border-t border-border-subtle bg-surface-base/40 px-6 py-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
