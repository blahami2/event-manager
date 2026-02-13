"use client";

import { useState } from "react";
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
  guestCount?: string;
  dietaryNotes?: string;
}

export function ManageForm({
  registration,
  token,
}: ManageFormProps): React.ReactElement {
  const [name, setName] = useState(registration.name);
  const [email, setEmail] = useState(registration.email);
  const [guestCount, setGuestCount] = useState(
    String(registration.guestCount),
  );
  const [dietaryNotes, setDietaryNotes] = useState(
    registration.dietaryNotes ?? "",
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
      guestCount: Number(guestCount),
      dietaryNotes: dietaryNotes.trim() || undefined,
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
        setSuccessMessage(
          "Registration updated successfully! A new manage link has been sent to your email.",
        );
        return;
      }

      if (response.status === 429) {
        setSubmitError("Too many attempts. Please try again later.");
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

      setSubmitError("An unexpected error occurred. Please try again.");
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(): Promise<void> {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your registration? This cannot be undone.",
    );
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
        setSubmitError("Too many attempts. Please try again later.");
        return;
      }

      setSubmitError("An unexpected error occurred. Please try again.");
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (isCancelled) {
    return (
      <div role="status" className="text-center">
        <p className="text-lg font-medium text-red-700">
          Registration cancelled
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Your registration has been cancelled successfully.
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
        <FormField label="Name" htmlFor="name" error={fieldErrors.name}>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            required
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
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
          label="Number of Guests"
          htmlFor="guestCount"
          error={fieldErrors.guestCount}
        >
          <select
            id="guestCount"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
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
          label="Dietary Notes (optional)"
          htmlFor="dietaryNotes"
          error={fieldErrors.dietaryNotes}
        >
          <Textarea
            id="dietaryNotes"
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            error={fieldErrors.dietaryNotes}
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
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCancelling ? "Cancelling…" : "Cancel Registration"}
        </button>
      </div>
    </div>
  );
}
