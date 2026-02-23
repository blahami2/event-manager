"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/auth/supabase-client";

export default function LoginPage(): React.ReactElement {
  const t = useTranslations("admin.login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(t("error"));
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-primary px-4 font-body">
      <div className="w-full max-w-md border border-border-dark border-t-2 border-t-accent bg-admin-card-bg p-8 rounded-sm">
        <h1 className="mb-6 text-center font-heading text-2xl uppercase tracking-widest text-admin-text-primary">
          {t("title")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-admin-text-secondary"
            >
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-admin-text-secondary"
            >
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 text-admin-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border-2 border-accent bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-transparent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-primary disabled:opacity-50"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
