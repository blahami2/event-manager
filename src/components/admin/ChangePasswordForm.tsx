"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui/admin";

type Status = "idle" | "submitting" | "success" | "error";

export function ChangePasswordForm(): React.ReactElement {
  const t = useTranslations("admin.settings");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(t("errorMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t("errorMismatch"));
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage(t("errorSamePassword"));
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/admin/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          setErrorMessage(t("errorCurrentIncorrect"));
        } else {
          setErrorMessage(data?.error?.message ?? t("errorGeneric"));
        }
        setStatus("error");
        return;
      }

      setStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(t("errorGeneric"));
      setStatus("error");
    }
  }

  return (
    <div>
      <h2 className="mb-5 text-base font-semibold tracking-tight text-text-primary">
        {t("changePassword")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("currentPassword")}
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label={t("newPassword")}
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <Input
          label={t("confirmPassword")}
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {errorMessage && (
          <div
            className="rounded-md border border-danger/40 bg-danger-muted p-3 text-sm text-danger"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {status === "success" && (
          <div
            className="rounded-md border border-success/40 bg-success-muted p-3 text-sm text-success"
            role="status"
          >
            {t("success")}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={status === "submitting"}
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
