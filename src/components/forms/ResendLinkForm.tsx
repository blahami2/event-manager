"use client";

import { useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const SUCCESS_MESSAGE =
  "If this email is registered, a manage link has been sent.";

export function ResendLinkForm(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setFieldError("");
    setSubmitError("");
    setSuccessMessage("");

    const parsed = emailSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });

      if (response.status === 429) {
        setSubmitError("Too many attempts. Please try again later.");
        return;
      }

      // Always show same message regardless of response (S5)
      setSuccessMessage(SUCCESS_MESSAGE);
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div role="status" className="text-center">
        <p className="text-lg font-medium text-green-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField label="Email" htmlFor="resend-email" error={fieldError}>
        <Input
          id="resend-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          required
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
        {isSubmitting ? "Sending…" : "Send Manage Link"}
      </button>
    </form>
  );
}
