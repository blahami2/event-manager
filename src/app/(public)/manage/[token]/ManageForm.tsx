"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { registrationSchema } from "@/lib/validation/registration";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { StayOption } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import type { ApiErrorResponse } from "@/types/api";

/** Stay options hidden from new selections but shown for legacy registrations. */
const LEGACY_STAY_OPTIONS: ReadonlyArray<StayOption> = [StayOption.FRI_SAT, StayOption.FRI_SUN] as const;

interface ManageFormProps {
  readonly registration: RegistrationOutput;
  readonly token: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  stay?: string;
  adultsCount?: string;
  childrenCount?: string;
  notes?: string;
}

export function ManageForm({
  registration,
  token,
}: ManageFormProps): React.ReactElement {
  const t = useTranslations("manage");
  const tForm = useTranslations("form");
  const tErrors = useTranslations("errors");

  const [name, setName] = useState(registration.name);
  const [email, setEmail] = useState(registration.email);
  const [stay, setStay] = useState(registration.stay as string);
  const [adultsCount, setAdultsCount] = useState(
    String(registration.adultsCount),
  );
  const [childrenCount, setChildrenCount] = useState(
    String(registration.childrenCount),
  );
  const [notes, setNotes] = useState(
    registration.notes ?? "",
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleSave(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError("");
    setSuccessMessage("");

    const parsed = registrationSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      stay,
      adultsCount: Number(adultsCount),
      childrenCount: Number(childrenCount),
      notes: notes.trim() || undefined,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...parsed.data }),
      });

      if (response.ok) {
        setSuccessMessage(t("updateSuccess"));
        return;
      }

      if (response.status === 429) {
        setSubmitError(tErrors("tooManyAttempts"));
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

      setSubmitError(tErrors("unexpectedRetry"));
    } catch {
      setSubmitError(tErrors("unexpectedRetry"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(): Promise<void> {
    const confirmed = window.confirm(t("confirmCancel"));
    if (!confirmed) return;

    setSubmitError("");
    setIsCancelling(true);
    try {
      const response = await fetch("/api/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setIsCancelled(true);
        return;
      }

      if (response.status === 429) {
        setSubmitError(tErrors("tooManyAttempts"));
        return;
      }

      setSubmitError(tErrors("unexpectedRetry"));
    } catch {
      setSubmitError(tErrors("unexpectedRetry"));
    } finally {
      setIsCancelling(false);
    }
  }

  if (isCancelled) {
    return (
      <div role="status" className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-accent">
          <span className="font-heading text-2xl text-accent">✕</span>
        </div>
        <p className="font-heading text-xl uppercase tracking-wider text-accent">
          {t("cancelled")}
        </p>
        <p className="mt-3 font-body text-sm text-text-gray">
          {t("cancelledDescription")}
        </p>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div role="status" className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-accent">
          <span className="font-heading text-2xl text-accent">✓</span>
        </div>
        <p className="font-heading text-xl uppercase tracking-wider text-accent">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSave} noValidate>
        <FormField label={tForm("name")} htmlFor="name" error={fieldErrors.name}>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            required
          />
        </FormField>

        <FormField label={tForm("email")} htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />
        </FormField>

        <FormField
          label={tForm("stay")}
          htmlFor="stay"
          error={fieldErrors.stay}
        >
          <select
            id="stay"
            value={stay}
            onChange={(e) => setStay(e.target.value)}
            className="form-input w-full border-2 border-border-dark bg-input-bg p-[15px] font-body text-base text-white transition-colors duration-200"
          >
            <option value="">{tForm("stayPlaceholder")}</option>
            {LEGACY_STAY_OPTIONS.includes(registration.stay) && (
              <option value={registration.stay}>
                {registration.stay === StayOption.FRI_SAT ? tForm("stayFriSat") : tForm("stayFriSun")}
              </option>
            )}
            <option value="SAT_SUN">{tForm("staySatSun")}</option>
            <option value="SAT_ONLY">{tForm("staySatOnly")}</option>
          </select>
        </FormField>

        <FormField
          label={tForm("adultsCount")}
          htmlFor="adultsCount"
          error={fieldErrors.adultsCount}
        >
          <select
            id="adultsCount"
            value={adultsCount}
            onChange={(e) => setAdultsCount(e.target.value)}
            className="form-input w-full border-2 border-border-dark bg-input-bg p-[15px] font-body text-base text-white transition-colors duration-200"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={tForm("childrenCount")}
          htmlFor="childrenCount"
          error={fieldErrors.childrenCount}
        >
          <select
            id="childrenCount"
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value)}
            className="form-input w-full border-2 border-border-dark bg-input-bg p-[15px] font-body text-base text-white transition-colors duration-200"
          >
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={tForm("notes")}
          htmlFor="notes"
          error={fieldErrors.notes}
        >
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={fieldErrors.notes}
            rows={3}
          />
        </FormField>

        {submitError && (
          <p className="mb-4 text-sm text-accent" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-rock w-full border-3 border-accent bg-accent font-heading text-2xl uppercase text-white transition-all duration-300"
          style={{
            padding: "15px 40px",
            opacity: isSubmitting ? 0.5 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? t("saving") : t("saveChanges")}
        </button>
      </form>

      <div className="mt-6 border-t-2 border-border-dark pt-6">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full border-2 border-border-dark bg-transparent px-4 py-3 font-heading uppercase tracking-wider text-text-gray transition-all duration-300 hover:border-accent hover:text-accent"
          style={{
            opacity: isCancelling ? 0.5 : 1,
            cursor: isCancelling ? "not-allowed" : "pointer",
          }}
        >
          {isCancelling ? t("cancelling") : t("cancel")}
        </button>
      </div>
    </div>
  );
}
