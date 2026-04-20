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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dark-primary px-4 font-body">
      {/* Ambient backdrop glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border-dark bg-dark-secondary/60 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="mb-8 text-center font-heading text-4xl uppercase tracking-widest text-white">
          {t("title")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("email")}
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            label={t("password")}
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />

          {error && (
            <div
              className="rounded-md border border-admin-danger/40 bg-admin-danger/10 p-3 text-sm text-admin-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="mt-4 w-full"
            loading={isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
