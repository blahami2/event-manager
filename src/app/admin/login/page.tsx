"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/auth/supabase-client";
import { Button, Input } from "@/components/ui/admin";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--color-surface-0)] px-4 font-body">
      {/* Ambient backdrop — very subtle accent glow, no neon */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-accent)]/[0.06] blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03),transparent_60%)]"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[color:var(--color-text-tertiary)]">
            Back office
          </p>
          <h1 className="mt-2 font-[var(--font-heading)] text-3xl uppercase tracking-[0.18em] text-[color:var(--color-text-primary)]">
            {t("title")}
          </h1>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]/80 p-8 shadow-[var(--shadow-lg)] backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("email")}
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
            />

            <Input
              label={t("password")}
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />

            {error && (
              <div
                className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 p-3 text-xs text-[color:var(--color-danger)]"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="mt-2 w-full"
              loading={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
