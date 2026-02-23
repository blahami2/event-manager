export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import { StatsCard } from "@/components/admin/StatsCard";

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [stats, t] = await Promise.all([getRegistrationStats(), getTranslations("admin.dashboard")]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("totalRegistrations")} value={stats.total} />
        <StatsCard label="Admins" value={4} />
        <StatsCard label={t("confirmed")} value={stats.confirmed} />
        <StatsCard label={t("cancelled")} value={stats.cancelled} />
        <StatsCard label={t("totalAdults")} value={stats.totalAdults} />
        <StatsCard label={t("totalChildren")} value={stats.totalChildren} />
      </div>

      <div className="flex gap-4 pt-4">
        <Link
          href="/admin/registrations"
          className="inline-flex items-center justify-center rounded-lg border-2 border-accent bg-accent px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-accent/20 transition-all duration-300 hover:bg-transparent hover:text-accent hover:shadow-none"
        >
          {t("viewRegistrations")}
        </Link>
        <a
          href="/api/admin/registrations/export"
          download
          className="group inline-flex items-center gap-2 rounded-lg border border-border-dark bg-dark-secondary/60 px-6 py-2.5 text-sm font-medium text-admin-text-secondary shadow-sm backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
            />
          </svg>
          {t("exportCsv")}
        </a>
      </div>
    </div>
  );
}
