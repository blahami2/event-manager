"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { registrationSchema } from "@/lib/validation/registration";
import { AccommodationOption, StayOption } from "@/types/registration";
import type { ApiErrorResponse } from "@/types/api";

/**
 * Fields that can be individually flagged with validation errors.
 * Mirrors the shape of the registration payload accepted by /api/register.
 */
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
  /** Invoked when the admin dismisses the modal without creating a registration. */
  readonly onClose: () => void;
  /** Invoked after the server confirms a successful registration creation. */
  readonly onCreated: () => void;
}

const ADULT_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);
const CHILDREN_COUNT_OPTIONS = Array.from({ length: 11 }, (_, i) => i);

/**
 * Map a Zod validation key to the translation key used in the admin modal.
 * Returning a stable translation key (instead of the raw Zod message) keeps
 * messages localized consistently with the rest of the admin UI.
 */
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

/**
 * Admin-only modal that lets an administrator manually create a registration
 * by submitting to the admin-only `/api/admin/registrations/create` endpoint
 * on behalf of the guest. That endpoint is authenticated via the same admin
 * guard as the rest of the admin API and bypasses the public registration
 * deadline, which is the only behavioural difference from `/api/register`.
 * The modal mirrors the validation rules of the public registration form
 * but is styled to match the admin UI.
 */
export function AddRegistrationModal({
  onClose,
  onCreated,
}: AddRegistrationModalProps): React.ReactElement {
  const t = useTranslations("admin.registrations.add");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stay, setStay] = useState("");
  const [accommodation, setAccommodation] = useState<string>(AccommodationOption.ANYWHERE);
  const [adultsCount, setAdultsCount] = useState("1");
  const [childrenCount, setChildrenCount] = useState("0");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep accommodation consistent with the chosen stay option. The public
  // registration form enforces the same rule; duplicating it here keeps
  // admin-side behaviour aligned with guest-side behaviour.
  useEffect(() => {
    if (stay === StayOption.SAT_ONLY) {
      setAccommodation(AccommodationOption.NONE);
    } else if (accommodation === AccommodationOption.NONE && stay !== "") {
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

  // Resolve potentially-translated and potentially-server-supplied error
  // messages into displayable strings. Server field errors come back as
  // plain text, so we render them verbatim; local keys are piped through t().
  const renderFieldError = (rawMessage: string | undefined): string | undefined => {
    if (!rawMessage) return undefined;
    // Translation keys in this component always start with "error"; server
    // messages may be free-form, so we pass those through unchanged.
    if (rawMessage.startsWith("error")) {
      return t(rawMessage);
    }
    return rawMessage;
  };

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
        <form onSubmit={handleSubmit} noValidate className="space-y-5 p-6">
          <div>
            <label
              htmlFor="add-name"
              className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
            >
              {t("name")}
            </label>
            <input
              id="add-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {renderFieldError(fieldErrors.name)}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-email"
              className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
            >
              {t("email")}
            </label>
            <input
              id="add-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {renderFieldError(fieldErrors.email)}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-stay"
              className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
            >
              {t("stay")}
            </label>
            <select
              id="add-stay"
              value={stay}
              onChange={(e) => setStay(e.target.value)}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">{t("stayPlaceholder")}</option>
              <option value={StayOption.SAT_SUN}>{t("staySatSun")}</option>
              <option value={StayOption.SAT_ONLY}>{t("staySatOnly")}</option>
            </select>
            {fieldErrors.stay && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {renderFieldError(fieldErrors.stay)}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-accommodation"
              className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
            >
              {t("accommodation")}
            </label>
            <select
              id="add-accommodation"
              value={accommodation}
              onChange={(e) => setAccommodation(e.target.value)}
              disabled={stay === StayOption.SAT_ONLY}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {stay === StayOption.SAT_ONLY ? (
                <option value={AccommodationOption.NONE}>{t("accommodationNone")}</option>
              ) : (
                <>
                  <option value={AccommodationOption.ANYWHERE}>{t("accommodationAnywhere")}</option>
                  <option value={AccommodationOption.PRIVATE_ROOM}>{t("accommodationPrivateRoom")}</option>
                  <option value={AccommodationOption.COMMON_ROOM}>{t("accommodationCommonRoom")}</option>
                  <option value={AccommodationOption.OWN_TENT}>{t("accommodationOwnTent")}</option>
                  <option value={AccommodationOption.NONE}>{t("accommodationNone")}</option>
                </>
              )}
            </select>
            {fieldErrors.accommodation && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {renderFieldError(fieldErrors.accommodation)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="add-adults-count"
                className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
              >
                {t("adultsCount")}
              </label>
              <select
                id="add-adults-count"
                value={adultsCount}
                onChange={(e) => setAdultsCount(e.target.value)}
                className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {ADULT_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {fieldErrors.adultsCount && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {renderFieldError(fieldErrors.adultsCount)}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="add-children-count"
                className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
              >
                {t("childrenCount")}
              </label>
              <select
                id="add-children-count"
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CHILDREN_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {fieldErrors.childrenCount && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  {renderFieldError(fieldErrors.childrenCount)}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="add-notes"
              className="mb-1.5 block text-sm font-medium text-admin-text-secondary"
            >
              {t("notes")}
            </label>
            <textarea
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {fieldErrors.notes && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {renderFieldError(fieldErrors.notes)}
              </p>
            )}
          </div>

          {submitError && (
            <p
              className="rounded-md border border-red-700 bg-red-900/40 p-3 text-sm text-red-400"
              role="alert"
            >
              {renderFieldError(submitError)}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-border-dark/50 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-border-dark bg-dark-primary/50 px-4 py-2 text-sm font-medium text-admin-text-secondary transition-all hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg border-2 border-accent bg-accent px-6 py-2 text-sm font-bold tracking-wide text-white transition-all hover:bg-transparent hover:text-accent hover:shadow-lg hover:shadow-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
