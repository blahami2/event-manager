"use client";

import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default function SettingsPage(): React.ReactElement {
  const t = useTranslations("admin.settings");

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">{t("title")}</h1>
      <ChangePasswordForm />
    </div>
  );
}
