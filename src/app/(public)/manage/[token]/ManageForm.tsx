"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { registrationSchema } from "@/lib/validation/registration";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { RegistrationOutput } from "@/types/registration";
import type { ApiErrorResponse } from "@/types/api";

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
      <div role="status" className="text-center">
        <p className="text-lg font-medium text-red-700">
          {t("cancelled")}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {t("cancelledDescription")}
        </p>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div role="status" className="text-center">
        <p className="text-lg font-medium text-green-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSave} className="space-y-5" noValidate>
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
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 sm:text-sm"
          >
            <option value="">{tForm("stayPlaceholder")}</option>
            <option value="FRI_SAT">{tForm("stayFriSat")}</option>
            <option value="SAT_SUN">{tForm("staySatSun")}</option>
            <option value="FRI_SUN">{tForm("stayFriSun")}</option>
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
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 sm:text-sm"
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
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 sm:text-sm"
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
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t("saving") : t("saveChanges")}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCancelling ? t("cancelling") : t("cancel")}
        </button>
      </div>
    </div>
  );
}
