"use client";

import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default function SettingsPage(): React.ReactElement {
  const t = useTranslations("admin.settings");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-text-primary)]">
          {t("title")}
        </h1>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
