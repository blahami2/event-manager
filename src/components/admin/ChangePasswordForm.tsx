"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
    <div className="border border-border-dark bg-dark-secondary rounded-lg p-6">
      <h2 className="text-lg font-semibold text-admin-text-primary mb-4">{t("changePassword")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-admin-text-secondary mb-1">
            {t("currentPassword")}
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full bg-dark-primary border border-border-dark text-white rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-admin-text-secondary mb-1">
            {t("newPassword")}
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-dark-primary border border-border-dark text-white rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-admin-text-secondary mb-1">
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-dark-primary border border-border-dark text-white rounded-md px-3 py-2"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-red-400" role="alert">{errorMessage}</p>
        )}

        {status === "success" && (
          <p className="text-sm text-green-400" role="status">{t("success")}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="border-2 border-accent bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-transparent hover:text-accent disabled:opacity-50"
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
