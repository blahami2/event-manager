"use client";

import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default function SettingsPage(): React.ReactElement {
  const t = useTranslations("admin.settings");

  return (
    <div className="space-y-6">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-text-tertiary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
          {t("title")}
        </h1>
      </header>
      <div className="max-w-xl">
        <div className="rounded-lg border border-border-default bg-surface-raised/40 p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
