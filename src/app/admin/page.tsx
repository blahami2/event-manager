export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import { StatsCard } from "@/components/admin/StatsCard";

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [stats, t] = await Promise.all([
    getRegistrationStats(),
    getTranslations("admin.dashboard"),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("totalRegistrations")} value={stats.total} />
        <StatsCard label={t("confirmed")} value={stats.confirmed} />
        <StatsCard label={t("cancelled")} value={stats.cancelled} />
        <StatsCard label={t("totalAdults")} value={stats.totalAdults} />
        <StatsCard label={t("totalChildren")} value={stats.totalChildren} />
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/registrations"
          className="border-2 border-accent bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-transparent hover:text-accent"
        >
          {t("viewRegistrations")}
        </Link>
        <a
          href="/api/admin/registrations/export"
          download
          className="inline-flex items-center gap-2 border border-border-dark bg-dark-secondary px-4 py-2 text-sm font-medium text-admin-text-secondary transition-all hover:border-accent/50 hover:text-admin-text-primary hover:bg-admin-hover"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
          </svg>
          {t("exportCsv")}
        </a>
      </div>
    </div>
  );
}
