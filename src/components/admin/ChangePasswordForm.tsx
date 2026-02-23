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
    <div className="max-w-md rounded-xl border border-border-dark bg-dark-secondary/60 p-8 shadow-lg backdrop-blur-md">
      <h2 className="mb-6 text-xl font-semibold tracking-wide text-admin-text-primary">{t("changePassword")}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
            {t("currentPassword")}
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
            {t("newPassword")}
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-3.5 py-2.5 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {errorMessage && (
          <div
            className="rounded-lg border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-400 backdrop-blur-sm"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {status === "success" && (
          <div
            className="rounded-lg border border-green-700/50 bg-green-900/20 p-3 text-sm text-green-400 backdrop-blur-sm"
            role="status"
          >
            {t("success")}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg border-2 border-accent bg-accent px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-accent/20 transition-all duration-300 hover:bg-transparent hover:text-accent hover:shadow-none disabled:opacity-50"
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
