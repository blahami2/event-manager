"use client";

import { useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function ResendLinkForm(): React.ReactElement {
  const t = useTranslations("resend");
  const tForm = useTranslations("form");
  const tErrors = useTranslations("errors");

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
      setFieldError(parsed.error.issues[0]?.message ?? tErrors("invalidEmail"));
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
        setSubmitError(tErrors("tooManyAttempts"));
        return;
      }

      setSuccessMessage(t("success"));
    } catch {
      setSubmitError(tErrors("unexpectedRetry"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div role="status" style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-accent)" }}>
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label={tForm("email")} htmlFor="resend-email" error={fieldError}>
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
        <p style={{ fontSize: "0.875rem", color: "var(--color-accent)", marginBottom: "15px" }} role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-rock"
        style={{
          width: "100%",
          display: "block",
          backgroundColor: "var(--color-accent)",
          color: "#fff",
          padding: "15px 40px",
          fontFamily: "'Anton', sans-serif",
          fontSize: "1.5rem",
          textTransform: "uppercase",
          border: "3px solid var(--color-accent)",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          opacity: isSubmitting ? 0.5 : 1,
        }}
      >
        {isSubmitting ? t("sending") : t("sendButton")}
      </button>
    </form>
  );
}
