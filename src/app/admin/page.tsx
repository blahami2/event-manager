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
      <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("totalRegistrations")} value={stats.total} />
        <StatsCard label={t("confirmed")} value={stats.confirmed} />
        <StatsCard label={t("cancelled")} value={stats.cancelled} />
        <StatsCard label={t("totalAdults")} value={stats.totalAdults} />
        <StatsCard label={t("totalChildren")} value={stats.totalChildren} />
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          href="/admin/registrations"
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-primary"
        >
          {t("viewRegistrations")}
        </Link>
        <a
          href="/api/admin/registrations/export"
          download
          className="inline-flex items-center gap-2 rounded-md border border-border-dark bg-dark-secondary px-4 py-2 text-sm font-medium text-admin-text-primary transition-colors hover:bg-admin-hover hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-border-dark focus-visible:ring-offset-2 focus-visible:ring-offset-dark-primary"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
