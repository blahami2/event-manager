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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
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
        console.error("Supabase Auth Error:", authError);
        setError(t("error") + " (Dev Error: " + authError.message + ")");
        return;
      }

      window.location.href = "/admin";
    } catch (err: unknown) {
      console.error("Client Exception during setup:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(t("error") + " (Client Exception: " + errorMessage + ")");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-primary px-4 font-body relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border-dark bg-dark-secondary/60 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="mb-8 text-center font-heading text-4xl uppercase tracking-widest text-white">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-4 py-3 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-admin-text-secondary">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-border-dark bg-dark-primary/50 px-4 py-3 text-sm text-admin-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div
              className="rounded-lg border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-400 backdrop-blur-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex w-full items-center justify-center rounded-lg border-2 border-accent bg-accent px-6 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-accent/20 transition-all duration-300 hover:bg-transparent hover:text-accent hover:shadow-none focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-primary disabled:opacity-50"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
